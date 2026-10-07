"use client";

import dynamic from "next/dynamic";
import { Place } from "@/lib/db";

// Chargement dynamique avec ssr: false pour éviter les erreurs "window is not defined"
const MapLeaflet = dynamic(() => import("./MapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-slate-200">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
      <p className="text-sm font-medium">Chargement de la carte Leaflet...</p>
    </div>
  ),
});

interface MapProps {
  places: Place[];
  selectedPlaceId?: number | null;
  onSelectPlace?: (place: Place) => void;
}

export default function Map(props: MapProps) {
  return <MapLeaflet {...props} />;
}
