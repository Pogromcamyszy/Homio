import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "80vh",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      padding: "2rem",
    }}>
      <div style={{ fontSize: "6rem", marginBottom: "1rem" }}>🏠</div>
      <h1 style={{ fontSize: "5rem", fontWeight: 700, color: "#4f46e5", margin: 0 }}>404</h1>
      <h2 style={{ fontSize: "1.5rem", color: "#111827", margin: "0.5rem 0" }}>Strona nie istnieje</h2>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
        Strona której szukasz nie została znaleziona.
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "0.75rem 2rem",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Strona główna
        </button>
        <button
          onClick={() => navigate("/listings")}
          style={{
            padding: "0.75rem 2rem",
            background: "#f3f4f6",
            color: "#374151",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Ogłoszenia
        </button>
      </div>
    </div>
  );
}