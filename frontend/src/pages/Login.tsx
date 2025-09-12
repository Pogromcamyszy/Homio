import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext"; // make sure path is correct

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext); // get login function from context
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login failed");
                return;
            }

            // store token in context + localStorage
            login(data.token);

            // redirect to dashboard
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            alert("An error occurred while logging in.");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
