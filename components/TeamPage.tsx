
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { Users, BarChart3, TrendingUp, MoreHorizontal, UserPlus, Shield, User, PieChart, CheckCircle2, AlertCircle, Clock, ArrowUpRight, X, Mail, Briefcase, ChevronRight, Settings, Trash2, Check } from 'lucide-react';
import { Task, TeamMember, UserRole } from '../types';
import { PriorityChart } from './VisualAnalytics';
import { TaskList } from './TaskList';
import { v4 as uuidv4 } from 'uuid';

interface TeamPageProps {
  tasks: Task[];
}

export const TeamPage: React.FC<TeamPageProps> = ({ tasks }) => {
  const { user, teamMembers, updateUser, addTeamMember, updateTeamMember, removeTeamMember } = useAppContext();
  const { t } = useTranslation();
  
  // Modals State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'member' as UserRole });
  
  // Member States
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // --- Analytics Logic ---
  const analytics = useMemo(() => {
    // 1. General Stats
    const totalTasks = tasks.length || 1; // avoid divide by zero
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = Math.round((completedTasks / totalTasks) * 100);
    const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status === 'pending').length;

    // 2. Member Performance
    const memberStats = teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignedTo === member.id);
      const mTotal = memberTasks.length;
      const mCompleted = memberTasks.filter(t => t.status === 'completed').length;
      const mPending = memberTasks.filter(t => t.status === 'pending').length;
      const mHigh = memberTasks.filter(t => t.priority === 'high' && t.status === 'pending').length;
      
      return {
        ...member,
        total: mTotal,
        completed: mCompleted,
        pending: mPending,
        highPriority: mHigh,
        rate: mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0
      };
    });

    // 3. Category Breakdown
    const categories: Record<string, number> = {};
    tasks.forEach(t => {
      const cat = t.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    const sortedCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4); // Top 4

    return { totalTasks, completedTasks, completionRate, highPriorityCount, memberStats, sortedCategories };
  }, [tasks, teamMembers]);

  // Tasks for the specific member being viewed
  const selectedMemberTasks = useMemo(() => {
    if (!viewingMember) return [];
    return tasks.filter(t => t.assignedTo === viewingMember.id);
  }, [tasks, viewingMember]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.name || !inviteData.email) return;

    const newMember: TeamMember = {
        id: uuidv4(),
        name: inviteData.name,
        email: inviteData.email,
        role: inviteData.role,
        avatar: `https://picsum.photos/seed/${inviteData.email}/100/100` // Deterministic random image
    };

    addTeamMember(newMember);
    setInviteData({ name: '', email: '', role: 'member' });
    setIsInviteModalOpen(false);
  };

  const handleRoleUpdate = (role: UserRole) => {
    if (editingMember) {
      updateTeamMember(editingMember.id, { role });
      setEditingMember(null);
    }
  };

  const handleDeleteMember = () => {
    if (editingMember) {
      if (confirm(`Are you sure you want to remove ${editingMember.name}?`)) {
        removeTeamMember(editingMember.id);
        setEditingMember(null);
      }
    }
  };

  // Gatekeeping for 'team' plan
  if (user.plan !== 'team' && user.plan !== 'pro') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in">
        <div className="p-6 bg-indigo-50 rounded-full mb-2">
          <Users size={48} className="text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">{t('team.title')}</h2>
        <p className="text-slate-500 max-w-md text-lg">{t('team.no_access')}</p>
        <button 
          onClick={() => updateUser({ plan: 'team' })} 
          className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:scale-105"
        >
          Upgrade to Team
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {t('team.title')}
            <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider font-bold">Admin View</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Shield size={14} className="text-indigo-500"/>
            {user.workspaceName || 'My Workspace'}
          </p>
        </div>
        {user.role === 'admin' && (
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-slate-900 dark:bg-slate-800 text-white px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-md active:scale-95"
          >
            <UserPlus size={18} />
            <span className="font-medium">{t('team.invite')}</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={60} className="text-emerald-500" />
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('team.velocity')}</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{analytics.completionRate}%</div>
          <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            <ArrowUpRight size={12} className="mr-1" /> +12% vs last week
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={60} className="text-blue-500" />
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Workload</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{analytics.totalTasks} <span className="text-sm font-normal text-slate-400">tasks</span></div>
          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
            Across {teamMembers.length} active members
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle size={60} className="text-rose-500" />
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Critical Blockers</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">{analytics.highPriorityCount}</div>
          <div className="flex items-center text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
            High priority pending items
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieChart size={60} className="text-purple-500" />
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Top Category</div>
          <div className="text-3xl font-bold text-slate-800 dark:text-white truncate capitalize">
            {analytics.sortedCategories[0]?.[0] || 'None'}
          </div>
          <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
            {analytics.sortedCategories[0]?.[1] || 0} active tasks
          </div>
        </div>
      </section>

      {/* Admin Deep Dive Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Workload Balance Chart */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-500" />
              Team Workload & Performance
            </h3>
            <select className="text-xs border-none bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg py-1 px-2 focus:ring-0 cursor-pointer hover:text-indigo-600">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="space-y-6">
            {analytics.memberStats.map(member => (
              <div key={member.id}>
                <div className="flex justify-between items-center mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <img src={member.avatar} alt="" className="w-6 h-6 rounded-full" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">{member.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                     <span className="text-slate-400">{member.completed} Done</span>
                     <span className="text-slate-400">/</span>
                     <span className="font-medium text-indigo-600 dark:text-indigo-400">{member.pending} Pending</span>
                  </div>
                </div>
                
                {/* Custom Stacked Bar */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  {/* Completed Segment */}
                  <div 
                    className="bg-emerald-400 h-full" 
                    style={{ width: `${(member.completed / (member.total || 1)) * 100}%` }}
                  ></div>
                  {/* Pending Segment */}
                  <div 
                    className="bg-indigo-500 h-full"
                    style={{ width: `${(member.pending / (member.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Task Composition */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
            <PieChart size={20} className="text-purple-500" />
            Task Composition
          </h3>

          <div className="flex-1 flex items-center justify-center min-h-[200px]">
             {/* D3 Donut Chart replacing static CSS bars */}
             <PriorityChart tasks={tasks} />
          </div>
        </section>
      </div>

      {/* Member Management List */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Users size={20} className="text-slate-400" />
             {t('team.members')}
           </h3>
           <span className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded">
             {teamMembers.length} Active Users
           </span>
        </div>
        <div>
          {analytics.memberStats.map((member) => (
            <div 
              key={member.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0 gap-4 sm:gap-0 cursor-pointer group"
              onClick={() => setViewingMember(member)}
            >
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-600 shadow-sm" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-600 ${member.highPriority > 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} title={member.highPriority > 2 ? "Heavy Load" : "Healthy Load"}></div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                    {member.name}
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-normal opacity-0 group-hover:opacity-100 transition-opacity">View Tasks</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    {member.email} 
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className={member.rate > 80 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}>{member.rate}% Completion Rate</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end sm:space-x-6 w-full sm:w-auto">
                 {/* Mini Stats for Admin Context */}
                 <div className="flex items-center gap-4 mr-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-400 uppercase">Pending</div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">{member.pending}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400 uppercase">High Prio</div>
                      <div className={`font-bold ${member.highPriority > 0 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{member.highPriority}</div>
                    </div>
                 </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center space-x-1 ${
                    member.role === 'admin' 
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                  }`}>
                    {member.role === 'admin' && <Shield size={10} />}
                    <span>{member.role === 'admin' ? t('team.role_admin') : t('team.role_member')}</span>
                  </span>
                  
                  {user.role === 'admin' && user.id !== member.id && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); setEditingMember(member); }}
                       className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                       title="Manage Member"
                     >
                       <MoreHorizontal size={18} />
                     </button>
                  )}
                  {/* Chevron only shown if not admin or if it is the user themselves (no edit button) to indicate clickable row */}
                  {!(user.role === 'admin' && user.id !== member.id) && (
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
               <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <UserPlus className="text-indigo-500" size={20} />
                 Invite Team Member
               </h3>
               <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                 <X size={24} />
               </button>
             </div>

             <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                 <input 
                   type="text" 
                   required
                   value={inviteData.name}
                   onChange={e => setInviteData({...inviteData, name: e.target.value})}
                   className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
                   placeholder="e.g. Jane Doe"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                 <div className="relative">
                   <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                   <input 
                     type="email" 
                     required
                     value={inviteData.email}
                     onChange={e => setInviteData({...inviteData, email: e.target.value})}
                     className="w-full p-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
                     placeholder="jane@company.com"
                   />
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                 <div className="grid grid-cols-2 gap-3">
                   <button
                     type="button"
                     onClick={() => setInviteData({...inviteData, role: 'member'})}
                     className={`p-3 rounded-xl border text-sm font-medium transition-all ${inviteData.role === 'member' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                   >
                     Member
                   </button>
                   <button
                     type="button"
                     onClick={() => setInviteData({...inviteData, role: 'admin'})}
                     className={`p-3 rounded-xl border text-sm font-medium transition-all ${inviteData.role === 'admin' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                   >
                     Admin
                   </button>
                 </div>
               </div>

               <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                  >
                    Send Invite
                  </button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingMember && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
             <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Settings className="text-indigo-500" size={18} />
                 Manage Member
               </h3>
               <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                 <X size={20} />
               </button>
             </div>

             <div className="p-6">
               <div className="flex items-center gap-3 mb-6">
                 <img src={editingMember.avatar} alt="" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" />
                 <div>
                   <div className="font-bold text-slate-800 dark:text-white">{editingMember.name}</div>
                   <div className="text-xs text-slate-500">{editingMember.email}</div>
                 </div>
               </div>

               <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assign Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleRoleUpdate('member')}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${editingMember.role === 'member' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}
                      >
                        <User size={20} className={editingMember.role === 'member' ? 'text-indigo-500' : 'text-slate-400'} />
                        Member
                        {editingMember.role === 'member' && <Check size={12} className="text-indigo-500" />}
                      </button>
                      <button
                        onClick={() => handleRoleUpdate('admin')}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${editingMember.role === 'admin' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}
                      >
                        <Shield size={20} className={editingMember.role === 'admin' ? 'text-purple-500' : 'text-slate-400'} />
                        Admin
                        {editingMember.role === 'admin' && <Check size={12} className="text-purple-500" />}
                      </button>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={handleDeleteMember}
                      className="w-full py-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Trash2 size={16} />
                      Remove from Team
                    </button>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* View Member Tasks Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                 <div className="flex items-center gap-4">
                    <img src={viewingMember.avatar} alt="" className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700" />
                    <div>
                       <h3 className="text-xl font-bold text-slate-800 dark:text-white">{viewingMember.name}</h3>
                       <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Briefcase size={14} />
                          <span>Assigned Tasks</span>
                          <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 rounded text-xs font-bold">{selectedMemberTasks.length}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setViewingMember(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                   <X size={24} />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/30">
                 <TaskList 
                   tasks={selectedMemberTasks} 
                   onTaskUpdate={() => {}} // Read-only view for admin context roughly, or could pass prop to allow edit
                   filter="all" 
                 />
                 {selectedMemberTasks.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                      <CheckCircle2 size={48} className="mb-4 opacity-20" />
                      <p>No tasks assigned to {viewingMember.name.split(' ')[0]}.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
