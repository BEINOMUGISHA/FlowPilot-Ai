
import React, { useState } from 'react';
import { Task } from '../types';
import { TaskList } from './TaskList';
import { SmartTaskCapture } from './SmartTaskCapture';
import { useAppContext } from '../contexts/AppContext';
import { User, Users } from 'lucide-react';

interface TasksPageProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskAdd: (task: Task) => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ tasks, onTaskUpdate, onTaskAdd }) => {
  const { user } = useAppContext();
  const [viewFilter, setViewFilter] = useState<'my' | 'all'>('my');

  // Filter tasks based on selection
  const displayTasks = tasks.filter(t => {
    if (viewFilter === 'my') {
      return t.assignedTo === user?.id;
    }
    return true; // 'all'
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Task Manager</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage, capture, and submit your daily operations.</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex shadow-sm">
           <button 
             onClick={() => setViewFilter('my')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
               viewFilter === 'my' 
                 ? 'bg-indigo-600 text-white shadow-md' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
             }`}
           >
             <User size={16} />
             My Roles
           </button>
           <button 
             onClick={() => setViewFilter('all')}
             className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
               viewFilter === 'all' 
                 ? 'bg-indigo-600 text-white shadow-md' 
                 : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
             }`}
           >
             <Users size={16} />
             Team Tasks
           </button>
        </div>
      </div>

      <SmartTaskCapture onTaskAdded={onTaskAdd} />

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-1">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
           <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
             {viewFilter === 'my' ? 'Assigned to Me' : 'All Team Tasks'}
           </span>
           <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 font-bold">
             {displayTasks.length}
           </span>
        </div>
        <TaskList tasks={displayTasks} onTaskUpdate={onTaskUpdate} filter="all" />
      </div>
    </div>
  );
};
