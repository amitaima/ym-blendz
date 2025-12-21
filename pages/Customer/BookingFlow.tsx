
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, Clock, BellRing, X, Sparkles, Mail, Info, AlertCircle } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, isBefore, addMinutes, isAfter } from 'date-fns';

const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { state, addBooking, updateProfile, addToWaitlist } = useApp();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ 
    name: state.currentUser?.name || '', 
    phone: state.currentUser?.phone || '',
    email: state.currentUser?.email || ''
  });
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'pending' | 'success'>('idle');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);


  useEffect(() => {
    if (state.currentUser) {
      setCustomerInfo({
        name: state.currentUser.name,
        phone: state.currentUser.phone,
        email: state.currentUser.email
      });
    }
  }, [state.currentUser]);

  const dates = useMemo(() => Array.from({ length: 14 }).map((_, i) => addDays(startOfToday(), i)), []);

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const slots: string[] = [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const blocks = state.settings.customAvailability?.[dateStr] || [];
    
    if (blocks.length === 0) return [];

    const slotDuration = state.settings.slotDuration;
    const now = new Date();

    blocks.forEach(block => {
      let current = new Date(`${dateStr}T${block.start}`);
      const end = new Date(`${dateStr}T${block.end}`);

      while (isBefore(current, end)) {
        const timeStr = format(current, 'HH:mm');
        if (!isSameDay(selectedDate, now) || isAfter(current, now)) {
          const isBooked = state.bookings.some(b => 
            b.date === dateStr && 
            b.timeSlot === timeStr && 
            b.status !== 'canceled'
          );
          if (!isBooked) slots.push(timeStr);
        }
        current = addMinutes(current, slotDuration);
      }
    });

    return Array.from(new Set(slots)).sort();
  }, [selectedDate, state.settings, state.bookings]);

  const handleComplete = async () => {
    if (!selectedSlot || !selectedDate) return;
    setIsBooking(true);
    try {
      const result = await addBooking({
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot
      });

      if (result.success) {
        setStep(4);
      } else {
        setBookingError(result.message || 'This slot was just taken. Please select another.');
      }
    } catch (error) {
      setBookingError('An unexpected error occurred. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleWaitlist = () => {
    if (!selectedDate) return;
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please fill your profile details first.");
      setStep(3);
      return;
    }
    setWaitlistStatus('pending');
    setTimeout(() => {
      addToWaitlist({
        date: format(selectedDate, 'yyyy-MM-dd'),
        name: customerInfo.name,
        phone: customerInfo.phone
      });
      setWaitlistStatus('success');
    }, 800);
  };

  const isSelectedDateOpen = useMemo(() => {
    if (!selectedDate) return false;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const blocks = state.settings.customAvailability?.[dateStr] || [];
    return blocks.length > 0;
  }, [selectedDate, state.settings]);

  const toggleDate = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      setStep(2);
    }
  };
  
  const handleSlotSelection = (slot: string) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  if (step === 4) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(191,149,63,0.2)]">
          <Check className="w-12 h-12 text-gold" strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-serif italic text-white gold-text-gradient">Booked Successfully!</h2>
        <p className="text-white/60 text-sm">Your chair is ready for {customerInfo.name} at {selectedSlot} on {selectedDate ? format(selectedDate, 'MMM do') : ''}.</p>
        
        <div className="w-full glass-card p-6 rounded-2xl border-gold/10 border space-y-4 shadow-2xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-light">Settlement</p>
          <a 
            href="https://www.bitpay.co.il/app/me/76089096-9818-4D7F-B3B8-86F7DBC4282F" 
            target="_blank" 
            rel="noreferrer"
            className="block py-4 rounded-xl bg-pinkAccent text-white font-bold text-center shadow-lg shadow-pink-900/40 active:scale-95 transition-all relative z-10"
          >
            Pay with BIT
          </a>
          <p className="text-[10px] text-white/30 italic relative z-10">Total: {state.settings.pricePerCut} NIS (Due at salon)</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <GoldButton variant="outline" onClick={() => navigate('/my-appointments')}>
            Profile
          </GoldButton>
          <GoldButton variant="gold" onClick={() => navigate('/')}>
            Home
          </GoldButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 animate-in fade-in duration-500 pb-32">
      {bookingError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in">
          <div className="glass-card p-8 rounded-[2rem] border-red-500/30 border text-center space-y-6 shadow-2xl shadow-red-900/40 max-w-sm">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-serif italic text-white">Booking Failed</h2>
              <p className="text-white/60 text-sm px-4">{bookingError}</p>
            </div>
            <GoldButton
              fullWidth
              variant="outline"
              className="!text-red-400 !border-red-400/50"
              onClick={() => {
                setBookingError(null);
                setSelectedSlot(null);
                setStep(2);
              }}
            >
              Choose Another Time
            </GoldButton>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-pinkAccent shadow-[0_0_15px_rgba(255,0,127,0.4)]' : 'bg-white/10'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif italic gold-text-gradient">Select Session</h2>
            <div className="flex items-center gap-1.5 bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
              <Sparkles className="text-gold w-2.5 h-2.5" />
              <span className="text-[7px] uppercase font-bold text-gold tracking-widest">Open Days</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {dates.map((date, i) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const blocks = state.settings.customAvailability?.[dateStr] || [];
              const isOpen = blocks.length > 0;
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              
              return (
                <button
                  key={i}
                  onClick={() => toggleDate(date)}
                  className={`flex flex-col items-center justify-center py-4 rounded-[1.25rem] border transition-all duration-300 relative overflow-hidden
                    ${isSelected ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(191,149,63,0.3)] scale-105 z-10' : 'glass-card border-white/5 text-white/60'}
                    ${isOpen && !isSelected ? 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : ''}
                    ${!isOpen ? 'opacity-30' : 'hover:border-gold/30'}`}
                >
                  {isOpen && (
                    <div className={`absolute top-1.5 right-1.5 w-1 h-1 rounded-full shadow-[0_0_6px_rgba(34,197,94,1)] ${isSelected ? 'bg-black' : 'bg-green-500'}`} />
                  )}
                  <span className={`text-[8px] uppercase font-bold tracking-tighter ${isSelected ? 'text-black/60' : 'text-white/30'}`}>{format(date, 'eee')}</span>
                  <span className="text-base font-bold">{format(date, 'd')}</span>
                  {!isOpen && <X className="absolute bottom-1 text-white/5 w-4 h-4 rotate-12" />}
                </button>
              );
            })}
          </div>

          {/* {selectedDate && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <GoldButton 
                fullWidth 
                onClick={() => setStep(2)}
                variant={isSelectedDateOpen ? 'gold' : 'outline'}
                className="h-14"
              >
                {isSelectedDateOpen ? 'View Available Slots' : 'Notify me for this day'}
              </GoldButton>
            </div>
          )} */}
        </div>
      )}

      {step === 2 && selectedDate && (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center space-x-4">
            <button onClick={() => {
              setSelectedDate(null);
              setStep(1);
              }} className="p-2 glass-card rounded-xl text-gold transition-transform active:scale-90 border-gold/20"><ChevronLeft size={20} /></button>
            <h2 className="text-2xl font-serif italic gold-text-gradient">Time Selection</h2>
          </div>
          
          <div className="glass-card p-5 rounded-[2rem] border-gold/20 border flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                <CalendarIcon size={18} className="text-gold" />
              </div>
              <div>
                <span className="text-sm font-bold block leading-tight text-white">{format(selectedDate, 'EEEE')}</span>
                <span className="text-[10px] text-gold/60 uppercase tracking-widest font-bold">{format(selectedDate, 'MMMM do')}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.length > 0 ? timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => handleSlotSelection(slot)}
                className={`py-4 rounded-2xl border text-sm font-bold transition-all duration-300
                  ${selectedSlot === slot ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(191,149,63,0.3)] scale-105' : 'glass-card border-white/5 text-white/60 hover:border-gold/30'}`}
              >
                {slot}
              </button>
            )) : (
              <div className="col-span-3 py-10 text-center space-y-6">
                <div className="glass-card p-8 rounded-[2.5rem] border-gold/20 space-y-5 shadow-2xl">
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
                    <BellRing className="text-gold w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-serif italic text-gold">Fully Booked</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed">Join the waiting list to get<br/>notified if a slot opens up</p>
                  </div>
                  
                  {waitlistStatus === 'success' ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold animate-in zoom-in">
                      ✓ Waitlist Active. We'll SMS you!
                    </div>
                  ) : (
                    <GoldButton 
                      fullWidth 
                      variant="gold" 
                      className="py-4"
                      onClick={handleWaitlist}
                      disabled={waitlistStatus === 'pending'}
                    >
                      {waitlistStatus === 'pending' ? 'Saving request...' : 'Notify Me (SMS)'}
                    </GoldButton>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* {timeSlots.length > 0 && (
            <GoldButton fullWidth variant="gold" disabled={!selectedSlot} onClick={() => setStep(3)} className="h-14">
              Continue to Details
            </GoldButton>
          )} */}
        </div>
      )}

      {step === 3 && selectedDate && (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center space-x-4">
            <button onClick={() => {
              setSelectedSlot(null);
              setStep(2);
              }} className="p-2 glass-card rounded-xl text-gold transition-transform active:scale-90 border-gold/20"><ChevronLeft size={20} /></button>
            <h2 className="text-2xl font-serif italic gold-text-gradient">Confirm Booking</h2>
          </div>
          
          <div className="glass-card p-6 rounded-[2rem] border-gold/10 border space-y-3">
            <p className="text-sm text-white/80"><span className="font-bold text-gold">{customerInfo.name}</span>, please confirm your booking for <span className="font-bold text-gold">{selectedSlot}</span>.</p>
            <p className="text-xs text-white/50">A confirmation will be sent to {customerInfo.email} and {customerInfo.phone}.</p>
          </div>
          
          <div className="glass-card p-6 rounded-[2.5rem] space-y-4 border-gold/10 border relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <Clock size={64} className="text-gold" />
             </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 uppercase font-bold tracking-widest">Date</span>
              <span className="font-bold text-white">{format(selectedDate, 'MMM do, yyyy')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 uppercase font-bold tracking-widest">Time</span>
              <span className="font-bold text-gold">{selectedSlot}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] text-white/40 uppercase font-bold block leading-none mb-1">Total Fee</span>
                <span className="text-2xl font-bold gold-text-gradient italic">₪{state.settings.pricePerCut.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-white/20 uppercase font-bold italic">Private Session</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300">
            <Info size={32} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <span className="font-bold">Cancellation Policy:</span> Cancellations are accepted up to 24 hours before your scheduled appointment time.
            </p>
          </div>

          <GoldButton 
            fullWidth 
            variant="gold" 
            disabled={isBooking} 
            onClick={handleComplete}
            className="h-16 shadow-gold/20"
          >
            {isBooking ? 'Confirming...' : 'Confirm Reservation'}
          </GoldButton>
        </div>
      )}
    </div>
  );
};

export default BookingFlow;
