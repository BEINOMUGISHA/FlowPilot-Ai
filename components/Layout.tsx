
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Zap, Settings, Menu, X, Bell, Crown, Users, LogOut } from 'lucide-react';
import { OfflineBanner } from './OfflineBanner';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!user) return null;

  const navItems = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.tasks'), path: '/tasks', icon: CheckSquare },
    { name: t('nav.automations'), path: '/automations', icon: Zap },
    { name: t('nav.team'), path: '/team', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out safe-area-left shadow-2xl lg:shadow-none
        lg:relative lg:translate-x-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-20 px-8 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">FlowPilot</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                group flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 relative overflow-hidden
                ${isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-medium'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full transition-transform duration-200 ${isActive ? 'scale-y-100' : 'scale-y-0'}`}></div>
                  <item.icon size={22} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 safe-area-bottom">
          <NavLink 
            to="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3 rounded-2xl transition-colors font-medium
              ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
            `}
          >
            <Settings size={20} className="text-slate-400 dark:text-slate-500" />
            <span>{t('nav.settings')}</span>
          </NavLink>

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-2xl transition-colors text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 dark:hover:text-rose-400 font-medium group"
          >
            <LogOut size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-rose-500 dark:group-hover:text-rose-400" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
        {/* Offline Banner */}
        <OfflineBanner />

        {/* Top Header (Mobile & Desktop) */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-6 lg:px-10 z-30 sticky top-0 safe-area-top">
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 mr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">FlowPilot</h1>
          </div>

          <div className="flex-1 hidden lg:block">
            {/* Breadcrumb or Page Title Placeholder */}
          </div>

          <div className="flex items-center space-x-5">
             <div className="hidden md:flex flex-col items-end mr-1">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mt-0.5">{user.plan}</span>
            </div>
            {user.plan === 'pro' && (
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full ring-2 ring-amber-50 dark:ring-amber-900/10" title="Pro User">
                <Crown size={18} className="text-amber-500 fill-amber-500" />
              </div>
            )}
             {user.plan === 'team' && (
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full ring-2 ring-indigo-50 dark:ring-indigo-900/10" title="Team User">
                <Users size={18} className="text-indigo-500 fill-indigo-500" />
              </div>
            )}
            <button className="relative p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-md ring-1 ring-slate-200 dark:ring-slate-700">
               <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 safe-area-bottom scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
