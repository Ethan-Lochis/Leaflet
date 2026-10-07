"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { Place } from "@/lib/db";

// Configuration d'une belle icône de marqueur SVG pour éviter les problèmes d'images manquantes de Leaflet
const createCustomIcon = (isHighlight: boolean = false) => {
  const color = isHighlight ? "#2563eb" : "#ef4444";
  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: ${color};
        border: 2px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

interface MapProps {
  places: Place[];
  selectedPlaceId?: number | null;
  onSelectPlace?: (place: Place) => void;
}

export default function MapLeaflet({
  places,
  selectedPlaceId,
  onSelectPlace,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<number, L.Marker>>(new Map());

  // 1. Initialisation de la carte Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centre initial : France métropolitaine (lat: 46.603354, lng: 1.888334, zoom 6)
      const map = L.map(mapContainerRef.current, {
        center: [46.603354, 1.888334],
        zoom: 6,
      });

      // Ajout de la couche de tuiles OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Création du groupe de calques pour les marqueurs
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;
    }

    return () => {
      // Nettoyage au démontage du composant
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Mise à jour des marqueurs lorsque la liste 'places' change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) return;

    // Vider les marqueurs précédents
    markersLayer.clearLayers();
    markersMapRef.current.clear();

    if (places.length === 0) return;

    const bounds = L.latLngBounds([]);

    places.forEach((place) => {
      const isSelected = place.id === selectedPlaceId;
      const marker = L.marker([place.latitude, place.longitude], {
        icon: createCustomIcon(isSelected),
      });

      // Construction du contenu HTML de la popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <h3 style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #111827;">
            ${place.name ? place.name : "Lieu enregistré"}
          </h3>
          <p style="margin: 0 0 6px 0; color: #4b5563;">
            ${place.address}
          </p>
          <div style="font-size: 11px; background: #f3f4f6; padding: 4px 6px; border-radius: 4px; color: #374151;">
            📍 <strong>Lat:</strong> ${place.latitude.toFixed(5)} | <strong>Lng:</strong> ${place.longitude.toFixed(5)}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Événement au clic sur le marqueur
      marker.on("click", () => {
        if (onSelectPlace) {
          onSelectPlace(place);
        }
      });

      marker.addTo(markersLayer);
      markersMapRef.current.set(place.id, marker);
      bounds.extend([place.latitude, place.longitude]);
    });

    // Ajuster la vue de la carte pour afficher tous les marqueurs
    if (bounds.isValid() && !selectedPlaceId) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [places, selectedPlaceId, onSelectPlace]);

  // 3. Zoomer et ouvrir la popup lorsqu'un lieu spécifique est sélectionné
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlaceId) return;

    const targetPlace = places.find((p) => p.id === selectedPlaceId);
    const targetMarker = markersMapRef.current.get(selectedPlaceId);

    if (targetPlace && targetMarker) {
      map.flyTo([targetPlace.latitude, targetPlace.longitude], 15, {
        duration: 1.2,
      });
      targetMarker.openPopup();
    }
  }, [selectedPlaceId, places]);

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-xl overflow-hidden shadow-lg border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px] z-0" />
      {places.length === 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-xs px-3 py-2 rounded-lg shadow border border-slate-200 z-10 text-slate-600">
          🗺️ Aucun lieu enregistré. Ajoutez-en un à gauche !
        </div>
      )}
    </div>
  );
}
