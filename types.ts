
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskSource = 'manual' | 'voice' | 'email' | 'text';
export type UserRole = 'admin' | 'member';

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string; // For registration
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // ISO string
  category?: string;
  source: TaskSource;
  description?: string;
  aiConfidence?: number;
  assignedTo?: string; // userId
}

// Automation Types
export type TriggerType = 'ON_CREATE' | 'ON_COMPLETE' | 'ON_OVERDUE' | 'KEYWORD_MATCH';
export type ActionType = 'NOTIFY' | 'SET_PRIORITY' | 'ASSIGN_USER' | 'DELETE';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerCondition?: string; // e.g., keyword for KEYWORD_MATCH, or 'high' for priority
  actionType: ActionType;
  actionTarget?: string; // e.g. 'high' for SET_PRIORITY or message for NOTIFY
  active: boolean;
  lastRun?: string;
  executionCount: number;
}

export interface UserStats {
  pendingTasks: number;
  completedToday: number;
  highPriority: number;
  productivityScore: number;
  streak: number; // Viral Feature: Daily Streak
}

export interface AppNotification {
  id: string;
  type: 'email' | 'social' | 'system' | 'automation';
  source: string; // e.g. 'Gmail', 'Slack', 'LinkedIn', 'FlowPilot'
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: 'high' | 'normal';
}

export interface GeminiTaskParseResponse {
  title: string;
  priority: Priority;
  dueDate?: string;
  category?: string;
  description?: string;
}

// --- New Types for Settings & Subscriptions ---

export type Language = 'en' | 'es' | 'fr' | 'zh' | 'hi' | 'pt';
export type SubscriptionPlan = 'free' | 'pro' | 'team';
export type Theme = 'light' | 'dark';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: SubscriptionPlan;
  role: UserRole;
  workspaceName?: string;
  twoFactorEnabled: boolean;
  emailNotifications?: boolean;
  soundEnabled: boolean; // Sound Alerts Feature
  language: Language;
  theme: Theme;
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
}

export interface AppContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (creds: AuthCredentials) => Promise<void>;
  register: (creds: AuthCredentials) => Promise<void>;
  logout: () => void;
  teamMembers: TeamMember[];
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  isOffline: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
}
