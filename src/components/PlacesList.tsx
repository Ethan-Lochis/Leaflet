"use client";

import { useState } from "react";
import { Trash2, Navigation, MapPin } from "lucide-react";
import { Place } from "@/lib/db";

interface PlacesListProps {
  places: Place[];
  selectedPlaceId?: number | null;
  onSelectPlace: (place: Place) => void;
  onPlaceDeleted: (id: number) => void;
}

export default function PlacesList({
  places,
  selectedPlaceId,
  onSelectPlace,
  onPlaceDeleted,
}: PlacesListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer ce lieu de la base ?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/places?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onPlaceDeleted(id);
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          Lieux enregistrés
        </h2>
        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
          {places.length}
        </span>
      </div>

      {places.length === 0 ? (
        <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">Aucun lieu pour l&apos;instant</p>
          <p className="text-xs text-slate-400 mt-1">
            Utilisez le formulaire ci-dessus pour ajouter des adresses.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {places.map((place) => {
            const isSelected = place.id === selectedPlaceId;
            return (
              <div
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/60 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">
                      {place.name || place.address}
                    </h3>
                    {place.name && (
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                        {place.address}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(place.id, e)}
                    disabled={deletingId === place.id}
                    title="Supprimer"
                    className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                    </span>
                    {place.city && (
                      <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                        {place.city}
                      </span>
                    )}
                  </div>

                  <span className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                    Centrer ↗
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
