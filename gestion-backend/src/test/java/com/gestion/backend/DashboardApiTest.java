package com.gestion.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.gestion.backend.geoespacial.ServicioGeoespacial;
import com.gestion.backend.modelo.Barrio;
import com.gestion.backend.modelo.Entidad;
import com.gestion.backend.modelo.EstadoReporte;
import com.gestion.backend.modelo.PrioridadCalculada;
import com.gestion.backend.modelo.Reporte;
import com.gestion.backend.modelo.RolUsuario;
import com.gestion.backend.modelo.Severidad;
import com.gestion.backend.modelo.TipoIncidencia;
import com.gestion.backend.modelo.Usuario;
import com.gestion.backend.repositorio.BarrioRepository;
import com.gestion.backend.repositorio.EntidadRepository;
import com.gestion.backend.repositorio.ReporteRepository;
import com.gestion.backend.repositorio.UsuarioRepository;
import com.gestion.backend.seguridad.ServicioTokens;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest(properties = {
		"gestion.semantica.ruta-tdb=target/jena-test-web",
		"gestion.almacenamiento.ruta-local=target/uploads-test-web" })
@AutoConfigureMockMvc
@Transactional
class DashboardApiTest {

	private static final MediaType GEOJSON = MediaType.valueOf("application/geo+json");

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UsuarioRepository usuarioRepository;

	@Autowired
	private EntidadRepository entidadRepository;

	@Autowired
	private BarrioRepository barrioRepository;

	@Autowired
	private ReporteRepository reporteRepository;

	@Autowired
	private ServicioTokens servicioTokens;

	@Autowired
	private ServicioGeoespacial servicioGeoespacial;

	private Usuario crearUsuario(RolUsuario rol, Entidad entidad) {
		Usuario usuario = new Usuario();
		usuario.setNombre("Usuario " + rol);
		usuario.setEmail("dashboard." + UUID.randomUUID() + "@test.local");
		usuario.setPasswordHash("no-aplica");
		usuario.setRol(rol);
		usuario.setEntidad(entidad);
		usuario.setFechaRegistro(Instant.now());
		return usuarioRepository.save(usuario);
	}

	private String autorizacion(Usuario usuario) {
		return "Bearer " + servicioTokens.generar(usuario).token();
	}

	private Reporte crearReporte(Usuario autor, Entidad entidad, TipoIncidencia categoria,
			PrioridadCalculada prioridad) {
		return crearReporte(autor, entidad, categoria, prioridad, null);
	}

	private Reporte crearReporte(Usuario autor, Entidad entidad, TipoIncidencia categoria,
			PrioridadCalculada prioridad, Barrio barrio) {
		Reporte reporte = new Reporte();
		reporte.setUsuario(autor);
		reporte.setEntidadAsignada(entidad);
		reporte.setBarrio(barrio);
		reporte.setUbicacion(servicioGeoespacial.a9377(0.0, -70.0));
		reporte.setCategoriaIa(categoria);
		reporte.setSeveridadIa(Severidad.MEDIA);
		reporte.setDescripcion("Reporte de prueba " + UUID.randomUUID());
		reporte.setUrlImagenHd("https://almacenamiento.local/reportes/" + UUID.randomUUID() + ".jpg");
		reporte.setEstado(EstadoReporte.PENDIENTE);
		reporte.setPrioridadCalculada(prioridad);
		return reporteRepository.saveAndFlush(reporte);
	}

	private List<Entidad> entidades() {
		return entidadRepository.findAll();
	}

