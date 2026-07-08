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
  username: string;
  photo_1: string | null;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const AdminPanel: React.FC = () => {
  const { token, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"pending" | "all" | "users">("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredListings = listings.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.district.toLowerCase().includes(search.toLowerCase()) ||
    l.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-panel">
      <h2>Panel Administratora</h2>

      <div className="admin-tabs">
        <button className={tab === "pending" ? "active" : ""} onClick={() => { setTab("pending"); setSearch(""); }}>
          Oczekujące
        </button>
        <button className={tab === "all" ? "active" : ""} onClick={() => { setTab("all"); setSearch(""); }}>
          Wszystkie ogłoszenia
        </button>
        <button className={tab === "users" ? "active" : ""} onClick={() => { setTab("users"); setSearch(""); }}>
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

      {loading && <p className="admin-loading">Ładowanie...</p>}

      {!loading && (tab === "pending" || tab === "all") && (
        filteredListings.length === 0 ? (
          <p className="admin-empty">Brak ogłoszeń.</p>
        ) : (
          <div className="admin-cards">
            {filteredListings.map((l) => (
              <div key={l.id} className="admin-card">
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
                    <span>{l.username}</span>
                  </div>
                  <div className="admin-card-status">
                    <span className={`badge ${l.accepted ? "badge-accepted" : "badge-pending"}`}>
                      {l.accepted ? "Zatwierdzone" : "Oczekujące"}
                    </span>
                  </div>
                  <div className="admin-card-actions">
                    <button className="btn-view" onClick={() => navigate(`/listings/${l.id}`, { state: { fromAdmin: true } })}>
                      Zobacz
                    </button>
                    {!l.accepted && (
                      <button className="btn-accept" onClick={() => acceptListing(l.id)}>
                        Zatwierdź
                      </button>
                    )}
                    <button className="btn-reject" onClick={() => rejectListing(l.id)}>
                      Odrzuć
                    </button>
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
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Użytkownik</th>
                <th>Email</th>
                <th>Rola</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "admin" ? "badge-admin" : "badge-user"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <button className="btn-role" onClick={() => changeRole(u.id, u.role === "admin" ? "user" : "admin")}>
                      {u.role === "admin" ? "Usuń admina" : "Zrób adminem"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default AdminPanel;