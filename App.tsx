
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TasksPage } from './components/TasksPage';
import { AutomationsPage } from './components/AutomationsPage';
import { SettingsPage } from './components/SettingsPage';
import { TeamPage } from './components/TeamPage';
import { AuthPage } from './components/AuthPage';
import { Task, AutomationRule, UserStats, AppNotification, TriggerType } from './types';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { runAutomations } from './services/automationEngine';
import { soundService } from './services/soundService';

// Mock initial data
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

const INITIAL_NOTIFICATIONS: AppNotification[] = [
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

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  // Load tasks from local storage or fallback to initial
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('flowpilot_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // Load automations from local storage or fallback
  const [automations, setAutomations] = useState<AutomationRule[]>(() => {
    const saved = localStorage.getItem('flowpilot_automations');
    return saved ? JSON.parse(saved) : INITIAL_AUTOMATIONS;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  
  const { isAuthenticated, user } = useAppContext();

  // Persist Data
  useEffect(() => {
    localStorage.setItem('flowpilot_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('flowpilot_automations', JSON.stringify(automations));
  }, [automations]);

  // --- AUTOMATION ENGINE INTEGRATION ---

  const handleAutomationExecution = useCallback((result: { updatedTasks: Task[], newNotifications: AppNotification[], triggeredRules: string[] }) => {
    // 1. Update Tasks if changed
    if (result.updatedTasks !== tasks) {
      setTasks(result.updatedTasks);
    }
    
    // 2. Add Notifications
    if (result.newNotifications.length > 0) {
      setNotifications(prev => [...result.newNotifications, ...prev]);
      
      // Sound Alert Logic
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

  // Timer for Overdue Checks (every 60s)
  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate new state based on current tasks and rules
      const result = runAutomations(tasks, automations, 'ON_OVERDUE');
      handleAutomationExecution(result);
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks, automations, handleAutomationExecution]);


  // Task Management Wrappers
  const addTask = (newTask: Task) => {
    // 1. Add Task
    const newTaskList = [newTask, ...tasks];
    setTasks(newTaskList);
    
    // 2. Run 'Create' Automations
    const result = runAutomations(newTaskList, automations, 'ON_CREATE', newTask);
    const result2 = runAutomations(result.updatedTasks, automations, 'KEYWORD_MATCH', newTask);
    
    // Merge results
    handleAutomationExecution({
      updatedTasks: result2.updatedTasks,
      newNotifications: [...result.newNotifications, ...result2.newNotifications],
      triggeredRules: [...result.triggeredRules, ...result2.triggeredRules]
    });
  };

  const updateTask = (updatedTask: Task) => {
    // 1. Update List
    const newTaskList = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTaskList);

    // 2. Run 'Complete' Automations & Sound
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

  // Stats Calculation with Viral Streak Logic
  const completedToday = tasks.filter(t => t.status === 'completed' && new Date(t.dueDate).toDateString() === new Date().toDateString()).length;
  
  // Fake Streak Logic for Demo (increments if task done)
  const streak = completedToday > 0 ? 5 : 4; 

  const stats: UserStats = {
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedToday,
    highPriority: tasks.filter(t => t.status === 'pending' && t.priority === 'high').length,
    productivityScore: 78,
    streak
  };

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" replace />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard 
                  tasks={tasks} 
                  stats={stats} 
                  notifications={notifications}
                  onTaskUpdate={updateTask}
                  onTaskAdd={addTask}
                  onNotificationDismiss={markNotificationRead}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <Layout>
                <TasksPage 
                  tasks={tasks} 
                  onTaskUpdate={updateTask}
                  onTaskAdd={addTask}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/automations" 
          element={
            <ProtectedRoute>
              <Layout>
                <AutomationsPage 
                  automations={automations} 
                  onToggle={toggleAutomation} 
                  onAdd={addAutomationRule}
                  onDelete={deleteAutomation}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/team" 
          element={
            <ProtectedRoute>
              <Layout>
                <TeamPage tasks={tasks} />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
