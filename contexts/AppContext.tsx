
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Language, AppContextType, TeamMember, AuthCredentials, Theme } from '../types';
import { useTranslation } from 'react-i18next';
import i18n from '../services/i18n';
import { supabase } from '../services/supabaseClient';

const defaultUser: UserProfile = {
  id: 'local-user',
  name: 'Pilot',
  email: 'pilot@flowpilot.ai',
  avatar: 'https://picsum.photos/id/64/100/100',
  plan: 'pro',
  role: 'admin',
  workspaceName: 'Local Workspace',
  twoFactorEnabled: false,
  emailNotifications: true,
  soundEnabled: true,
  language: 'en',
  theme: 'light'
};

const mockTeamMembers: TeamMember[] = [
  { id: 'u1', name: 'Alex Johnson', role: 'admin', avatar: 'https://picsum.photos/id/64/100/100', email: 'alex@flowpilot.ai' },
  { id: 'u2', name: 'Sarah Miller', role: 'member', avatar: 'https://picsum.photos/id/65/100/100', email: 'sarah@flowpilot.ai' },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const { i18n: i18nFromHook } = useTranslation();

  // Auth & Profile Sync
  useEffect(() => {
    if (!supabase) {
      // Mock Auth Check
      const localAuth = localStorage.getItem('flowpilot_auth');
      if (localAuth === 'true') {
        setIsAuthenticated(true);
        const savedProfile = localStorage.getItem('flowpilot_profile');
        setUser(savedProfile ? JSON.parse(savedProfile) : defaultUser);
      }
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        fetchProfile(session.user.id, session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        fetchProfile(session.user.id, session.user.email);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          name: data.name || email?.split('@')[0] || 'User',
          email: data.email || email || '',
          avatar: data.avatar || defaultUser.avatar,
          plan: data.plan || 'free',
          role: data.role || 'admin',
          workspaceName: data.workspace_name,
          twoFactorEnabled: data.two_factor_enabled,
          emailNotifications: data.email_notifications,
          soundEnabled: data.sound_enabled,
          language: data.language || 'en',
          theme: data.theme || 'light'
        });
      } else if (email) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: userId,
          email,
          name: email.split('@')[0],
          avatar: defaultUser.avatar,
          plan: 'free',
          role: 'admin',
          language: 'en',
          theme: 'light'
        });
        if (!insertError) setUser({ ...defaultUser, id: userId, email });
      }
    } catch (e) {
      console.error("Profile sync error", e);
    }
  };

  useEffect(() => {
    const currentTheme = user?.theme || 'light';
    const root = window.document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [user?.theme]);

  const login = async (creds: AuthCredentials) => {
    if (!supabase) {
      // Mock Login
      setIsAuthenticated(true);
      setUser(defaultUser);
      localStorage.setItem('flowpilot_auth', 'true');
      localStorage.setItem('flowpilot_profile', JSON.stringify(defaultUser));
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    });
    if (error) throw error;
  };

  const register = async (creds: AuthCredentials) => {
    if (!supabase) {
      // Mock Register
      setIsAuthenticated(true);
      const newUser = { ...defaultUser, name: creds.name || 'Pilot', email: creds.email };
      setUser(newUser);
      localStorage.setItem('flowpilot_auth', 'true');
      localStorage.setItem('flowpilot_profile', JSON.stringify(newUser));
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: creds.email,
      password: creds.password,
      options: { data: { name: creds.name } },
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (!supabase) {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('flowpilot_auth');
      return;
    }
    await supabase.auth.signOut();
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      if (!supabase) {
        localStorage.setItem('flowpilot_profile', JSON.stringify(updatedUser));
        return;
      }

      const dbUpdates = {
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        plan: updatedUser.plan,
        role: updatedUser.role,
        workspace_name: updatedUser.workspaceName,
        two_factor_enabled: updatedUser.twoFactorEnabled,
        email_notifications: updatedUser.emailNotifications,
        sound_enabled: updatedUser.soundEnabled,
        language: updatedUser.language,
        theme: updatedUser.theme
      };

      await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    }
  };

  const addTeamMember = (member: TeamMember) => setTeamMembers(prev => [...prev, member]);
  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => 
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  const removeTeamMember = (id: string) => setTeamMembers(prev => prev.filter(m => m.id !== id));
  const setLanguage = (lang: Language) => {
    updateUser({ language: lang });
    i18n.changeLanguage(lang);
  };
  const toggleTheme = () => {
    if (user) updateUser({ theme: user.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <AppContext.Provider value={{ 
      user, isAuthenticated, login, register, logout, teamMembers, 
      addTeamMember, updateTeamMember, removeTeamMember, updateUser, 
      isOffline, language: user?.language || 'en', setLanguage, toggleTheme
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
