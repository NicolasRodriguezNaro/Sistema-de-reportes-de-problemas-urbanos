package com.gestion.backend.servicio;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestion.backend.almacenamiento.ResolvedorUrlArchivos;
import com.gestion.backend.dto.HistorialReporteResponse;
import com.gestion.backend.dto.PaginaResponse;
import com.gestion.backend.dto.ReporteCreacionRequest;
import com.gestion.backend.dto.ReporteResumenResponse;
import com.gestion.backend.dto.ReporteResponse;
import com.gestion.backend.error.RecursoNoEncontradoException;
import com.gestion.backend.geoespacial.ServicioGeoespacial;
import com.gestion.backend.ia.ClasificadorIncidencias;
import com.gestion.backend.ia.ResultadoClasificacion;
import com.gestion.backend.modelo.Entidad;
import com.gestion.backend.modelo.EstadoReporte;
import com.gestion.backend.modelo.MotivoRechazo;
import com.gestion.backend.modelo.PrioridadCalculada;
import com.gestion.backend.modelo.Reporte;
import com.gestion.backend.modelo.ReporteHistorial;
import com.gestion.backend.modelo.Severidad;
import com.gestion.backend.modelo.TipoIncidencia;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.BarrioRepository;
import com.gestion.backend.repositorio.EntidadRepository;
import com.gestion.backend.repositorio.ReporteEspecificaciones;
import com.gestion.backend.repositorio.ReporteFiltros;
import com.gestion.backend.repositorio.ReporteHistorialRepository;
import com.gestion.backend.repositorio.ReporteRepository;
import com.gestion.backend.semantica.AnalisisSemantico;
import com.gestion.backend.semantica.ServicioSemantico;
import com.gestion.backend.seguridad.AlcanceReportes;

@Service
public class ReporteService {

	private static final double RADIO_DEDUPLICACION_METROS = 5.0;

	private final ReporteRepository reporteRepository;
	private final ReporteHistorialRepository reporteHistorialRepository;
	private final EntidadRepository entidadRepository;
	private final BarrioRepository barrioRepository;
	private final ServicioGeoespacial servicioGeoespacial;
	private final ClasificadorIncidencias clasificadorIncidencias;
	private final ServicioSemantico servicioSemantico;
	private final ResolvedorUrlArchivos resolvedorUrlArchivos;
	private final AlcanceReportes alcanceReportes;

	public ReporteService(ReporteRepository reporteRepository,
			ReporteHistorialRepository reporteHistorialRepository,
			EntidadRepository entidadRepository,
			BarrioRepository barrioRepository, ServicioGeoespacial servicioGeoespacial,
			ClasificadorIncidencias clasificadorIncidencias, ServicioSemantico servicioSemantico,
			ResolvedorUrlArchivos resolvedorUrlArchivos, AlcanceReportes alcanceReportes) {
		this.reporteRepository = reporteRepository;
		this.reporteHistorialRepository = reporteHistorialRepository;
		this.entidadRepository = entidadRepository;
		this.barrioRepository = barrioRepository;
		this.servicioGeoespacial = servicioGeoespacial;
		this.clasificadorIncidencias = clasificadorIncidencias;
		this.servicioSemantico = servicioSemantico;
		this.resolvedorUrlArchivos = resolvedorUrlArchivos;
		this.alcanceReportes = alcanceReportes;
	}

