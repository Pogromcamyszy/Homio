import React, { useState } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import "./Home.css";

const libraries = ["places"];

type Listing = {
  id: number;
  title: string;
  district: string;
  price: number;
  type: "room" | "apartment";
  lat: number;
  lng: number;
  main_photo?: string | null;
};

const ALL_DISTRICTS = [
  "Wszystkie",
  "Stare Miasto",
  "Grzegórzki",
  "Prądnik Czerwony",
  "Prądnik Biały",
  "Krowodrza",
  "Bronowice",
  "Zwierzyniec",
  "Dębniki",
  "Łagiewniki-Borek Fałęcki",
  "Swoszowice",
  "Podgórze Duchackie",
  "Bieżanów-Prokocim",
  "Podgórze",
  "Czyżyny",
  "Mistrzejowice",
  "Bieńczyce",
  "Wzgórza Krzesławickie",
  "Nowa Huta",
];

const KRAKOW_CENTER = { lat: 50.0619, lng: 19.9366 };

export default function Home() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries as any,
  });

  // Filtry
  const [district, setDistrict] = useState("Wszystkie");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState("");

  // Wyniki
  const [listings, setListings] = useState<Listing[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // InfoWindow
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setSelectedListing(null);
    try {
      const res = await fetch("http://localhost:5000/listings");
      const data: Listing[] = await res.json();

      const filtered = data.filter((l) => {
        return (
          (district === "Wszystkie" || l.district === district) &&
          (minPrice === "" || l.price >= parseInt(minPrice)) &&
          (maxPrice === "" || l.price <= parseInt(maxPrice)) &&
          (type === "" || l.type === type)
        );
      });

      setListings(filtered);
      setSearched(true);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="home-loading">Loading map...</div>;

  return (
    <div className="home-page">

      {/* FILTRY */}
      <div className="home-filters">
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          {ALL_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Cena od (PLN)"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />

        <input
          type="number"
          placeholder="Cena do (PLN)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Wszystkie typy</option>
          <option value="room">Pokój</option>
          <option value="apartment">Mieszkanie</option>
        </select>

        <button className="search-btn" onClick={handleSearch} disabled={loading}>
          {loading ? "Szukam..." : "Wyszukaj"}
        </button>
      </div>

      {/* WYNIK WYSZUKIWANIA */}
      {searched && (
        <p className="home-results-info">
          {listings.length > 0
            ? `Znaleziono ${listings.length} ogłoszenie(ń).`
            : "Brak ogłoszeń spełniających kryteria."}
        </p>
      )}

      {/* MAPA */}
      <div className="home-map-container">
        <GoogleMap
          zoom={12}
          center={KRAKOW_CENTER}
          mapContainerStyle={{ width: "100%", height: "100%" }}
        >
          {listings.map((listing) => (
            <Marker
              key={listing.id}
              position={{ lat: listing.lat, lng: listing.lng }}
              onClick={() => setSelectedListing(listing)}
            />
          ))}

          {selectedListing && (
            <InfoWindow
              position={{ lat: selectedListing.lat, lng: selectedListing.lng }}
              onCloseClick={() => setSelectedListing(null)}
            >
              <div className="info-window">
                {selectedListing.main_photo && (
                  <img
                    src={`http://localhost:5000${selectedListing.main_photo}`}
                    alt={selectedListing.title}
                  />
                )}
                <h3>{selectedListing.title}</h3>
                <p><strong>Dzielnica:</strong> {selectedListing.district}</p>
                <p><strong>Cena:</strong> {selectedListing.price} PLN</p>
                <p><strong>Typ:</strong> {selectedListing.type === "room" ? "Pokój" : "Mieszkanie"}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

    </div>
  );
}