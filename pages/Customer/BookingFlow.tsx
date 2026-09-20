import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { ChevronRight, Check, Calendar as CalendarIcon, Clock, BellRing, X, Sparkles, Info, AlertCircle, Scissors, UserCheck } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, isBefore, addMinutes, isAfter } from 'date-fns';
import { he } from 'date-fns/locale';
import { generateICS, createICSDataURI } from '../../utils/calendar';
import { Booking, BookingStatus, ShiftType, BarberId } from '../../types';
import { getBarberName, getBarberPrice } from '../../constants';

interface AvailableSlot {
  time: string;
  shiftType: ShiftType;
  barberId: BarberId;
  barberName: string;
  price: number;
}

const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { state, addBooking, addToWaitlist } = useApp();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBarberTab, setSelectedBarberTab] = useState<'all' | BarberId>('all');
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<AvailableSlot | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ 
    name: state.currentUser?.name || '', 
    phone: state.currentUser?.phone || '',
    email: state.currentUser?.email || ''
  });
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'pending' | 'success'>('idle');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const recentBooking = useMemo(() => {
    if (step !== 4 || !state.currentUser || !selectedDate || !selectedSlotInfo) return null;
    
    const matchingBooking = state.bookings.find(b => 
        b.customerId === state.currentUser!.uid &&
        b.date === format(selectedDate, 'yyyy-MM-dd') &&
        b.timeSlot === selectedSlotInfo.time &&
        (b.barberId || 'yoav') === selectedSlotInfo.barberId
    );
    return matchingBooking;
  }, [step, state.bookings, state.currentUser, selectedDate, selectedSlotInfo]);

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

      const now = new Date();
      const slotDuration = state.settings.slotDuration;
      let hasAvailableSlot = false;

      for (const block of blocks) {
        const barberId: BarberId = block.barberId || 'yoav';
        let current = new Date(`${dateStr}T${block.start}`);
        const end = new Date(`${dateStr}T${block.end}`);

        while (isBefore(current, end)) {
          const timeStr = format(current, 'HH:mm');
          if (!isSameDay(date, now) || isAfter(current, now)) {
            const isBooked = state.bookings.some(b => 
              b.date === dateStr && 
              (b.barberId || 'yoav') === barberId &&
              b.timeSlot === timeStr && 
              b.status !== BookingStatus.CANCELED
            );
            if (!isBooked) {
              hasAvailableSlot = true;
              break;
            }
          }
          current = addMinutes(current, slotDuration);
        }
        if (hasAvailableSlot) break;
      }

      return { date, status: hasAvailableSlot ? 'available' : 'full' };
    });
  }, [dates, state.settings, state.bookings]);

  const slotsByBarber = useMemo(() => {
    if (!selectedDate) return { yoav: [], dvir: [] };
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const blocks = state.settings.customAvailability?.[dateStr] || [];
    
    const yoavSlots: AvailableSlot[] = [];
    const dvirSlots: AvailableSlot[] = [];
    
    if (blocks.length === 0) return { yoav: [], dvir: [] };

    const slotDuration = state.settings.slotDuration;
    const now = new Date();

    blocks.forEach(block => {
      const barberId: BarberId = block.barberId || 'yoav';
      const barberName = block.barberName || getBarberName(barberId);
      const price = getBarberPrice(state.settings, barberId);

      let current = new Date(`${dateStr}T${block.start}`);
      const end = new Date(`${dateStr}T${block.end}`);

      while (isBefore(current, end)) {
        const timeStr = format(current, 'HH:mm');
        if (!isSameDay(selectedDate, now) || isAfter(current, now)) {
          const isBooked = state.bookings.some(b => 
            b.date === dateStr && 
            (b.barberId || 'yoav') === barberId &&
            b.timeSlot === timeStr && 
            b.status !== BookingStatus.CANCELED
          );
          if (!isBooked) {
            const slotItem: AvailableSlot = {
              time: timeStr,
              shiftType: block.shiftType || ShiftType.REGULAR,
              barberId,
              barberName,
              price
            };
            if (barberId === 'dvir') {
              dvirSlots.push(slotItem);
            } else {
              yoavSlots.push(slotItem);
            }
          }
        }
        current = addMinutes(current, slotDuration);
      }
    });

    const dedupeAndSort = (list: AvailableSlot[]) => {
      const map = new Map<string, AvailableSlot>();
      list.forEach(item => {
        if (!map.has(item.time)) {
          map.set(item.time, item);
        }
      });
      return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
    };

    return {
      yoav: dedupeAndSort(yoavSlots),
      dvir: dedupeAndSort(dvirSlots)
    };
  }, [selectedDate, state.settings, state.bookings]);

  const yoavPrice = getBarberPrice(state.settings, 'yoav');
  const dvirPrice = getBarberPrice(state.settings, 'dvir');

  const totalSlotsCount = slotsByBarber.yoav.length + slotsByBarber.dvir.length;

  const handleComplete = async () => {
    if (!selectedSlotInfo || !selectedDate) return;
    setIsBooking(true);
    try {
      const result = await addBooking({
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlotInfo.time,
        shiftType: selectedSlotInfo.shiftType,
        barberId: selectedSlotInfo.barberId,
        barberName: selectedSlotInfo.barberName,
        price: selectedSlotInfo.price
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
      setSelectedBarberTab('all');
      setSelectedSlotInfo(null);
      setStep(2);
    }
  };
  
  const handleSlotSelection = (slot: AvailableSlot) => {
    setSelectedSlotInfo(slot);
    setStep(3);
  };

  if (step === 4) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in zoom-in duration-500 text-right">
        <div className="w-24 h-24 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mb-2 mx-auto shadow-[0_0_30px_rgba(191,149,63,0.2)]">
          <Check className="w-12 h-12 text-gold" strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white gold-text-gradient text-center">התור נקבע בהצלחה!</h2>
        <p className="text-white/70 text-base text-center">
          הכיסא מוכן עבורך אצל <span className="text-gold font-bold">{selectedSlotInfo?.barberName}</span> בשעה <span className="text-gold font-bold">{selectedSlotInfo?.time}</span> בתאריך {selectedDate ? format(selectedDate, 'd בMMM', { locale: he }) : ''}.
        </p>
        
        <div className="w-full glass-card p-6 rounded-2xl border-gold/20 border space-y-4 shadow-2xl relative overflow-hidden text-right">
          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
            <span className="text-white/40">ספר:</span>
            <span className="font-bold text-gold">{selectedSlotInfo?.barberName}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
            <span className="text-white/40">מחיר לתשלום:</span>
            <span className="font-bold text-white text-lg">₪{selectedSlotInfo?.price}</span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-gold text-center">פעולות מהירות</p>
          <GoldButton fullWidth variant='outline' onClick={handleAddToCalendar} className="gap-3">
            <CalendarIcon size={16} />
            הוסף ליומן
          </GoldButton>
          <a 
            href="https://www.bitpay.co.il/app/me/76089096-9818-4D7F-B3B8-86F7DBC4282F" 
            target="_blank" 
            rel="noreferrer"
            className="block py-4 rounded-xl bg-pinkAccent text-white font-bold text-center shadow-lg shadow-pink-900/40 active:scale-95 transition-all relative z-10"
          >
            שלם עם BIT (₪{selectedSlotInfo?.price})
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
    <div className="p-6 space-y-4 animate-in fade-in duration-500 pb-32 text-right">
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
                setSelectedSlotInfo(null);
                setStep(2);
              }}
            >
              בחר מועד אחר
            </GoldButton>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center space-x-2 space-x-reverse">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-pinkAccent shadow-[0_0_15px_rgba(255,0,127,0.4)]' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Step 1: Date Selection */}
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

      {/* Step 2: Select Time with Barber Splitter & Tabs */}
      {step === 2 && selectedDate && (
        <div className="space-y-5 animate-in slide-in-from-left-8 duration-500">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button onClick={() => {
              setSelectedDate(null);
              setSelectedSlotInfo(null);
              setStep(1);
            }} className="p-2 glass-card rounded-xl text-gold transition-transform active:scale-90 border-gold/20">
              <ChevronRight size={20} />
            </button>
            <h2 className="text-2xl font-serif font-bold gold-text-gradient">בחירת שעה וספר</h2>
          </div>
          
          {/* Selected Date Header */}
          <div className="glass-card p-4 rounded-[1.75rem] border-gold/20 border flex items-center justify-between shadow-xl">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-11 h-11 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                <CalendarIcon size={18} className="text-gold" />
              </div>
              <div>
                <span className="text-base font-bold block leading-tight text-white">{format(selectedDate, 'EEEE', { locale: he })}</span>
                <span className="text-xs text-gold/60 uppercase tracking-widest font-bold">{format(selectedDate, 'd בMMMM', { locale: he })}</span>
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-white/5 rounded-full text-white/60 font-medium">
              {totalSlotsCount} שעות פנויות
            </span>
          </div>

          {/* Barber Filter Switcher / Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setSelectedBarberTab('all')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                selectedBarberTab === 'all'
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              הכל ({totalSlotsCount})
            </button>

            <button
              onClick={() => setSelectedBarberTab('yoav')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                selectedBarberTab === 'yoav'
                  ? 'bg-gold/20 text-gold shadow-sm border border-gold/40'
                  : 'text-white/40 hover:text-gold/70'
              }`}
            >
              <span>יואב (₪{yoavPrice})</span>
              <span className="text-[10px] opacity-75">{slotsByBarber.yoav.length} פנויים</span>
            </button>

            <button
              onClick={() => setSelectedBarberTab('dvir')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                selectedBarberTab === 'dvir'
                  ? 'bg-sky-500/20 text-sky-400 shadow-sm border border-sky-500/40'
                  : 'text-white/40 hover:text-sky-400/70'
              }`}
            >
              <span>דביר (₪{dvirPrice})</span>
              <span className="text-[10px] opacity-75">{slotsByBarber.dvir.length} פנויים</span>
            </button>
          </div>

          {/* Slots Content Area */}
          <div className="space-y-6">
            {totalSlotsCount === 0 ? (
              <div className="py-10 text-center space-y-6">
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
            ) : (
              <>
                {/* Yoav Section */}
                {(selectedBarberTab === 'all' || selectedBarberTab === 'yoav') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-xs font-bold">
                          י
                        </div>
                        <span className="font-bold text-white text-sm">יואב מלכה <span className="text-xs text-gold font-normal">(ספר ראשי)</span></span>
                      </div>
                      <span className="text-xs font-bold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20">
                        ₪{yoavPrice} לתספורת
                      </span>
                    </div>

                    {slotsByBarber.yoav.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2.5">
                        {slotsByBarber.yoav.map(slot => {
                          const isSelected = selectedSlotInfo?.time === slot.time && selectedSlotInfo?.barberId === 'yoav';
                          const isSoldier = slot.shiftType === ShiftType.SOLDIER;
                          return (
                            <button
                              key={`yoav-${slot.time}`}
                              onClick={() => handleSlotSelection(slot)}
                              className={`py-3.5 px-2 rounded-2xl border text-center transition-all duration-300 relative flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? 'bg-gold text-black border-gold shadow-[0_0_15px_rgba(191,149,63,0.4)] scale-105 font-black'
                                  : isSoldier
                                    ? 'glass-card border-green-500/30 text-green-400 hover:border-green-500'
                                    : 'glass-card border-white/5 text-white/90 hover:border-gold/40 hover:bg-gold/5'
                              }`}
                            >
                              <span className="text-base font-bold leading-tight">{slot.time}</span>
                              <div className="flex items-center gap-1">
                                <span className={`text-[11px] font-medium ${isSelected ? 'text-black/75' : 'text-gold'}`}>₪{slot.price}</span>
                                {isSoldier && (
                                  <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-black/20 text-black' : 'bg-green-500/20 text-green-400'}`}>חיילים</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-white/40">
                        אין תורים פנויים ליואב בתאריך זה
                      </div>
                    )}
                  </div>
                )}

                {/* SPLITTER BETWEEN THE TWO BARBERS (shown when tab is 'all') */}
                {selectedBarberTab === 'all' && (
                  <div className="relative py-3 flex items-center justify-center my-2">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="absolute px-4 bg-[#0a0a0c] text-white/50 text-xs font-bold flex items-center gap-2 border border-white/10 rounded-full py-1">
                      <Scissors size={12} className="text-sky-400" />
                      <span>אפשרות נוספת • דביר חניה</span>
                    </div>
                  </div>
                )}

                {/* Dvir Section */}
                {(selectedBarberTab === 'all' || selectedBarberTab === 'dvir') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 text-xs font-bold">
                          ד
                        </div>
                        <span className="font-bold text-white text-sm">דביר חניה <span className="text-xs text-sky-400 font-normal">(ספר משני)</span></span>
                      </div>
                      <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                        ₪{dvirPrice} לתספורת
                      </span>
                    </div>

                    {slotsByBarber.dvir.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2.5">
                        {slotsByBarber.dvir.map(slot => {
                          const isSelected = selectedSlotInfo?.time === slot.time && selectedSlotInfo?.barberId === 'dvir';
                          const isSoldier = slot.shiftType === ShiftType.SOLDIER;
                          return (
                            <button
                              key={`dvir-${slot.time}`}
                              onClick={() => handleSlotSelection(slot)}
                              className={`py-3.5 px-2 rounded-2xl border text-center transition-all duration-300 relative flex flex-col items-center justify-center gap-1 ${
                                isSelected
                                  ? 'bg-sky-500 text-black border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] scale-105 font-black'
                                  : isSoldier
                                    ? 'glass-card border-green-500/30 text-green-400 hover:border-green-500'
                                    : 'glass-card border-sky-500/10 text-white/90 hover:border-sky-500/40 hover:bg-sky-500/5'
                              }`}
                            >
                              <span className="text-base font-bold leading-tight">{slot.time}</span>
                              <div className="flex items-center gap-1">
                                <span className={`text-[11px] font-medium ${isSelected ? 'text-black/75' : 'text-sky-400'}`}>₪{slot.price}</span>
                                {isSoldier && (
                                  <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-black/20 text-black' : 'bg-green-500/20 text-green-400'}`}>חיילים</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-white/40">
                        אין תורים פנויים לדביר בתאריך זה
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Order Confirmation */}
      {step === 3 && selectedDate && selectedSlotInfo && (
        <div className="space-y-6 animate-in slide-in-from-left-8 duration-500">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button onClick={() => {
              setSelectedSlotInfo(null);
              setStep(2);
            }} className="p-2 glass-card rounded-xl text-gold transition-transform active:scale-90 border-gold/20">
              <ChevronRight size={20} />
            </button>
            <h2 className="text-2xl font-serif font-bold gold-text-gradient">אישור הזמנה</h2>
          </div>
          
          <div className="glass-card p-5 rounded-[2rem] border-gold/10 border space-y-2 text-right">
            <p className="text-base text-white/80">
              <span className="font-bold text-gold">{customerInfo.name || 'לקוח יקר'}</span>, נא לאשר את פרטי התור שלך:
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-[2.5rem] space-y-4 border-gold/20 border relative overflow-hidden shadow-2xl text-right">
            <div className="absolute top-0 left-0 p-6 opacity-5">
              <Clock size={64} className="text-gold" />
            </div>

            {/* Barber Choice */}
            <div className="flex justify-between items-center text-sm pb-2 border-b border-white/5">
              <span className="text-white/40 font-bold">ספר נבחר</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  selectedSlotInfo.barberId === 'dvir'
                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                    : 'bg-gold/15 text-gold border-gold/30'
                }`}>
                  {selectedSlotInfo.barberId === 'dvir' ? 'ספר משני' : 'ספר ראשי'}
                </span>
                <span className="font-bold text-white text-base">{selectedSlotInfo.barberName}</span>
              </div>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/40 font-bold">תאריך</span>
              <span className="font-bold text-white">{format(selectedDate, 'd בMMMM, yyyy', { locale: he })}</span>
            </div>

            {/* Time */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/40 font-bold">שעה</span>
              <span className="font-bold text-gold text-lg">{selectedSlotInfo.time}</span>
            </div>

            {/* Shift Type if soldier */}
            {selectedSlotInfo.shiftType === ShiftType.SOLDIER && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40 font-bold">סוג תור</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-bold">תור חיילים</span>
              </div>
            )}

            <div className="h-px bg-white/5" />

            {/* Price */}
            <div className="flex justify-between items-end pt-1">
              <div>
                <span className="text-xs text-white/40 uppercase font-bold block leading-none mb-1">מחיר לתשלום</span>
                <span className="text-3xl font-bold gold-text-gradient">₪{selectedSlotInfo.price.toFixed(2)}</span>
              </div>
              <span className="text-xs text-white/30 font-medium">תשלום במקום / BIT</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300">
            <Info size={24} className="shrink-0 mt-0.5" />
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
            {isBooking ? 'מאשר תור...' : `אישור הזמנה (₪${selectedSlotInfo.price})`}
          </GoldButton>
        </div>
      )}
    </div>
  );
};

export default BookingFlow;
