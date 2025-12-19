import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './store/AppContext';
import Layout from './components/Layout';
import { UserRole } from './types';

// Pages
import CustomerHome from './pages/Customer/Home';
import BookingFlow from './pages/Customer/BookingFlow';
import CustomerProfile from './pages/Customer/Profile';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminFinance from './pages/Admin/Finance';
import AdminBookings from './pages/Admin/Bookings';
import AdminSettings from './pages/Admin/Settings';
import AuthScreen from './pages/Auth/AuthScreen';

const AnimatedRoutes = () => {
  const { state } = useApp();
  const location = useLocation();

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
              {/* Admin Routes */}
              <Route path="/admin" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><AdminDashboard /></motion.div>} />
              <Route path="/admin/bookings" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><AdminBookings /></motion.div>} />
              <Route path="/admin/finance" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><AdminFinance /></motion.div>} />
              <Route path="/admin/settings" element={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}><AdminSettings /></motion.div>} />
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