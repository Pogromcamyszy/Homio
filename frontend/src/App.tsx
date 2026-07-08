import React, { useContext, useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
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


function AppContent() {
  const { token, role, username, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setAvatar(null); return; }
    fetch("http://localhost:5000/api/profile/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAvatar(data.avatar || null))
      .catch(() => {});
  }, [token]);

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