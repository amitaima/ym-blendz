import React from 'react';
import { useApp } from '../../store/AppContext';
import { format, isToday, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { BookingStatus, ShiftType } from '../../types'; // Import ShiftType

const AdminDashboard: React.FC = () => {
  const { state, getFinancialStats, updateBookingStatus, deleteBooking } = useApp();
  const stats = getFinancialStats();

  const todayBookings = state.bookings
    .filter(b => isToday(parseISO(b.date)))
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const todayRevenue = todayBookings
    .filter(b => b.status === BookingStatus.COMPLETED)
    .length * state.settings.pricePerCut;

  const upcomingBookings = state.bookings
    .filter(b => b.status === BookingStatus.UPCOMING && !isToday(parseISO(b.date)))
    .sort((a, b) => new Date(`${a.date}T${a.timeSlot}`).getTime() - new Date(`${b.date}T${b.timeSlot}`).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 text-right">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-sm font-bold text-gold uppercase tracking-widest">לוח בקרה ראשי</h2>
          <h1 className="text-2.5xl font-serif font-bold gold-text-gradient">ברוך שובך, יואב</h1>
        </div>
        <div className="text-left">
          <p className="text-[14px] text-gold/40 uppercase font-bold">הכנסות היום</p>
          <p className="text-xl font-bold text-gold">₪{todayRevenue}</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label='הכנסות' value={`₪${stats.income}`} color="text-green-400" />
        <StatCard label="הוצאות" value={`₪${stats.expenses}`} color="text-red-400" />
        <StatCard label="רווח נקי" value={`₪${Math.abs(stats.net)} ${stats.net >= 0 ? '+' : '-'}`} color="gold-text-gradient" />
      </div>

      {/* Today's Schedule */}
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-row-reverse">
          <span className="text-[12px] px-2 py-1 bg-gold/5 border border-gold/10 rounded-full font-bold text-gold uppercase tracking-widest">{todayBookings.length} תורים</span>
          <h3 className="font-serif font-bold text-xl gold-text-gradient">התספורות להיום</h3>
        </div>

        <div className="space-y-3">
          {todayBookings.length > 0 ? todayBookings.map(booking => {
            const isSoldier = booking.shiftType === ShiftType.SOLDIER;
            return (
              <div key={booking.id} className={`glass-card p-4 rounded-2xl border-white/5 border flex items-center justify-between ${isSoldier ? 'bg-green-900/20' : ''}`}>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="bg-gold/10 p-3 rounded-xl border border-gold/20">
                    <span className="font-bold text-gold text-sm">{booking.timeSlot}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{booking.customerName}</h4>
                    <p className="text-sm text-white/40">{booking.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {isSoldier && <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">תור חיילים</span>}
                  {booking.status === BookingStatus.UPCOMING && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, BookingStatus.COMPLETED)}
                      className="p-2 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 transition-all active:scale-90"
                    >
                      <CheckIcon size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteBooking(booking.id)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 transition-all active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          }) : (
            <div className="py-12 text-center glass-card rounded-2xl border-dashed border-2 border-white/5 text-white/20 italic">
              יום שקט לפנינו.
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-xl gold-text-gradient">תספורות עתידיות</h3>
        <div className="space-y-3">
          {upcomingBookings.map(b => {
            const isSoldier = b.shiftType === ShiftType.SOLDIER;
            return (
              <div key={b.id} className={`flex items-center justify-between p-3 border-b ${isSoldier ? 'border-green-500/10' : 'border-white/5'}`}>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-bold text-white">{format(parseISO(b.date), 'EEE, d בMMM', { locale: he })}</span>
                  <span className="text-[14px] text-white/40 uppercase tracking-tighter">{b.timeSlot} — {b.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isSoldier && <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">חייל</span>}
                  <span className="text-[14px] px-2 py-0.5 bg-gold/10 text-gold rounded-full border border-gold/20 font-bold uppercase">קרוב</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="glass-card p-3 rounded-2xl border-white/5 border flex flex-col space-y-1 text-right">
    <span className="text-[12px] uppercase tracking-widest text-gold/40 font-bold">{label}</span>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
  </div>
);

const CheckIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default AdminDashboard;