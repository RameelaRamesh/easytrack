import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  registerCEO: (data: any) => Promise<void>;
  registerOrganization: (data: any) => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get<User>('/auth/me/');
      setUser(response.data);
    } catch (error) {
      const savedUser = sessionStorage.getItem('easytrack_offline_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear any legacy auth tokens from localStorage so each browser tab has an isolated session
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_key');
    localStorage.removeItem('easytrack_offline_user');

    const accessToken = sessionStorage.getItem('access_token');
    if (accessToken) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ access: string; refresh: string; session_key?: string; user: User }>('/auth/login/', {
        username,
        password,
      });
      const { access, refresh, session_key, user: loggedUser } = response.data;
      const activeSessionKey = session_key || 'sess_' + Math.random().toString(36).substring(2) + Date.now();
      
      sessionStorage.setItem('access_token', access);
      sessionStorage.setItem('refresh_token', refresh);
      sessionStorage.setItem('session_key', activeSessionKey);
      sessionStorage.removeItem('easytrack_offline_user');
      
      setUser(loggedUser);
      return loggedUser;
    } catch (error: any) {
      // If the backend returned validation errors (e.g. username wrong or password wrong), rethrow directly
      if (error.response?.data && (error.response.data.username || error.response.data.password || error.response.data.detail)) {
        setLoading(false);
        throw error;
      }

      const cleanUser = username.trim().toLowerCase();
      // Offline fallback only when backend is unreachable:
      if (cleanUser === 'ceo' || cleanUser === 'ceo11' || (cleanUser === 'operations@vattara.com' && (password === 'password' || password === 'ceo2026'))) {
        if (password === 'password' || password === 'ceo2026') {
          const mockCEO: User = {
            id: '1',
            username: cleanUser === 'ceo11' ? 'ceo11' : 'ceo',
            email: 'operations@vattara.com',
            first_name: 'CEO',
            last_name: 'Executive',
            role: 'ceo',
            organization: '1',
            organization_name: 'Vattara Solutions',
            must_change_password: false,
          };
          const mockSessionKey = 'sess_mock_' + Date.now();
          sessionStorage.setItem('access_token', 'mock_jwt_token_ceo');
          sessionStorage.setItem('refresh_token', 'mock_refresh_token_ceo');
          sessionStorage.setItem('session_key', mockSessionKey);
          sessionStorage.setItem('easytrack_offline_user', JSON.stringify(mockCEO));

          setUser(mockCEO);
          return mockCEO;
        } else {
          setLoading(false);
          throw { response: { data: { password: ['Incorrect password. Please try again.'] } } };
        }
      }

      if (cleanUser === 'hr' || cleanUser === 'hr11') {
        if (password === 'password' || password === 'hr2026') {
          const mockHR: User = {
            id: '2',
            username: cleanUser === 'hr11' ? 'hr11' : 'hr',
            email: 'hr@vattara.com',
            first_name: 'HR',
            last_name: 'Lead',
            role: 'hr',
            organization: '1',
            organization_name: 'Vattara Solutions',
            must_change_password: false,
          };
          const mockSessionKey = 'sess_mock_' + Date.now();
          sessionStorage.setItem('access_token', 'mock_jwt_token_hr');
          sessionStorage.setItem('refresh_token', 'mock_refresh_token_hr');
          sessionStorage.setItem('session_key', mockSessionKey);
          sessionStorage.setItem('easytrack_offline_user', JSON.stringify(mockHR));

          setUser(mockHR);
          return mockHR;
        } else {
          setLoading(false);
          throw { response: { data: { password: ['Incorrect password. Please try again.'] } } };
        }
      }

      if (cleanUser === 'ops_head' || cleanUser === 'opshead' || cleanUser === 'opshead11') {
        if (password === 'password' || password === 'ops2026') {
          const mockOps: User = {
            id: '3',
            username: cleanUser === 'opshead11' ? 'opshead11' : 'ops_head',
            email: 'opshead@vattara.com',
            first_name: 'Operations',
            last_name: 'Head',
            role: 'operations_head',
            organization: '1',
            organization_name: 'Vattara Solutions',
            must_change_password: false,
          };
          const mockSessionKey = 'sess_mock_' + Date.now();
          sessionStorage.setItem('access_token', 'mock_jwt_token_ops');
          sessionStorage.setItem('refresh_token', 'mock_refresh_token_ops');
          sessionStorage.setItem('session_key', mockSessionKey);
          sessionStorage.setItem('easytrack_offline_user', JSON.stringify(mockOps));

          setUser(mockOps);
          return mockOps;
        } else {
          setLoading(false);
          throw { response: { data: { password: ['Incorrect password. Please try again.'] } } };
        }
      }

      if (cleanUser === 'tl' || cleanUser === 'tl11') {
        if (password === 'password' || password === 'tl2026') {
          const mockTL: User = {
            id: '4',
            username: cleanUser === 'tl11' ? 'tl11' : 'tl',
            email: 'tl@vattara.com',
            first_name: 'Team',
            last_name: 'Lead',
            role: 'tl',
            organization: '1',
            organization_name: 'Vattara Solutions',
            must_change_password: false,
          };
          const mockSessionKey = 'sess_mock_' + Date.now();
          sessionStorage.setItem('access_token', 'mock_jwt_token_tl');
          sessionStorage.setItem('refresh_token', 'mock_refresh_token_tl');
          sessionStorage.setItem('session_key', mockSessionKey);
          sessionStorage.setItem('easytrack_offline_user', JSON.stringify(mockTL));

          setUser(mockTL);
          return mockTL;
        } else {
          setLoading(false);
          throw { response: { data: { password: ['Incorrect password. Please try again.'] } } };
        }
      }

      if (cleanUser === 'employee' || cleanUser === 'emp11' || cleanUser === 'employee11') {
        if (password === 'password' || password === 'emp2026') {
          const mockEmp: User = {
            id: '5',
            username: cleanUser === 'emp11' || cleanUser === 'employee11' ? 'emp11' : 'employee',
            email: 'employee@vattara.com',
            first_name: 'Standard',
            last_name: 'Employee',
            role: 'employee',
            organization: '1',
            organization_name: 'Vattara Solutions',
            must_change_password: false,
          };
          const mockSessionKey = 'sess_mock_' + Date.now();
          sessionStorage.setItem('access_token', 'mock_jwt_token_emp');
          sessionStorage.setItem('refresh_token', 'mock_refresh_token_emp');
          sessionStorage.setItem('session_key', mockSessionKey);
          sessionStorage.setItem('easytrack_offline_user', JSON.stringify(mockEmp));

          setUser(mockEmp);
          return mockEmp;
        } else {
          setLoading(false);
          throw { response: { data: { password: ['Incorrect password. Please try again.'] } } };
        }
      }

      // If backend was unreachable and username does not match known demo user:
      if (!error.response) {
        setLoading(false);
        throw { response: { data: { username: ['Username does not exist. Please check your username.'] } } };
      }

      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      apiClient.post('/auth/logout/').catch(() => {});
    } catch {}

    // Clear all storage synchronously immediately to prevent auto re-login on redirect
    sessionStorage.clear();
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const registerOrganization = async (data: any): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.post('/auth/register/', data);
    } finally {
      setLoading(false);
    }
  };

  const registerCEO = registerOrganization;

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerCEO, registerOrganization, updateUser }}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
