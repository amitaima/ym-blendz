
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { ChevronRight, Check, Calendar as CalendarIcon, Clock, BellRing, X, Sparkles, Info, AlertCircle } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, isBefore, addMinutes, isAfter } from 'date-fns';
import { he } from 'date-fns/locale';
import { generateICS, createICSDataURI } from '../../utils/calendar';
import { Booking, ShiftType } from '../../types';

const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { state, addBooking, addToWaitlist } = useApp();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ 
    name: state.currentUser?.name || '', 
    phone: state.currentUser?.phone || '',
    email: state.currentUser?.email || ''
  });
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'pending' | 'success'>('idle');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const recentBooking = useMemo(() => {
    if (step !== 4 || !state.currentUser) return null;
    
    const matchingBooking = state.bookings.find(b => 
        b.customerId === state.currentUser!.uid &&
        b.date === format(selectedDate!, 'yyyy-MM-dd') &&
        b.timeSlot === selectedSlot
    );
    return matchingBooking;
  }, [step, state.bookings, state.currentUser, selectedDate, selectedSlot]);

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

  const datesWithAvailability = useMemo(() => {
    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const blocks = state.settings.customAvailability?.[dateStr] || [];
      if (blocks.length === 0) {
        return { date, status: 'closed' };
      }

      const slots: { time: string, shiftType: ShiftType }[] = [];
      const now = new Date();
      const slotDuration = state.settings.slotDuration;

      blocks.forEach(block => {
        let current = new Date(`${dateStr}T${block.start}`);
        const end = new Date(`${dateStr}T${block.end}`);

        while (isBefore(current, end)) {
          const timeStr = format(current, 'HH:mm');
          if (!isSameDay(date, now) || isAfter(current, now)) {
            const isBooked = state.bookings.some(b => 
              b.date === dateStr && 
              b.timeSlot === timeStr && 
              b.status !== 'canceled'
            );
            if (!isBooked) {
              slots.push({ time: timeStr, shiftType: block.shiftType || ShiftType.REGULAR });
            }
          }
          current = addMinutes(current, slotDuration);
        }
      });
      
      const availableSlots = Array.from(new Set(slots));
      if (availableSlots.length > 0) {
        return { date, status: 'available' };
      } else {
        return { date, status: 'full' };
      }
    });
  }, [dates, state.settings, state.bookings]);

  const timeSlots = useMemo(() => {
    if (!selectedDate) return { regular: [], soldier: [] };
    const regularSlots: string[] = [];
    const soldierSlots: string[] = [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const blocks = state.settings.customAvailability?.[dateStr] || [];
    
    if (blocks.length === 0) return { regular: [], soldier: [] };

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
          if (!isBooked) {
            if (block.shiftType === ShiftType.SOLDIER) {
              soldierSlots.push(timeStr);
            } else {
              regularSlots.push(timeStr);
            }
          }
        }
        current = addMinutes(current, slotDuration);
      }
    });

    return {
      regular: Array.from(new Set(regularSlots)).sort(),
      soldier: Array.from(new Set(soldierSlots)).sort(),
    };
  }, [selectedDate, state.settings, state.bookings]);

  const handleComplete = async () => {
    if (!selectedSlot || !selectedDate || !selectedShiftType) return;
    setIsBooking(true);
    try {
      const result = await addBooking({
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot,
        shiftType: selectedShiftType
      });

      if (result.success) {
        setStep(4);
      } else {
        setBookingError(result.message || 'התור הזה נתפס. נא לבחור מועד אחר.');
      }
    } catch (error) {
      setBookingError('אירעה שגיאה לא צפויה. נסה שוב.');
    } finally {
      setIsBooking(false);
    }
  };
  
  const handleAddToCalendar = () => {
    if (!recentBooking) return;
    const icsContent = generateICS(recentBooking, state.settings);
    const dataUri = createICSDataURI(icsContent);
    window.location.href = dataUri;
  };

  const handleWaitlist = () => {
    if (!selectedDate) return;
    if (!customerInfo.name || !customerInfo.phone) {
      alert("יש למלא את פרטי הפרופיל תחילה.");
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

  const toggleDate = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      setStep(2);
    }
  };
  
  const handleSlotSelection = (slot: string, shiftType: ShiftType) => {
    setSelectedSlot(slot);
    setSelectedShiftType(shiftType)
    setStep(3);
  };

  if (step === 4) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(191,149,63,0.2)]">
          <Check className="w-12 h-12 text-gold" strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white gold-text-gradient">התור נקבע בהצלחה!</h2>
        <p className="text-white/60 text-base">הכיסא מוכן עבורך בשעה {selectedSlot} בתאריך {selectedDate ? format(selectedDate, 'd בMMM', { locale: he }) : ''}.</p>
        
        <div className="w-full glass-card p-6 rounded-2xl border-gold/10 border space-y-4 shadow-2xl relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-light">פעולות</p>
          <GoldButton fullWidth variant='outline' onClick={handleAddToCalendar} className="gap-5">
            <CalendarIcon size={16} />
            הוסף ליומן
          </GoldButton>
          <a 
            href="https://www.bitpay.co.il/app/me/76089096-9818-4D7F-B3B8-86F7DBC4282F" 
            target="_blank" 
            rel="noreferrer"
            className="block py-4 rounded-xl bg-pinkAccent text-white font-bold text-center shadow-lg shadow-pink-900/40 active:scale-95 transition-all relative z-10"
          >
            שלם עם BIT
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <GoldButton variant="outline" onClick={() => navigate('/profile')}>
            פרופיל
          </GoldButton>
          <GoldButton variant="gold" onClick={() => navigate('/')}>
            דף הבית
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
              <h2 className="text-xl font-serif font-bold text-white">ההזמנה נכשלה</h2>
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
              בחר מועד אחר
            </GoldButton>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 space-x-reverse">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-pinkAccent shadow-[0_0_15px_rgba(255,0,127,0.4)]' : 'bg-white/10'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold gold-text-gradient">בחירת תור</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-green-500">
              <Sparkles className="text-white w-3.5 h-3.5" />
              <span className="text-[12px] uppercase font-bold text-white tracking-widest">ימים פנויים</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {datesWithAvailability.map(({ date, status }, i) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              
              return (
                <button
                  key={i}
                  onClick={() => status !== 'closed' && toggleDate(date)}
                  disabled={status === 'closed'}
                  className={`flex flex-col items-center justify-center py-4 rounded-[1.25rem] border transition-all duration-300 relative overflow-hidden
                    ${isSelected ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(191,149,63,0.3)] scale-105 z-10' : 'glass-card text-white/80'}
                    ${status === 'available' && !isSelected ? 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : ''}
                    ${status === 'full' && !isSelected ? 'border-orange-500' : ''}
                    ${status === 'closed' || status === 'full' ? 'opacity-50' : 'hover:border-gold/30'}`
                  }
                >
                  {status === 'available' && (
                    <div className={`absolute top-3 left-3 w-1 h-1 rounded-full shadow-[0_0_6px_rgba(34,197,94,1)] ${isSelected ? 'bg-black' : 'bg-green-500'}`} />
                  )}
                  {status === 'full' && (
                    <div className={`absolute top-3 left-3 w-1 h-1 rounded-full shadow-[0_0_6px_rgba(255,165,0,1)] ${isSelected ? 'bg-black' : 'bg-orange-500'}`} />
                  )}
                  <span className={`text-[16px] uppercase font-bold tracking-tighter ${isSelected ? 'text-black/60' : 'text-white/50'}`}>{format(date, 'eee', { locale: he })}</span>
                  <span className="text-2xl font-bold">{format(date, 'd')}</span>
                  {(status === 'closed' || status === 'full') && <X className="absolute bottom-1 text-white/5 w-4 h-4 rotate-12" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && selectedDate && (
        <div className="space-y-6 animate-in slide-in-from-left-8 duration-500">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button onClick={() => {
              setSelectedDate(null);
              setStep(1);
              }} className="p-2 glass-card rounded-xl text-gold transition-transform active:scale-90 border-gold/20"><ChevronRight size={20} /></button>
            <h2 className="text-2xl font-serif font-bold gold-text-gradient">בחירת שעה</h2>
          </div>
          
          <div className="glass-card p-5 rounded-[2rem] border-gold/20 border flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                <CalendarIcon size={18} className="text-gold" />
              </div>
              <div>
                <span className="text-base font-bold block leading-tight text-white">{format(selectedDate, 'EEEE', { locale: he })}</span>
                <span className="text-[14px] text-gold/60 uppercase tracking-widest font-bold">{format(selectedDate, 'd בMMMM', { locale: he })}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {timeSlots.regular.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {timeSlots.regular.map(slot => (
                  <button
                    key={slot}
                    onClick={() => handleSlotSelection(slot, ShiftType.REGULAR)}
                    className={`py-4 rounded-2xl border text-sm font-bold transition-all duration-300
                      ${selectedSlot === slot ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(191,149,63,0.3)] scale-105' : 'glass-card border-white/5 text-white/80 hover:border-gold/30'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
            {timeSlots.soldier.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
                  <h4 className="text-center text-sm font-bold text-green-400 px-4">תור לחיילים</h4>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.soldier.map(slot => (
                    <button
                      key={slot}
                      onClick={() => handleSlotSelection(slot, ShiftType.SOLDIER)}
                      className={`py-4 rounded-2xl border text-sm font-bold transition-all duration-300
                        ${selectedSlot === slot ? 'bg-green-500 text-black border-green-700 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-105' : 'glass-card border-green-500/20 text-green-400 hover:border-green-500/30'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {timeSlots.regular.length === 0 && timeSlots.soldier.length === 0 && (
              <div className="col-span-3 py-10 text-center space-y-6">
                <div className="glass-card p-8 rounded-[2.5rem] border-gold/20 space-y-5 shadow-2xl">
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
                    <BellRing className="text-gold w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-serif font-bold text-gold">לצערנו הכל תפוס</p>
                    <p className="text-white/40 text-[12px] uppercase tracking-widest leading-relaxed">הצטרף לרשימת ההמתנה<br/>כדי לקבל התראה אם יתפנה תור</p>
                  </div>
                  
                  {waitlistStatus === 'success' ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold animate-in zoom-in">
                      ✓ נרשמת להמתנה. ניידע אותך ב-SMS!
                    </div>
                  ) : (
                    <GoldButton 
                      fullWidth 
                      variant="gold" 
                      className="py-4"
                      onClick={handleWaitlist}
                      disabled
                    >
                      בהמשך...
                    </GoldButton>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && selectedDate && (
        <div className="space-y-6 animate-in slide-in-from-left-8 duration-500">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button onClick={() => {
              setSelectedSlot(null);
              setStep(2);
              }} className="p-2 glass-card rounded-xl text-gold transition-transform active:scale-90 border-gold/20"><ChevronRight size={20} /></button>
            <h2 className="text-2xl font-serif font-bold gold-text-gradient">אישור הזמנה</h2>
          </div>
          
          <div className="glass-card p-6 rounded-[2rem] border-gold/10 border space-y-3">
            <p className="text-base text-white/80"><span className="font-bold text-gold">{customerInfo.name}</span>, נא לאשר את הזמנתך לשעה <span className="font-bold text-gold">{selectedSlot}</span>.</p>
          </div>
          
          <div className="glass-card p-6 rounded-[2.5rem] space-y-4 border-gold/10 border relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 p-6 opacity-5">
                <Clock size={64} className="text-gold" />
             </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/40 uppercase font-bold tracking-widest">תאריך</span>
              <span className="font-bold text-white">{format(selectedDate, 'd MMM, yyyy', { locale: he })}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/40 uppercase font-bold tracking-widest">שעה</span>
              <span className="font-bold text-gold">{selectedSlot}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[12px] text-white/40 uppercase font-bold block leading-none mb-1">מחיר סופי</span>
                <span className="text-2xl font-bold gold-text-gradient">₪{state.settings.pricePerCut.toFixed(2)}</span>
              </div>
              <span className="text-[12px] text-white/20 uppercase font-bold italic">תור אישי</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300">
            <Info size={40} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <span className="font-bold">מדיניות ביטולים:</span> ניתן לבטל עד 2 שעות לפני מועד התור שנקבע.
            </p>
          </div>

          <GoldButton 
            fullWidth 
            variant="gold" 
            disabled={isBooking} 
            onClick={handleComplete}
            className="h-16 shadow-gold/20"
          >
            {isBooking ? 'מאשר...' : 'אישור הזמנה'}
          </GoldButton>
        </div>
      )}
    </div>
  );
};

export default BookingFlow;