	@Test
	void ciudadanoNoPuedeAccederAlDashboard() throws Exception {
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		String autorizacion = autorizacion(ciudadano);

		mockMvc.perform(get("/api/reportes")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/dashboard/resumen")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isForbidden());
	}

	@Test
	void funcionarioSoloVeReportesDeSuEntidad() throws Exception {
		List<Entidad> entidades = entidades();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);

		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		crearReporte(ciudadano, entidadA, TipoIncidencia.HUECO_VIA, PrioridadCalculada.MEDIA);
		crearReporte(ciudadano, entidadB, TipoIncidencia.FUGA_AGUA, PrioridadCalculada.ALTA);

		Usuario funcionario = crearUsuario(RolUsuario.FUNCIONARIO, entidadA);
		String autorizacion = autorizacion(funcionario);

		MvcResult resultado = mockMvc.perform(get("/api/reportes")
				.param("size", "100")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andReturn();

		String cuerpo = resultado.getResponse().getContentAsString();
		List<Number> entidadesEnResultado = JsonPath.read(cuerpo, "$.contenido[*].entidadAsignadaId");
		assertThat(entidadesEnResultado).isNotEmpty();
		assertThat(entidadesEnResultado)
				.allMatch(entidadId -> entidadId.intValue() == entidadA.getId());

		MvcResult filtrado = mockMvc.perform(get("/api/reportes")
				.param("entidadId", String.valueOf(entidadB.getId()))
				.param("size", "100")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andReturn();

		List<Number> entidadesFiltradas = JsonPath.read(filtrado.getResponse().getContentAsString(),
				"$.contenido[*].entidadAsignadaId");
		assertThat(entidadesFiltradas)
				.allMatch(entidadId -> entidadId.intValue() == entidadA.getId());
	}

	@Test
	void empresaSoloVeReportesDeSuEntidad() throws Exception {
		List<Entidad> entidades = entidades();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);

		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		crearReporte(ciudadano, entidadA, TipoIncidencia.HUECO_VIA, PrioridadCalculada.MEDIA);
		crearReporte(ciudadano, entidadB, TipoIncidencia.FUGA_AGUA, PrioridadCalculada.ALTA);

		Usuario empresa = crearUsuario(RolUsuario.EMPRESA, entidadA);

		MvcResult resultado = mockMvc.perform(get("/api/reportes")
				.param("size", "100")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(empresa)))
				.andExpect(status().isOk())
				.andReturn();

		List<Number> entidadesEnResultado = JsonPath.read(resultado.getResponse().getContentAsString(),
				"$.contenido[*].entidadAsignadaId");
		assertThat(entidadesEnResultado).isNotEmpty();
		assertThat(entidadesEnResultado)
				.allMatch(entidadId -> entidadId.intValue() == entidadA.getId());
	}

	@Test
	void funcionarioNoPuedeVerNiCambiarReporteDeOtraEntidad() throws Exception {
		List<Entidad> entidades = entidades();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);

		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Reporte reporte = crearReporte(ciudadano, entidadA, TipoIncidencia.HUECO_VIA,
				PrioridadCalculada.MEDIA);
		Usuario funcionarioB = crearUsuario(RolUsuario.FUNCIONARIO, entidadB);

