import React, { createContext, useState } from "react";

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: string | null;
  banned: boolean;
  setToken: (token: string) => void;
  login: (token: string, username: string, role: string) => void;
  logout: () => void;
  setBanned: (banned: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  username: null,
  role: null,
  banned: false,
  setToken: () => {},
  login: () => {},
  logout: () => {},
  setBanned: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("username"));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem("role"));
  const [banned, setBannedState] = useState<boolean>(false);

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem("token", newToken);
  };

  const login = (newToken: string, newUsername: string, newRole: string) => {
    setTokenState(newToken);
    setUsername(newUsername);
    setRole(newRole);
    setBannedState(false);
    localStorage.setItem("token", newToken);
    localStorage.setItem("username", newUsername);
    localStorage.setItem("role", newRole);
  };

  const logout = () => {
    setTokenState(null);
    setUsername(null);
    setRole(null);
    setBannedState(false);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  };

  const setBanned = (b: boolean) => setBannedState(b);

  return (
    <AuthContext.Provider value={{ token, username, role, banned, setToken, login, logout, setBanned }}>
      {children}
    </AuthContext.Provider>
  );
};