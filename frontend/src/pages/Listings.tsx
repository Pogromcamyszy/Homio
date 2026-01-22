import React, { useState, useEffect } from "react";
import "./Listings.css";

type Listing = {
  id: number;
  title: string;
  district: string;
  price: number;
  type: "room" | "apartment";

  photo_1?: string | null;
  photo_2?: string | null;
  photo_3?: string | null;
  photo_4?: string | null;
  photo_5?: string | null;
};

const districts = ["All", "Stare Miasto", "Kazimierz", "Nowa Huta", "Podgórze"];

const Listings: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
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

  // Choose first available photo
  const getMainPhoto = (listing: Listing) => {
    return (
      listing.photo_1 ||
      listing.photo_2 ||
      listing.photo_3 ||
      listing.photo_4 ||
      listing.photo_5 ||
      null
    );
  };

  return (
    <div className="listings-page">
      <h2>Available Listings in Kraków</h2>

      <div className="filter-bar">
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="room">Room</option>
          <option value="apartment">Apartment</option>
        </select>
      </div>

      <div className="listings-grid">
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <div key={listing.id} className="listing-card">
              {/* MAIN PHOTO */}
              {getMainPhoto(listing) ? (
                <img
                  src={getMainPhoto(listing)!}
                  alt={listing.title}
                  className="listing-photo"
                />
              ) : (
                <div className="no-photo">No photo</div>
              )}

              <h3>{listing.title}</h3>
              <p><strong>District:</strong> {listing.district}</p>
              <p><strong>Price:</strong> {listing.price} PLN</p>
              <p><strong>Type:</strong> {listing.type}</p>

              {/* THUMBNAILS */}
              <div className="thumbs">
                {[listing.photo_1, listing.photo_2, listing.photo_3, listing.photo_4, listing.photo_5].map(
                  (p, i) =>
                    p ? (
                      <img
                        key={i}
                        src={p}
                        alt={`thumb-${i}`}
                        className="thumb"
                      />
                    ) : null
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No listings found.</p>
        )}
      </div>
    </div>
  );
};

export default Listings;
