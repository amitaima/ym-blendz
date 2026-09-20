
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
import { AppState, Booking, Expense, BusinessSettings, BookingStatus, UserProfile, TimeBlock, WaitlistRequest, UserRole, SignupProfile, BarberId } from '../types';
import { DEFAULT_SETTINGS, BARBERS, getBarberName, getBarberPrice, getDvirCommission } from '../constants';
import { db, auth } from '../firebase';

export interface FinancialBreakdown {
  income: number;
  expenses: number;
  net: number;
  yoav: {
    directIncome: number;
    dvirCommission: number;
    totalIncome: number;
    expenses: number;
    net: number;
    cutsCount: number;
  };
  dvir: {
    grossIncome: number;
    yoavCommission: number;
    netEarnings: number;
    cutsCount: number;
  };
}

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
  deleteExpense: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  updateDayAvailability: (date: string, blocks: TimeBlock[]) => Promise<void>;
  addToWaitlist: (request: Omit<WaitlistRequest, 'id'>) => Promise<void>;
  getFinancialStats: (customBookings?: Booking[], customExpenses?: Expense[]) => FinancialBreakdown;
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
    settings: { ...DEFAULT_SETTINGS, customAvailability: {}, homePageImages: [] },
    users: [],
    currentUser: undefined,
    waitlist: []
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timer);
      try {
        if (firebaseUser) {
          try {
            await firebaseUser.reload(); 
          } catch (e) {
            console.warn("User reload failed:", e);
          }
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
      } catch (err) {
        console.warn("Auth state change error:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      clearTimeout(timer);
      console.warn("onAuthStateChanged error:", error);
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!state.currentUser) return;

    const listeners: Unsubscribe[] = [];
    const settingsRef = doc(db, "config", "business");

    listeners.push(onSnapshot(settingsRef, async (docSnap) => {
        const completeDefaultSettings = { 
          ...DEFAULT_SETTINGS, 
          customAvailability: {}, 
          homePageImages: [] 
        };
        if (docSnap.exists()) {
            const data = docSnap.data();
            const mergedBarbers = {
              yoav: {
                ...DEFAULT_SETTINGS.barbers.yoav,
                ...(data.barbers?.yoav || {})
              },
              dvir: {
                ...DEFAULT_SETTINGS.barbers.dvir,
                ...(data.barbers?.dvir || {})
              }
            };
            setState(prev => ({ 
              ...prev, 
              settings: { 
                ...completeDefaultSettings, 
                ...data, 
                barbers: mergedBarbers,
                homePageImages: data.homePageImages || [] 
              } 
            }));
        } else if (state.currentUser?.role === UserRole.ADMIN) {
            await setDoc(settingsRef, completeDefaultSettings);
            setState(prev => ({ ...prev, settings: completeDefaultSettings }));
        }
    }, (err) => {
        console.warn("settings snapshot error:", err);
    }));

    if (state.currentUser.role === UserRole.ADMIN) {
        listeners.push(onSnapshot(collection(db, "bookings"), s => 
            setState(p => ({ ...p, bookings: s.docs.map(d => ({ id: d.id, ...d.data() } as Booking)) })),
            (err) => console.warn("bookings snapshot error:", err)
        ));
        listeners.push(onSnapshot(collection(db, "expenses"), s => 
            setState(p => ({ ...p, expenses: s.docs.map(d => ({ id: d.id, ...d.data() } as Expense)) })),
            (err) => console.warn("expenses snapshot error:", err)
        ));
        listeners.push(onSnapshot(collection(db, "waitlist"), s => 
            setState(p => ({ ...p, waitlist: s.docs.map(d => ({ id: d.id, ...d.data() } as WaitlistRequest)) })),
            (err) => console.warn("waitlist snapshot error:", err)
        ));
    } else {
        let upcomingBookings: Booking[] = [];
        let myBookings: Booking[] = [];
        const bookingsMap = new Map<string, Booking>();
        const mergeAndSetState = () => {
            bookingsMap.clear();
            upcomingBookings.forEach(b => bookingsMap.set(b.id, b));
            myBookings.forEach(b => bookingsMap.set(b.id, b));
            setState(p => ({ ...p, bookings: Array.from(bookingsMap.values()) }));
        };
        const qUpcoming = query(collection(db, "bookings"), where("status", "==", BookingStatus.UPCOMING));
        const unsubUpcoming = onSnapshot(qUpcoming, (snapshot) => {
            upcomingBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
            mergeAndSetState();
        }, (err) => console.warn("upcoming bookings snapshot error:", err));
        const qMy = query(collection(db, "bookings"), where("customerId", "==", state.currentUser.uid));
        const unsubMy = onSnapshot(qMy, (snapshot) => {
            myBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
            mergeAndSetState();
        }, (err) => console.warn("my bookings snapshot error:", err));
        listeners.push(unsubUpcoming, unsubMy);
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
      const actionCodeSettings = {
        url: 'https://ym-blendz.web.app/verify-email',
        handleCodeInApp: true,
      };
      await sendEmailVerification(cred.user, actionCodeSettings);
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
      const actionCodeSettings = {
        url: 'https://ym-blendz.web.app/auth',
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
    } else {
      throw new Error("No user is currently signed in to resend verification email.");
    }
  };
  
  const updateProfile = async (profile: Partial<Omit<UserProfile, 'uid' | 'role'>>): Promise<void> => {
    if (!state.currentUser) return;
    await updateDoc(doc(db, "users", state.currentUser.uid), profile);
    setState(prev => ({ 
        ...prev, 
        currentUser: prev.currentUser ? { ...prev.currentUser, ...profile } : undefined 
    }));
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'customerId'>) => {
    if (!state.currentUser) {
      return { success: false, message: "יש להתחבר כדי לקבוע תור." };
    }
    try {
      const barberId: BarberId = (booking.barberId === 'dvir') ? 'dvir' : 'yoav';
      const barberName = booking.barberName || getBarberName(barberId);
      const price = typeof booking.price === 'number' 
        ? booking.price 
        : getBarberPrice(state.settings, barberId);

      const slotId = `${booking.date}_${barberId}_${booking.timeSlot}`;
      const legacySlotId = `${booking.date}_${booking.timeSlot}`;

      await runTransaction(db, async (transaction) => {
        const bookingRef = doc(db, "bookings", slotId);
        const bookingDoc = await transaction.get(bookingRef);
        
        let legacyConflict = false;
        if (barberId === 'yoav') {
          const legacyRef = doc(db, "bookings", legacySlotId);
          const legacyDoc = await transaction.get(legacyRef);
          if (legacyDoc.exists() && legacyDoc.data().status !== BookingStatus.CANCELED) {
            legacyConflict = true;
          }
        }

        if ((bookingDoc.exists() && bookingDoc.data().status !== BookingStatus.CANCELED) || legacyConflict) {
          throw new Error("התור שבחרת כבר נתפס על ידי לקוח אחר");
        }

        transaction.set(bookingRef, { 
          ...booking, 
          barberId,
          barberName,
          price,
          customerId: state.currentUser!.uid, 
          status: BookingStatus.UPCOMING, 
          createdAt: serverTimestamp() 
        });
      });
      return { success: true, message: "התור נקבע בהצלחה!" };
    } catch (error: any) {
      return { success: false, message: error.message || "קביעת התור נכשלה." };
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

  const deleteExpense = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "expenses", id));
  };

  const updateSettings = async (settings: Partial<BusinessSettings>): Promise<void> => {
    try {
      await setDoc(doc(db, "config", "business"), settings, { merge: true });
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      alert(`Error saving settings: ${error.message}`);
      throw error;
    }
  };

  const updateDayAvailability = async (date: string, blocks: TimeBlock[]): Promise<void> => {
    await setDoc(doc(db, "config", "business"), { 
      customAvailability: {
        [date]: blocks 
      }
    }, { merge: true });
  };

  const addToWaitlist = async (request: Omit<WaitlistRequest, 'id'>): Promise<void> => {
    await addDoc(collection(db, "waitlist"), request);
  };

  const getFinancialStats = (customBookings?: Booking[], customExpenses?: Expense[]): FinancialBreakdown => {
    let yoavDirectIncome = 0;
    let yoavCutsCount = 0;

    let dvirGrossIncome = 0;
    let dvirCutsCount = 0;
    let dvirNetEarnings = 0;
    let yoavFromDvir = 0;

    const completedBookings = (customBookings || state.bookings).filter(b => b.status === BookingStatus.COMPLETED);
    const dvirCommissionRate = getDvirCommission(state.settings);

    completedBookings.forEach(b => {
      const barberId: BarberId = b.barberId === 'dvir' ? 'dvir' : 'yoav';
      const cutPrice = typeof b.price === 'number' 
        ? b.price 
        : getBarberPrice(state.settings, barberId);

      if (barberId === 'dvir') {
        dvirCutsCount += 1;
        dvirGrossIncome += cutPrice;
        // From Dvir's haircut: commission goes to Yoav, rest to Dvir
        const commissionToYoav = Math.min(dvirCommissionRate, cutPrice);
        const netToDvir = Math.max(0, cutPrice - commissionToYoav);
        yoavFromDvir += commissionToYoav;
        dvirNetEarnings += netToDvir;
      } else {
        // Yoav's haircut goes full into Yoav
        yoavCutsCount += 1;
        yoavDirectIncome += cutPrice;
      }
    });

    const expensesList = customExpenses || state.expenses;
    const expensesTotal = expensesList.reduce((sum, e) => sum + e.amount, 0);
    const yoavTotalIncome = yoavDirectIncome + yoavFromDvir;
    const yoavNet = yoavTotalIncome - expensesTotal;

    const totalIncome = yoavDirectIncome + dvirGrossIncome;
    const totalNet = totalIncome - expensesTotal;

    return {
      income: totalIncome,
      expenses: expensesTotal,
      net: totalNet,
      yoav: {
        directIncome: yoavDirectIncome,
        dvirCommission: yoavFromDvir,
        totalIncome: yoavTotalIncome,
        expenses: expensesTotal,
        net: yoavNet,
        cutsCount: yoavCutsCount
      },
      dvir: {
        grossIncome: dvirGrossIncome,
        yoavCommission: yoavFromDvir,
        netEarnings: dvirNetEarnings,
        cutsCount: dvirCutsCount
      }
    };
  };

  const isAdminAuthenticated = state.currentUser?.role === UserRole.ADMIN;

  return (
    <AppContext.Provider value={{
      state, loading, authError, login, loginWithGoogle, signup, logout, resendVerificationEmail, updateProfile, isAdminAuthenticated, addBooking, updateBookingStatus, deleteBooking, addExpense, deleteExpense, updateSettings, updateDayAvailability, addToWaitlist, getFinancialStats
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
