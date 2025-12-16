
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Language, AppContextType, TeamMember, AuthCredentials, Theme } from '../types';
import { useTranslation } from 'react-i18next';
import i18n from '../services/i18n';

const defaultUser: UserProfile = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex@flowpilot.ai',
  avatar: 'https://picsum.photos/id/64/100/100',
  plan: 'free',
  role: 'admin',
  workspaceName: 'FlowPilot HQ',
  twoFactorEnabled: false,
  emailNotifications: true,
  soundEnabled: true,
  language: 'en',
  theme: 'light'
};

// Mock Team Data
const mockTeamMembers: TeamMember[] = [
  { id: 'u1', name: 'Alex Johnson', role: 'admin', avatar: 'https://picsum.photos/id/64/100/100', email: 'alex@flowpilot.ai' },
  { id: 'u2', name: 'Sarah Miller', role: 'member', avatar: 'https://picsum.photos/id/65/100/100', email: 'sarah@flowpilot.ai' },
  { id: 'u3', name: 'David Chen', role: 'member', avatar: 'https://picsum.photos/id/91/100/100', email: 'david@flowpilot.ai' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('flowpilot_auth') === 'true';
  });

  // Load user from local storage or default
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('flowpilot_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Use hook for t function re-renders, but rely on imported i18n for control
  const { i18n: i18nFromHook } = useTranslation();

  // Persistence
  useEffect(() => {
    if (user) {
      localStorage.setItem('flowpilot_user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('flowpilot_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  // Sync i18n with user state
  useEffect(() => {
    if (user && user.language && i18n.language !== user.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user]);

  // Theme Logic
  useEffect(() => {
    const currentTheme = user?.theme || 'light';
    const root = window.document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [user?.theme]);

  // Network Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = async (creds: AuthCredentials) => {
    // Mock API Call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setUser({ ...defaultUser, email: creds.email });
        setIsAuthenticated(true);
        resolve();
      }, 800);
    });
  };

  const register = async (creds: AuthCredentials) => {
    // Mock API Call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: UserProfile = {
          ...defaultUser,
          id: 'u_' + Date.now(),
          name: creds.name || 'New User',
          email: creds.email,
        };
        setUser(newUser);
        setIsAuthenticated(true);
        resolve();
      }, 800);
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('flowpilot_user');
    localStorage.removeItem('flowpilot_auth');
    document.documentElement.classList.remove('dark');
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (user) {
      setUser(prev => prev ? ({ ...prev, ...updates }) : null);
    }
  };

  const addTeamMember = (member: TeamMember) => {
    setTeamMembers(prev => [...prev, member]);
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const setLanguage = (lang: Language) => {
    updateUser({ language: lang });
    i18n.changeLanguage(lang);
  };

  const toggleTheme = () => {
    if (user) {
      const newTheme: Theme = user.theme === 'dark' ? 'light' : 'dark';
      updateUser({ theme: newTheme });
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      register, 
      logout,
      teamMembers, 
      addTeamMember,
      updateTeamMember,
      removeTeamMember,
      updateUser, 
      isOffline, 
      language: user?.language || 'en', 
      setLanguage,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
