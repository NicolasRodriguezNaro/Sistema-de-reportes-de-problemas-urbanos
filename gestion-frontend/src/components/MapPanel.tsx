import { useEffect } from "react";
import { circleMarker, latLngBounds } from "leaflet";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

import { useLanguage } from "../i18n/LanguageContext";
import type {
  BarrioGeoProperties,
  FeatureCollection,
  ReporteGeoProperties,
  SitioGeoProperties,
} from "../types/api";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO, formatearFecha } from "../utils/format";

const CENTRO_FLORENCIA: [number, number] = [1.615, -75.607];

const COLOR_PRIORIDAD: Record<string, string> = {
  CRITICA: "#c2410c",
  ALTA: "#d97706",
  MEDIA: "#2563eb",
  BAJA: "#15803d",
};

function colorPrioridad(prioridad: string | null | undefined) {
  return COLOR_PRIORIDAD[prioridad ?? ""] ?? "#0f4c5c";
}

function AjustarMapa({
  puntos,
  ajustar,
  centro,
  zoom,
}: {
  puntos: Array<[number, number]>;
  ajustar: boolean;
  centro: [number, number];
  zoom: number;
}) {
  const mapa = useMap();

  useEffect(() => {
    if (!ajustar) {
      mapa.setView(centro, zoom);
      return;
    }
    if (!puntos.length) {
      mapa.setView(centro, zoom);
      return;
    }
    if (puntos.length === 1) {
      mapa.setView(puntos[0], Math.max(zoom, 15));
      return;
    }
    const bounds = latLngBounds(puntos);
    mapa.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
  }, [ajustar, centro, mapa, puntos, zoom]);

  return null;
}

function PopupReporte({ properties }: { properties: ReporteGeoProperties }) {
  const { t, locale } = useLanguage();
  return (
    <Popup>
      <div className="map-popup">
        {properties.thumbUrl && (
          <img src={properties.thumbUrl} alt={t("Reporte #{id}", { id: properties.id })} />
        )}
        <strong>#{properties.id}</strong>
        <span>{properties.categoria ? t(ETIQUETAS_CATEGORIA[properties.categoria]) : t("Sin categoría")}</span>
        <span>{properties.barrioNombre ?? t("Sin barrio")}</span>
        <small>{t(ETIQUETAS_ESTADO[properties.estado])} · {formatearFecha(properties.fechaCreacion, locale)}</small>
      </div>
    </Popup>
  );
}

export function MapPanel({
  reportes,
  barrios,
  sitios,
  altura = "320px",
  mostrarBarrios = false,
  mostrarSitios = false,
  zoomControl = true,
  ajustar = true,
  centro = CENTRO_FLORENCIA,
  zoom = 13,
}: {
  reportes?: FeatureCollection<ReporteGeoProperties>;
  barrios?: FeatureCollection<BarrioGeoProperties>;
  sitios?: FeatureCollection<SitioGeoProperties>;
  altura?: string;
  mostrarBarrios?: boolean;
  mostrarSitios?: boolean;
  zoomControl?: boolean;
  ajustar?: boolean;
  centro?: [number, number];
  zoom?: number;
}) {
  const puntos = (reportes?.features ?? []).map((feature) => {
    const [longitud, latitud] = feature.geometry.coordinates as [number, number];
    return [latitud, longitud] as [number, number];
  });

  return (
    <div className="map-shell" style={{ height: altura }}>
      <MapContainer
        center={centro}
        zoom={zoom}
        zoomControl={zoomControl}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mostrarBarrios && barrios && (
          <GeoJSON
            data={barrios as never}
            style={() => ({
              color: "#0f4c5c",
              weight: 1,
              fillColor: "#e6f2f3",
              fillOpacity: 0.22,
            })}
          />
        )}
        {mostrarSitios && sitios && (
          <GeoJSON
            data={sitios as never}
            pointToLayer={(_feature, latlng) =>
              circleMarker(latlng, {
                radius: 5,
                color: "#7c3aed",
                fillColor: "#7c3aed",
                fillOpacity: 0.75,
              })
            }
            style={() => ({ color: "#7c3aed", weight: 1, fillOpacity: 0.1 })}
          />
        )}
        {reportes?.features.map((feature) => {
          const [longitud, latitud] = feature.geometry.coordinates as [number, number];
          return (
            <CircleMarker
              key={feature.properties.id}
              center={[latitud, longitud]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: colorPrioridad(feature.properties.prioridad),
                fillOpacity: 1,
              }}
            >
              <PopupReporte properties={feature.properties} />
            </CircleMarker>
          );
        })}
        <AjustarMapa puntos={puntos} ajustar={ajustar} centro={centro} zoom={zoom} />
      </MapContainer>
    </div>
  );
}

export function ReportMap({
  latitud,
  longitud,
  altura = "280px",
}: {
  latitud: number;
  longitud: number;
  altura?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="map-shell" style={{ height: altura }}>
      <MapContainer
        center={[latitud, longitud]}
        zoom={15}
        zoomControl
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[latitud, longitud]}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#0f4c5c", fillOpacity: 1 }}
        >
          <Popup>{t("Ubicación del reporte")}</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
