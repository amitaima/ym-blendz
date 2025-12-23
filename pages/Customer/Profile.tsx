
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { User, Phone, Calendar, Clock, ArrowRight, XCircle, CheckCircle, Info, ShieldAlert, AlertTriangle, Mail, ChevronDown } from 'lucide-react';
import { format, isAfter, subHours, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { BookingStatus, Booking } from '../../types';
import { generateICS, createICSDataURI } from '../../utils/calendar';

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
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5);

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
    if (formData.name || formData.phone) {
      updateProfile(formData);
      setIsEditing(false);
    }
  };

  const handleAddToCalendar = (booking: Booking) => {
    const icsContent = generateICS(booking, state.settings);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const executeCancel = () => {
    if (cancelingBooking) {
      updateBookingStatus(cancelingBooking.id, BookingStatus.CANCELED);
      setCancelingBooking(null);
    }
  };

  const getCancellationStatus = (booking: Booking) => {
    const apptDate = new Date(`${booking.date}T${booking.timeSlot}`);
    const limitDate = subHours(apptDate, 2);
    return isAfter(limitDate, new Date());
  };

  if (isEditing) {
    return (
      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 glass-card rounded-xl text-gold transition-transform active:scale-90 border-gold/20"
          >
            <ArrowRight size={20} />
          </button>
          <div className="space-y-0.5 text-right">
            <h2 className="text-2xl font-serif font-bold text-white gold-text-gradient">עריכת פרופיל</h2>
            <p className="text-white/40 text-[12px] uppercase tracking-widest font-bold">עדכון פרטים אישיים</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 text-right">
            <div className="space-y-2">
              <label className="text-[12px] uppercase tracking-widest text-gold/60 font-bold mr-3">שם מלא</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ישראל ישראלי"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pr-12 focus:border-gold outline-none transition-colors text-white text-right"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] uppercase tracking-widest text-gold/60 font-bold mr-3">מספר טלפון</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 w-5 h-5" />
                <input 
                  type="tel" 
                  placeholder="050-123-4567"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pr-12 focus:border-gold outline-none transition-colors text-white text-right"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60 font-mono">{state.currentUser?.email}</span>
                <span className="text-white/20 uppercase font-bold tracking-widest">אימייל</span>
              </div>
              <div className="pt-2">
                <p className="text-[8px] text-white/20 italic leading-tight text-center">לשינוי כתובת המייל, יש ליצור קשר עם התמיכה.</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <GoldButton fullWidth variant="gold" onClick={handleSave} disabled={!formData.name}>
              שמירת שינויים
            </GoldButton>
            <button 
              onClick={() => setIsEditing(false)}
              className="w-full py-4 text-[12px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-colors"
            >
              ביטול וחזרה
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32 relative text-right">
      {cancelingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-sm rounded-[2.5rem] p-8 border-gold/20 border space-y-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            
            {getCancellationStatus(cancelingBooking) ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-gold leading-tight">לבטל את התור?</h3>
                  <p className="text-white/60 text-base leading-relaxed">
                    אתה מבטל את התור שלך בתאריך <span className="text-gold font-bold">{format(parseISO(cancelingBooking.date), 'd בMMM', { locale: he })}</span> בשעה <span className="text-gold font-bold">{cancelingBooking.timeSlot}</span>.
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <GoldButton fullWidth onClick={executeCancel} className="bg-red-600 text-black shadow-red-900/40">כן, בטל את התור</GoldButton>
                  <button onClick={() => setCancelingBooking(null)} className="w-full py-4 text-sm uppercase tracking-widest font-bold text-white/60">השאר את התור</button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-white leading-tight">לא ניתן לבטל</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    מדיניות קפדנית: לא ניתן לנהל תורים פחות מ-<span className="text-gold font-bold">2 שעות</span> לפני המועד.
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/60 text-right">
                  <div className="flex items-center justify-start gap-2 mb-2">
                    <ShieldAlert size={14} className="text-gold" />
                    <span className="font-bold text-gold uppercase tracking-widest text-[8px]">כללי העסק</span>
                  </div>
                  נא ליצור קשר ישירות עם YM Blendz למקרי חירום.
                </div>
                <GoldButton fullWidth variant="outline" onClick={() => setCancelingBooking(null)}>הבנתי</GoldButton>
              </>
            )}
          </div>
        </div>
      )}

      <div className="glass-card p-6 rounded-[2rem] border-gold/20 border relative overflow-hidden group shadow-[0_0_30px_rgba(191,149,63,0.05)]">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
        <div className="flex justify-between items-start mb-6">
          <div className="text-right">
            <h2 className="text-2xl font-serif font-bold text-gold transition-all duration-500">
              {state.currentUser?.name}
            </h2>
            <p className="text-sm text-white/40 font-mono tracking-tighter">{state.currentUser?.email}</p>
            <p className="text-sm text-white/20 font-mono mt-1">{state.currentUser?.phone}</p>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[14px] uppercase tracking-widest text-gold font-bold px-3 py-1 bg-gold/10 rounded-full border border-gold/20 hover:bg-gold/20 transition-all z-10"
          >
            עריכה
          </button>
        </div>
        <div className="flex items-center justify-start space-x-2 space-x-reverse text-gold">
          <CheckCircle size={16} />
          <span className="text-[14px] uppercase font-bold tracking-widest">חבר פרימיום</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif font-bold text-2xl flex items-center justify-start gap-2 gold-text-gradient">
          התורים שלי
          {upcoming.length > 0 && <span className="text-[16px] bg-gold/20 text-gold px-2 py-0.5 rounded-full not-italic border border-gold/10">{upcoming.length}</span>}
        </h3>
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map(b => (
              <div key={b.id} className="glass-card p-5 rounded-2xl border-gold/10 border relative">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 text-right">
                    <div className="flex items-center justify-end space-x-3 space-x-reverse text-gold">
                      <Calendar size={16} />
                      <span className="text-base font-bold">{format(parseISO(b.date), 'EEEE, d בMMM', { locale: he })}</span>
                    </div>
                    <div className="flex items-center justify-start space-x-3 space-x-reverse text-white/60">
                      <Clock size={16} />
                      <span className="text-base">{b.timeSlot} ({state.settings.slotDuration} דק')</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCancelingBooking(b)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <XCircle size={22} />
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <GoldButton 
                        variant="outline" 
                        onClick={() => handleAddToCalendar(b)} 
                        className="px-4 text-xs flex items-center h-10 gap-2"
                    >
                        <Calendar size={18}/>
                    </GoldButton>
                    <GoldButton 
                        variant="pink" 
                        onClick={() => window.open('https://www.bitpay.co.il/app/me/76089096-9818-4D7F-B3B8-86F7DBC4282F', '_blank')} 
                        className="px-6 text-base flex items-center h-10 shadow-xl"
                    >
                        שלם בביט
                    </GoldButton>
                  </div>
                  <div className="text-right">
                      <span className="text-[14px] text-white/30 uppercase font-bold tracking-widest">מחיר</span>
                      <span className="text-base font-bold text-gold block">₪{state.settings.pricePerCut}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 rounded-2xl border-dashed border border-white/10 text-center flex flex-col items-center justify-center space-y-4">
            <p className="text-white/30 italic text-sm">אין תורים קרובים.</p>
            <GoldButton variant="gold" className="scale-90 py-3 mx-auto" onClick={() => navigate('/book')}>
              הזמן תור
            </GoldButton>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-serif font-bold text-xl gold-text-gradient text-right">היסטוריית תורים</h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.slice(0, visibleHistoryCount).map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 glass-card rounded-xl border-white/5 border opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 animate-in fade-in">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${b.status === BookingStatus.COMPLETED ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {b.status === BookingStatus.COMPLETED ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{format(parseISO(b.date), 'd MMM, yyyy', { locale: he })}</p>
                    <p className="text-[14px] text-white/40 uppercase tracking-tighter font-bold">{b.status === 'completed' ? 'הושלם' : 'בוטל'}</p>
                  </div>
                </div>
                <span className="text-[14px] font-bold text-white/20">₪{state.settings.pricePerCut}</span>
              </div>
            ))}
            {history.length > visibleHistoryCount && (
                <button 
                    onClick={() => setVisibleHistoryCount(prev => prev + 5)} 
                    className="w-full text-center py-3 text-sm uppercase tracking-widest font-bold text-gold/60 hover:text-gold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <ChevronDown size={16} className="transition-transform" />
                    הצג עוד
                </button>
            )}
          </div>
        ) : (
          <p className="text-center py-8 text-white/20 text-sm italic">ההיסטוריה שלך תתחיל אחרי התספורת הראשונה.</p>
        )}
      </div>

      <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start space-x-3 space-x-reverse">
        <Info className="text-gold w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-[12px] text-white/40 leading-relaxed text-right">
          <span className="text-gold font-bold">מדיניות:</span> ניתן לבטל או לשנות מועד עד 2 שעות לפני התור. ביטול מאוחר עלול לגרור חיוב בביקור הבא.
        </p>
      </div>
    </div>
  );
};

export default CustomerProfile;
