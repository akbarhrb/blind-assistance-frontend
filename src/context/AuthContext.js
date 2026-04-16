import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, clearAuth, loadAuth, storeAuth } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const stored = await loadAuth();
        if (isMounted) {
          setToken(stored.token || null);
          setUser(stored.user || null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email, password) => {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    await storeAuth(result.access_token, result.user);
    setToken(result.access_token);
    setUser(result.user);
  };

  const signUp = async (name, email, password) => {
    const result = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    await storeAuth(result.access_token, result.user);
    setToken(result.access_token);
    setUser(result.user);
  };

  const signOut = async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isLoggedIn: Boolean(token),
      signIn,
      signUp,
      signOut,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