	@Transactional
	public ReporteResponse crear(ReporteCreacionRequest solicitud) {
		Usuario usuario = alcanceReportes.usuarioActual();

		ResultadoClasificacion clasificacion = null;
		if (solicitud.categoriaIa() == null || solicitud.severidadIa() == null || solicitud.descripcion() == null) {
			clasificacion = clasificadorIncidencias.clasificar(solicitud.claveImagenHd());
		}

		TipoIncidencia categoria = solicitud.categoriaIa() != null ? solicitud.categoriaIa() : clasificacion.categoria();
		Severidad severidad = solicitud.severidadIa() != null ? solicitud.severidadIa() : clasificacion.severidad();
		String descripcion = solicitud.descripcion() != null ? solicitud.descripcion()
				: clasificacion.descripcionBorrador();

		if (clasificacion != null && !clasificacion.esIncidencia()) {
			categoria = null;
			severidad = null;
		}

		Reporte reporte = new Reporte();
		reporte.setUsuario(usuario);

		Point ubicacion = servicioGeoespacial.a9377(solicitud.latitud(), solicitud.longitud());
		reporte.setUbicacion(ubicacion);

		servicioGeoespacial.buscarBarrio(ubicacion)
				.ifPresent(barrioId -> reporte.setBarrio(barrioRepository.getReferenceById(barrioId)));

		servicioGeoespacial.buscarReportePadre(ubicacion, RADIO_DEDUPLICACION_METROS, categoria)
				.ifPresent(padreId -> reporte.setReportePadre(reporteRepository.getReferenceById(padreId)));

		reporte.setCategoriaIa(categoria);
		reporte.setSeveridadIa(severidad);
		reporte.setDescripcion(descripcion);
		if (clasificacion != null) {
			reporte.setConfianzaIa(clasificacion.confianza());
		}
		reporte.setUrlImagenHd(solicitud.claveImagenHd());
		reporte.setUrlImagenThumb(solicitud.claveImagenThumb());

		Reporte guardado = reporteRepository.save(reporte);

		AnalisisSemantico analisis = servicioSemantico.analizar(guardado);
		guardado.setPrioridadCalculada(analisis.prioridad());
		if (analisis.entidadId() != null) {
			guardado.setEntidadAsignada(entidadRepository.getReferenceById(analisis.entidadId()));
		}

		registrarHistorial(guardado, null, guardado.getEstado(), null, null, null, usuario);

		return aRespuesta(guardado);
	}

	@Transactional(readOnly = true)
	public ReporteResponse obtener(Long id) {
		Reporte reporte = buscar(id);
		alcanceReportes.verificarPuedeVer(alcanceReportes.usuarioActual(), reporte);
		return aRespuesta(reporte);
	}

	@Transactional(readOnly = true)
	public PaginaResponse<ReporteResumenResponse> listar(EstadoReporte estado, TipoIncidencia categoria,
			PrioridadCalculada prioridad, Integer barrioId, Integer entidadId, LocalDate desde, LocalDate hasta,
			String texto, int pagina, int tamano) {
		Usuario usuario = alcanceReportes.usuarioActual();
		Integer entidadFiltro = alcanceReportes.esAdministrador(usuario)
				? entidadId
				: alcanceReportes.entidadIdObligatoria(usuario);

		ReporteFiltros filtros = new ReporteFiltros(estado, categoria, prioridad, barrioId, entidadFiltro,
				inicio(desde), finExclusivo(hasta), texto);

		Page<Reporte> resultado = reporteRepository.findAll(ReporteEspecificaciones.conFiltros(filtros),
				pagina(pagina, tamano));
		return aPagina(resultado);
	}

	@Transactional(readOnly = true)
	public PaginaResponse<ReporteResumenResponse> listarMios(int pagina, int tamano) {
		Usuario usuario = alcanceReportes.usuarioActual();
		Page<Reporte> resultado = reporteRepository.findByUsuarioId(usuario.getId(), pagina(pagina, tamano));
		return aPagina(resultado);
	}

