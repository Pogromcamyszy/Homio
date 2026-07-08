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
  likes_received: number;
  likes_given: number;
}

interface Listing {
  id: number;
  title: string;
  district: string;
  price: number;
  type: string;
  main_photo: string | null;
}

interface FavoriteListing {
  id: number;
  title: string;
  district: string;
  price: number;
  type: string;
  accepted: number;
  rented: number;
  likes_count: number;
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

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

const strengthLabel = (strength: number) => {
  if (strength === 0) return "";
  if (strength === 1) return "Słabe";
  if (strength === 2) return "Średnie";
  if (strength === 3) return "Dobre";
  return "Silne";
};

const strengthColor = (strength: number) => {
  if (strength === 1) return "#ef4444";
  if (strength === 2) return "#f59e0b";
  if (strength === 3) return "#3b82f6";
  return "#10b981";
};

export default function Profile() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [tab, setTab] = useState<"active" | "pending" | "rented" | "deleted" | "favorites">("active");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [filterType, setFilterType] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [activeFilters, setActiveFilters] = useState({ type: "", district: "", priceMin: "", priceMax: "" });

  useEffect(() => {
    fetchProfile();
    fetchFavorites();
    fetchAllListings();
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

  const fetchFavorites = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFavorites(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Błąd pobierania ulubionych.");
    }
  };

  const fetchAllListings = async () => {
    try {
      const res = await fetch("http://localhost:5000/listings/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAllListings(Array.isArray(data) ? data : []);
    } catch {}
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

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Wypełnij wszystkie pola.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Nowe hasła nie są identyczne.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Hasło musi zawierać co najmniej jedną wielką literę.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error("Hasło musi zawierać co najmniej jedną cyfrę.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("http://localhost:5000/api/profile/password", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Hasło zostało zmienione.");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "Błąd zmiany hasła.");
      }
    } catch {
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setChangingPassword(false);
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

  const active = allListings.filter((l) => l.deleted === 0 && l.accepted === 1 && l.rented === 0);
  const pending = allListings.filter((l) => l.deleted === 0 && l.accepted === 0 && l.rented === 0);
  const rented = allListings.filter((l) => l.rented === 1 && l.deleted === 0);
  const deleted = allListings.filter((l) => l.deleted === 1);

  const currentRaw =
    tab === "active" ? active :
    tab === "pending" ? pending :
    tab === "rented" ? rented :
    tab === "deleted" ? deleted :
    favorites;

  const filteredListings = currentRaw.filter((l) => {
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

  const districts = [...new Set(currentRaw.map((l) => l.district))].sort();

  if (loading) return <div className="profile-loading">Ładowanie...</div>;
  if (!profile) return <div className="profile-loading">Błąd ładowania profilu.</div>;

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar" onClick={() => fileRef.current?.click()}>
            {profile.avatar ? (
              <img src={`http://localhost:5000/server_pictures/avatars/${profile.avatar}`} alt="Avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="profile-avatar-overlay">
              {uploadingAvatar ? "Uploading..." : "Zmień"}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
        </div>

        <div className="profile-info">
          {!showPasswordForm ? (
            <>
              <div className="profile-info-header">
                <div>
                  <h2>{profile.username}</h2>
                  <p className="profile-email">{profile.email}</p>
                  <span className={`badge ${profile.role === "admin" ? "badge-admin" : "badge-user"}`}>
                    {profile.role === "admin" ? "Administrator" : "Użytkownik"}
                  </span>
                </div>
                <button className="btn-change-password" onClick={() => setShowPasswordForm(true)}>
                  Zmień hasło
                </button>
              </div>
              <div className="profile-dates">
                <p>Konto założone: <strong>{formatDate(profile.created_at)}</strong></p>
                <p>Ostatnie logowanie: <strong>{formatDate(profile.last_login)}</strong></p>
                <p>Otrzymane polubienia: <strong>❤️ {profile.stats.likes_received}</strong></p>
                <p>Dane polubienia: <strong>🤍 {profile.stats.likes_given}</strong></p>
              </div>
            </>
          ) : (
            <div className="password-form">
              <div className="password-form-header">
                <h3>Zmiana hasła</h3>
                <button className="btn-cancel-password" onClick={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}>
                  Anuluj
                </button>
              </div>
              <input
                type="password"
                placeholder="Aktualne hasło"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Nowe hasło (min. 8 znaków, wielka litera, cyfra)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {newPassword && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="password-strength-segment"
                        style={{ background: i <= passwordStrength ? strengthColor(passwordStrength) : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                  <span style={{ color: strengthColor(passwordStrength), fontSize: "0.8rem", fontWeight: 600 }}>
                    {strengthLabel(passwordStrength)}
                  </span>
                </div>
              )}
              <input
                type="password"
                placeholder="Potwierdź nowe hasło"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: 0 }}>Hasła nie są identyczne.</p>
              )}
              <button className="btn-save-password" onClick={handlePasswordChange} disabled={changingPassword}>
                {changingPassword ? "Zapisywanie..." : "Zapisz hasło"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card" onClick={() => setTab("active")} style={{ cursor: "pointer" }}>
          <div className="stat-number">{active.length}</div>
          <div className="stat-label">Aktywne</div>
        </div>
        <div className="stat-card" onClick={() => setTab("pending")} style={{ cursor: "pointer" }}>
          <div className="stat-number">{pending.length}</div>
          <div className="stat-label">Oczekujące</div>
        </div>
        <div className="stat-card" onClick={() => setTab("rented")} style={{ cursor: "pointer" }}>
          <div className="stat-number">{rented.length}</div>
          <div className="stat-label">Wynajęte</div>
        </div>
        <div className="stat-card" onClick={() => setTab("deleted")} style={{ cursor: "pointer" }}>
          <div className="stat-number">{deleted.length}</div>
          <div className="stat-label">Usunięte</div>
        </div>
        <div className="stat-card" onClick={() => setTab("favorites")} style={{ cursor: "pointer" }}>
          <div className="stat-number">{favorites.length}</div>
          <div className="stat-label">Ulubione</div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="btn-dashboard" onClick={() => navigate("/dashboard")}>
          Przejdź do dashboardu
        </button>
      </div>

      <div className="profile-tabs">
        <button className={tab === "active" ? "active" : ""} onClick={() => { setTab("active"); clearFilters(); }}>
          Aktywne <span className="tab-count">{active.length}</span>
        </button>
        <button className={tab === "pending" ? "active" : ""} onClick={() => { setTab("pending"); clearFilters(); }}>
          Oczekujące <span className="tab-count">{pending.length}</span>
        </button>
        <button className={tab === "rented" ? "active" : ""} onClick={() => { setTab("rented"); clearFilters(); }}>
          Wynajęte <span className="tab-count">{rented.length}</span>
        </button>
        <button className={tab === "deleted" ? "active" : ""} onClick={() => { setTab("deleted"); clearFilters(); }}>
          Usunięte <span className="tab-count">{deleted.length}</span>
        </button>
        <button className={tab === "favorites" ? "active" : ""} onClick={() => { setTab("favorites"); clearFilters(); }}>
          Ulubione <span className="tab-count">{favorites.length}</span>
        </button>
      </div>

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
        <p className="profile-empty">Brak ogłoszeń w tej kategorii.</p>
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
                  {"likes_count" in l && <span>❤️ {(l as FavoriteListing).likes_count}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}