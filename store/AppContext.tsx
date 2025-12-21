
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  Unsubscribe,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  AuthCredential,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, addDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { AppState, Booking, Expense, BusinessSettings, BookingStatus, UserProfile, TimeBlock, WaitlistRequest, UserRole, SignupProfile } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { db, auth } from '../firebase';

interface AppContextType {
  state: AppState;
  loading: boolean;
  authError?: string;
  login: (email: string, pass: string) => Promise<{ verified: boolean }>;
  loginWithGoogle: () => Promise<void>;
  signup: (profile: SignupProfile) => Promise<void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateProfile: (profile: Partial<Omit<UserProfile, 'uid' | 'role'>>) => Promise<void>;
  isAdminAuthenticated: boolean;
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'customerId'>) => Promise<{ success: boolean, message: string }>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  updateDayAvailability: (date: string, blocks: TimeBlock[]) => Promise<void>;
  addToWaitlist: (request: Omit<WaitlistRequest, 'id'>) => Promise<void>;
  getFinancialStats: () => { income: number; expenses: number; net: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | undefined>();
  const [pendingCredential, setPendingCredential] = useState<AuthCredential | undefined>();
  const [emailForLinking, setEmailForLinking] = useState<string | undefined>();

  const [state, setState] = useState<AppState>({
    bookings: [],
    expenses: [],
    settings: { ...DEFAULT_SETTINGS, customAvailability: {} },
    users: [],
    currentUser: undefined,
    waitlist: []
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await firebaseUser.reload(); 
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userProfileData = userDocSnap.exists() ? userDocSnap.data() as Omit<UserProfile, 'uid'> : undefined;

        if (firebaseUser.emailVerified || userProfileData?.role === UserRole.ADMIN) {
          if (userProfileData) {
            setState(prev => ({ ...prev, currentUser: {uid: firebaseUser.uid, ...userProfileData} }));
          } else {
            const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email!,
                phone: firebaseUser.phoneNumber || '',
                role: UserRole.CUSTOMER,
            };
            await setDoc(userDocRef, newProfile);
            setState(prev => ({ ...prev, currentUser: newProfile }));
          }
        } else {
            setState(prev => ({...prev, currentUser: undefined}));
        }
      } else {
        setState(prev => ({ ...prev, currentUser: undefined }));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!state.currentUser) return;
    const listeners: Unsubscribe[] = [];
    const settingsRef = doc(db, "config", "business");

    listeners.push(onSnapshot(settingsRef, async (docSnap) => {
        const completeDefaultSettings = { ...DEFAULT_SETTINGS, customAvailability: {} };
        if (docSnap.exists()) {
            setState(prev => ({ ...prev, settings: { ...completeDefaultSettings, ...docSnap.data() } }));
        } else if (state.currentUser?.role === UserRole.ADMIN) {
            await setDoc(settingsRef, completeDefaultSettings);
            setState(prev => ({ ...prev, settings: completeDefaultSettings }));
        }
    }));

    if (state.currentUser.role === UserRole.ADMIN) {
      listeners.push(onSnapshot(collection(db, "bookings"), s => setState(p => ({ ...p, bookings: s.docs.map(d => ({ id: d.id, ...d.data() } as Booking)) }))));
      listeners.push(onSnapshot(collection(db, "expenses"), s => setState(p => ({ ...p, expenses: s.docs.map(d => ({ id: d.id, ...d.data() } as Expense)) }))));
      listeners.push(onSnapshot(collection(db, "waitlist"), s => setState(p => ({ ...p, waitlist: s.docs.map(d => ({ id: d.id, ...d.data() } as WaitlistRequest)) }))));
    } else {
      const q = query(collection(db, "bookings"), where("customerId", "==", state.currentUser.uid));
      listeners.push(onSnapshot(q, s => setState(p => ({ ...p, bookings: s.docs.map(d => ({ id: d.id, ...d.data() } as Booking)) }))));
    }
    return () => listeners.forEach(unsub => unsub());
  }, [state.currentUser]);
  
  const login = async (email: string, pass: string): Promise<{ verified: boolean; }> => {
    setAuthError(undefined);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        await user.reload();

        if (pendingCredential && emailForLinking === email) {
            await linkWithCredential(user, pendingCredential);
            setPendingCredential(undefined);
            setEmailForLinking(undefined);
        }

        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        const profile = docSnap.exists() ? docSnap.data() as Omit<UserProfile, 'uid'> : undefined;
        
        if (!user.emailVerified && profile?.role !== UserRole.ADMIN) {
            return { verified: false };
        }

        if (profile) {
            setState(prev => ({ ...prev, currentUser: { uid: user.uid, ...profile } }));
        } else {
            const newProfile: UserProfile = {
                uid: user.uid,
                name: user.displayName || 'New User',
                email: user.email!,
                phone: user.phoneNumber || '',
                role: UserRole.CUSTOMER,
            };
            await setDoc(userDocRef, newProfile);
            setState(prev => ({ ...prev, currentUser: newProfile }));
        }
        
        return { verified: true };

    } catch (error: any) {
        console.error("Login error:", error);
        setAuthError(error.message);
        await signOut(auth);
        throw error;
    }
};


  const loginWithGoogle = async (): Promise<void> => {
    setAuthError(undefined);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const pendingCred = GoogleAuthProvider.credentialFromError(error);
        if (pendingCred) {
          setPendingCredential(pendingCred);
          const email = error.customData.email;
          setEmailForLinking(email);
          setAuthError(`An account already exists for ${email}. Please sign in with your password to link your Google account.`);
        }
      } else {
        console.error("Google Login Error:", error);
        setAuthError(error.message);
        throw error;
      }
    }
  };

  const signup = async (profile: SignupProfile): Promise<void> => {
    setAuthError(undefined);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, profile.email);
      if (methods.length > 0) {
        throw new Error("An account with this email already exists.");
      }
      const cred = await createUserWithEmailAndPassword(auth, profile.email, profile.password);
      await sendEmailVerification(cred.user);
      const newUserProfile: Omit<UserProfile, 'uid'> = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: UserRole.CUSTOMER,
      };
      await setDoc(doc(db, "users", cred.user.uid), newUserProfile);
    } catch (error: any) {
      console.error("Signup Error:", error);
      setAuthError(error.message);
      throw error; 
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setState(prev => ({ ...prev, currentUser: undefined }));
  };

  const resendVerificationEmail = async (): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    } else {
      throw new Error("No user is currently signed in to resend verification email.");
    }
  };
  
  const updateProfile = async (profile: Partial<Omit<UserProfile, 'uid' | 'role'>>): Promise<void> => {
    if (!state.currentUser) return;
    await updateDoc(doc(db, "users", state.currentUser.uid), profile);
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'customerId'>) => {
    if (!state.currentUser) return { success: false, message: "You must be logged in to book." };
    try {
      const slotId = `${booking.date}_${booking.timeSlot}`;
      await runTransaction(db, async (t) => {
        const snap = await t.get(doc(db, "bookings", slotId));
        if (snap.exists()) throw new Error("Slot already taken");
        t.set(doc(db, "bookings", slotId), { ...booking, customerId: state.currentUser!.uid, status: BookingStatus.UPCOMING, createdAt: serverTimestamp() });
      });
      return { success: true, message: "Booking successful!" };
    } catch (error: any) {
      return { success: false, message: error.message || "Booking failed." };
    }
  };

  const updateBookingStatus = async (id: string, status: BookingStatus): Promise<void> => {
    await updateDoc(doc(db, "bookings", id), { status });
  };

  const deleteBooking = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "bookings", id));
  };

  const addExpense = async (expense: Omit<Expense, 'id'>): Promise<void> => {
    await addDoc(collection(db, "expenses"), expense);
  };

  const updateSettings = async (settings: Partial<BusinessSettings>): Promise<void> => {
    await setDoc(doc(db, "config", "business"), settings, { merge: true });
  };

  const updateDayAvailability = async (date: string, blocks: TimeBlock[]): Promise<void> => {
    await updateDoc(doc(db, "config", "business"), { [`customAvailability.${date}`]: blocks });
  };

  const addToWaitlist = async (request: Omit<WaitlistRequest, 'id'>): Promise<void> => {
    await addDoc(collection(db, "waitlist"), request);
  };

  const getFinancialStats = () => {
    const income = state.bookings.filter(b => b.status === BookingStatus.COMPLETED).length * (state.settings.pricePerCut || 0);
    const expensesTotal = state.expenses.reduce((sum, e) => sum + e.amount, 0);
    return { income, expenses: expensesTotal, net: income - expensesTotal };
  };

  const isAdminAuthenticated = state.currentUser?.role === UserRole.ADMIN;

  return (
    <AppContext.Provider value={{
      state, loading, authError, login, loginWithGoogle, signup, logout, resendVerificationEmail, updateProfile, isAdminAuthenticated, addBooking, updateBookingStatus, deleteBooking, addExpense, updateSettings, updateDayAvailability, addToWaitlist, getFinancialStats
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
