
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskSource = 'manual' | 'voice' | 'email' | 'text';
export type UserRole = 'admin' | 'member';

export type TaskID = string;
export type UserID = string;
export type ISODate = string;

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface Task {
  id: TaskID;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: ISODate;
  category: string;
  source: TaskSource;
  description?: string;
  aiConfidence?: number;
  assignedTo?: UserID;
  createdAt?: ISODate;
}

export type TriggerType = 'ON_CREATE' | 'ON_COMPLETE' | 'ON_OVERDUE' | 'KEYWORD_MATCH';
export type ActionType = 'NOTIFY' | 'SET_PRIORITY' | 'ASSIGN_USER' | 'DELETE';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerCondition?: string;
  actionType: ActionType;
  actionTarget?: string;
  active: boolean;
  lastRun?: ISODate;
  executionCount: number;
}

export interface UserStats {
  pendingTasks: number;
  completedToday: number;
  highPriority: number;
  productivityScore: number;
  streak: number;
}

export interface AppNotification {
  id: string;
  type: 'email' | 'social' | 'system' | 'automation';
  source: string;
  title: string;
  message: string;
  timestamp: ISODate;
  read: boolean;
  priority?: 'high' | 'normal';
}

export type Language = 'en' | 'es' | 'fr' | 'zh' | 'hi' | 'pt';
export type SubscriptionPlan = 'free' | 'pro' | 'team';
export type Theme = 'light' | 'dark';

export interface UserProfile {
  id: UserID;
  name: string;
  email: string;
  avatar: string;
  plan: SubscriptionPlan;
  role: UserRole;
  workspaceName?: string;
  twoFactorEnabled: boolean;
  emailNotifications?: boolean;
  soundEnabled: boolean;
  language: Language;
  theme: Theme;
}

export interface TeamMember {
  id: UserID;
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
  updateTeamMember: (id: UserID, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: UserID) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  isOffline: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
}
