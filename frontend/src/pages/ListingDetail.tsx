import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import "./ListingDetail.css";

const libraries = ["places"];

type Listing = {
  id: number;
  title: string;
  district: string;
  price: number;
  type: "room" | "apartment";
  owner_id: number;
  lat: number;
  lng: number;
  photo_1?: string | null;
  photo_2?: string | null;
  photo_3?: string | null;
  photo_4?: string | null;
  photo_5?: string | null;
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries as any,
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`http://localhost:5000/listings/${id}`);
        const data: Listing = await res.json();
        setListing(data);
        setActiveIndex(0);
      } catch (err) {
        console.error("Error fetching listing:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  if (loading) return <div className="detail-loading">Ładowanie...</div>;
  if (!listing) return <div className="detail-loading">Nie znaleziono ogłoszenia.</div>;

  const photos = [
    listing.photo_1,
    listing.photo_2,
    listing.photo_3,
    listing.photo_4,
    listing.photo_5,
  ].filter(Boolean) as string[];

  const hasMultiple = photos.length > 1;

  const prevPhoto = () =>
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));

  const nextPhoto = () =>
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));

  return (
    <div className="detail-page">

      <button className="detail-back" onClick={() => navigate(-1)}>
        ← Powrót
      </button>

      <div className="detail-container">

        {/* LEWA KOLUMNA — zdjęcia */}
        <div className="detail-photos">

          {/* GŁÓWNE ZDJĘCIE ZE STRZAŁKAMI */}
          <div className="detail-slider">
            {photos.length > 0 ? (
              <img
                className="detail-main-photo"
                src={`http://localhost:5000/server_pictures/listings/${photos[activeIndex]}`}
                alt={listing.title}
              />
            ) : (
              <div className="detail-no-photo">Brak zdjęcia</div>
            )}

            {hasMultiple && (
              <>
                <button className="slider-btn slider-btn-left" onClick={prevPhoto}>
                  &#8249;
                </button>
                <button className="slider-btn slider-btn-right" onClick={nextPhoto}>
                  &#8250;
                </button>
                <div className="slider-dots">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={`slider-dot ${i === activeIndex ? "active" : ""}`}
                      onClick={() => setActiveIndex(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* MINIATURKI — tylko jeśli więcej niż 1 zdjęcie */}
          {hasMultiple && (
            <div className="detail-thumbs">
              {photos.map((photo, i) => (
                <img
                  key={i}
                  className={`detail-thumb ${i === activeIndex ? "active" : ""}`}
                  src={`http://localhost:5000/server_pictures/listings/${photo}`}
                  alt={`Zdjęcie ${i + 1}`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* PRAWA KOLUMNA — szczegóły */}
        <div className="detail-info">
          <h1 className="detail-title">{listing.title}</h1>

          <div className="detail-badges">
            <span className="badge badge-type">
              {listing.type === "room" ? "Pokój" : "Mieszkanie"}
            </span>
            <span className="badge badge-district">{listing.district}</span>
          </div>

          <div className="detail-price">{listing.price} PLN / miesiąc</div>

          <div className="detail-divider" />

          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-label">Dzielnica</span>
              <span className="detail-value">{listing.district}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Typ</span>
              <span className="detail-value">
                {listing.type === "room" ? "Pokój" : "Mieszkanie"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cena</span>
              <span className="detail-value">{listing.price} PLN</span>
            </div>
          </div>

          <div className="detail-divider" />

          <h3 className="detail-map-title">Lokalizacja</h3>
          {isLoaded ? (
            <div className="detail-map">
              <GoogleMap
                zoom={15}
                center={{ lat: listing.lat, lng: listing.lng }}
                mapContainerStyle={{ width: "100%", height: "100%" }}
              >
                <Marker position={{ lat: listing.lat, lng: listing.lng }} />
              </GoogleMap>
            </div>
          ) : (
            <div className="detail-map-loading">Ładowanie mapy...</div>
          )}
        </div>

      </div>
    </div>
  );
}