	@Transactional
	public ReporteResponse cambiarEstado(Long id, EstadoReporte nuevoEstado, MotivoRechazo motivoRechazo,
			String detalleRechazo, String motivoReapertura) {
		Usuario usuario = alcanceReportes.usuarioActual();
		Reporte reporte = buscar(id);
		alcanceReportes.verificarPuedeGestionar(usuario, reporte);

		EstadoReporte estadoAnterior = reporte.getEstado();
		validarRechazo(nuevoEstado, motivoRechazo, detalleRechazo);
		validarReapertura(estadoAnterior, nuevoEstado, motivoReapertura);

		String detalleNormalizado = nuevoEstado == EstadoReporte.RECHAZADO
				? normalizarDetalle(detalleRechazo)
				: null;
		String motivoReaperturaNormalizado = estadoAnterior == EstadoReporte.RECHAZADO
				&& nuevoEstado != EstadoReporte.RECHAZADO
						? normalizarDetalle(motivoReapertura)
						: null;

		reporte.setEstado(nuevoEstado);
		if (nuevoEstado == EstadoReporte.RECHAZADO) {
			reporte.setMotivoRechazo(motivoRechazo);
			reporte.setDetalleRechazo(detalleNormalizado);
		} else {
			reporte.setMotivoRechazo(null);
			reporte.setDetalleRechazo(null);
		}

		Reporte guardado = reporteRepository.saveAndFlush(reporte);
		registrarHistorial(guardado, estadoAnterior, nuevoEstado, motivoRechazo,
				detalleNormalizado, motivoReaperturaNormalizado, usuario);

		return aRespuesta(guardado);
	}

	@Transactional(readOnly = true)
	public List<HistorialReporteResponse> obtenerHistorial(Long id) {
		Reporte reporte = buscar(id);
		alcanceReportes.verificarPuedeVer(alcanceReportes.usuarioActual(), reporte);
		return reporteHistorialRepository.findByReporteIdOrderByFechaAscIdAsc(id).stream()
				.map(HistorialReporteResponse::desde)
				.toList();
	}

	private void validarRechazo(EstadoReporte estado, MotivoRechazo motivo, String detalle) {
		if (estado == EstadoReporte.RECHAZADO && motivo == null) {
			throw new IllegalArgumentException("Debe indicar el motivo del rechazo");
		}
		if (estado != EstadoReporte.RECHAZADO
				&& (motivo != null || (detalle != null && !detalle.isBlank()))) {
			throw new IllegalArgumentException("El motivo y el detalle de rechazo solo aplican al estado RECHAZADO");
		}
		if (motivo == MotivoRechazo.OTRO && (detalle == null || detalle.isBlank())) {
			throw new IllegalArgumentException("Debe explicar el motivo cuando selecciona OTRO");
		}
	}

	private void validarReapertura(EstadoReporte anterior, EstadoReporte nuevo, String motivo) {
		if (anterior == EstadoReporte.RECHAZADO && nuevo != EstadoReporte.RECHAZADO) {
			if (nuevo != EstadoReporte.EN_REVISION) {
				throw new IllegalArgumentException(
						"Un reporte rechazado solo puede reabrirse al estado EN_REVISION");
			}
			if (motivo == null || motivo.isBlank()) {
				throw new IllegalArgumentException("Debe indicar el motivo de reapertura");
			}
			return;
		}
		if (anterior != EstadoReporte.RECHAZADO && motivo != null && !motivo.isBlank()) {
			throw new IllegalArgumentException("El motivo de reapertura solo aplica a reportes rechazados");
		}
	}

	private String normalizarDetalle(String detalle) {
		if (detalle == null || detalle.isBlank()) {
			return null;
		}
		return detalle.trim();
	}

	private void registrarHistorial(Reporte reporte, EstadoReporte anterior, EstadoReporte nuevo,
			MotivoRechazo motivo, String detalle, String motivoReapertura, Usuario usuario) {
		ReporteHistorial historial = new ReporteHistorial();
		historial.setReporte(reporteRepository.getReferenceById(reporte.getId()));
		historial.setEstadoAnterior(anterior);
		historial.setEstadoNuevo(nuevo);
		historial.setUsuario(usuario);
		historial.setMotivo(motivo);
		historial.setDetalle(detalle);
		historial.setMotivoReapertura(motivoReapertura);
		reporteHistorialRepository.save(historial);
	}

