
import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from '../store/AppContext';
import Layout from '../components/Layout';
import { UserRole } from '../types';
import { Loader } from 'lucide-react';

// Pages
import CustomerHome from '../pages/Customer/Home';
import BookingFlow from '../pages/Customer/BookingFlow';
import CustomerProfile from '../pages/Customer/Profile';
import AdminDashboard from '../pages/Admin/Dashboard';
import AdminFinance from '../pages/Admin/Finance';
import AdminBookings from '../pages/Admin/Bookings';
import AdminSettings from '../pages/Admin/Settings';
import AuthScreen from '../pages/Auth/AuthScreen';
import AdminGuard from '../pages/Admin/AdminGuard';

const AnimatedRoutes = () => {
  const { state, loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shadow-[0_0_30px_rgba(191,149,63,0.1)]">
          <Loader className="text-gold w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif italic gold-text-gradient">YM-Blendz</h2>
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return <AuthScreen />;
  }

  const isAdmin = state.currentUser.role === UserRole.ADMIN;

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {isAdmin ? (
            <>
              <Route path="/admin" element={<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}><AdminGuard><AdminDashboard /></AdminGuard></motion.div>} />
              <Route path="/admin/bookings" element={<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}><AdminGuard><AdminBookings /></AdminGuard></motion.div>} />
              <Route path="/admin/finance" element={<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}><AdminGuard><AdminFinance /></AdminGuard></motion.div>} />
              <Route path="/admin/settings" element={<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}><AdminGuard><AdminSettings /></AdminGuard></motion.div>} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          ) : (
            <>
              {/* Customer Routes */}
              <Route path="/" element={<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}><CustomerHome /></motion.div>} />
              <Route path="/book" element={<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}><BookingFlow /></motion.div>} />
              <Route path="/my-appointments" element={<motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}><CustomerProfile /></motion.div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </AnimatePresence>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AnimatedRoutes />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
