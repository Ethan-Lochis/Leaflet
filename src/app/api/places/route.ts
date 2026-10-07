import { NextRequest, NextResponse } from "next/server";
import { getPlaces, addPlace, deletePlace } from "@/lib/db";

// GET /api/places : Récupérer tous les lieux enregistrés en base
export async function GET() {
  try {
    const places = getPlaces();
    return NextResponse.json(places);
  } catch (error) {
    console.error("Erreur lors de la récupération des lieux :", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les lieux" },
      { status: 500 }
    );
  }
}

// POST /api/places : Géocoder l'adresse via l'API adresse.data.gouv.fr et enregistrer en base
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, name } = body;

    if (!address || typeof address !== "string" || address.trim() === "") {
      return NextResponse.json(
        { error: "L'adresse est obligatoire." },
        { status: 400 }
      );
    }

    let { latitude, longitude, city, postcode } = body;
    let finalAddress = address.trim();

    // Si les coordonnées ne sont pas fournies par le client, on interroge l'API du gouvernement
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      const apiUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        finalAddress
      )}&limit=1`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: "Erreur lors de l'appel à l'API api-adresse.data.gouv.fr" },
          { status: 502 }
        );
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        return NextResponse.json(
          { error: "Aucun résultat trouvé pour cette adresse en France." },
          { status: 404 }
        );
      }

      const feature = data.features[0];
      // ⚠️ ATTENTION : Le format GeoJSON fournit [longitude, latitude] dans les coordonnées !
      const [lon, lat] = feature.geometry.coordinates;
      longitude = lon;
      latitude = lat;

      // On récupère aussi le libellé officiel et les détails de la commune
      finalAddress = feature.properties.label || finalAddress;
      city = feature.properties.city || "";
      postcode = feature.properties.postcode || "";
    }

    // Sauvegarde dans la base SQLite locale
    const newPlace = addPlace({
      name: name?.trim() || undefined,
      address: finalAddress,
      latitude,
      longitude,
      city,
      postcode,
    });

    return NextResponse.json(newPlace, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'ajout du lieu :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement du lieu" },
      { status: 500 }
    );
  }
}

// DELETE /api/places?id=123 : Supprimer un lieu
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { error: "Le paramètre 'id' est requis." },
        { status: 400 }
      );
    }

    const id = parseInt(idParam, 10);
    const deleted = deletePlace(id);

    if (!deleted) {
      return NextResponse.json({ error: "Lieu non trouvé." }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Erreur suppression lieu :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression." },
      { status: 500 }
    );
  }
}
