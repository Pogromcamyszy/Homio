import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../AuthContext";
import "./Profile.css";

interface Listing {
  id: number;
  title: string;
  district: string;
  price: number;
  type: string;
  main_photo: string | null;
}

interface UserProfileData {
  id: number;
  username: string;
  avatar: string | null;
  created_at: string;
  banned: number;
  stats: {
    total: number;
    active: number;
    rented: number;
    likes_received: number;
    likes_given: number;
  };
  listings: Listing[];
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, role } = useContext(AuthContext);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [activeFilters, setActiveFilters] = useState({ type: "", district: "", priceMin: "", priceMax: "" });

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = () => {
    fetch(`http://localhost:5000/api/profile/${id}`)
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch(() => toast.error("Błąd połączenia z serwerem."))
      .finally(() => setLoading(false));
  };

  const handleBan = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { toast.success("Użytkownik zbanowany."); fetchProfile(); }
      else toast.error(data.message);
    } catch { toast.error("Błąd."); }
  };

  const handleUnban = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/unban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Użytkownik odbanowany."); fetchProfile(); }
    } catch { toast.error("Błąd."); }
  };

  const applyFilters = () => {
    setActiveFilters({ type: filterType, district: filterDistrict, priceMin: filterPriceMin, priceMax: filterPriceMax });
  };

  const clearFilters = () => {
    setFilterType("");
    setFilterDistrict("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setActiveFilters({ type: "", district: "", priceMin: "", priceMax: "" });
  };

  const filteredListings = (profile?.listings || []).filter((l) => {
    if (activeFilters.type && l.type !== activeFilters.type) return false;
    if (activeFilters.district && !l.district.toLowerCase().includes(activeFilters.district.toLowerCase())) return false;
    if (activeFilters.priceMin && l.price < parseInt(activeFilters.priceMin)) return false;
    if (activeFilters.priceMax && l.price > parseInt(activeFilters.priceMax)) return false;
    return true;
  });

  const typeLabel = (type: string) =>
    type === "room" ? "Pokój" : type === "house" ? "Dom" : "Mieszkanie";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Brak danych";
    return new Date(dateStr).toLocaleString("pl-PL");
  };

  const districts = [...new Set((profile?.listings || []).map((l) => l.district))].sort();

  if (loading) return <div className="profile-loading">Ładowanie...</div>;
  if (!profile) return <div className="profile-loading">Nie znaleziono użytkownika.</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar" style={{ cursor: "default" }}>
            {profile.avatar ? (
              <img src={`http://localhost:5000/server_pictures/avatars/${profile.avatar}`} alt="Avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-info-header">
            <div>
              <h2>
                {profile.username}
                {profile.banned === 1 && (
                  <span className="badge badge-banned" style={{ marginLeft: "0.75rem" }}>Zbanowany</span>
                )}
              </h2>
              <div className="profile-dates">
                <p>Członek od: <strong>{formatDate(profile.created_at)}</strong></p>
                <p>Otrzymane polubienia: <strong>❤️ {profile.stats.likes_received}</strong></p>
                <p>Dane polubienia: <strong>🤍 {profile.stats.likes_given}</strong></p>
              </div>
            </div>
            {role === "admin" && (
              <div>
                {profile.banned === 0 ? (
                  <button className="btn-ban" onClick={handleBan}>Zbanuj</button>
                ) : (
                  <button className="btn-unban" onClick={handleUnban}>Odbanuj</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-number">{profile.stats.active}</div>
          <div className="stat-label">Aktywne ogłoszenia</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{profile.stats.rented}</div>
          <div className="stat-label">Wynajęte</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{profile.stats.likes_received}</div>
          <div className="stat-label">Polubienia</div>
        </div>
      </div>

      <h3 className="profile-listings-title">Aktywne ogłoszenia</h3>

      <div className="profile-filters">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Wszystkie typy</option>
          <option value="apartment">Mieszkanie</option>
          <option value="room">Pokój</option>
          <option value="house">Dom</option>
        </select>
        <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)}>
          <option value="">Wszystkie dzielnice</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input type="number" placeholder="Cena od" value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} />
        <input type="number" placeholder="Cena do" value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} />
        <button className="btn-filter" onClick={applyFilters}>Filtruj</button>
        <button className="btn-clear" onClick={clearFilters}>Wyczyść</button>
      </div>

      {filteredListings.length === 0 ? (
        <p className="profile-empty">Brak aktywnych ogłoszeń.</p>
      ) : (
        <div className="profile-listings">
          {filteredListings.map((l) => (
            <div key={l.id} className="profile-listing-card" onClick={() => navigate(`/listings/${l.id}`)}>
              <div className="profile-listing-photo">
                {l.main_photo ? (
                  <img src={l.main_photo.startsWith("/server_pictures") ? `http://localhost:5000${l.main_photo}` : `http://localhost:5000/server_pictures/listings/${l.main_photo}`} alt={l.title} />
                ) : (
                  <div className="profile-listing-no-photo">Brak zdjęcia</div>
                )}
              </div>
              <div className="profile-listing-body">
                <div className="profile-listing-title">{l.title}</div>
                <div className="profile-listing-meta">
                  <span>{l.district}</span>
                  <span>{l.price} zł</span>
                  <span>{typeLabel(l.type)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}