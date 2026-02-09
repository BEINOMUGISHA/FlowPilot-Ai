
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, AutomationRule, AppNotification, UserStats } from '../types';
import { DB } from '../services/database';
import { runAutomations } from '../services/automationEngine';
import { soundService } from '../services/soundService';
import { useAppContext } from '../contexts/AppContext';

export const useAppLogic = () => {
  const { user } = useAppContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized Stats for Performance
  const stats = useMemo((): UserStats => {
    const today = new Date().toDateString();
    const completedToday = tasks.filter(t => t.status === 'completed' && new Date(t.dueDate).toDateString() === today).length;
    const pending = tasks.filter(t => t.status === 'pending');
    
    return {
      pendingTasks: pending.length,
      completedToday,
      highPriority: pending.filter(t => t.priority === 'high').length,
      productivityScore: Math.min(100, Math.round((completedToday / (tasks.length || 1)) * 100) + 20),
      streak: completedToday > 0 ? 5 : 4
    };
  }, [tasks]);

  // Initial Data Fetch
  useEffect(() => {
    if (!user) return;
    
    const init = async () => {
      setIsLoading(true);
      try {
        const [t, a, n] = await Promise.all([
          DB.tasks.fetchAll(user.id),
          DB.automations.fetchAll(user.id),
          DB.notifications.fetchAll(user.id)
        ]);
        setTasks(t);
        setAutomations(a);
        setNotifications(n);
      } catch (err) {
        console.error("Critical Sync Error", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user]);

  // Orchestrator for Automations (Side Effect Handler)
  const processAutomations = useCallback(async (trigger: string, task?: Task) => {
    if (!user) return;
    const result = runAutomations(tasks, automations, trigger as any, task);
    
    if (result.triggeredRules.length > 0) {
      // 1. Sync Notifications
      if (result.newNotifications.length > 0) {
        setNotifications(prev => [...result.newNotifications, ...prev]);
        result.newNotifications.forEach(n => DB.notifications.create(n, user.id));
        if (user.soundEnabled) soundService.playNotification();
      }

      // 2. Sync Automation Execution Stats
      const updatedRules = automations.map(r => {
        if (result.triggeredRules.includes(r.id)) {
          const u = { ...r, executionCount: r.executionCount + 1, lastRun: new Date().toISOString() };
          DB.automations.update(u, user.id);
          return u;
        }
        return r;
      });
      setAutomations(updatedRules);

      // 3. Sync Task Updates from Rules (e.g., auto-escalate priority)
      if (JSON.stringify(result.updatedTasks) !== JSON.stringify(tasks)) {
         setTasks(result.updatedTasks);
         result.updatedTasks.forEach(t => {
            const original = tasks.find(ot => ot.id === t.id);
            if (original && JSON.stringify(original) !== JSON.stringify(t)) {
                DB.tasks.update(t, user.id);
            }
         });
      }
    }
  }, [tasks, automations, user]);

  const addTask = async (newTask: Task) => {
    if (!user) return;
    setTasks(prev => [newTask, ...prev]); // Optimistic
    try {
      await DB.tasks.create(newTask, user.id);
      processAutomations('ON_CREATE', newTask);
      processAutomations('KEYWORD_MATCH', newTask);
    } catch (e) {
      setTasks(prev => prev.filter(t => t.id !== newTask.id)); // Rollback
    }
  };

  const updateTask = async (updatedTask: Task) => {
    if (!user) return;
    const original = tasks.find(t => t.id === updatedTask.id);
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    try {
      await DB.tasks.update(updatedTask, user.id);
      if (updatedTask.status === 'completed' && original?.status !== 'completed') {
        if (user.soundEnabled) soundService.playSuccess();
        processAutomations('ON_COMPLETE', updatedTask);
      }
    } catch (e) {
      if (original) setTasks(prev => prev.map(t => t.id === updatedTask.id ? original : t));
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!user) return;
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await DB.notifications.update({ id, read: true } as any, user.id);
    } catch (e) {
      // Silently fail or re-fetch on next load
    }
  };

  return {
    tasks,
    automations,
    notifications,
    stats,
    isLoading,
    addTask,
    updateTask,
    addAutomationRule: (r: AutomationRule) => {
      setAutomations(prev => [r, ...prev]);
      if (user) DB.automations.create(r, user.id);
    },
    toggleAutomation: (id: string) => {
      const rule = automations.find(a => a.id === id);
      if (!rule || !user) return;
      const u = { ...rule, active: !rule.active };
      setAutomations(prev => prev.map(a => a.id === id ? u : a));
      DB.automations.update(u, user.id);
    },
    deleteAutomation: (id: string) => {
      setAutomations(prev => prev.filter(a => a.id !== id));
      DB.automations.delete(id);
    },
    markNotificationRead
  };
};
