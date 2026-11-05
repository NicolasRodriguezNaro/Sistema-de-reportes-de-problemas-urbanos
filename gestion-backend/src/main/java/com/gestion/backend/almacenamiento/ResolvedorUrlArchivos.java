package com.gestion.backend.almacenamiento;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Resuelve claves de almacenamiento a URLs temporales.
 *
 * <p>Las URLs firmadas se reutilizan durante unos minutos. Sin esta caché,
 * cada respuesta de la API genera una firma nueva y el cliente móvil pierde
 * el caché de imágenes aunque el objeto no haya cambiado.</p>
 */
@Component
public class ResolvedorUrlArchivos {

	private static final Duration VIGENCIA_CACHE = Duration.ofMinutes(10);
	private static final int MAX_ENTRADAS = 1_000;

	private final AlmacenamientoArchivos almacenamiento;
	private final Map<String, UrlCacheada> cache = new ConcurrentHashMap<>();

	public ResolvedorUrlArchivos(AlmacenamientoArchivos almacenamiento) {
		this.almacenamiento = almacenamiento;
	}

	public String resolver(String valor) {
		if (valor == null) {
			return null;
		}
		if (valor.startsWith("http://") || valor.startsWith("https://")) {
			return valor;
		}

		Instant ahora = Instant.now();
		UrlCacheada guardada = cache.get(valor);
		if (guardada != null && guardada.expira().isAfter(ahora)) {
			return guardada.url();
		}

		String url = almacenamiento.urlDe(valor);
		cache.put(valor, new UrlCacheada(url, ahora.plus(VIGENCIA_CACHE)));

		if (cache.size() > MAX_ENTRADAS) {
			cache.entrySet().removeIf(entrada -> !entrada.getValue().expira().isAfter(ahora));
		}

		return url;
	}

	private record UrlCacheada(String url, Instant expira) {
	}
}
