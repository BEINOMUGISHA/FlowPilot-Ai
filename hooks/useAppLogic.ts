
import { useState, useEffect, useCallback } from 'react';
import { Task, AutomationRule, AppNotification, UserStats } from '../types';
import { DB } from '../services/database';
import { runAutomations } from '../services/automationEngine';
import { soundService } from '../services/soundService';
import { useAppContext } from '../contexts/AppContext';

export const useAppLogic = () => {
  const { user } = useAppContext();
  
  // Initialize State (Empty, then fetched)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Data on User Change
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setTasks([]);
        setAutomations([]);
        setNotifications([]);
        return;
      }

      setLoading(true);
      try {
        const [loadedTasks, loadedRules, loadedNotes] = await Promise.all([
          DB.tasks.fetchAll(user.id),
          DB.automations.fetchAll(user.id),
          DB.notifications.fetchAll(user.id)
        ]);
        setTasks(loadedTasks);
        setAutomations(loadedRules);
        setNotifications(loadedNotes);
      } catch (e) {
        console.error("Failed to load app data", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // --- Automation Logic ---
  const handleAutomationExecution = useCallback(async (result: { updatedTasks: Task[], newNotifications: AppNotification[], triggeredRules: string[] }) => {
    // 1. Update Tasks locally and in DB
    // Note: Diffing tasks to find which to update is complex here.
    // For simplicity in this adaptation, we will rely on individual task updates triggering automations.
    // However, the automation engine might modify multiple tasks.
    // We will update local state immediately and assume the 'engine' only touched specific tasks, or batch update.
    // Given Supabase usage, batch updates are trickier. 
    // We will update local state for UI responsiveness. DB sync for automations is handled best by backend triggers, 
    // but here we will just sync the specific changes if possible or assume optimistic UI is enough for now.
    
    // In this specific flow, runAutomations returns a NEW array. We set that to state.
    // BUT we need to persist these changes.
    // Ideally, automation logic should call `updateTask` wrapper.
    // For now, let's just update local state to reflect automation outcome in UI.
    if (result.updatedTasks !== tasks) {
      setTasks(result.updatedTasks);
      
      // Persist changes? This is the hard part of client-side automation + DB.
      // We'll iterate and update modified tasks.
      const modifiedTasks = result.updatedTasks.filter(t => {
        const original = tasks.find(ot => ot.id === t.id);
        return original && JSON.stringify(original) !== JSON.stringify(t);
      });
      
      if (user) {
         modifiedTasks.forEach(t => DB.tasks.update(t, user.id).catch(console.error));
      }
    }
    
    // 2. Add Notifications
    if (result.newNotifications.length > 0) {
      setNotifications(prev => [...result.newNotifications, ...prev]);
      if (user) {
         result.newNotifications.forEach(n => DB.notifications.create(n, user.id).catch(console.error));
      }
      
      if (user?.soundEnabled) {
         soundService.playNotification();
      }
    }

    // 3. Update Rule Stats
    if (result.triggeredRules.length > 0) {
      const updatedRules = automations.map(rule => {
        if (result.triggeredRules.includes(rule.id)) {
          return {
            ...rule,
            lastRun: new Date().toISOString(),
            executionCount: rule.executionCount + 1
          };
        }
        return rule;
      });
      setAutomations(updatedRules);
      
      if (user) {
        updatedRules
          .filter(r => result.triggeredRules.includes(r.id))
          .forEach(r => DB.automations.update(r, user.id).catch(console.error));
      }
    }
  }, [tasks, automations, user]); 

  // Timer for Overdue Checks
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const result = runAutomations(tasks, automations, 'ON_OVERDUE');
      handleAutomationExecution(result);
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks, automations, handleAutomationExecution, user]);

  // --- Public API (Controllers) ---

  const addTask = async (newTask: Task) => {
    if (!user) return;
    // Optimistic Update
    const newTaskList = [newTask, ...tasks];
    setTasks(newTaskList);
    
    try {
      await DB.tasks.create(newTask, user.id);
      
      // Trigger Automations
      const result = runAutomations(newTaskList, automations, 'ON_CREATE', newTask);
      const result2 = runAutomations(result.updatedTasks, automations, 'KEYWORD_MATCH', newTask);
      
      handleAutomationExecution({
        updatedTasks: result2.updatedTasks,
        newNotifications: [...result.newNotifications, ...result2.newNotifications],
        triggeredRules: [...result.triggeredRules, ...result2.triggeredRules]
      });
    } catch (e) {
      console.error("Error creating task", e);
      // Rollback? setTasks(tasks)
    }
  };

  const updateTask = async (updatedTask: Task) => {
    if (!user) return;
    const newTaskList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTaskList);

    try {
        await DB.tasks.update(updatedTask, user.id);

        if (updatedTask.status === 'completed') {
           if (user.soundEnabled) {
             soundService.playSuccess();
           }
           const result = runAutomations(newTaskList, automations, 'ON_COMPLETE', updatedTask);
           handleAutomationExecution(result);
        }
    } catch (e) {
        console.error("Error updating task", e);
    }
  };

  const addAutomationRule = async (rule: AutomationRule) => {
    if (!user) return;
    setAutomations(prev => [rule, ...prev]);
    try {
      await DB.automations.create(rule, user.id);
    } catch(e) { console.error(e); }
  };

  const toggleAutomation = async (id: string) => {
    if (!user) return;
    const rule = automations.find(a => a.id === id);
    if (!rule) return;
    
    const updatedRule = { ...rule, active: !rule.active };
    setAutomations(prev => prev.map(a => a.id === id ? updatedRule : a));
    
    try {
      await DB.automations.update(updatedRule, user.id);
    } catch(e) { console.error(e); }
  };
  
  const deleteAutomation = async (id: string) => {
    if (!user) return;
    setAutomations(prev => prev.filter(a => a.id !== id));
    try {
      await DB.automations.delete(id);
    } catch(e) { console.error(e); }
  };

  const markNotificationRead = async (id: string) => {
    if (!user) return;
    const note = notifications.find(n => n.id === id);
    if (note) {
        // Optimistic delete/read
        setNotifications(prev => prev.filter(n => n.id !== id));
        // If we just want to mark read:
        // const updated = { ...note, read: true };
        // setNotifications(prev => prev.map(n => n.id === id ? updated : n));
        // await DB.notifications.update(updated, user.id);
        
        // App logic was "dismiss" (delete from view), so let's maybe assume delete or mark read?
        // Layout uses "markNotificationRead" but implementation was filter out. 
        // We'll update DB to read=true or delete. Let's do update read=true for persistence sake, but remove from UI list.
        try {
            await DB.notifications.update({ ...note, read: true }, user.id);
        } catch(e) { console.error(e); }
    }
  };

  // Stats Logic
  const getStats = (): UserStats => {
    const completedToday = tasks.filter(t => t.status === 'completed' && new Date(t.dueDate).toDateString() === new Date().toDateString()).length;
    // Streak simulation (could fetch from DB if we tracked history)
    const streak = completedToday > 0 ? 5 : 4; 

    return {
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        completedToday,
        highPriority: tasks.filter(t => t.status === 'pending' && t.priority === 'high').length,
        productivityScore: 78, // Placeholder
        streak
    };
  };

  return {
    tasks,
    automations,
    notifications,
    stats: getStats(),
    addTask,
    updateTask,
    addAutomationRule,
    toggleAutomation,
    deleteAutomation,
    markNotificationRead,
    loading
  };
};
