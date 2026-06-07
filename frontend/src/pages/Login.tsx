import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../AuthContext";
import "./Register.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Wypełnij wszystkie pola.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Nieprawidłowy email lub hasło.");
        return;
      }

      toast.success("Zalogowano pomyślnie!");
      login(data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h2>Witaj z powrotem</h2>
        <p className="auth-subtitle">Zaloguj się do swojego konta</p>

        <form onSubmit={handleLogin}>

          <div className="auth-field">
            <label>Adres email</label>
            <input
              type="email"
              placeholder="adres@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Hasło</label>
            <div className="input-with-icon">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Twoje hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ukryj" : "Pokaż"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>

        </form>

        <p className="auth-switch">
          Nie masz konta? <Link to="/register">Zarejestruj się</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;