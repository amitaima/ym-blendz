
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Booking, Expense, BusinessSettings, BookingStatus, UserProfile, TimeBlock, WaitlistRequest, UserRole } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface AppContextType {
  state: AppState;
  login: (email: string, pass: string) => { success: boolean; role?: UserRole };
  signup: (profile: Omit<UserProfile, 'id' | 'role'>) => void;
  logout: () => void;
  // Added updateProfile to support user profile updates
  updateProfile: (profile: Omit<UserProfile, 'id' | 'role'>) => void;
  // Added admin authentication state for the AdminGuard
  isAdminAuthenticated: boolean;
  setAdminAuthenticated: (val: boolean) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  deleteBooking: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateSettings: (settings: BusinessSettings) => void;
  updateDayAvailability: (date: string, blocks: TimeBlock[]) => void;
  addToWaitlist: (request: Omit<WaitlistRequest, 'id'>) => void;
  getFinancialStats: () => { income: number; expenses: number; net: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_USERS: UserProfile[] = [
  { id: 'admin1', name: 'Yoav Malka', email: 'yoav.malka@gmail.com', phone: '0500000001', role: UserRole.ADMIN, password: 'yoav1234' },
  { id: 'admin2', name: 'Amitai Malka', email: 'amitai.malka@gmail.com', phone: '0500000002', role: UserRole.ADMIN, password: 'amitai1234' }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Added local state for admin secondary authentication
  const [isAdminAuthenticated, setAdminAuthenticated] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('ym_blendz_state_v2');
    if (saved) return JSON.parse(saved);
    return {
      bookings: [],
      expenses: [],
      settings: { ...DEFAULT_SETTINGS, customAvailability: {} },
      users: INITIAL_USERS,
      currentUser: undefined,
      waitlist: []
    };
  });

  useEffect(() => {
    localStorage.setItem('ym_blendz_state_v2', JSON.stringify(state));
  }, [state]);

  const login = (email: string, pass: string) => {
    const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      return { success: true, role: user.role };
    }
    return { success: false };
  };

  const signup = (profile: Omit<UserProfile, 'id' | 'role'>) => {
    const newUser: UserProfile = {
      ...profile,
      id: Math.random().toString(36).substr(2, 9),
      role: UserRole.CUSTOMER
    };
    setState(prev => ({ 
      ...prev, 
      users: [...prev.users, newUser],
      currentUser: newUser
    }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: undefined }));
    // Reset admin authentication on logout
    setAdminAuthenticated(false);
  };

  // Added updateProfile implementation to update the current user's information
  const updateProfile = (profile: Omit<UserProfile, 'id' | 'role'>) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const updatedUser = { ...prev.currentUser, ...profile };
      return {
        ...prev,
        currentUser: updatedUser,
        users: prev.users.map(u => u.id === prev.currentUser?.id ? updatedUser : u)
      };
    });
  };

  const addBooking = (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: Math.random().toString(36).substr(2, 9),
      status: BookingStatus.UPCOMING,
      createdAt: Date.now()
    };
    setState(prev => ({ ...prev, bookings: [...prev.bookings, newBooking] }));
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === id ? { ...b, status } : b)
    }));
  };

  const deleteBooking = (id: string) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.filter(b => b.id !== id)
    }));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Math.random().toString(36).substr(2, 9)
    };
    setState(prev => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
  };

  const updateSettings = (settings: BusinessSettings) => {
    setState(prev => ({ ...prev, settings }));
  };

  const updateDayAvailability = (date: string, blocks: TimeBlock[]) => {
    setState(prev => {
      const customAvailability = { ...(prev.settings.customAvailability || {}) };
      if (blocks.length === 0) {
        delete customAvailability[date];
      } else {
        customAvailability[date] = blocks;
      }
      return {
        ...prev,
        settings: { ...prev.settings, customAvailability }
      };
    });
  };

  const addToWaitlist = (request: Omit<WaitlistRequest, 'id'>) => {
    const newRequest: WaitlistRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9)
    };
    setState(prev => ({ ...prev, waitlist: [...prev.waitlist, newRequest] }));
  };

  const getFinancialStats = () => {
    const income = state.bookings
      .filter(b => b.status === BookingStatus.COMPLETED)
      .length * state.settings.pricePerCut;

    const expensesTotal = state.expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      income,
      expenses: expensesTotal,
      net: income - expensesTotal
    };
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      login,
      signup,
      logout,
      updateProfile,
      isAdminAuthenticated,
      setAdminAuthenticated,
      addBooking, 
      updateBookingStatus, 
      deleteBooking, 
      addExpense, 
      updateSettings,
      updateDayAvailability,
      addToWaitlist,
      getFinancialStats
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
