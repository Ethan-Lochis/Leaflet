"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Plus, Loader2 } from "lucide-react";
import { Place } from "@/lib/db";

interface AddressSuggestion {
  label: string;
  city: string;
  postcode: string;
  coordinates: [number, number]; // [lon, lat]
}

interface AddressFormProps {
  onPlaceAdded: (newPlace: Place) => void;
}

export default function AddressForm({ onPlaceAdded }: AddressFormProps) {
  const [name, setName] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
    city?: string;
    postcode?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fermer la liste déroulante lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche automatique d'autocomplétion sur l'API adresse.data.gouv.fr (avec debounce)
  useEffect(() => {
    if (addressInput.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            addressInput
          )}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          // Extraction des données retournées par l'API
          const items: AddressSuggestion[] = (data.features || []).map(
            (feat: any) => ({
              label: feat.properties.label,
              city: feat.properties.city,
              postcode: feat.properties.postcode,
              coordinates: feat.geometry.coordinates, // [longitude, latitude]
            })
          );
          setSuggestions(items);
          setShowDropdown(items.length > 0);
        }
      } catch (err) {
        console.error("Erreur autocomplétion :", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 300); // Débounce de 300ms

    return () => clearTimeout(timer);
  }, [addressInput]);

  // Sélection d'une suggestion dans la liste déroulante
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setAddressInput(suggestion.label);
    // ⚠️ ATTENTION : GeoJSON stocke [longitude, latitude]
    setSelectedCoords({
      lng: suggestion.coordinates[0],
      lat: suggestion.coordinates[1],
      city: suggestion.city,
      postcode: suggestion.postcode,
    });
    setShowDropdown(false);
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) {
      setErrorMessage("Veuillez saisir une adresse.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: any = {
        name: name.trim() || undefined,
        address: addressInput.trim(),
      };

      // Si l'utilisateur a cliqué sur une suggestion, on envoie directement les coordonnées
      if (selectedCoords) {
        payload.latitude = selectedCoords.lat;
        payload.longitude = selectedCoords.lng;
        payload.city = selectedCoords.city;
        payload.postcode = selectedCoords.postcode;
      }

      // Appel de notre API interne Next.js
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement du lieu");
      }

      // Succès
      setSuccessMessage(`"${data.address}" a été enregistré avec succès !`);
      setName("");
      setAddressInput("");
      setSelectedCoords(null);
      setSuggestions([]);
      onPlaceAdded(data);

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        Ajouter un lieu
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Saisissez une adresse. Elle sera géocodée par l&apos;API nationale
        (adresse.data.gouv.fr) et sauvegardée dans la base de données.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Nom ou titre du lieu (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex : Bureau, Chez moi, Tour Eiffel..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Adresse en France <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Ex : 55 Rue du Faubourg Saint-Honoré, Paris"
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                setSelectedCoords(null); // Réinitialiser les coordonnées manuelles si modification
              }}
              className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {isSearchingSuggestions && (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-2.5" />
            )}
          </div>

          {/* Liste déroulante des suggestions d'adresses trouvées */}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100 text-sm">
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer flex flex-col text-slate-700 transition-colors"
                >
                  <span className="font-medium text-xs text-slate-900">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {item.postcode} {item.city} • Coords: [
                    {item.coordinates[1].toFixed(4)},{" "}
                    {item.coordinates[0].toFixed(4)}]
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Aperçu des coordonnées si pré-sélectionné */}
        {selectedCoords && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-md flex items-center justify-between">
            <span>
              ✅ Coordonnées prêtes : {selectedCoords.lat.toFixed(4)},{" "}
              {selectedCoords.lng.toFixed(4)}
            </span>
          </div>
        )}

        {/* Messages d'erreur ou de succès */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-md">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-md">
            🎉 {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm py-2.5 px-4 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Géocodage & Sauvegarde...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Enregistrer le lieu
            </>
          )}
        </button>
      </form>
    </div>
  );
}
