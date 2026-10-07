"use client";

import { useEffect, useState } from "react";
import Map from "@/components/Map";
import AddressForm from "@/components/AddressForm";
import PlacesList from "@/components/PlacesList";
import { Place } from "@/lib/db";
import { MapPin, Compass } from "lucide-react";

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la liste des lieux depuis l'API Next.js au premier chargement
  useEffect(() => {
    async function loadPlaces() {
      try {
        const res = await fetch("/api/places");
        if (res.ok) {
          const data: Place[] = await res.json();
          setPlaces(data);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des lieux :", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPlaces();
  }, []);

  // Callback lorsqu'un nouveau lieu est ajouté
  const handlePlaceAdded = (newPlace: Place) => {
    setPlaces((prev) => [newPlace, ...prev]);
    setSelectedPlaceId(newPlace.id);
  };

  // Callback lorsqu'un lieu est supprimé
  const handlePlaceDeleted = (deletedId: number) => {
    setPlaces((prev) => prev.filter((p) => p.id !== deletedId));
    if (selectedPlaceId === deletedId) {
      setSelectedPlaceId(null);
    }
  };

  // Callback au clic sur un lieu
  const handleSelectPlace = (place: Place) => {
    setSelectedPlaceId(place.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Exploration Leaflet & Next.js
              </h1>
              <p className="text-xs text-slate-500">
                Géocodage avec <span className="font-medium text-slate-700">api-adresse.data.gouv.fr</span> &amp; Sauvegarde SQLite
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              ● API Gouvernementale
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              ● Base SQLite
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center text-slate-500">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm">Chargement des données...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            {/* Colonne latérale gauche : Formulaire + Liste */}
            <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
              <AddressForm onPlaceAdded={handlePlaceAdded} />
              <PlacesList
                places={places}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={handleSelectPlace}
                onPlaceDeleted={handlePlaceDeleted}
              />
            </div>

            {/* Colonne principale droite : Carte Leaflet */}
            <div className="lg:col-span-7 flex flex-col order-1 lg:order-2 min-h-[500px] lg:min-h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Visualisation cartographique
                </span>
                <span className="text-xs text-slate-400">
                  {places.length} point{places.length > 1 ? "s" : ""} affiché{places.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex-1 min-h-[480px]">
                <Map
                  places={places}
                  selectedPlaceId={selectedPlaceId}
                  onSelectPlace={handleSelectPlace}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Test Leaflet + Next.js (App Router) • OpenStreetMap • api-adresse.data.gouv.fr
      </footer>
    </div>
  );
}
