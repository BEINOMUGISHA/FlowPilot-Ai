
import React, { useEffect, useState } from 'react';
import { Task, UserStats, AppNotification } from '../types';
import { SmartTaskCapture } from './SmartTaskCapture';
import { TaskList } from './TaskList';
import { FocusGauge } from './FocusGauge';
import { PriorityChart, CategoryChart } from './VisualAnalytics';
import { suggestDailyPlan } from '../services/geminiService';
import { Sparkles, ArrowRight, Activity, CheckCircle2, Clock, Mail, MessageSquare, Bell, Check, Inbox, PieChart, BarChart3, Share2, Flame, X, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { useAppContext } from '../contexts/AppContext';

interface DashboardProps {
  tasks: Task[];
  stats: UserStats;
  notifications?: AppNotification[];
  onTaskUpdate: (task: Task) => void;
  onTaskAdd: (task: Task) => void;
  onNotificationDismiss?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, 
  stats, 
  notifications = [], 
  onTaskUpdate, 
  onTaskAdd,
  onNotificationDismiss 
}) => {
  const [dailyTip, setDailyTip] = useState<string>("Analyzing your schedule...");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { t } = useTranslation();
  const { user } = useAppContext();
  
  useEffect(() => {
    // Generate AI Tip
    const taskTitles = tasks.filter(t => t.status === 'pending').map(t => t.title);
    suggestDailyPlan(taskTitles).then(setDailyTip);
  }, [tasks]);

  const highPriorityTasks = tasks
    .filter(t => t.status === 'pending' && t.priority === 'high')
    .slice(0, 3);

  const pendingTasks = tasks.filter(t => t.status === 'pending');

  const getSourceIcon = (type: string, source: string) => {
    if (type === 'email') return <Mail size={14} className="text-white" />;
    if (source === 'Slack' || type === 'social') return <MessageSquare size={14} className="text-white" />;
    return <Bell size={14} className="text-white" />;
  };

  const getSourceColor = (type: string, source: string) => {
    if (type === 'email') return 'bg-blue-500';
    if (source === 'Slack') return 'bg-purple-500';
    if (source === 'LinkedIn') return 'bg-sky-700';
    return 'bg-slate-500';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Section: Capture & Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Task Input & AI Insight */}
        <div className="lg:col-span-2 space-y-6">
          <section className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              {t('dash.mind')}
            </h2>
             {/* Viral Streak Badge */}
             <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800/30">
               <Flame size={18} className="text-orange-500 fill-orange-500 animate-pulse" />
               <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{stats.streak} Day Streak</span>
             </div>
          </section>
          
          <SmartTaskCapture onTaskAdded={onTaskAdd} />

          {/* AI Daily Plan Card - "Deep Focus" Theme */}
          <div className="bg-gradient-to-r from-violet-800 to-fuchsia-900 rounded-2xl p-6 text-white shadow-xl shadow-violet-200 dark:shadow-violet-900/20 relative overflow-hidden group">
            {/* Animated Glow Effect */}
            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/20 transition-all duration-700"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-3 text-violet-200">
                <Sparkles size={18} className="text-fuchsia-300" />
                <span className="text-xs font-bold uppercase tracking-widest">{t('dash.plan')}</span>
              </div>
              <p className="text-xl font-medium leading-relaxed drop-shadow-sm">
                "{dailyTip}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Stats & Unified Inbox */}
        <div className="space-y-6">
          
          {/* Productivity Gauge & Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
            
            {/* Share Button (Viral Feature) */}
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Share Stats"
            >
              <Share2 size={18} />
            </button>

            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-6 self-start flex items-center gap-2">
               <Activity size={18} className="text-indigo-500" />
               {t('dash.productivity')}
            </h3>
            <FocusGauge score={stats.productivityScore} />
            
            <div className="mt-8 w-full grid grid-cols-2 gap-4 text-center">
              {/* Done */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <div className="text-2xl font-extrabold text-slate-800 dark:text-emerald-100">{stats.completedToday}</div>
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{t('dash.done')}</div>
              </div>

              {/* Pending */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <div className="text-2xl font-extrabold text-slate-800 dark:text-blue-100">{stats.pendingTasks}</div>
                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">{t('dash.pending')}</div>
              </div>
            </div>
          </div>

          {/* Unified Inbox Widget */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-lg overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                <Inbox size={16} className="text-indigo-500" />
                {t('dash.inbox')}
              </h3>
              <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <p>All caught up!</p>
                </div>
              ) : (
                notifications.map(note => (
                  <div key={note.id} className="group flex items-start p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors relative">
                    <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${getSourceColor(note.type, note.source)} shadow-sm`}>
                      {getSourceIcon(note.type, note.source)}
                    </div>
                    
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 block">{note.source}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(note.timestamp), { addSuffix: true }).replace('about ', '')}
                        </span>
                      </div>
                      <h4 className={`text-sm font-semibold text-slate-800 dark:text-slate-200 truncate ${note.read ? 'font-normal text-slate-500' : ''}`}>
                        {note.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{note.message}</p>
                    </div>

                    {/* Hover Action */}
                    {onNotificationDismiss && (
                      <button 
                        onClick={() => onNotificationDismiss(note.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-800 shadow-md rounded-full text-slate-400 hover:text-emerald-500 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Analytics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center">
           <h3 className="w-full text-slate-800 dark:text-white font-bold mb-4 flex items-center gap-2">
             <PieChart size={20} className="text-indigo-500" />
             Workload Distribution
           </h3>
           <div className="w-full flex-1 flex items-center justify-center min-h-[250px]">
             <PriorityChart tasks={tasks} />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center">
           <h3 className="w-full text-slate-800 dark:text-white font-bold mb-4 flex items-center gap-2">
             <BarChart3 size={20} className="text-indigo-500" />
             Tasks by Category
           </h3>
           <div className="w-full flex-1 flex items-center justify-center min-h-[250px]">
             <CategoryChart tasks={tasks} />
           </div>
        </div>
      </section>

      {/* Main Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* High Priority - Alert Theme */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                 <Activity size={18} />
              </div>
              {t('dash.highPriority')}
            </h3>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-900/30">
              {highPriorityTasks.length} Urgent
            </span>
          </div>
          <TaskList 
            tasks={highPriorityTasks} 
            onTaskUpdate={onTaskUpdate} 
          />
          {highPriorityTasks.length === 0 && (
             <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 text-sm">
               <span className="block mb-2 text-2xl">🎉</span>
               No urgent tasks. Great job!
             </div>
          )}
        </div>

        {/* All Pending - Work Theme */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                 <Clock size={18} />
              </div>
              {t('dash.upNext')}
            </h3>
            <button className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors">
              {t('dash.viewAll')} <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <TaskList 
            tasks={pendingTasks.filter(t => t.priority !== 'high').slice(0, 4)} 
            onTaskUpdate={onTaskUpdate} 
          />
        </div>
      </div>

      {/* Share/Viral Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-indigo-500/20">
             <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-8 text-center text-white">
                <button 
                  onClick={() => setIsShareModalOpen(false)} 
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner border border-white/30">
                  <Trophy size={40} className="text-yellow-300 drop-shadow-md" />
                </div>
                
                <h3 className="text-2xl font-black uppercase tracking-tight mb-1">Daily Flow</h3>
                <p className="text-indigo-100 font-medium">FlowPilot Summary</p>
             </div>

             <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats.completedToday}</div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tasks Done</div>
                   </div>
                   <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="text-3xl font-black text-orange-500">{stats.streak}</div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Day Streak</div>
                   </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                   <div className="flex items-center gap-3">
                     <img src={user?.avatar} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800" alt="User" />
                     <div className="text-left">
                       <div className="font-bold text-slate-800 dark:text-white text-sm">{user?.name}</div>
                       <div className="text-xs text-indigo-500 font-medium">Top 10% Productivity</div>
                     </div>
                   </div>
                   <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.productivityScore}</div>
                </div>

                <button className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2">
                  <Share2 size={20} /> Share to Story
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
