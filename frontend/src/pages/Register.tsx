import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../AuthContext";
import "./Register.css";

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function getStrengthLabel(score: number): string {
  switch (score) {
    case 1: return "Bardzo słabe";
    case 2: return "Słabe";
    case 3: return "Dobre";
    case 4: return "Silne";
    default: return "";
  }
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setToken } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (username.trim().length < 3)
      newErrors.username = "Nazwa użytkownika musi mieć co najmniej 3 znaki.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Podaj poprawny adres email.";

    if (password.length < 8)
      newErrors.password = "Hasło musi mieć co najmniej 8 znaków.";
    else if (!/[A-Z]/.test(password))
      newErrors.password = "Hasło musi zawierać co najmniej jedną wielką literę.";
    else if (!/[0-9]/.test(password))
      newErrors.password = "Hasło musi zawierać co najmniej jedną cyfrę.";

    if (password !== confirmPassword)
      newErrors.confirmPassword = "Hasła nie są identyczne.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Konto zostało utworzone!");
        setToken(data.token);
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Rejestracja nie powiodła się.");
      }
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

        <h2>Utwórz konto</h2>
        <p className="auth-subtitle">Dołącz do Homio i znajdź swoje miejsce</p>

        <form onSubmit={handleSubmit}>

          <div className="auth-field">
            <label>Nazwa użytkownika</label>
            <input
              type="text"
              placeholder="np. jan_kowalski"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errors.username ? "input-error" : ""}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          <div className="auth-field">
            <label>Adres email</label>
            <input
              type="email"
              placeholder="adres@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label>Hasło</label>
            <div className="input-with-icon">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 znaków, wielka litera, cyfra"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? "input-error" : ""}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ukryj" : "Pokaż"}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}

            {password.length > 0 && (
              <>
                <div className="strength-meter">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`bar ${strength >= i ? "active" : ""}`}
                      style={{ "--bar-index": i } as React.CSSProperties}
                    />
                  ))}
                </div>
                <span className="strength-text">{getStrengthLabel(strength)}</span>
              </>
            )}
          </div>

          <div className="auth-field">
            <label>Potwierdź hasło</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Powtórz hasło"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? "input-error" : ""}
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Rejestrowanie..." : "Zarejestruj się"}
          </button>

        </form>

        <p className="auth-switch">
          Masz już konto? <Link to="/login">Zaloguj się</Link>
        </p>

      </div>
    </div>
  );
};

export default Register;