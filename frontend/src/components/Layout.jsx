import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, FolderOpen, Sun, Moon, HelpCircle, User, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [hasNewResult, setHasNewResult] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Derive user initials from profile name
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const displayName = profile?.full_name ?? 'My Account';
  const displayRole = profile?.role ?? '';

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    const handleAiResult = () => {
      setHasNewResult(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    };
    window.addEventListener('aiResult', handleAiResult);

    // Close profile menu when clicking outside
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('aiResult', handleAiResult);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    setShowProfileMenu(false);
    
    // 1. Force-clear ALL Supabase auth tokens from localStorage to guarantee log out
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });

    // 2. Tell the server to kill the session (don't await it so we never hang)
    signOut().catch(err => console.error('Supabase signout failed:', err));

    // 3. Hard navigate immediately so React Router and React state fully reset
    window.location.href = '/login';
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDarkMode(true);
    }
  };
  return (
    <div className="bg-[var(--color-surface)] font-[var(--font-body)] text-[var(--color-on-surface)] min-h-screen flex">
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-[var(--color-surface-container-low)] border-r border-[var(--color-outline-variant)]/30 flex flex-col p-4 space-y-2 hidden md:flex">
        <div className="px-4 py-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-[var(--color-on-primary)] shadow-lg shadow-blue-900/20">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <div>
              <h1 className="font-[var(--font-headline)] font-bold text-[var(--color-on-surface)] leading-none">MediScan AI</h1>
              <p className="text-[10px] text-[var(--color-on-surface-variant)] font-medium uppercase tracking-wider mt-1">Clinical Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink to="/" end className={({isActive}) => `flex items-center gap-3 px-4 py-3 mb-1 rounded-lg font-medium transition-all duration-200 ${isActive ? 'bg-[var(--color-surface-container-highest)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]/50'}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/analysis" className={({isActive}) => `flex items-center gap-3 px-4 py-3 mb-1 rounded-lg font-medium transition-all duration-200 ${isActive ? 'bg-[var(--color-surface-container-highest)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]/50'}`}>
            <Activity size={20} />
            <span>AI Analysis</span>
          </NavLink>
          <NavLink to="/records" className={({isActive}) => `flex items-center gap-3 px-4 py-3 mb-1 rounded-lg font-medium transition-all duration-200 ${isActive ? 'bg-[var(--color-surface-container-highest)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]/50'}`}>
            <FolderOpen size={20} />
            <span>Records</span>
          </NavLink>
        </nav>

        <div className="pt-4 mt-auto space-y-1">
          <a
            href="tel:+911800425293"
            title="Call National Emergency Medical Helpline"
            className="w-full bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl py-4 px-4 font-semibold text-sm shadow-md mb-2 active:scale-95 transition-transform flex items-center justify-center gap-2 hover:from-red-500 hover:to-red-600"
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            Emergency Priority
          </a>
          <p className="text-[10px] text-center text-[var(--color-on-surface-variant)] mb-4 leading-tight">
            Radiology Helpline: <span className="font-bold text-red-400">1800-425-0293</span>
          </p>
          <a className="flex items-center gap-3 text-[var(--color-on-surface-variant)] px-4 py-3 hover:bg-[var(--color-surface-container-highest)] rounded-lg transition-colors" href="mailto:prithanjan2006@gmail.com">
            <HelpCircle size={20} />
            <span className="text-sm">Support</span>
          </a>
        </div>
      </aside>

      {/* Main Canvas */}
      <div className="ml-0 md:ml-64 flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        
        {/* Top Navbar */}
        <header className="w-full sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md shadow-sm shadow-black/5 flex justify-between items-center px-6 md:px-8 h-16 border-b border-[var(--color-outline-variant)]/30">
          <div className="flex items-center gap-8">
            {/* Mobile Title */}
            <span className="text-xl font-bold tracking-tight text-[var(--color-on-surface)] md:hidden flex items-center gap-2">
               <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl">psychology</span>
               MediScan AI
            </span>
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 font-[var(--font-headline)] font-semibold text-sm">
              <NavLink to="/" end className={({isActive}) => isActive ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] pb-1' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors pb-1'}>Dashboard</NavLink>
              <NavLink to="/analysis" className={({isActive}) => isActive ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] pb-1' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors pb-1'}>AI Analysis</NavLink>
              <NavLink to="/records" className={({isActive}) => isActive ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] pb-1' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors pb-1'}>Records</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative group">
              <input className="bg-[var(--color-surface-container-high)] border-none rounded-full px-4 py-1.5 text-sm w-64 focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]" placeholder="Search records..." type="text"/>
              <span className="material-symbols-outlined absolute right-3 top-1.5 text-[var(--color-on-surface-variant)] text-lg">search</span>
            </div>
            <button 
              className={`p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-md transition-all relative ${hasNewResult ? 'text-[var(--color-tertiary)]' : ''}`}
              onClick={() => setHasNewResult(false)}
            >
              <Bell size={20} />
              {hasNewResult && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-tertiary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-tertiary)] border-2 border-[var(--color-surface)]"></span>
                </span>
              )}
            </button>
            <button 
              className="p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] rounded-md transition-all sm:flex"
              onClick={toggleDarkMode}
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {/* Profile Avatar + Dropdown */}
            <div className="relative ml-2" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(v => !v)}
                className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-colors group"
                title="Account"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-xs font-bold border-2 border-[var(--color-outline-variant)]/30 shrink-0">
                  {profile ? initials : <User size={16} />}
                </div>
                <ChevronDown size={14} className={`text-[var(--color-on-surface-variant)] transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''} hidden sm:block`} />
              </button>

              {/* Dropdown Panel */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 overflow-hidden">
                  {/* Profile header */}
                  <div className="p-4 border-b border-[var(--color-outline-variant)]/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary)] text-sm font-bold shrink-0">
                        {profile ? initials : <User size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{displayName}</p>
                        {displayRole && <p className="text-[11px] text-[var(--color-on-surface-variant)] truncate">{displayRole}</p>}
                      </div>
                    </div>
                    {profile?.total_scans !== undefined && (
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container-high)] rounded-lg px-3 py-2">
                        <span className="material-symbols-outlined text-[14px] text-[var(--color-primary)]">scan</span>
                        <span><strong className="text-[var(--color-on-surface)]">{profile.total_scans}</strong> scans completed</span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors font-medium"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <Outlet />

        {/* Footer */}
        <footer className="w-full mt-auto py-10 bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-outline-variant)]/20">
          <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto space-y-4 md:space-y-0">
            <div className="flex flex-col items-center md:items-start gap-1">
              <span className="text-sm font-bold text-[var(--color-on-surface)]">MediScan AI</span>
              <p className="font-[var(--font-body)] text-[10px] tracking-widest uppercase text-[var(--color-on-surface-variant)]/80">© 2026 MediScan AI. HIPAA Compliant.</p>
            </div>
            <div className="flex gap-6">
              <a className="font-[var(--font-body)] text-[10px] tracking-widest uppercase text-[var(--color-on-surface-variant)]/80 hover:text-[var(--color-primary)] transition-colors" href="#">Privacy Policy</a>
              <a className="font-[var(--font-body)] text-[10px] tracking-widest uppercase text-[var(--color-on-surface-variant)]/80 hover:text-[var(--color-primary)] transition-colors" href="#">Terms of Service</a>
              <a className="font-[var(--font-body)] text-[10px] tracking-widest uppercase text-[var(--color-on-surface-variant)]/80 hover:text-[var(--color-primary)] transition-colors" href="#">Compliance</a>
            </div>
          </div>
        </footer>

        {/* Toast Notification */}
        <div className={`fixed bottom-20 md:bottom-6 right-6 z-50 transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
          <div 
            onClick={() => { setShowToast(false); navigate('/analysis'); }}
            className="bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/30 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-xl p-4 flex items-start gap-4 cursor-pointer hover:border-[var(--color-primary)]/50 transition-all w-80"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--color-tertiary)]/20 flex items-center justify-center text-[var(--color-tertiary)] shrink-0">
              <Bell className="animate-pulse" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--color-on-surface)]">Analysis Complete</h4>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">AI has finished analyzing the radiograph. Click to view results.</p>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation (Responsive Tabs) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--color-surface)] border-t border-[var(--color-outline-variant)]/30 flex justify-around items-center h-16 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
          <NavLink to="/" end className={({isActive}) => `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}>
            <LayoutDashboard size={20} />
            <span className="text-[10px] mt-1">Dashboard</span>
          </NavLink>
          <NavLink to="/analysis" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}>
            <Activity size={20} />
            <span className="text-[10px] mt-1">AI Analysis</span>
          </NavLink>
          <NavLink to="/records" className={({isActive}) => `flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}>
            <FolderOpen size={20} />
            <span className="text-[10px] mt-1">Records</span>
          </NavLink>
        </nav>

      </div>
    </div>
  );
}
