import React, { useContext } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddListing from "./pages/AddListing";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, AuthContext } from "./AuthContext";

function AppContent() {
  const { token, logout } = useContext(AuthContext);

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
              <Link to="/login" onClick={logout}>
                Logout
              </Link>
            </>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-listing"
          element={
            <ProtectedRoute>
              <AddListing />
            </ProtectedRoute>
          }
        />
      </Routes>
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
