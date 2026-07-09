import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddListing from "./pages/AddListing";
import EditListing from "./pages/EditListing";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, AuthContext } from "./AuthContext";
import ListingDetail from "./pages/ListingDetail";
import UserProfile from "./pages/UserProfile";
import { initApiFetch } from "./api/apiFetch";
import NotFound from "./pages/NotFound";



function AppContent() {
  const { token, role, username, logout, banned, setBanned } = useContext(AuthContext);
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, options);
    if (res.status === 403) {
      const data = await res.json();
      if (data.message === "BANNED") {
        setBanned(true);
        return null;
      }
      if (data.message === "Invalid or expired token") {
        logout();
        toast.error("Sesja wygasła. Zaloguj się ponownie.");
        navigate("/login");
        return null;
      }
    }
    return res;
  };

  useEffect(() => {
    if (!token) { setAvatar(null); return; }
    apiFetch("http://localhost:5000/api/profile/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res ? res.json() : null)
      .then((data) => { if (data) setAvatar(data.avatar || null); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
  initApiFetch(logout, setBanned, navigate);
}, []);

  if (banned) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f4f6f9",
        fontFamily: "Arial, sans-serif",
      }}>
        <div style={{
          background: "#fff",
          padding: "3rem",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
          maxWidth: "400px",
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚫</div>
          <h2 style={{ color: "#dc2626", marginBottom: "0.5rem" }}>Konto zablokowane</h2>
          <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
            Twoje konto zostało zablokowane przez administratora. Skontaktuj się z pomocą techniczną.
          </p>
          <button
            onClick={() => { logout(); navigate("/"); }}
            style={{
              padding: "0.75rem 2rem",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Wyloguj się
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header>
        <h1>Homio</h1>
        <nav>
          <Link to="/">Home</Link>
          {token && <Link to="/dashboard">Dashboard</Link>}
          <Link to="/listings">Listings</Link>
          {!token && (
            <>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </>
          )}
          {token && (
            <>
              <Link to="/add-listing">Add Listing</Link>
              <Link to="/login" onClick={logout}>Logout</Link>
              {role === "admin" && <Link to="/admin">Admin</Link>}
            </>
          )}
        </nav>
        {token && (
          <div className="nav-avatar" onClick={() => navigate("/profile")}>
            {avatar ? (
              <img src={`http://localhost:5000/server_pictures/avatars/${avatar}`} alt="avatar" />
            ) : (
              <div className="nav-avatar-placeholder">
                {username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/add-listing" element={<ProtectedRoute><AddListing /></ProtectedRoute>} />
        <Route path="/listings/:id/edit" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="bottom-center" autoClose={3000} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}