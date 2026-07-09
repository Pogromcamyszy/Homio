import React, { useState, useEffect } from "react";
import "./Listings.css";
import { useNavigate } from "react-router-dom";

type Listing = {
  id: number;
  title: string;
  district: string;
  price: number;
  type: "room" | "apartment" | "house";
  owner_id: number;
  lat: number;
  lng: number;
  likes_count: number;
  views: number;
  main_photo?: string | null;
};

const Listings: React.FC = () => {
  const navigate = useNavigate();

  const [listings, setListings] = useState<Listing[]>([]);
  const [allDistricts, setAllDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/listings/districts")
      .then((res) => res.json())
      .then((data) => setAllDistricts(data))
      .catch(console.error);
    fetchListings();
  }, []);

  const fetchListings = async (params?: {
    search?: string;
    district?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.district && params.district !== "All") query.append("district", params.district);
      if (params?.type) query.append("type", params.type);
      if (params?.minPrice) query.append("minPrice", params.minPrice);
      if (params?.maxPrice) query.append("maxPrice", params.maxPrice);

      const res = await fetch(`http://localhost:5000/listings?${query.toString()}`);
      const data: Listing[] = await res.json();
      setListings(data);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchListings({ search, district, type, minPrice, maxPrice });
  };

  const handleClear = () => {
    setSearch("");
    setDistrict("All");
    setType("");
    setMinPrice("");
    setMaxPrice("");
    fetchListings();
  };

  const typeLabel = (type: string) =>
    type === "room" ? "Pokój" : type === "house" ? "Dom" : "Mieszkanie";

  return (
    <div className="listings-page">
      <h2>Ogłoszenia w Krakowie</h2>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Szukaj po tytule, opisie, dzielnicy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="search-input"
        />
        <div className="filter-row">
          <select value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="All">Wszystkie dzielnice</option>
            {allDistricts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Cena od"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Cena do"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Wszystkie typy</option>
            <option value="room">Pokój</option>
            <option value="apartment">Mieszkanie</option>
            <option value="house">Dom</option>
          </select>
          <button className="btn-search" onClick={handleSearch}>Szukaj</button>
          <button className="btn-clear-search" onClick={handleClear}>Wyczyść</button>
        </div>
      </div>

      {loading && <p style={{ textAlign: "center", color: "#6b7280" }}>Ładowanie...</p>}

      <div className="listings-grid">
        {!loading && listings.length > 0 ? (
          listings.map((listing) => (
            <div key={listing.id} className="listing-card">
              {listing.main_photo ? (
                <img
                  src={`http://localhost:5000${listing.main_photo}`}
                  alt={listing.title}
                  className="thumb-left"
                />
              ) : null}
              <div className="listing-text">
                <h3>{listing.title}</h3>
                <p><strong>Dzielnica:</strong> {listing.district}</p>
                <p><strong>Cena:</strong> {listing.price} PLN</p>
                <p><strong>Typ:</strong> {typeLabel(listing.type)}</p>
                <p>❤️ {listing.likes_count} &nbsp; 👁 {listing.views}</p>
              </div>
              <button
                className="listing-detail-btn"
                onClick={() => navigate(`/listings/${listing.id}`)}
              >
                Przejdź do oferty
              </button>
            </div>
          ))
        ) : (
          !loading && <p>Brak ogłoszeń.</p>
        )}
      </div>
    </div>
  );
};

export default Listings;