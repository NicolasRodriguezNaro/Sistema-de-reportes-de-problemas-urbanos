#!/usr/bin/env node
/**
 * Descarga un set pequeno de imagenes publicas para evaluar el clasificador.
 * Las imagenes se guardan en ia-evaluation/imagenes, que esta ignorada por Git.
 * El manifiesto conserva fuente, autor y licencia.
 */
import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve("ia-evaluation");
const imagenes = path.join(raiz, "imagenes");
const manifest = path.join(raiz, "manifest.csv");

const archivos = [
  { categoria: "HUECO_VIA", titulo: "File:Pothole Big.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Bache de calle.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Pothole in the street.jpg" },

  { categoria: "FUGA_AGUA", titulo: "File:Tiverton , Bampton Street Water Leak - geograph.org.uk - 1436412.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:A photo of a water leak on Camberwell Place 2022-10-08 7.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:A photo of a water leak on Camberwell Place 2022-10-08 9.jpg" },

  { categoria: "FALLA_ALUMBRADO", titulo: "File:Damaged street light (25593659424).jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Broken Street Light Stevenage (The White Way Lamppost 26) - geograph.org.uk - 8268947.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Broken lamppost - streetlight collision on A899 Livingston Road - geograph.org.uk - 990599.jpg" },

  { categoria: "ACUMULACION_BASURA", titulo: "File:India - Sights & Culture - Common garbage dump outside a temple (2566331277).jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Albert Place garbage problem persists.jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Everyday Dumping (36312775123).jpg" },

  { categoria: "NO_RELACIONADO", titulo: "File:Green hill on a path.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:A cat in a cafe in Tbilisi, Georgia.jpg" }
];

const titulos = archivos.map((a) => a.titulo).join("|");
const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titulos)}&prop=imageinfo&iiprop=url%7Cmime%7Csize%7Cextmetadata&iiurlwidth=1024&format=json&origin=*`;

const respuesta = await fetch(url, {
  headers: { "User-Agent": "GestionIncidenciasEvaluator/1.0" }
});
if (!respuesta.ok) throw new Error(`Wikimedia respondio HTTP ${respuesta.status}`);
const datos = await respuesta.json();
const paginas = datos.query?.pages || {};

fs.mkdirSync(imagenes, { recursive: true });
const filas = ["categoria,archivo,fuente,licencia,autor"];

for (const archivo of archivos) {
  const pagina = Object.values(paginas).find((p) => p.title === archivo.titulo);
  if (!pagina?.imageinfo?.[0]) {
    console.warn(`No encontrado: ${archivo.titulo}`);
    continue;
  }
  const info = pagina.imageinfo[0];
  const md = info.extmetadata || {};
  const limpio = (v) => String(v || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const nombreOriginal = archivo.titulo.replace(/^File:/, "");
  const nombre = nombreOriginal.replace(/[^A-Za-z0-9._-]+/g, "_");
  const destino = path.join(imagenes, archivo.categoria);
  fs.mkdirSync(destino, { recursive: true });
  const archivoDestino = path.join(destino, nombre);

  const urlImagen = info.thumburl || info.url;
  const imagen = await fetch(urlImagen, {
    headers: { "User-Agent": "GestionIncidenciasEvaluator/1.0" }
  });
  if (!imagen.ok) {
    console.warn(`No se pudo descargar ${archivo.titulo}: HTTP ${imagen.status}`);
    continue;
  }
  fs.writeFileSync(archivoDestino, Buffer.from(await imagen.arrayBuffer()));

  filas.push([
    archivo.categoria,
    `${archivo.categoria}/${nombre}`,
    info.descriptionurl || urlImagen,
    limpio(md.LicenseShortName?.value),
    limpio(md.Artist?.value)
  ].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","));

  console.log(`OK ${archivo.categoria}/${nombre}`);
}

// Una imagen local adicional para "no relacionado": el diagrama MER del proyecto.
const merOrigen = path.resolve("..", "MER.png");
const merDestino = path.join(imagenes, "NO_RELACIONADO", "mer.png");
if (fs.existsSync(merOrigen)) {
  fs.copyFileSync(merOrigen, merDestino);
  filas.push('"NO_RELACIONADO","NO_RELACIONADO/mer.png","Proyecto local MER.png","Uso interno","Proyecto"');
  console.log("OK NO_RELACIONADO/mer.png");
}

fs.writeFileSync(manifest, `${filas.join("\n")}\n`, "utf8");
console.log(`Manifiesto: ${manifest}`);
