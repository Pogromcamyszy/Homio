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
  main_photo?: string | null;
};

const Listings: React.FC = () => {
  const navigate = useNavigate();

  const [listings, setListings] = useState<Listing[]>([]);
  const [allDistricts, setAllDistricts] = useState<string[]>([]);
  const [district, setDistrict] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch("http://localhost:5000/listings");
        const data: Listing[] = await res.json();
        setListings(data);
        const uniqueDistricts = [...new Set(data.map((l) => l.district))].sort();
        setAllDistricts(uniqueDistricts);
      } catch (err) {
        console.error("Error fetching listings:", err);
      }
    };
    fetchListings();
  }, []);

  const filteredListings = listings.filter((listing) => {
    return (
      (district === "All" || listing.district === district) &&
      (minPrice === "" || listing.price >= parseInt(minPrice)) &&
      (maxPrice === "" || listing.price <= parseInt(maxPrice)) &&
      (type === "" || listing.type === type)
    );
  });

  const typeLabel = (type: string) =>
    type === "room" ? "Pokój" : type === "house" ? "Dom" : "Mieszkanie";

  return (
    <div className="listings-page">
      <h2>Ogłoszenia w Krakowie</h2>

      <div className="filter-bar">
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
      </div>

      <div className="listings-grid">
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
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
          <p>Brak ogłoszeń.</p>
        )}
      </div>
    </div>
  );
};

export default Listings;