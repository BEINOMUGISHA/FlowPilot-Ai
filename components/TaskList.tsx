
import React from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Calendar, Flag, Tag, User, ArrowUp } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useAppContext } from '../contexts/AppContext';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  filter?: 'today' | 'all' | 'pending';
}

export const TaskList: React.FC<TaskListProps> = React.memo(({ tasks, onTaskUpdate, filter = 'all' }) => {
  const { teamMembers } = useAppContext();

  // Color Mapping
  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'high': return { 
        border: 'border-l-rose-500', 
        tag: 'text-rose-700 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30',
        icon: 'text-rose-500'
      };
      case 'medium': return { 
        border: 'border-l-amber-500', 
        tag: 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
        icon: 'text-amber-500'
      };
      case 'low': return { 
        border: 'border-l-blue-400', 
        tag: 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        icon: 'text-slate-400'
      };
      default: return { 
        border: 'border-l-slate-300 dark:border-l-slate-600', 
        tag: 'text-slate-500 dark:text-slate-400',
        icon: 'text-slate-400'
      };
    }
  };

  const getAssigneeAvatar = (userId?: string) => {
    if (!userId) return null;
    const member = teamMembers.find(m => m.id === userId);
    return member ? member.avatar : null;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status === 'pending';
    return true;
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">
        <p className="text-slate-400 font-medium">No tasks found. Enjoy your day!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task) => {
        const style = getPriorityStyle(task.priority);
        const taskDate = new Date(task.dueDate);
        const isDateValid = isValid(taskDate);

        return (
          <div 
            key={task.id}
            className={`
              group relative flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-l-4 transition-all duration-200
              hover:shadow-md hover:translate-x-1
              ${style.border}
              ${task.status === 'completed' ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50 border-l-slate-300 dark:border-l-slate-600' : ''}
            `}
          >
            {/* Description Tooltip */}
            {task.description && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 pointer-events-none">
                <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg py-2 px-3 shadow-xl relative text-center">
                  {task.description}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"></div>
                </div>
              </div>
            )}

            <button
              onClick={() => onTaskUpdate({ ...task, status: task.status === 'completed' ? 'pending' : 'completed' })}
              className={`
                flex-shrink-0 mr-4 transition-all duration-200 transform active:scale-90
                ${task.status === 'completed' 
                  ? 'text-emerald-500' 
                  : 'text-slate-300 dark:text-slate-600 hover:text-emerald-500'}
              `}
              title={task.status === 'completed' ? "Mark incomplete" : "Mark complete"}
            >
              {task.status === 'completed' ? (
                <CheckCircle2 size={26} className="fill-emerald-50 dark:fill-emerald-900/20" />
              ) : (
                <Circle size={26} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold text-slate-800 dark:text-slate-200 truncate ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                {task.title}
              </h3>
              <div className="flex items-center mt-1.5 space-x-4 text-xs text-slate-500 dark:text-slate-400">
                <div className={`flex items-center space-x-1.5 ${isDateValid && taskDate < new Date() && task.status !== 'completed' ? 'text-rose-500 font-bold' : ''}`}>
                  <Calendar size={12} />
                  <span>{isDateValid ? format(taskDate, 'MMM d') : 'No date'}</span>
                </div>
                {task.category && (
                  <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                    <Tag size={10} />
                    <span>{task.category}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 ml-4">
               {/* Assignee Avatar */}
              {task.assignedTo && (
                <div className="hidden sm:block">
                  {getAssigneeAvatar(task.assignedTo) ? (
                    <img 
                      src={getAssigneeAvatar(task.assignedTo)!} 
                      alt="Assignee" 
                      className="w-6 h-6 rounded-full border border-white dark:border-slate-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                      <User size={12}/>
                    </div>
                  )}
                </div>
              )}
              
              <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border flex items-center gap-1 ${style.tag}`}>
                {task.priority === 'high' && <ArrowUp size={10} />}
                {task.priority}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});
