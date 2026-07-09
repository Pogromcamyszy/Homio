import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";

interface Listing {
  id: number;
  title: string;
  district: string;
  price: number;
  type: string;
  accepted: number;
  deleted: number;
  username: string;
  photo_1: string | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar: string | null;
  created_at: string;
  last_login: string | null;
  banned: number;
  active_listings: number;
  total_listings: number;
}

const AdminPanel: React.FC = () => {
  const { token, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"pending" | "all" | "deleted" | "users">("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [activeFilters, setActiveFilters] = useState({ type: "", district: "", priceMin: "", priceMax: "" });

  useEffect(() => {
    if (role !== "admin") { navigate("/"); return; }
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "pending") {
        const res = await fetch("http://localhost:5000/api/admin/listings/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setListings(await res.json());
      } else if (tab === "all") {
        const res = await fetch("http://localhost:5000/api/admin/listings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setListings(await res.json());
      } else if (tab === "deleted") {
        const res = await fetch("http://localhost:5000/api/admin/listings/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setListings(data.filter((l: Listing) => l.deleted === 1));
      } else if (tab === "users") {
        const res = await fetch("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(await res.json());
      }
    } catch {
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  const restoreAcceptListing = async (id: number) => {
  try {
    const res = await fetch(`http://localhost:5000/api/admin/listings/${id}/restore-accept`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success("Ogłoszenie przywrócone i zaakceptowane."); fetchData(); }
  } catch { toast.error("Błąd."); }
};

  const acceptListing = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/listings/${id}/accept`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Ogłoszenie zatwierdzone."); fetchData(); }
    } catch { toast.error("Błąd."); }
  };

  const rejectListing = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/listings/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Ogłoszenie odrzucone."); fetchData(); }
    } catch { toast.error("Błąd."); }
  };

  const restoreListing = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/listings/${id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Ogłoszenie przywrócone do oczekujących."); fetchData(); }
    } catch { toast.error("Błąd."); }
  };

  const changeRole = async (id: number, newRole: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) { toast.success("Rola zaktualizowana."); fetchData(); }
    } catch { toast.error("Błąd."); }
  };

  const banUser = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { toast.success("Użytkownik zbanowany."); fetchData(); }
      else toast.error(data.message);
    } catch { toast.error("Błąd."); }
  };

  const unbanUser = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/unban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Użytkownik odbanowany."); fetchData(); }
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

  const filteredListings = listings
    .filter((l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.district.toLowerCase().includes(search.toLowerCase()) ||
      l.username.toLowerCase().includes(search.toLowerCase())
    )
    .filter((l) => {
      if (activeFilters.type && l.type !== activeFilters.type) return false;
      if (activeFilters.district && !l.district.toLowerCase().includes(activeFilters.district.toLowerCase())) return false;
      if (activeFilters.priceMin && l.price < parseInt(activeFilters.priceMin)) return false;
      if (activeFilters.priceMax && l.price > parseInt(activeFilters.priceMax)) return false;
      return true;
    });

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Brak danych";
    return new Date(dateStr).toLocaleString("pl-PL");
  };

  const typeLabel = (type: string) =>
    type === "room" ? "Pokój" : type === "house" ? "Dom" : "Mieszkanie";

  const districts = [...new Set(listings.map((l) => l.district))].sort();

  return (
    <div className="admin-panel">
      <h2>Panel Administratora</h2>

      <div className="admin-tabs">
        <button className={tab === "pending" ? "active" : ""} onClick={() => { setTab("pending"); setSearch(""); clearFilters(); }}>
          Oczekujące
        </button>
        <button className={tab === "all" ? "active" : ""} onClick={() => { setTab("all"); setSearch(""); clearFilters(); }}>
          Aktywne ogłoszenia
        </button>
        <button className={tab === "deleted" ? "active" : ""} onClick={() => { setTab("deleted"); setSearch(""); clearFilters(); }}>
          Odrzucone / Usunięte
        </button>
        <button className={tab === "users" ? "active" : ""} onClick={() => { setTab("users"); setSearch(""); clearFilters(); }}>
          Użytkownicy
        </button>
      </div>

      <div className="admin-search">
        <span className="admin-search-icon">🔍</span>
        <input
          type="text"
          placeholder={tab === "users" ? "Szukaj użytkownika..." : "Szukaj ogłoszenia, dzielnicy, właściciela..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="admin-search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {tab !== "users" && (
        <div className="admin-filters">
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
      )}

      {loading && <p className="admin-loading">Ładowanie...</p>}

      {!loading && (tab === "pending" || tab === "all" || tab === "deleted") && (
        filteredListings.length === 0 ? (
          <p className="admin-empty">Brak ogłoszeń.</p>
        ) : (
          <div className="admin-cards">
            {filteredListings.map((l) => (
              <div key={l.id} className={`admin-card ${l.deleted ? "admin-card-deleted" : ""}`}>
                <div className="admin-card-thumb" onClick={() => navigate(`/listings/${l.id}`, { state: { fromAdmin: true } })}>
                  {l.photo_1 ? (
                    <img src={`http://localhost:5000/server_pictures/listings/${l.photo_1}`} alt={l.title} />
                  ) : (
                    <div className="admin-card-no-photo">Brak zdjęcia</div>
                  )}
                </div>
                <div className="admin-card-body">
                  <div className="admin-card-title" onClick={() => navigate(`/listings/${l.id}`, { state: { fromAdmin: true } })}>
                    {l.title}
                  </div>
                  <div className="admin-card-meta">
                    <span>{l.district}</span>
                    <span>{l.price} zł</span>
                    <span>{typeLabel(l.type)}</span>
                    <span>{l.username}</span>
                  </div>
                  <div className="admin-card-status">
                    {l.deleted === 1 && <span className="badge badge-deleted">Usunięte</span>}
                    {l.deleted === 0 && (
                      <span className={`badge ${l.accepted ? "badge-accepted" : "badge-pending"}`}>
                        {l.accepted ? "Zatwierdzone" : "Oczekujące"}
                      </span>
                    )}
                  </div>
                  <div className="admin-card-actions">
                    <button className="btn-view" onClick={() => navigate(`/listings/${l.id}`, { state: { fromAdmin: true } })}>
                      Zobacz
                    </button>
                    {!l.accepted && !l.deleted && (
                      <button className="btn-accept" onClick={() => acceptListing(l.id)}>
                        Zatwierdź
                      </button>
                    )}
                    {!l.deleted && (
                      <button className="btn-reject" onClick={() => rejectListing(l.id)}>
                        Odrzuć
                      </button>
                    )}
                    {l.deleted === 1 && (
  <>
    <button className="btn-accept" onClick={() => restoreAcceptListing(l.id)}>
      Przywróć i zatwierdź
    </button>
    <button className="btn-role" onClick={() => restoreListing(l.id)}>
      Przywróć do oczekujących
    </button>
  </>
)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {!loading && tab === "users" && (
        filteredUsers.length === 0 ? (
          <p className="admin-empty">Brak użytkowników.</p>
        ) : (
          <div className="admin-users">
            {filteredUsers.map((u) => (
              <div key={u.id} className={`admin-user-card ${u.banned ? "banned" : ""}`}>
                <div className="admin-user-avatar" onClick={() => navigate(`/user/${u.id}`)}>
                  {u.avatar ? (
                    <img src={`http://localhost:5000/server_pictures/avatars/${u.avatar}`} alt="avatar" />
                  ) : (
                    <div className="admin-user-avatar-placeholder">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="admin-user-body">
                  <div className="admin-user-name" onClick={() => navigate(`/user/${u.id}`)}>
                    {u.username}
                    {u.banned === 1 && <span className="badge badge-banned">Zbanowany</span>}
                  </div>
                  <div className="admin-user-email">{u.email}</div>
                  <div className="admin-user-meta">
                    <span>Dołączył: {formatDate(u.created_at)}</span>
                    <span>Ostatnie logowanie: {formatDate(u.last_login)}</span>
                    <span>Ogłoszenia: {u.active_listings} aktywnych / {u.total_listings} łącznie</span>
                  </div>
                  <div className="admin-user-actions">
                    <span className={`badge ${u.role === "admin" ? "badge-admin" : "badge-user"}`}>
                      {u.role}
                    </span>
                    {u.role !== "admin" && (
                      <button className="btn-role" onClick={() => changeRole(u.id, "admin")}>
                        Zrób adminem
                      </button>
                    )}
                    {u.role === "admin" && (
                      <button className="btn-role" onClick={() => changeRole(u.id, "user")}>
                        Usuń admina
                      </button>
                    )}
                    {u.banned === 0 ? (
                      <button className="btn-ban" onClick={() => banUser(u.id)}>
                        Zbanuj
                      </button>
                    ) : (
                      <button className="btn-unban" onClick={() => unbanUser(u.id)}>
                        Odbanuj
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default AdminPanel;