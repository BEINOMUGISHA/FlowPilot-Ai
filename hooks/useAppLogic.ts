
import { useState, useEffect, useCallback } from 'react';
import { Task, AutomationRule, AppNotification, UserStats } from '../types';
import { DB } from '../services/database';
import { runAutomations } from '../services/automationEngine';
import { soundService } from '../services/soundService';
import { useAppContext } from '../contexts/AppContext';

export const useAppLogic = () => {
  const { user } = useAppContext();
  
  // Initialize State from "Database"
  const [tasks, setTasks] = useState<Task[]>(DB.tasks.load);
  const [automations, setAutomations] = useState<AutomationRule[]>(DB.automations.load);
  const [notifications, setNotifications] = useState<AppNotification[]>(DB.notifications.load);

  // Persistence Effects (The "Write" to Database)
  useEffect(() => DB.tasks.save(tasks), [tasks]);
  useEffect(() => DB.automations.save(automations), [automations]);
  useEffect(() => DB.notifications.save(notifications), [notifications]);

  // --- Automation Logic ---
  const handleAutomationExecution = useCallback((result: { updatedTasks: Task[], newNotifications: AppNotification[], triggeredRules: string[] }) => {
    // 1. Update Tasks if changed
    if (result.updatedTasks !== tasks) {
      setTasks(result.updatedTasks);
    }
    
    // 2. Add Notifications
    if (result.newNotifications.length > 0) {
      setNotifications(prev => [...result.newNotifications, ...prev]);
      
      // Sound Alert Logic (Side Effect)
      if (user?.soundEnabled) {
         soundService.playNotification();
      }
    }

    // 3. Update Rule Stats (Last Run, Count)
    if (result.triggeredRules.length > 0) {
      setAutomations(prev => prev.map(rule => {
        if (result.triggeredRules.includes(rule.id)) {
          return {
            ...rule,
            lastRun: new Date().toISOString(),
            executionCount: rule.executionCount + 1
          };
        }
        return rule;
      }));
    }
  }, [tasks, user]); 

  // Timer for Overdue Checks (Background Job Simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      const result = runAutomations(tasks, automations, 'ON_OVERDUE');
      handleAutomationExecution(result);
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks, automations, handleAutomationExecution]);

  // --- Public API (Controllers) ---

  const addTask = (newTask: Task) => {
    const newTaskList = [newTask, ...tasks];
    setTasks(newTaskList);
    
    // Trigger "Backend" Processing
    const result = runAutomations(newTaskList, automations, 'ON_CREATE', newTask);
    const result2 = runAutomations(result.updatedTasks, automations, 'KEYWORD_MATCH', newTask);
    
    handleAutomationExecution({
      updatedTasks: result2.updatedTasks,
      newNotifications: [...result.newNotifications, ...result2.newNotifications],
      triggeredRules: [...result.triggeredRules, ...result2.triggeredRules]
    });
  };

  const updateTask = (updatedTask: Task) => {
    const newTaskList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTaskList);

    if (updatedTask.status === 'completed') {
       if (user?.soundEnabled) {
         soundService.playSuccess();
       }
       const result = runAutomations(newTaskList, automations, 'ON_COMPLETE', updatedTask);
       handleAutomationExecution(result);
    }
  };

  const addAutomationRule = (rule: AutomationRule) => {
    setAutomations(prev => [rule, ...prev]);
  };

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };
  
  const deleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Stats Logic (Read Model)
  const getStats = (): UserStats => {
    const completedToday = tasks.filter(t => t.status === 'completed' && new Date(t.dueDate).toDateString() === new Date().toDateString()).length;
    // Streak simulation
    const streak = completedToday > 0 ? 5 : 4; 

    return {
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        completedToday,
        highPriority: tasks.filter(t => t.status === 'pending' && t.priority === 'high').length,
        productivityScore: 78,
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
    markNotificationRead
  };
};
