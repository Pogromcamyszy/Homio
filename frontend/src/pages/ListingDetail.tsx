import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { toast } from "react-toastify";
import { AuthContext } from "../AuthContext";
import "./ListingDetail.css";

const libraries = ["places"];

type Listing = {
  id: number;
  title: string;
  district: string;
  details: string;
  price: number;
  type: "room" | "apartment" | "house";
  owner_id: number;
  owner_username: string | null;
  owner_avatar: string | null;
  is_owner: boolean;
  lat: number;
  lng: number;
  phone: string | null;
  accepted: number;
  rented: number;
  photo_1?: string | null;
  photo_2?: string | null;
  photo_3?: string | null;
  photo_4?: string | null;
  photo_5?: string | null;
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, role } = useContext(AuthContext);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fromAdmin = location.state?.fromAdmin === true;

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries as any,
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`http://localhost:5000/listings/${id}`, { headers });
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
  }, [id, token]);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) { toast.error(data.message || "Błąd podczas usuwania."); return; }
      toast.success("Ogłoszenie zostało usunięte.");
      navigate("/listings");
    } catch (err) {
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleRent = async () => {
    try {
      const res = await fetch(`http://localhost:5000/listings/${id}/rent`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Ogłoszenie oznaczone jako wynajęte.");
        setListing((prev) => prev ? { ...prev, rented: 1 } : prev);
      }
    } catch { toast.error("Błąd."); }
  };

  const handleUnrent = async () => {
    try {
      const res = await fetch(`http://localhost:5000/listings/${id}/unrent`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Ogłoszenie przywrócone do aktywnych.");
        setListing((prev) => prev ? { ...prev, rented: 0 } : prev);
      }
    } catch { toast.error("Błąd."); }
  };

  const handleAdminAccept = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/listings/${id}/accept`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Ogłoszenie zatwierdzone.");
        setListing((prev) => prev ? { ...prev, accepted: 1 } : prev);
      }
    } catch { toast.error("Błąd."); }
  };

  const handleAdminReject = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/listings/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Ogłoszenie odrzucone.");
        if (fromAdmin) navigate("/admin");
        else navigate("/listings");
      }
    } catch { toast.error("Błąd."); }
  };

  if (loading) return <div className="detail-loading">Ładowanie...</div>;
  if (!listing) return <div className="detail-loading">Nie znaleziono ogłoszenia.</div>;

  const photos = [
    listing.photo_1, listing.photo_2, listing.photo_3,
    listing.photo_4, listing.photo_5,
  ].filter(Boolean) as string[];

  const hasMultiple = photos.length > 1;
  const prevPhoto = () => setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  const nextPhoto = () => setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));

  return (
    <div className="detail-page">
      <div className="detail-topbar">
        {fromAdmin && (
          <button className="detail-back-btn" onClick={() => navigate("/admin")}>
            ← Wróć do panelu admina
          </button>
        )}

        <div className="detail-topbar-right">
          {listing.owner_username && !listing.is_owner && (
            <div className="detail-owner-badge" onClick={() => navigate(`/user/${listing.owner_id}`)}>
              <div className="detail-owner-avatar">
                {listing.owner_avatar ? (
                  <img src={`http://localhost:5000/server_pictures/avatars/${listing.owner_avatar}`} alt="avatar" />
                ) : (
                  <div className="detail-owner-avatar-placeholder">
                    {listing.owner_username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="detail-owner-name">{listing.owner_username}</span>
            </div>
          )}

          {role === "admin" && listing && (
            <div className="detail-admin-bar">
              {listing.accepted ? (
                <>
                  <span className="badge badge-accepted">Zatwierdzone</span>
                  <button className="btn-reject" onClick={handleAdminReject}>Odrzuć i usuń</button>
                </>
              ) : (
                <>
                  <span className="badge badge-pending">Oczekujące</span>
                  <button className="btn-accept" onClick={handleAdminAccept}>Zatwierdź</button>
                  <button className="btn-reject" onClick={handleAdminReject}>Odrzuć i usuń</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="detail-container">
        <div className="detail-photos">
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
                <button className="slider-btn slider-btn-left" onClick={prevPhoto}>&#8249;</button>
                <button className="slider-btn slider-btn-right" onClick={nextPhoto}>&#8250;</button>
                <div className="slider-dots">
                  {photos.map((_, i) => (
                    <span key={i} className={`slider-dot ${i === activeIndex ? "active" : ""}`} onClick={() => setActiveIndex(i)} />
                  ))}
                </div>
              </>
            )}
          </div>
          {hasMultiple && (
            <div className="detail-thumbs">
              {photos.map((photo, i) => (
                <img key={i} className={`detail-thumb ${i === activeIndex ? "active" : ""}`}
                  src={`http://localhost:5000/server_pictures/listings/${photo}`}
                  alt={`Zdjęcie ${i + 1}`} onClick={() => setActiveIndex(i)} />
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="detail-title-row">
            <h1 className="detail-title">{listing.title}</h1>
            {listing.is_owner && (
              <div className="detail-owner-actions">
                {!listing.rented && (
                  <button className="detail-edit-btn" onClick={() => navigate(`/listings/${id}/edit`)}>Edytuj</button>
                )}
                {!listing.rented ? (
                  <button className="detail-rent-btn" onClick={handleRent}>Oznacz jako wynajęte</button>
                ) : (
                  <button className="detail-rent-btn" onClick={handleUnrent}>Przywróć do aktywnych</button>
                )}
                <button className={`detail-delete-btn ${confirmDelete ? "confirm" : ""}`} onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Usuwanie..." : confirmDelete ? "Potwierdź usunięcie" : "Usuń"}
                </button>
                {confirmDelete && (
                  <button className="detail-cancel-btn" onClick={() => setConfirmDelete(false)}>Anuluj</button>
                )}
              </div>
            )}
          </div>

          <div className="detail-badges">
            <span className="badge badge-type">
              {listing.type === "room" ? "Pokój" : listing.type === "house" ? "Dom" : "Mieszkanie"}
            </span>
            <span className="badge badge-district">{listing.district}</span>
            {listing.rented === 1 && <span className="badge badge-rented">Wynajęte</span>}
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
                {listing.type === "room" ? "Pokój" : listing.type === "house" ? "Dom" : "Mieszkanie"}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cena</span>
              <span className="detail-value">{listing.price} PLN</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Kontakt</span>
              {token && listing.phone ? (
                <span className={`detail-phone ${phoneRevealed ? "revealed" : ""}`} onClick={() => setPhoneRevealed(true)}>
                  {phoneRevealed ? listing.phone : "Kliknij, aby pokazać numer"}
                </span>
              ) : (
                <span className="detail-phone-locked">Zaloguj się, aby zobaczyć numer</span>
              )}
            </div>
          </div>

          {listing.details && listing.details.trim() !== "" && (
            <>
              <div className="detail-divider" />
              <h3 className="detail-section-title">Opis</h3>
              <p className="detail-description">{listing.details}</p>
            </>
          )}

          <div className="detail-divider" />
          <h3 className="detail-section-title">Lokalizacja</h3>
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