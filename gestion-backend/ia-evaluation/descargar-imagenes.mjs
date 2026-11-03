#!/usr/bin/env node
/**
 * Descarga el set de imagenes publicas para evaluar el clasificador.
 * Las imagenes se guardan en ia-evaluation/imagenes, que esta ignorada por Git.
 * El manifiesto conserva fuente, autor y licencia.
 */
import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve("ia-evaluation");
const imagenes = path.join(raiz, "imagenes");
const manifest = path.join(raiz, "manifest.csv");
const USER_AGENT = "GestionIncidenciasEvaluator/1.0";

const archivos = [
  // HUECO_VIA: 10
  { categoria: "HUECO_VIA", titulo: "File:Pothole Big.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Bache de calle.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Pothole in the street.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:A pothole in Dilova Street in Kyiv.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Pothole on Market Street - geograph.org.uk - 5030145.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Duke Street pothole, Blaenavon - geograph.org.uk - 7880520.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Pothole on local Road in County Monaghan.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Potholes in Bengaluru road.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Pothole in Indianapolis - May 2022 - Sarah Stierch.jpg" },
  { categoria: "HUECO_VIA", titulo: "File:Road in Nairobi, Kenya with large pothole Aug 10, 2025 04-27-36 PM.jpeg" },

  // FUGA_AGUA: 10
  { categoria: "FUGA_AGUA", titulo: "File:A photo of a water leak on Camberwell Place 2022-10-08 7.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:A photo of a water leak on Camberwell Place 2022-10-08 9.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:Burst pipe in Long Eaton.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:Pipe burst in Innsbruck city.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:Burst water pipe - geograph.org.uk - 6866868.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:Burst water main (geograph 2646387).jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:Burst water pipe in Churchland Lane, Sedlescombe - geograph.org.uk - 7506999.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:A photo of a water leak on Camberwell Place 2022-10-08 8.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:A photo of a water leak on Camberwell Place 2022-10-08 10.jpg" },
  { categoria: "FUGA_AGUA", titulo: "File:Burst pipe - Hawley Lane - geograph.org.uk - 7361881.jpg" },

  // FALLA_ALUMBRADO: 10
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Broken lamppost - streetlight collision on A899 Livingston Road - geograph.org.uk - 990599.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Damaged public street light, Feijenoord, Rotterdam (2021) 01.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Damaged public street light, Feijenoord, Rotterdam (2021) 02.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Damaged public street light, Feijenoord, Rotterdam (2021) 03.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Damaged public street light, Feijenoord, Rotterdam (2021) 04.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Apollostraat broken street light 'In behandeling bij de gemeente Rotterdam', Hillegersberg, Rotterdam (2020) 01.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Apollostraat broken street light 'In behandeling bij de gemeente Rotterdam', Hillegersberg, Rotterdam (2020) 02.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Broken lamppost - streetlight on A899 Livingston Road - geograph.org.uk - 957464.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Damaged lamp post, Fira, Santorini, Greece (approx. GPS location) julesvernex2.jpg" },
  { categoria: "FALLA_ALUMBRADO", titulo: "File:Damaged lamp post in Christiansfeld.jpg" },

  // ACUMULACION_BASURA: 10
  { categoria: "ACUMULACION_BASURA", titulo: "File:India - Sights & Culture - Common garbage dump outside a temple (2566331277).jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Albert Place garbage problem persists.jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Everyday Dumping (36312775123).jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Pile of garbage (8372997400).jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Pile of garbage 2.jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Garbage pile - panoramio.jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Illegal waste dump in Nigeria 04.jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Trash Bags on Bourbon Street, NOLA March 2020.jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:Puerto Vallarta trash in the road.jpg" },
  { categoria: "ACUMULACION_BASURA", titulo: "File:NYC - trash on sidewalk.jpg" },

  // NO_RELACIONADO: 9 + MER local = 10
  { categoria: "NO_RELACIONADO", titulo: "File:Green hill on a path.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:A cat in a cafe in Tbilisi, Georgia.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:Sleeping cat on her back.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:Cat November 2010-1a.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:Liver yellow dog in the water looking at viewer at golden hour in Don Det Laos.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:White dog sleeping on the floor with puppies after nursing in Don Det Laos.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:Zagedan Lakes, Mountain cirque, Caucasus Mountains.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:Tulip Tulipa clusiana 'Lady Jane' Rock Ledge Flower Edit 2000px.jpg" },
  { categoria: "NO_RELACIONADO", titulo: "File:Building facade in Avenida Paulista.jpg" }
];

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchConReintentos(url, opciones = {}, intentos = 5) {
  let ultimoError;
  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      const respuesta = await fetch(url, opciones);
      if (respuesta.ok) return respuesta;
      ultimoError = new Error(`HTTP ${respuesta.status}`);
      if (respuesta.status !== 429 && respuesta.status < 500) throw ultimoError;
    } catch (error) {
      ultimoError = error;
    }
    await dormir(2500 * intento);
  }
  throw ultimoError;
}

const paginas = {};
const LOTE = 15;
for (let inicio = 0; inicio < archivos.length; inicio += LOTE) {
  const lote = archivos.slice(inicio, inicio + LOTE);
  const titulos = lote.map((archivo) => archivo.titulo).join("|");
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titulos)}&prop=imageinfo&iiprop=url%7Cmime%7Csize%7Cextmetadata&iiurlwidth=1024&format=json&origin=*`;
  const respuesta = await fetchConReintentos(url, {
    headers: { "User-Agent": USER_AGENT }
  });
  const datos = await respuesta.json();
  Object.assign(paginas, datos.query?.pages || {});
  await dormir(1000);
}

fs.mkdirSync(imagenes, { recursive: true });
const filas = ["categoria,archivo,fuente,licencia,autor"];
let descargadas = 0;

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
  try {
    const imagen = await fetchConReintentos(urlImagen, {
      headers: { "User-Agent": USER_AGENT }
    });
    fs.writeFileSync(archivoDestino, Buffer.from(await imagen.arrayBuffer()));
    descargadas += 1;
  } catch (error) {
    console.warn(`No se pudo descargar ${archivo.titulo}: ${error.message}`);
    continue;
  }

  filas.push([
    archivo.categoria,
    `${archivo.categoria}/${nombre}`,
    info.descriptionurl || urlImagen,
    limpio(md.LicenseShortName?.value),
    limpio(md.Artist?.value)
  ].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","));

  console.log(`OK ${archivo.categoria}/${nombre}`);
  await dormir(400);
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
console.log(`Descargadas: ${descargadas}`);
console.log(`Manifiesto: ${manifest}`);
