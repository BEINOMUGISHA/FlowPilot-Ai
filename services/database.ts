
import { Task, AutomationRule, AppNotification } from '../types';

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Review quarterly financial report',
    status: 'pending',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    category: 'Finance',
    source: 'email',
    aiConfidence: 0.95,
    assignedTo: 'u1'
  },
  {
    id: '2',
    title: 'Call Sarah about the marketing assets',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date().toISOString(),
    category: 'Marketing',
    source: 'voice',
    aiConfidence: 0.88,
    assignedTo: 'u2'
  },
  {
    id: '3',
    title: 'Update software license keys',
    status: 'completed',
    priority: 'low',
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    category: 'IT',
    source: 'manual',
    aiConfidence: 1.0,
    assignedTo: 'u1'
  }
];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: '1',
    name: 'Urgent Client Tasks',
    description: 'Mark tasks with "Client" as High Priority',
    triggerType: 'KEYWORD_MATCH',
    triggerCondition: 'Client',
    actionType: 'SET_PRIORITY',
    actionTarget: 'high',
    active: true,
    executionCount: 12,
    lastRun: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    name: 'Overdue Watchdog',
    description: 'Notify me when tasks are overdue',
    triggerType: 'ON_OVERDUE',
    actionType: 'NOTIFY',
    actionTarget: 'You have overdue tasks pending review.',
    active: true,
    executionCount: 5
  },
  {
    id: '3',
    name: 'Celebrate Wins',
    description: 'Send a notification when a task is completed',
    triggerType: 'ON_COMPLETE',
    actionType: 'NOTIFY',
    actionTarget: 'Great job completing a task! 🚀',
    active: true,
    executionCount: 45
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { 
    id: '1', 
    type: 'email', 
    source: 'Gmail', 
    title: 'New Contract Proposal', 
    message: 'Attached is the revised contract for Q4...', 
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), 
    read: false, 
    priority: 'high' 
  },
  { 
    id: '2', 
    type: 'social', 
    source: 'Slack', 
    title: 'Mention in #general', 
    message: 'Sarah: @Alex did you see the latest metrics?', 
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), 
    read: false 
  },
  { 
    id: '3', 
    type: 'system', 
    source: 'System', 
    title: 'Update Available', 
    message: 'FlowPilot v2.1 is ready to install.', 
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), 
    read: false 
  }
];

export const DB = {
  tasks: {
    load: (): Task[] => {
      try {
        const saved = localStorage.getItem('flowpilot_tasks');
        return saved ? JSON.parse(saved) : INITIAL_TASKS;
      } catch (e) {
        console.error("Failed to load tasks", e);
        return INITIAL_TASKS;
      }
    },
    save: (tasks: Task[]) => localStorage.setItem('flowpilot_tasks', JSON.stringify(tasks))
  },
  automations: {
    load: (): AutomationRule[] => {
      try {
        const saved = localStorage.getItem('flowpilot_automations');
        return saved ? JSON.parse(saved) : INITIAL_AUTOMATIONS;
      } catch (e) {
        return INITIAL_AUTOMATIONS;
      }
    },
    save: (rules: AutomationRule[]) => localStorage.setItem('flowpilot_automations', JSON.stringify(rules))
  },
  notifications: {
     load: (): AppNotification[] => {
        try {
          const saved = localStorage.getItem('flowpilot_notifications');
          return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
        } catch (e) {
          return INITIAL_NOTIFICATIONS;
        }
     },
     save: (notes: AppNotification[]) => localStorage.setItem('flowpilot_notifications', JSON.stringify(notes))
  }
};
