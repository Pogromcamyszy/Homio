import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../AuthContext";
import "./Profile.css";

interface Stats {
  total: number;
  active: number;
  pending: number;
  rented: number;
  deleted: number;
}

interface Listing {
  id: number;
  title: string;
  district: string;
  price: number;
  type: string;
  main_photo: string | null;
}

interface ProfileData {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar: string | null;
  created_at: string;
  last_login: string | null;
  stats: Stats;
  listings: Listing[];
}

export default function Profile() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [filterType, setFilterType] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [activeFilters, setActiveFilters] = useState({ type: "", district: "", priceMin: "", priceMax: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data);
    } catch {
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await fetch("http://localhost:5000/api/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Avatar zaktualizowany.");
        setProfile((prev) => prev ? { ...prev, avatar: data.avatar } : prev);
      } else {
        toast.error(data.message || "Błąd uploadu.");
      }
    } catch {
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setUploadingAvatar(false);
    }
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Brak danych";
    return new Date(dateStr).toLocaleString("pl-PL");
  };

  const typeLabel = (type: string) =>
    type === "room" ? "Pokój" : type === "house" ? "Dom" : "Mieszkanie";

  const districts = [...new Set((profile?.listings || []).map((l) => l.district))].sort();

  if (loading) return <div className="profile-loading">Ładowanie...</div>;
  if (!profile) return <div className="profile-loading">Błąd ładowania profilu.</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar" onClick={() => fileRef.current?.click()}>
            {profile.avatar ? (
              <img
                src={`http://localhost:5000/server_pictures/avatars/${profile.avatar}`}
                alt="Avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="profile-avatar-overlay">
              {uploadingAvatar ? "Uploading..." : "Zmień"}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarUpload}
          />
        </div>

        <div className="profile-info">
          <h2>{profile.username}</h2>
          <p className="profile-email">{profile.email}</p>
          <span className={`badge ${profile.role === "admin" ? "badge-admin" : "badge-user"}`}>
            {profile.role === "admin" ? "Administrator" : "Użytkownik"}
          </span>
          <div className="profile-dates">
            <p>Konto założone: <strong>{formatDate(profile.created_at)}</strong></p>
            <p>Ostatnie logowanie: <strong>{formatDate(profile.last_login)}</strong></p>
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-number">{profile.stats.total}</div>
          <div className="stat-label">Wszystkie ogłoszenia</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{profile.stats.active}</div>
          <div className="stat-label">Aktywne</div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="btn-dashboard" onClick={() => navigate("/dashboard")}>
          Przejdź do dashboardu
        </button>
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
        <input
          type="number"
          placeholder="Cena od"
          value={filterPriceMin}
          onChange={(e) => setFilterPriceMin(e.target.value)}
        />
        <input
          type="number"
          placeholder="Cena do"
          value={filterPriceMax}
          onChange={(e) => setFilterPriceMax(e.target.value)}
        />
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
                  <img src={`http://localhost:5000/server_pictures/listings/${l.main_photo}`} alt={l.title} />
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