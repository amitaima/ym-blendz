export enum ShiftType {
  REGULAR = 'regular',
  SOLDIER = 'soldier'
}

export enum BookingStatus {
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
}

export type BarberId = 'yoav' | 'dvir';

export interface BarberConfig {
  id: BarberId;
  name: string;
  price: number;
  role?: 'main' | 'secondary';
  yoavCommission?: number;
}

export interface Booking {
  id: string;
  customerId: string; // Add this line
  customerName: string;
  customerPhone: string;
  date: string; // ISO format YYYY-MM-DD
  timeSlot: string; // HH:mm
  status: BookingStatus;
  createdAt: number;
  shiftType?: ShiftType;
  barberId?: BarberId;
  barberName?: string;
  price?: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
}

export interface TimeBlock {
  start: string;
  end: string;
  shiftType?: ShiftType;
  barberId?: BarberId;
  barberName?: string;
}

export interface WaitlistRequest {
  id: string;
  date: string;
  phone: string;
  name: string;
}

export interface BusinessSettings {
  openDays: number[];
  startTime: string; 
  endTime: string; 
  slotDuration: number; // minutes
  pricePerCut: number;
  dvirYoavCommission?: number;
  barbers?: {
    yoav?: BarberConfig;
    dvir?: BarberConfig;
    [key: string]: BarberConfig | undefined;
  };
  homePageImages: string[];
  customAvailability: Record<string, TimeBlock[]>; // Key is YYYY-MM-DD. Empty/Missing = Closed.
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
}

export type SignupProfile = Omit<UserProfile, 'uid' | 'role'> & { password: string };

export interface AppState {
  bookings: Booking[];
  expenses: Expense[];
  settings: BusinessSettings;
  users: UserProfile[]; // Store registered users for mock auth
  currentUser?: UserProfile;
  waitlist: WaitlistRequest[];
}