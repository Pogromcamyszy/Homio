import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const libraries = ["places"];

type Listing = {
  id: number;
  title: string;
  district: string;
  price: number;
  type: "room" | "apartment" | "house";
  lat: number;
  lng: number;
  main_photo?: string | null;
};

const KRAKOW_CENTER = { lat: 50.0619, lng: 19.9366 };

const typeLabel = (type: string) =>
  type === "room" ? "Pokój" : type === "house" ? "Dom" : "Mieszkanie";

export default function Home() {
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries as any,
  });

  const [district, setDistrict] = useState("Wszystkie");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [allDistricts, setAllDistricts] = useState<string[]>([]);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await fetch("http://localhost:5000/listings/districts");
        const data: string[] = await res.json();
        setAllDistricts(["Wszystkie", ...data]);
      } catch (err) {
        console.error("Error fetching districts:", err);
      }
    };
    fetchDistricts();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setSelectedListing(null);
    try {
      const query = new URLSearchParams();
      if (district !== "Wszystkie") query.append("district", district);
      if (type) query.append("type", type);
      if (minPrice) query.append("minPrice", minPrice);
      if (maxPrice) query.append("maxPrice", maxPrice);
      query.append("limit", "100");

      const res = await fetch(`http://localhost:5000/listings?${query.toString()}`);
      const data = await res.json();
      const fetchedListings = Array.isArray(data) ? data : data.listings || [];
      setListings(fetchedListings);
      setSearched(true);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="home-loading">Ładowanie mapy...</div>;

  return (
    <div className="home-page">
      <div className="home-filters">
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          {allDistricts.map((d) => (
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
          <option value="house">Dom</option>
        </select>

        <button className="search-btn" onClick={handleSearch} disabled={loading}>
          {loading ? "Szukam..." : "Wyszukaj"}
        </button>
      </div>

      {searched && (
        <p className="home-results-info">
          {listings.length > 0
            ? `Znaleziono ${listings.length} ogłoszenie(ń).`
            : "Brak ogłoszeń spełniających kryteria."}
        </p>
      )}

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
                <p><strong>Typ:</strong> {typeLabel(selectedListing.type)}</p>
                <button
                  className="info-window-btn"
                  onClick={() => navigate(`/listings/${selectedListing.id}`)}
                >
                  Przejdź do oferty
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}