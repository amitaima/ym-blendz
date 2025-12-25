export enum BookingStatus {
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
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