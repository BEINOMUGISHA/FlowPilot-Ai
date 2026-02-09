
import { supabase } from './supabaseClient';
import { Task, AutomationRule, AppNotification, Priority, TaskStatus, TaskSource } from '../types';

// --- MOCK DATA ---
const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Review quarterly financial report',
    status: 'pending',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    category: 'Finance',
    source: 'email',
    aiConfidence: 0.95,
    assignedTo: 'local-user'
  }
];

const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: '1',
    name: 'Urgent Client Tasks',
    description: 'Mark tasks with "Client" as High Priority',
    triggerType: 'KEYWORD_MATCH',
    triggerCondition: 'Client',
    actionType: 'SET_PRIORITY',
    actionTarget: 'high',
    active: true,
    executionCount: 0
  }
];

// --- MAPPERS ---
const mapTaskFromDB = (t: any): Task => ({
  id: t.id,
  title: t.title,
  status: t.status,
  priority: t.priority,
  dueDate: t.due_date,
  category: t.category,
  source: t.source,
  description: t.description,
  aiConfidence: t.ai_confidence,
  assignedTo: t.assigned_to
});

const mapTaskToDB = (t: Partial<Task>, userId: string) => ({
  id: t.id,
  title: t.title,
  status: t.status,
  priority: t.priority,
  due_date: t.dueDate,
  category: t.category,
  source: t.source,
  description: t.description,
  ai_confidence: t.aiConfidence,
  assigned_to: t.assignedTo,
  user_id: userId
});

const mapAutomationFromDB = (a: any): AutomationRule => ({
  id: a.id,
  name: a.name,
  description: a.description,
  triggerType: a.trigger_type,
  triggerCondition: a.trigger_condition,
  actionType: a.action_type,
  actionTarget: a.action_target,
  active: a.active,
  lastRun: a.last_run,
  executionCount: a.execution_count
});

const mapAutomationToDB = (a: Partial<AutomationRule>, userId: string) => ({
  id: a.id,
  name: a.name,
  description: a.description,
  trigger_type: a.triggerType,
  trigger_condition: a.triggerCondition,
  action_type: a.actionType,
  action_target: a.actionTarget,
  active: a.active,
  last_run: a.lastRun,
  execution_count: a.executionCount,
  user_id: userId
});

const mapNotificationFromDB = (n: any): AppNotification => ({
  id: n.id,
  type: n.type,
  source: n.source,
  title: n.title,
  message: n.message,
  timestamp: n.timestamp,
  read: n.read,
  priority: n.priority
});

const mapNotificationToDB = (n: Partial<AppNotification>, userId: string) => ({
  id: n.id,
  type: n.type,
  source: n.source,
  title: n.title,
  message: n.message,
  timestamp: n.timestamp,
  read: n.read,
  priority: n.priority,
  user_id: userId
});

// --- LOCAL STORAGE HELPERS ---
const localStore = {
  get: <T>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(`flowpilot_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(`flowpilot_${key}`, JSON.stringify(value));
  }
};

// --- HYBRID API SERVICE ---
export const DB = {
  tasks: {
    fetchAll: async (userId: string): Promise<Task[]> => {
      if (!supabase) return localStore.get('tasks', INITIAL_TASKS);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapTaskFromDB);
    },
    create: async (task: Task, userId: string) => {
      if (!supabase) {
        const tasks = localStore.get('tasks', INITIAL_TASKS);
        localStore.set('tasks', [task, ...tasks]);
        return;
      }
      const { error } = await supabase.from('tasks').insert(mapTaskToDB(task, userId));
      if (error) throw error;
    },
    update: async (task: Task, userId: string) => {
      if (!supabase) {
        const tasks = localStore.get('tasks', INITIAL_TASKS);
        localStore.set('tasks', tasks.map(t => t.id === task.id ? task : t));
        return;
      }
      const { error } = await supabase
        .from('tasks')
        .update(mapTaskToDB(task, userId))
        .eq('id', task.id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      if (!supabase) {
        const tasks = localStore.get('tasks', INITIAL_TASKS);
        localStore.set('tasks', tasks.filter(t => t.id !== id));
        return;
      }
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    }
  },

  automations: {
    fetchAll: async (userId: string): Promise<AutomationRule[]> => {
      if (!supabase) return localStore.get('automations', INITIAL_AUTOMATIONS);
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []).map(mapAutomationFromDB);
    },
    create: async (rule: AutomationRule, userId: string) => {
      if (!supabase) {
        const rules = localStore.get('automations', INITIAL_AUTOMATIONS);
        localStore.set('automations', [rule, ...rules]);
        return;
      }
      const { error } = await supabase.from('automations').insert(mapAutomationToDB(rule, userId));
      if (error) throw error;
    },
    update: async (rule: AutomationRule, userId: string) => {
      if (!supabase) {
        const rules = localStore.get('automations', INITIAL_AUTOMATIONS);
        localStore.set('automations', rules.map(r => r.id === rule.id ? rule : r));
        return;
      }
      const { error } = await supabase
        .from('automations')
        .update(mapAutomationToDB(rule, userId))
        .eq('id', rule.id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      if (!supabase) {
        const rules = localStore.get('automations', INITIAL_AUTOMATIONS);
        localStore.set('automations', rules.filter(r => r.id !== id));
        return;
      }
      const { error } = await supabase.from('automations').delete().eq('id', id);
      if (error) throw error;
    }
  },

  notifications: {
    fetchAll: async (userId: string): Promise<AppNotification[]> => {
      if (!supabase) return localStore.get('notifications', []);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapNotificationFromDB);
    },
    create: async (note: AppNotification, userId: string) => {
      if (!supabase) {
        const notes = localStore.get('notifications', []);
        localStore.set('notifications', [note, ...notes]);
        return;
      }
      const { error } = await supabase.from('notifications').insert(mapNotificationToDB(note, userId));
      if (error) throw error;
    },
    update: async (note: AppNotification, userId: string) => {
      if (!supabase) {
        const notes = localStore.get('notifications', []);
        localStore.set('notifications', notes.map(n => n.id === note.id ? note : n));
        return;
      }
      const { error } = await supabase
        .from('notifications')
        .update(mapNotificationToDB(note, userId))
        .eq('id', note.id);
      if (error) throw error;
    }
  }
};