	@Transactional
	public ReporteResponse asignar(Long id, Integer entidadId) {
		alcanceReportes.verificarPuedeAsignar(alcanceReportes.usuarioActual());
		Reporte reporte = buscar(id);
		if (reporte.getEstado() == EstadoReporte.RECHAZADO) {
			throw new IllegalArgumentException(
					"No se puede asignar una entidad a un reporte rechazado. Reabrelo primero.");
		}
		Entidad entidad = entidadRepository.findById(entidadId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Entidad no encontrada con id " + entidadId));
		reporte.setEntidadAsignada(entidad);
		return aRespuesta(reporteRepository.saveAndFlush(reporte));
	}

	private Reporte buscar(Long id) {
		return reporteRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Reporte no encontrado con id " + id));
	}

	private Pageable pagina(int pagina, int tamano) {
		int paginaSegura = Math.max(pagina, 0);
		int tamanoSeguro = Math.min(Math.max(tamano, 1), 100);
		return PageRequest.of(paginaSegura, tamanoSeguro, Sort.by(Sort.Direction.DESC, "fechaCreacion"));
	}

	private PaginaResponse<ReporteResumenResponse> aPagina(Page<Reporte> resultado) {
		List<ReporteResumenResponse> contenido = resultado.getContent().stream().map(this::aResumen).toList();
		return new PaginaResponse<>(contenido, resultado.getNumber(), resultado.getSize(),
				resultado.getTotalElements(), resultado.getTotalPages());
	}

	private ReporteResumenResponse aResumen(Reporte reporte) {
		String claveThumb = reporte.getUrlImagenThumb();
		String barrioNombre = reporte.getBarrio() != null ? reporte.getBarrio().getNombre() : null;
		String entidadNombre = reporte.getEntidadAsignada() != null
				? reporte.getEntidadAsignada().getNombre()
				: null;
		return new ReporteResumenResponse(
				reporte.getId(),
				reporte.getEstado(),
				reporte.getCategoriaIa(),
				reporte.getSeveridadIa(),
				reporte.getPrioridadCalculada(),
				reporte.getDescripcion(),
				claveThumb,
				resolvedorUrlArchivos.resolver(claveThumb),
				reporte.getBarrio() != null ? reporte.getBarrio().getGid() : null,
				barrioNombre,
				reporte.getEntidadAsignada() != null ? reporte.getEntidadAsignada().getId() : null,
				entidadNombre,
				reporte.getUsuario().getId(),
				reporte.getReportePadre() != null ? reporte.getReportePadre().getId() : null,
				reporte.getFechaCreacion(),
				reporte.getFechaActualizacion());
	}

	private ReporteResponse aRespuesta(Reporte reporte) {
		ServicioGeoespacial.CoordenadasGps gps = servicioGeoespacial.a4326(reporte.getUbicacion());
		String claveImagenHd = reporte.getUrlImagenHd();
		String claveImagenThumb = reporte.getUrlImagenThumb();

		return new ReporteResponse(
				reporte.getId(),
				reporte.getEstado(),
				reporte.getCategoriaIa(),
				reporte.getSeveridadIa(),
				reporte.getPrioridadCalculada(),
				reporte.getConfianzaIa(),
				reporte.getDescripcion(),
				gps.latitud(),
				gps.longitud(),
				claveImagenHd,
				resolvedorUrlArchivos.resolver(claveImagenHd),
				claveImagenThumb,
				resolvedorUrlArchivos.resolver(claveImagenThumb),
				reporte.getFechaCreacion(),
				reporte.getFechaActualizacion(),
				reporte.getUsuario().getId(),
				reporte.getBarrio() != null ? reporte.getBarrio().getGid() : null,
				reporte.getBarrio() != null ? reporte.getBarrio().getNombre() : null,
				reporte.getEntidadAsignada() != null ? reporte.getEntidadAsignada().getId() : null,
				reporte.getEntidadAsignada() != null ? reporte.getEntidadAsignada().getNombre() : null,
				reporte.getMotivoRechazo(),
				reporte.getDetalleRechazo(),
				reporte.getReportePadre() != null ? reporte.getReportePadre().getId() : null);
	}

	private Instant inicio(LocalDate fecha) {
		return fecha == null ? null : fecha.atStartOfDay(ZoneId.systemDefault()).toInstant();
	}

	private Instant finExclusivo(LocalDate fecha) {
		return fecha == null ? null : fecha.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
	}
}
