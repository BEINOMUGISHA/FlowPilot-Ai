
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TasksPage } from './components/TasksPage';
import { AutomationsPage } from './components/AutomationsPage';
import { SettingsPage } from './components/SettingsPage';
import { TeamPage } from './components/TeamPage';
import { AuthPage } from './components/AuthPage';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { useAppLogic } from './hooks/useAppLogic';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAppContext();
  
  // Use the custom hook to access "backend" logic and state
  const { 
    tasks, 
    automations, 
    notifications, 
    stats, 
    addTask, 
    updateTask, 
    addAutomationRule, 
    toggleAutomation, 
    deleteAutomation, 
    markNotificationRead 
  } = useAppLogic();

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
