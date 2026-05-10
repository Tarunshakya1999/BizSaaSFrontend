import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getMe()
        .then((res) => {
          console.log('✅ User already logged in:', res.data);
          setUser(res.data);
        })
        .catch(() => {
          console.log('❌ Token invalid, clearing storage');
          localStorage.clear();
        })
        .finally(() => setLoading(false));
    } else {
      console.log('ℹ️ No token found');
      setLoading(false);
    }
  }, []);

  // Login function - NO redirect here
  const login = async (username, password) => {
    console.log('🔐 Login function called for:', username);
    const { data } = await apiLogin({ username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const me = await getMe();
    setUser(me.data);
    console.log('✅ Login successful, user set:', me.data);
    return me.data;
  };

  // Register function - only creates account
  const register = async (formData) => {
    console.log('📝 Register function called');
    const response = await apiRegister(formData);
    console.log('✅ Registration successful');
    return response.data;
  };

  const logout = () => {
    console.log('🚪 Logging out');
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};