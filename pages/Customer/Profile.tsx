
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { User, Phone, Calendar, Clock, ChevronLeft, XCircle, CheckCircle, Info, ShieldAlert, AlertTriangle, Mail, ArrowLeft } from 'lucide-react';
import { format, isAfter, subHours, parseISO } from 'date-fns';
import { BookingStatus, Booking } from '../../types';

const CustomerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateProfile, updateBookingStatus } = useApp();
  const [isEditing, setIsEditing] = useState(!state.currentUser);
  const [formData, setFormData] = useState({
    name: state.currentUser?.name || '',
    phone: state.currentUser?.phone || '',
    email: state.currentUser?.email || ''
  });
  
  const [cancelingBooking, setCancelingBooking] = useState<Booking | null>(null);

  const myBookings = useMemo(() => {
    if (!state.currentUser) return [];
    return state.bookings.filter(b => b.customerId === state.currentUser?.uid);
  }, [state.bookings, state.currentUser]);

  const upcoming = myBookings
    .filter(b => b.status === BookingStatus.UPCOMING && isAfter(new Date(`${b.date}T${b.timeSlot}`), new Date()))
    .sort((a, b) => new Date(`${a.date}T${a.timeSlot}`).getTime() - new Date(`${b.date}T${b.timeSlot}`).getTime());

  const history = myBookings
    .filter(b => b.status !== BookingStatus.UPCOMING || !isAfter(new Date(`${b.date}T${b.timeSlot}`), new Date()))
    .sort((a, b) => new Date(`${b.date}T${b.timeSlot}`).getTime() - new Date(`${a.date}T${a.timeSlot}`).getTime());

  const handleSave = () => {
    if (formData.name) {
      updateProfile(formData);
      setIsEditing(false);
    }
  };

  const executeCancel = () => {
    if (cancelingBooking) {
      updateBookingStatus(cancelingBooking.id, BookingStatus.CANCELED);
      setCancelingBooking(null);
    }
  };

  const getCancellationStatus = (booking: Booking) => {
    const apptDate = new Date(`${booking.date}T${booking.timeSlot}`);
    const limitDate = subHours(apptDate, 24);
    return isAfter(limitDate, new Date());
  };

  if (isEditing) {
    return (
      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 glass-card rounded-xl text-gold transition-transform active:scale-90 border-gold/20"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-serif italic text-white gold-text-gradient">Edit Identity</h2>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Update your profile</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gold/60 font-bold ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 focus:border-gold outline-none transition-colors text-white"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-gold/60 font-bold ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 w-5 h-5" />
                <input 
                  type="tel" 
                  placeholder="+1 234 567 890"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 focus:border-gold outline-none transition-colors text-white"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/20 uppercase font-bold tracking-widest">Email</span>
                <span className="text-white/60 font-mono">{state.currentUser?.email}</span>
              </div>
              <div className="pt-2">
                 <p className="text-[8px] text-white/20 italic leading-tight text-center">Contact support to change email associated with your membership.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <GoldButton fullWidth variant="gold" onClick={handleSave} disabled={!formData.name}>
              Save Changes
            </GoldButton>
            <button 
              onClick={() => setIsEditing(false)}
              className="w-full py-4 text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-colors"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32 relative">
      {cancelingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-sm rounded-[2.5rem] p-8 border-gold/20 border space-y-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            
            {getCancellationStatus(cancelingBooking) ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif italic text-white leading-tight">Cancel Appointment?</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    You are cancelling your slot on <span className="text-gold font-bold">{format(parseISO(cancelingBooking.date), 'MMM do')}</span> at <span className="text-gold font-bold">{cancelingBooking.timeSlot}</span>.
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <GoldButton fullWidth onClick={executeCancel} className="bg-red-600 text-white shadow-red-900/40">Yes, Cancel Slot</GoldButton>
                  <button onClick={() => setCancelingBooking(null)} className="w-full py-4 text-xs uppercase tracking-widest font-bold text-white/40">Keep Booking</button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif italic text-white leading-tight">Cannot Cancel</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Strict Policy: Appointments within <span className="text-gold font-bold">24 hours</span> cannot be managed online.
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/60 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert size={14} className="text-gold" />
                    <span className="font-bold text-gold uppercase tracking-widest text-[8px]">Business Rules</span>
                  </div>
                  Please contact YM Blendz directly for emergencies.
                </div>
                <GoldButton fullWidth variant="outline" onClick={() => setCancelingBooking(null)}>Understood</GoldButton>
              </>
            )}
          </div>
        </div>
      )}

      <div className="glass-card p-6 rounded-[2rem] border-gold/20 border relative overflow-hidden group shadow-[0_0_30px_rgba(191,149,63,0.05)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-serif italic text-white group-hover:text-gold transition-all duration-500">
              {state.currentUser?.name}
            </h2>
            <p className="text-xs text-white/40 font-mono tracking-tighter">{state.currentUser?.email}</p>
            <p className="text-[10px] text-white/20 font-mono mt-1">{state.currentUser?.phone}</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[10px] uppercase tracking-widest text-gold font-bold px-3 py-1 bg-gold/10 rounded-full border border-gold/20 hover:bg-gold/20 transition-all"
          >
            Edit
          </button>
        </div>
        <div className="flex items-center space-x-2 text-gold">
          <CheckCircle size={14} />
          <span className="text-[10px] uppercase font-bold tracking-widest">Premium Member</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif italic text-xl flex items-center gap-2 gold-text-gradient">
          My Blendz
          {upcoming.length > 0 && <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full not-italic border border-gold/10">{upcoming.length}</span>}
        </h3>
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map(b => (
              <div key={b.id} className="glass-card p-5 rounded-2xl border-gold/10 border relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-gold">
                      <Calendar size={16} />
                      <span className="text-sm font-bold">{format(parseISO(b.date), 'EEEE, MMM do')}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-white/60">
                      <Clock size={16} />
                      <span className="text-sm">{b.timeSlot} ({state.settings.slotDuration} min)</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCancelingBooking(b)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
    <GoldButton 
        variant="pink" 
        onClick={() => window.open('https://www.bitpay.co.il/app/me/DA03B6AD-44C0-6B8E-A1DC-5D8BDA26C03A5431', '_blank')} 
        className="px-6 text-xs flex items-center h-10"
    >
        Pay with Bit
    </GoldButton>
    <div className="text-right">
        <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Price</span>
        <span className="text-sm font-bold text-gold block">₪{state.settings.pricePerCut}</span>
    </div>
</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 rounded-2xl border-dashed border border-white/10 text-center flex flex-col items-center justify-center space-y-4">
            <p className="text-white/30 italic text-sm">No upcoming appointments.</p>
            <GoldButton variant="gold" className="scale-90 py-3 mx-auto" onClick={() => navigate('/book')}>
              Book Now
            </GoldButton>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-serif italic text-xl gold-text-gradient">Past Sessions</h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 glass-card rounded-xl border-white/5 border opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${b.status === BookingStatus.COMPLETED ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {b.status === BookingStatus.COMPLETED ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{format(parseISO(b.date), 'MMM d, yyyy')}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-tighter font-bold">{b.status}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-white/20">₪{state.settings.pricePerCut}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-white/20 text-xs italic">Your history starts after your first cut.</p>
        )}
      </div>

      <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start space-x-3">
        <Info className="text-gold w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-[10px] text-white/40 leading-relaxed">
          <span className="text-gold font-bold">Policy:</span> You can cancel or reschedule up to 24 hours before your slot. Late cancellations may incur a fee on your next visit.
        </p>
      </div>
    </div>
  );
};

export default CustomerProfile;
