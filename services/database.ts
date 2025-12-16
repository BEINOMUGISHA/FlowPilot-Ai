
import { supabase } from './supabaseClient';
import { Task, AutomationRule, AppNotification } from '../types';

// Mappers to convert between App types (camelCase) and DB columns (snake_case)

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

// --- API Service ---

export const DB = {
  tasks: {
    fetchAll: async (userId: string): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return (data || []).map(mapTaskFromDB);
    },
    create: async (task: Task, userId: string) => {
      const { error } = await supabase.from('tasks').insert(mapTaskToDB(task, userId));
      if (error) throw error;
    },
    update: async (task: Task, userId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update(mapTaskToDB(task, userId))
        .eq('id', task.id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    }
  },

  automations: {
    fetchAll: async (userId: string): Promise<AutomationRule[]> => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      return (data || []).map(mapAutomationFromDB);
    },
    create: async (rule: AutomationRule, userId: string) => {
      const { error } = await supabase.from('automations').insert(mapAutomationToDB(rule, userId));
      if (error) throw error;
    },
    update: async (rule: AutomationRule, userId: string) => {
      const { error } = await supabase
        .from('automations')
        .update(mapAutomationToDB(rule, userId))
        .eq('id', rule.id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('automations').delete().eq('id', id);
      if (error) throw error;
    }
  },

  notifications: {
    fetchAll: async (userId: string): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
        
      if (error) throw error;
      return (data || []).map(mapNotificationFromDB);
    },
    create: async (note: AppNotification, userId: string) => {
      const { error } = await supabase.from('notifications').insert(mapNotificationToDB(note, userId));
      if (error) throw error;
    },
    update: async (note: AppNotification, userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update(mapNotificationToDB(note, userId))
        .eq('id', note.id);
      if (error) throw error;
    }
  }
};