		mockMvc.perform(get("/api/reportes/" + reporte.getId())
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionarioB)))
				.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionarioB))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\"}"))
				.andExpect(status().isForbidden());

		Usuario funcionarioA = crearUsuario(RolUsuario.FUNCIONARIO, entidadA);

		mockMvc.perform(get("/api/reportes/" + reporte.getId())
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionarioA)))
				.andExpect(status().isOk());

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionarioA))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("EN_REVISION"));
	}

	@Test
	void empresaPuedeCambiarEstadoSoloDeReportesDeSuEntidad() throws Exception {
		List<Entidad> entidades = entidades();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);

		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Reporte reporteA = crearReporte(ciudadano, entidadA, TipoIncidencia.FUGA_AGUA,
				PrioridadCalculada.ALTA);
		Reporte reporteB = crearReporte(ciudadano, entidadB, TipoIncidencia.HUECO_VIA,
				PrioridadCalculada.MEDIA);
		Usuario empresa = crearUsuario(RolUsuario.EMPRESA, entidadA);
		String autorizacion = autorizacion(empresa);

		mockMvc.perform(patch("/api/reportes/" + reporteA.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("EN_REVISION"));

		mockMvc.perform(patch("/api/reportes/" + reporteB.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\"}"))
				.andExpect(status().isForbidden());
	}

	@Test
	void listadoAceptaFiltrosDeFechaBarrioTextoYPrioridad() throws Exception {
		Entidad entidad = entidades().get(0);
		Barrio barrio = barrioRepository.findAll().get(0);
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);

		String descripcion = "filtro-" + UUID.randomUUID();
		Reporte reporte = crearReporte(ciudadano, entidad, TipoIncidencia.FUGA_AGUA,
				PrioridadCalculada.ALTA, barrio);
		reporte.setDescripcion(descripcion);
		reporteRepository.saveAndFlush(reporte);

		String hoy = LocalDate.now().toString();
		MvcResult resultado = mockMvc.perform(get("/api/reportes")
				.param("texto", descripcion)
				.param("categoria", "FUGA_AGUA")
				.param("prioridad", "ALTA")
				.param("barrioId", String.valueOf(barrio.getGid()))
				.param("desde", hoy)
				.param("hasta", hoy)
				.param("size", "100")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin)))
				.andExpect(status().isOk())
				.andReturn();

		String cuerpo = resultado.getResponse().getContentAsString();
		assertThat(((Number) JsonPath.read(cuerpo, "$.total")).longValue()).isGreaterThanOrEqualTo(1);
		List<String> categorias = JsonPath.read(cuerpo, "$.contenido[*].categoriaIa");
		List<String> prioridades = JsonPath.read(cuerpo, "$.contenido[*].prioridadCalculada");
		List<Number> barrios = JsonPath.read(cuerpo, "$.contenido[*].barrioId");
		List<String> barriosNombre = JsonPath.read(cuerpo, "$.contenido[*].barrioNombre");
		List<String> entidadesNombre = JsonPath.read(cuerpo, "$.contenido[*].entidadNombre");
		assertThat(categorias).allMatch("FUGA_AGUA"::equals);
		assertThat(prioridades).allMatch("ALTA"::equals);
		assertThat(barrios).allMatch(barrioId -> barrioId.intValue() == barrio.getGid());
		assertThat(barriosNombre).allMatch(barrio.getNombre()::equals);
		assertThat(entidadesNombre).allMatch(entidad.getNombre()::equals);
	}

	@Test
	void funcionarioSoloVeSuEntidadEnElCatalogo() throws Exception {
		List<Entidad> entidades = entidades();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);
		Usuario funcionario = crearUsuario(RolUsuario.FUNCIONARIO, entidadA);

		MvcResult resultado = mockMvc.perform(get("/api/entidades")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionario)))
				.andExpect(status().isOk())
				.andReturn();

		List<Number> ids = JsonPath.read(resultado.getResponse().getContentAsString(), "$[*].id");
		assertThat(ids).hasSize(1);
		assertThat(ids.get(0).intValue()).isEqualTo(entidadA.getId());
		assertThat(ids.get(0).intValue()).isNotEqualTo(entidadB.getId());
	}

	@Test
	void resumenIncluyeElBarrioDelReporte() throws Exception {
		Entidad entidad = entidades().get(0);
		Barrio barrio = barrioRepository.findAll().get(0);
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		crearReporte(ciudadano, entidad, TipoIncidencia.HUECO_VIA, PrioridadCalculada.MEDIA, barrio);

		MvcResult resultado = mockMvc.perform(get("/api/dashboard/resumen")
				.param("barrioId", String.valueOf(barrio.getGid()))
				.param("entidadId", String.valueOf(entidad.getId()))
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin)))
				.andExpect(status().isOk())
				.andReturn();

		List<Map<String, Object>> porBarrio = JsonPath.read(resultado.getResponse().getContentAsString(),
				"$.porBarrio");
		assertThat(porBarrio)
				.anyMatch(fila -> ((Number) fila.get("barrioId")).intValue() == barrio.getGid());
	}

	@Test
	void asignacionConEntidadInexistenteResponde404() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Reporte reporte = crearReporte(ciudadano, entidades().get(0), TipoIncidencia.HUECO_VIA,
				PrioridadCalculada.MEDIA);

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/asignacion")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"entidadId\":999999}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void administradorListaYFiltraReportes() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Entidad entidad = entidades().get(0);
		crearReporte(ciudadano, entidad, TipoIncidencia.FUGA_AGUA, PrioridadCalculada.ALTA);

		MvcResult resultado = mockMvc.perform(get("/api/reportes")
				.param("categoria", "FUGA_AGUA")
				.param("page", "0")
				.param("size", "1")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pagina").value(0))
				.andExpect(jsonPath("$.tamano").value(1))
				.andExpect(jsonPath("$.contenido").isArray())
				.andReturn();

		String cuerpo = resultado.getResponse().getContentAsString();
		assertThat(((Number) JsonPath.read(cuerpo, "$.total")).longValue()).isGreaterThanOrEqualTo(1);
		List<String> categorias = JsonPath.read(cuerpo, "$.contenido[*].categoriaIa");
		assertThat(categorias).allMatch("FUGA_AGUA"::equals);
	}

	@Test
	void ciudadanoConsultaMiosSoloDeSusReportes() throws Exception {
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Usuario otro = crearUsuario(RolUsuario.CIUDADANO, null);
		Entidad entidad = entidades().get(0);
		crearReporte(ciudadano, entidad, TipoIncidencia.HUECO_VIA, PrioridadCalculada.MEDIA);
		crearReporte(otro, entidad, TipoIncidencia.ACUMULACION_BASURA, PrioridadCalculada.BAJA);

		MvcResult resultado = mockMvc.perform(get("/api/reportes/mios")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(ciudadano)))
				.andExpect(status().isOk())
				.andReturn();

		List<Number> usuarios = JsonPath.read(resultado.getResponse().getContentAsString(),
				"$.contenido[*].usuarioId");
		assertThat(usuarios).isNotEmpty();
		assertThat(usuarios).allMatch(usuarioId -> usuarioId.longValue() == ciudadano.getId());
	}

	@Test
	void resumenDelDashboardEsCoherente() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Entidad entidad = entidades().get(0);
		crearReporte(ciudadano, entidad, TipoIncidencia.FUGA_AGUA, PrioridadCalculada.CRITICA);

		MvcResult resultado = mockMvc.perform(get("/api/dashboard/resumen")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.porEstado").isMap())
				.andExpect(jsonPath("$.porCategoria").isMap())
				.andExpect(jsonPath("$.porPrioridad").isMap())
				.andExpect(jsonPath("$.porBarrio").isArray())
				.andReturn();

		String cuerpo = resultado.getResponse().getContentAsString();
		long total = ((Number) JsonPath.read(cuerpo, "$.total")).longValue();
		Map<String, Number> porEstado = JsonPath.read(cuerpo, "$.porEstado");
		long sumaEstados = porEstado.values().stream().mapToLong(Number::longValue).sum();
		assertThat(total).isGreaterThanOrEqualTo(1);
		assertThat(sumaEstados).isEqualTo(total);

		Map<String, Number> porPrioridad = JsonPath.read(cuerpo, "$.porPrioridad");
		assertThat(porPrioridad.get("CRITICA").longValue()).isGreaterThanOrEqualTo(1);
		assertThat(((Number) JsonPath.read(cuerpo, "$.criticos")).longValue()).isGreaterThanOrEqualTo(1);
	}

	@Test
	void rechazoRequiereMotivoYQuedaRegistradoEnElHistorial() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Entidad entidad = entidades().get(0);
		Reporte reporte = crearReporte(ciudadano, entidad, TipoIncidencia.HUECO_VIA,
				PrioridadCalculada.MEDIA);
		String autorizacion = autorizacion(admin);

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"RECHAZADO\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje").value("Debe indicar el motivo del rechazo"));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"RECHAZADO\",\"motivoRechazo\":\"OTRO\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje")
						.value("Debe explicar el motivo cuando selecciona OTRO"));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"estado":"RECHAZADO","motivoRechazo":"NO_RELACIONADO",
						 "detalleRechazo":"La imagen no corresponde a una incidencia urbana."}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("RECHAZADO"))
				.andExpect(jsonPath("$.motivoRechazo").value("NO_RELACIONADO"))
				.andExpect(jsonPath("$.detalleRechazo")
						.value("La imagen no corresponde a una incidencia urbana."));

		mockMvc.perform(get("/api/reportes/" + reporte.getId() + "/historial")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].estadoAnterior").value("PENDIENTE"))
				.andExpect(jsonPath("$[0].estadoNuevo").value("RECHAZADO"))
				.andExpect(jsonPath("$[0].motivo").value("NO_RELACIONADO"))
				.andExpect(jsonPath("$[0].usuarioId").value(admin.getId()))
				.andExpect(jsonPath("$[0].usuarioNombre").value(admin.getNombre()));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje").value("Debe indicar el motivo de reapertura"));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"PENDIENTE\",\"motivoReapertura\":\"Correccion\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje")
						.value("No se permite cambiar el estado de RECHAZADO a PENDIENTE"));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"estado":"EN_REVISION",
						 "motivoReapertura":"El rechazo fue un error de moderacion."}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("EN_REVISION"))
				.andExpect(jsonPath("$.motivoRechazo").value(org.hamcrest.Matchers.nullValue()))
				.andExpect(jsonPath("$.detalleRechazo").value(org.hamcrest.Matchers.nullValue()));

		mockMvc.perform(get("/api/reportes/" + reporte.getId() + "/historial")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[1].estadoAnterior").value("RECHAZADO"))
				.andExpect(jsonPath("$[1].estadoNuevo").value("EN_REVISION"))
				.andExpect(jsonPath("$[1].motivoReapertura")
						.value("El rechazo fue un error de moderacion."));
	}

	@Test
	void resumenSeparaRechazadosYReportesSinClasificar() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		String autorizacion = autorizacion(admin);

		MvcResult antes = mockMvc.perform(get("/api/dashboard/resumen")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andReturn();
		long rechazadosAntes = ((Number) JsonPath.read(
				antes.getResponse().getContentAsString(), "$.rechazados")).longValue();
		long sinClasificarAntes = ((Number) JsonPath.read(
				antes.getResponse().getContentAsString(), "$.pendientesClasificacion")).longValue();
		long sinAsignarAntes = ((Number) JsonPath.read(
				antes.getResponse().getContentAsString(), "$.sinAsignar")).longValue();

		Reporte rechazado = crearReporte(ciudadano, null, null, PrioridadCalculada.MEDIA);
		rechazado.setEstado(EstadoReporte.RECHAZADO);
		rechazado.setMotivoRechazo(com.gestion.backend.modelo.MotivoRechazo.NO_RELACIONADO);
		reporteRepository.saveAndFlush(rechazado);

		MvcResult despuesRechazo = mockMvc.perform(get("/api/dashboard/resumen")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andReturn();
		String cuerpoDespuesRechazo = despuesRechazo.getResponse().getContentAsString();
		assertThat(((Number) JsonPath.read(cuerpoDespuesRechazo, "$.rechazados")).longValue())
				.isEqualTo(rechazadosAntes + 1);
		assertThat(((Number) JsonPath.read(cuerpoDespuesRechazo, "$.pendientesClasificacion")).longValue())
				.isEqualTo(sinClasificarAntes);
		assertThat(((Number) JsonPath.read(cuerpoDespuesRechazo, "$.sinAsignar")).longValue())
				.isEqualTo(sinAsignarAntes);

		crearReporte(ciudadano, null, null, PrioridadCalculada.MEDIA);

		MvcResult despuesPendiente = mockMvc.perform(get("/api/dashboard/resumen")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andReturn();
		String cuerpoDespuesPendiente = despuesPendiente.getResponse().getContentAsString();
		assertThat(((Number) JsonPath.read(cuerpoDespuesPendiente, "$.pendientesClasificacion")).longValue())
				.isEqualTo(sinClasificarAntes + 1);
		assertThat(((Number) JsonPath.read(cuerpoDespuesPendiente, "$.sinAsignar")).longValue())
				.isEqualTo(sinAsignarAntes + 1);
	}

	@Test
	void geojsonDeReportesTieneFeaturesYPuntosValidos() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		crearReporte(ciudadano, entidades().get(0), TipoIncidencia.HUECO_VIA, PrioridadCalculada.MEDIA);

		MvcResult resultado = mockMvc.perform(get("/api/reportes/geojson")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin)))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(GEOJSON))
				.andExpect(jsonPath("$.type").value("FeatureCollection"))
				.andExpect(jsonPath("$.features").isArray())
				.andReturn();

		String cuerpo = resultado.getResponse().getContentAsString();
		List<Number> coordenadas = JsonPath.read(cuerpo, "$.features[0].geometry.coordinates");
		assertThat(coordenadas).hasSize(2);
		assertThat(coordenadas.get(0).doubleValue()).isBetween(-180.0, 180.0);
		assertThat(coordenadas.get(1).doubleValue()).isBetween(-90.0, 90.0);
		assertThat((Object) JsonPath.read(cuerpo, "$.features[0].properties.id")).isNotNull();

		String fechaCreacion = JsonPath.read(cuerpo, "$.features[0].properties.fechaCreacion");
		assertThatCode(() -> Instant.parse(fechaCreacion)).doesNotThrowAnyException();
	}

	@Test
	void catalogosGeojsonYEntidadesEstanDisponibles() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		String autorizacion = autorizacion(admin);

		mockMvc.perform(get("/api/barrios/geojson")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(GEOJSON))
				.andExpect(jsonPath("$.type").value("FeatureCollection"))
				.andExpect(jsonPath("$.features").isArray());

		mockMvc.perform(get("/api/sitios-interes/geojson")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(GEOJSON))
				.andExpect(jsonPath("$.type").value("FeatureCollection"))
				.andExpect(jsonPath("$.features").isArray());

		MvcResult entidades = mockMvc.perform(get("/api/entidades")
				.header(HttpHeaders.AUTHORIZATION, autorizacion))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andReturn();

		List<Object> listaEntidades = JsonPath.read(entidades.getResponse().getContentAsString(), "$");
		assertThat(listaEntidades).hasSizeGreaterThanOrEqualTo(3);
	}

	@Test
	void noSePuedeAsignarEntidadAReporteRechazado() throws Exception {
		List<Entidad> entidades = entidades();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);

		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Reporte reporte = crearReporte(ciudadano, entidadA, TipoIncidencia.HUECO_VIA,
				PrioridadCalculada.MEDIA);
		reporte.setEstado(EstadoReporte.RECHAZADO);
		reporte.setMotivoRechazo(com.gestion.backend.modelo.MotivoRechazo.NO_RELACIONADO);
		reporteRepository.saveAndFlush(reporte);

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/asignacion")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"entidadId\":" + entidadB.getId() + "}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje")
						.value("No se puede asignar una entidad a un reporte rechazado. Reabrelo primero."));

		Reporte sinCambios = reporteRepository.findById(reporte.getId()).orElseThrow();
		assertThat(sinCambios.getEntidadAsignada().getId()).isEqualTo(entidadA.getId());
	}

	@Test
	void respetaLaMatrizDeTransicionesYBloqueaReaperturaDeResueltosSinAdmin() throws Exception {
		Entidad entidadA = entidades().get(0);
		Entidad entidadB = entidades().get(1);
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario funcionario = crearUsuario(RolUsuario.FUNCIONARIO, entidadA);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Reporte reporte = crearReporte(ciudadano, entidadA, TipoIncidencia.HUECO_VIA,
				PrioridadCalculada.MEDIA);

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"RESUELTO\"}"))
				.andExpect(status().isBadRequest());

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\"}"))
				.andExpect(status().isOk());

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"ASIGNADO\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("ASIGNADO"));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"RESUELTO\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("RESUELTO"));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/asignacion")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"entidadId\":" + entidadB.getId() + "}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje")
						.value("No se puede asignar una entidad a un reporte resuelto. Reabrelo primero."));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionario))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\",\"motivoReapertura\":\"Correccion\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje").value("Debe indicar el motivo de reapertura"));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\",\"motivoReapertura\":\"Se corrigio el cierre\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.estado").value("EN_REVISION"));

		mockMvc.perform(get("/api/reportes/" + reporte.getId() + "/historial")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(4))
				.andExpect(jsonPath("$[3].estadoAnterior").value("RESUELTO"))
				.andExpect(jsonPath("$[3].estadoNuevo").value("EN_REVISION"))
				.andExpect(jsonPath("$[3].motivoReapertura").value("Se corrigio el cierre"));
	}

	@Test
	void noSePuedeMarcarAsignadoSinEntidadResponsable() throws Exception {
		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Reporte reporte = crearReporte(ciudadano, null, null, PrioridadCalculada.BAJA);

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"EN_REVISION\"}"))
				.andExpect(status().isOk());

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/estado")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"estado\":\"ASIGNADO\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensaje").value(
						"Debe asignar una entidad responsable antes de marcar el reporte como ASIGNADO"));
	}

	@Test
	void administradorAsignaEntidadYFuncionarioNoPuedeAsignar() throws Exception {
		List<Entidad> entidades = entidades();
		Entidad entidadA = entidades.get(0);
		Entidad entidadB = entidades.get(1);

		Usuario admin = crearUsuario(RolUsuario.ADMINISTRADOR, null);
		Usuario funcionario = crearUsuario(RolUsuario.FUNCIONARIO, entidadB);
		Usuario ciudadano = crearUsuario(RolUsuario.CIUDADANO, null);
		Reporte reporte = crearReporte(ciudadano, entidadA, TipoIncidencia.HUECO_VIA,
				PrioridadCalculada.MEDIA);

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/asignacion")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(admin))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"entidadId\":" + entidadB.getId() + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.entidadAsignadaId").value(entidadB.getId()))
				.andExpect(jsonPath("$.estado").value("PENDIENTE"));

		mockMvc.perform(patch("/api/reportes/" + reporte.getId() + "/asignacion")
				.header(HttpHeaders.AUTHORIZATION, autorizacion(funcionario))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"entidadId\":" + entidadA.getId() + "}"))
				.andExpect(status().isForbidden());
	}

	@Test
	void corsPermiteElOrigenDelDashboard() throws Exception {
		mockMvc.perform(options("/api/reportes")
				.header(HttpHeaders.ORIGIN, "http://localhost:5173")
				.header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
				.andExpect(status().isOk())
				.andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
	}

	@Test
	void documentacionOpenApiEstaDisponibleSinToken() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.openapi").exists());
	}
}
