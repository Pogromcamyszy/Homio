import React, { createContext, useState, useEffect } from "react";

interface AuthContextType {
    setToken: (token: string) => void;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    token: null,
    setToken: () => { },
    login: () => { },
    logout: () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

    const login = (newToken: string) => {
        setToken(newToken);
        localStorage.setItem("token", newToken);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ setToken,token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
