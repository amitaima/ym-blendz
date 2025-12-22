import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Settings, DollarSign, User, Scissors, LogOut } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, logout } = useApp();
  const location = useLocation();
  const isAdmin = state.currentUser?.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans mx-auto relative max-w-md lg:max-w-4xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold opacity-10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-gold/5 opacity-5 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="p-6 flex justify-between items-center z-10 sticky top-0 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex flex-col items-start">
          <div className="flex items-center">
            <Scissors className="text-gold w-6 h-6 ml-3 shrink-0 -rotate-90" />
            <h1 className="text-2xl font-en-serif italic font-bold tracking-tighter gold-text-gradient">
              YM BLENDZ
            </h1>
          </div>
          {/* <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-semibold leading-relaxed mt-1">Grooming Excellence</p> */}
          <p className="text-[12px] tracking-[0.2em] text-gold/60 font-semibold leading-relaxed mt-1">מצוינות בטיפוח</p>
        </div>
        <button 
          onClick={logout}
          className="w-10 h-10 rounded-full glass-card flex items-center justify-center border-white/5 border hover:border-red-500/50 transition-colors group"
        >
          <LogOut className="w-4 h-4 text-white/40 group-hover:text-red-500 -rotate-180" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 z-0">
        {children}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] glass-card rounded-[3rem] px-8 py-2 flex justify-between items-center z-50 border-gold/10 border shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-w-[360px] lg:max-w-2xl">
        {isAdmin ? (
          <>
            <NavItem to="/admin" icon={<Home />} active={location.pathname === '/admin'} label="ראשי" />
            <NavItem to="/admin/bookings" icon={<Calendar />} active={location.pathname === '/admin/bookings'} label="הזמנות" />
            <NavItem to="/admin/finance" icon={<DollarSign />} active={location.pathname === '/admin/finance'} label="כספים" />
            <NavItem to="/admin/settings" icon={<Settings />} active={location.pathname === '/admin/settings'} label="הגדרות" />
          </>
        ) : (
          <>
            <NavItem to="/" icon={<Home />} active={location.pathname === '/'} label="ראשי" />
            <NavItem to="/book" icon={<Calendar />} active={location.pathname === '/book'} label="הזמן תור" />
            <NavItem to="/profile" icon={<User />} active={location.pathname === '/profile'} label="פרופיל" />
          </>
        )}
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ to: string, icon: React.ReactNode, active: boolean, label: string }> = ({ to, icon, active, label }) => (
  <Link 
    to={to} 
    className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-[1.5rem] transition-all duration-150 min-w-[72px] text-center relative
      ${active ? 'text-white bg-gold/10 scale-105 shadow-[0_0_15px_rgba(191,149,63,0.15)] border border-gold/20' : 'text-white/40 border border-transparent'}`}
  >
    <div className="transition-transform duration-150">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 18, strokeWidth: active ? 2.5 : 2, className: active ? 'text-gold' : '' })}
    </div>
    <span className={`text-[10px] mt-1 font-bold w-full text-center block leading-tight tracking-widest uppercase transition-opacity duration-150 ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </Link>
);

export default Layout;