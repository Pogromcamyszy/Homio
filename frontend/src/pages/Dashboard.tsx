import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../AuthContext";
import "./Dashboard.css";

interface Listing {
  id: number;
  title: string;
  district: string;
  price: number;
  type: string;
  accepted: number;
  deleted: number;
  rented: number;
  main_photo: string | null;
}

export default function Dashboard() {
  const { token, username } = useContext(AuthContext);
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "active" | "pending" | "rented" | "deleted">("all");

  const [filterType, setFilterType] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [activeFilters, setActiveFilters] = useState({ type: "", district: "", priceMin: "", priceMax: "" });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch("http://localhost:5000/listings/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setListings(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Ogłoszenie usunięte."); fetchListings(); }
    } catch { toast.error("Błąd."); }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/listings/${id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Ogłoszenie przywrócone."); fetchListings(); }
    } catch { toast.error("Błąd."); }
  };

  const handleRent = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/listings/${id}/rent`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Ogłoszenie oznaczone jako wynajęte."); fetchListings(); }
    } catch { toast.error("Błąd."); }
  };

  const handleUnrent = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/listings/${id}/unrent`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success("Ogłoszenie przywrócone do aktywnych."); fetchListings(); }
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

  const applyListingFilters = (list: Listing[]) => {
    return list.filter((l) => {
      if (activeFilters.type && l.type !== activeFilters.type) return false;
      if (activeFilters.district && !l.district.toLowerCase().includes(activeFilters.district.toLowerCase())) return false;
      if (activeFilters.priceMin && l.price < parseInt(activeFilters.priceMin)) return false;
      if (activeFilters.priceMax && l.price > parseInt(activeFilters.priceMax)) return false;
      return true;
    });
  };

  const all = listings;
  const active = listings.filter((l) => l.deleted === 0 && l.accepted === 1 && l.rented === 0);
  const pending = listings.filter((l) => l.deleted === 0 && l.accepted === 0 && l.rented === 0);
  const rented = listings.filter((l) => l.rented === 1 && l.deleted === 0);
  const deleted = listings.filter((l) => l.deleted === 1);

  const currentRaw =
    tab === "all" ? all :
    tab === "active" ? active :
    tab === "pending" ? pending :
    tab === "rented" ? rented :
    deleted;

  const current = applyListingFilters(currentRaw);

  const typeLabel = (type: string) =>
    type === "room" ? "Pokój" : type === "house" ? "Dom" : "Mieszkanie";

  const districts = [...new Set(listings.map((l) => l.district))].sort();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Witaj, {username}!</h2>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card" onClick={() => setTab("all")} style={{ cursor: "pointer" }}>
          <div className="stat-number">{listings.length}</div>
          <div className="stat-label">Wszystkie</div>
        </div>
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
      </div>

      <div className="dashboard-tabs">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
          Wszystkie <span className="tab-count">{listings.length}</span>
        </button>
        <button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>
          Aktywne <span className="tab-count">{active.length}</span>
        </button>
        <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
          Oczekujące <span className="tab-count">{pending.length}</span>
        </button>
        <button className={tab === "rented" ? "active" : ""} onClick={() => setTab("rented")}>
          Wynajęte <span className="tab-count">{rented.length}</span>
        </button>
        <button className={tab === "deleted" ? "active" : ""} onClick={() => setTab("deleted")}>
          Usunięte <span className="tab-count">{deleted.length}</span>
        </button>
      </div>

      <div className="dashboard-filters">
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

      {loading && <p className="dashboard-loading">Ładowanie...</p>}

      {!loading && current.length === 0 && (
        <p className="dashboard-empty">Brak ogłoszeń w tej kategorii.</p>
      )}

      {!loading && current.length > 0 && (
        <div className="dashboard-cards">
          {current.map((l) => (
            <div key={l.id} className="dashboard-card">
              <div className="dashboard-card-photo" onClick={() => navigate(`/listings/${l.id}`)}>
                {l.main_photo ? (
                  <img src={`http://localhost:5000${l.main_photo}`} alt={l.title} />
                ) : (
                  <div className="dashboard-card-no-photo">Brak zdjęcia</div>
                )}
              </div>
              <div className="dashboard-card-body">
                <div className="dashboard-card-title" onClick={() => navigate(`/listings/${l.id}`)}>
                  {l.title}
                </div>
                <div className="dashboard-card-meta">
                  <span>{l.district}</span>
                  <span>{l.price} zł</span>
                  <span>{typeLabel(l.type)}</span>
                </div>
                <div className="dashboard-card-status">
                  {l.deleted === 1 && <span className="badge badge-deleted">Usunięte</span>}
                  {l.rented === 1 && <span className="badge badge-rented">Wynajęte</span>}
                  {l.deleted === 0 && l.rented === 0 && l.accepted === 0 && <span className="badge badge-pending">Oczekujące</span>}
                  {l.deleted === 0 && l.rented === 0 && l.accepted === 1 && <span className="badge badge-accepted">Aktywne</span>}
                </div>
                <div className="dashboard-card-actions">
                  {l.deleted === 0 && l.rented === 0 && l.accepted === 1 && (
                    <>
                      <button className="btn-edit" onClick={() => navigate(`/listings/${l.id}/edit`)}>
                        Edytuj
                      </button>
                      <button className="btn-rent" onClick={() => handleRent(l.id)}>
                        Oznacz wynajęte
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(l.id)}>
                        Usuń
                      </button>
                    </>
                  )}
                  {l.deleted === 0 && l.accepted === 0 && l.rented === 0 && (
                    <button className="btn-delete" onClick={() => handleDelete(l.id)}>
                      Usuń
                    </button>
                  )}
                  {l.rented === 1 && l.deleted === 0 && (
                    <button className="btn-edit" onClick={() => handleUnrent(l.id)}>
                      Przywróć do aktywnych
                    </button>
                  )}
                  {l.deleted === 1 && (
                    <button className="btn-edit" onClick={() => handleRestore(l.id)}>
                      Przywróć
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}