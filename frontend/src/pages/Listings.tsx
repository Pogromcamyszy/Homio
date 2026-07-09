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

const LIMIT = 10;

const Listings: React.FC = () => {
  const navigate = useNavigate();

  const [listings, setListings] = useState<Listing[]>([]);
  const [allDistricts, setAllDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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
    fetchListings(1);
  }, []);

  const fetchListings = async (p: number, params?: {
    search?: string;
    district?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.append("page", p.toString());
      query.append("limit", LIMIT.toString());
      if (params?.search) query.append("search", params.search);
      if (params?.district && params.district !== "All") query.append("district", params.district);
      if (params?.type) query.append("type", params.type);
      if (params?.minPrice) query.append("minPrice", params.minPrice);
      if (params?.maxPrice) query.append("maxPrice", params.maxPrice);

      const res = await fetch(`http://localhost:5000/listings?${query.toString()}`);
      const data = await res.json();
      setListings(data.listings);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(p);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchListings(1, { search, district, type, minPrice, maxPrice });
  };

  const handleClear = () => {
    setSearch("");
    setDistrict("All");
    setType("");
    setMinPrice("");
    setMaxPrice("");
    fetchListings(1);
  };

  const handlePage = (p: number) => {
    fetchListings(p, { search, district, type, minPrice, maxPrice });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      {total > 0 && (
        <p className="listings-count">Znaleziono {total} ogłoszenie(ń)</p>
      )}

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

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePage(page - 1)}
            disabled={page === 1}
          >
            ← Poprzednia
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination-btn ${p === page ? "active" : ""}`}
              onClick={() => handlePage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="pagination-btn"
            onClick={() => handlePage(page + 1)}
            disabled={page === totalPages}
          >
            Następna →
          </button>
        </div>
      )}
    </div>
  );
};

export default Listings;