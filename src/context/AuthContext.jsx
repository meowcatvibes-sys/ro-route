import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('roroute_token');
    if (token) {
      authAPI.me()
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('roroute_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('roroute_token');
          localStorage.removeItem('roroute_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { user: userData, token } = res.data;
    setUser(userData);
    localStorage.setItem('roroute_token', token);
    localStorage.setItem('roroute_user', JSON.stringify(userData));
    return userData;
  };

  const register = async ({ name, email, phone, password }) => {
    const res = await authAPI.register({ name, email, phone, password });
    const { user: userData, token } = res.data;
    setUser(userData);
    localStorage.setItem('roroute_token', token);
    localStorage.setItem('roroute_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    setUser(null);
    localStorage.removeItem('roroute_token');
    localStorage.removeItem('roroute_user');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDriver: user?.role === 'driver',
    isPassenger: user?.role === 'passenger',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
