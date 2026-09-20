import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { 
  Plus, 
  Receipt, 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  Trash2, 
  Scissors, 
  TrendingUp, 
  HandCoins, 
  ChevronDown, 
  Calendar, 
  CalendarDays, 
  History 
} from 'lucide-react';
import { format, parseISO, isSameMonth, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import { BookingStatus, BarberId } from '../../types';
import { getBarberPrice, getDvirCommission } from '../../constants';

type FinanceBarber = 'yoav' | 'dvir' | 'all';
type TimeRange = 'all' | 'this_month' | 'last_month';

const AdminFinance: React.FC = () => {
  const { state, addExpense, getFinancialStats, deleteExpense } = useApp();
  const [selectedBarber, setSelectedBarber] = useState<FinanceBarber>('yoav');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newExp, setNewExp] = useState({ title: '', amount: 0 });

  // Scroll to top when opening the page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const now = new Date();
  const prevMonth = subMonths(now, 1);
  const dvirCommissionRate = getDvirCommission(state.settings);

  const handleAddExpense = () => {
    if (!newExp.title || newExp.amount <= 0) return;
    addExpense({
      ...newExp,
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setNewExp({ title: '', amount: 0 });
    setShowAdd(false);
  };

  // Filter helper by selected time range
  const filterByTimeRange = (dateStr: string): boolean => {
    if (timeRange === 'all') return true;
    if (!dateStr) return false;
    try {
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) return false;
      if (timeRange === 'this_month') {
        return isSameMonth(parsed, now) && parsed.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'last_month') {
        return isSameMonth(parsed, prevMonth) && parsed.getFullYear() === prevMonth.getFullYear();
      }
    } catch {
      return false;
    }
    return true;
  };

  const completedBookings = useMemo(() => {
    return state.bookings
      .filter(b => b.status === BookingStatus.COMPLETED)
      .filter(b => filterByTimeRange(b.date))
      .slice()
      .reverse();
  }, [state.bookings, timeRange]);

  const filteredExpenses = useMemo(() => {
    return state.expenses
      .filter(e => filterByTimeRange(e.date))
      .slice()
      .reverse();
  }, [state.expenses, timeRange]);

  const stats = useMemo(() => {
    return getFinancialStats(completedBookings, filteredExpenses);
  }, [completedBookings, filteredExpenses, state.settings]);

  const yoavBookings = completedBookings.filter(b => (b.barberId || 'yoav') === 'yoav');
  const dvirBookings = completedBookings.filter(b => b.barberId === 'dvir');

  const getTimeRangeLabel = () => {
    if (timeRange === 'this_month') {
      return `חודש נוכחי (${format(now, 'MMMM yyyy', { locale: he })})`;
    }
    if (timeRange === 'last_month') {
      return `חודש קודם (${format(prevMonth, 'MMMM yyyy', { locale: he })})`;
    }
    return 'כל הזמנים (מתחילת הפעילות)';
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 text-right pb-32">
      {/* Header */}
      <div className="flex justify-between items-center flex-row-reverse">
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="p-3 bg-gold/10 text-gold rounded-xl border border-gold/30 hover:bg-gold/20 transition-colors"
          title="הוסף הוצאה"
        >
          <Plus size={20} className={`transition-transform duration-300 ${showAdd ? 'rotate-45' : ''}`} />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold gold-text-gradient">ספר חשבונות</h1>
          <p className="text-[12px] text-white/40 font-bold uppercase tracking-wider">מעקב הכנסות, עמלות והוצאות</p>
        </div>
      </div>

      {/* Barber Selector Dropdown */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">בחר חשבון / ספר</label>
        <div className="relative">
          <select
            value={selectedBarber}
            onChange={e => setSelectedBarber(e.target.value as FinanceBarber)}
            className={`w-full bg-black/60 border rounded-2xl p-3.5 pr-11 pl-10 font-bold text-sm outline-none transition-all appearance-none text-right cursor-pointer shadow-lg ${
              selectedBarber === 'yoav'
                ? 'border-gold/40 text-gold focus:border-gold shadow-[0_0_15px_rgba(191,149,63,0.15)]'
                : selectedBarber === 'dvir'
                ? 'border-sky-500/40 text-sky-400 focus:border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                : 'border-white/20 text-white focus:border-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
            }`}
          >
            <option value="yoav" className="bg-[#121214] text-gold">✂️ יואב מלכה (ספר ראשי)</option>
            <option value="dvir" className="bg-[#121214] text-sky-400">✂️ דביר חניה (ספר משני)</option>
            <option value="all" className="bg-[#121214] text-white">📊 עסק כולל (הכל)</option>
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {selectedBarber === 'yoav' ? (
              <Scissors size={18} className="text-gold" />
            ) : selectedBarber === 'dvir' ? (
              <Scissors size={18} className="text-sky-400" />
            ) : (
              <TrendingUp size={18} className="text-white/70" />
            )}
          </div>
          <ChevronDown size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* Time Range Tabs (All Time, This Month, Last Month) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-white/40">
          <span>טווח זמנים</span>
          <span className="text-[10px] text-gold/80 font-medium">{getTimeRangeLabel()}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => setTimeRange('all')}
            className={`py-2.5 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              timeRange === 'all'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Calendar size={13} />
            <span>כל הזמנים</span>
          </button>

          <button
            onClick={() => setTimeRange('this_month')}
            className={`py-2.5 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              timeRange === 'this_month'
                ? 'bg-gold text-black shadow-[0_0_15px_rgba(191,149,63,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <CalendarDays size={13} />
            <span>חודש נוכחי</span>
          </button>

          <button
            onClick={() => setTimeRange('last_month')}
            className={`py-2.5 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              timeRange === 'last_month'
                ? 'bg-gold text-black shadow-[0_0_15px_rgba(191,149,63,0.3)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <History size={13} />
            <span>חודש קודם</span>
          </button>
        </div>
      </div>

      {/* Add Expense Modal Form */}
      {showAdd && (
        <div className="glass-card p-6 rounded-2xl border-gold/20 border space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gold-light">הוסף הוצאה חדשה לעסק</h3>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="כותרת (למשל, מכונת תספורת, חומרי חיטוי)"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-gold outline-none text-sm text-right text-white"
              value={newExp.title}
              onChange={e => setNewExp(p => ({ ...p, title: e.target.value }))}
            />
            <input 
              type="number" 
              placeholder="סכום (₪)"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-gold outline-none text-sm text-right text-white"
              value={newExp.amount || ''}
              onChange={e => setNewExp(p => ({ ...p, amount: parseFloat(e.target.value) }))}
            />
            <GoldButton fullWidth onClick={handleAddExpense}>רשום הוצאה</GoldButton>
          </div>
        </div>
      )}

      {/* TAB 1: YOAV */}
      {selectedBarber === 'yoav' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border-gold/20 border relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 w-36 h-36 bg-gold/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
                ספר ראשי
              </span>
              <p className="text-[12px] uppercase tracking-[0.2em] font-bold text-white/40">חשבון יואב מלכה</p>
            </div>

            <div>
              <p className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1">
                רווח נקי של יואב ({timeRange === 'all' ? 'כולל' : timeRange === 'this_month' ? 'חודש נוכחי' : 'חודש קודם'})
              </p>
              <h2 className={`text-5xl font-serif font-bold ${stats.yoav.net >= 0 ? 'text-gold' : 'text-red-500'}`}>
                ₪{stats.yoav.net.toLocaleString()}
              </h2>
              <p className="text-xs text-white/40 mt-1">
                כולל תספורות יואב (100%) + עמלה של ₪{dvirCommissionRate} מכל תספורת של דביר, בניכוי הוצאות
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[11px] text-white/40 font-bold">תספורות יואב</p>
                <p className="font-bold text-white text-base">₪{stats.yoav.directIncome}</p>
                <p className="text-[10px] text-white/30">{stats.yoav.cutsCount} תספורות</p>
              </div>

              <div className="p-3 rounded-xl bg-gold/5 border border-gold/20">
                <p className="text-[11px] text-gold font-bold">עמלות מדביר (₪{dvirCommissionRate})</p>
                <p className="font-bold text-gold text-base">₪{stats.yoav.dvirCommission}</p>
                <p className="text-[10px] text-gold/60">{stats.dvir.cutsCount} תספורות דביר</p>
              </div>

              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                <p className="text-[11px] text-red-400 font-bold">הוצאות עסק</p>
                <p className="font-bold text-red-400 text-base">₪{stats.yoav.expenses}</p>
                <p className="text-[10px] text-white/30">{filteredExpenses.length} פריטים</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[11px] text-white/40 font-bold">סך הכנסה ברוטו</p>
                <p className="font-bold text-white text-base">₪{stats.yoav.totalIncome}</p>
                <p className="text-[10px] text-white/30">לפני הוצאות</p>
              </div>
            </div>
          </div>

          {/* Activity for Yoav */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-gold flex items-center gap-2">
              <Scissors size={18} />
              <span>תנועות בחשבון יואב ({yoavBookings.length + stats.dvir.cutsCount + filteredExpenses.length} פריטים)</span>
            </h3>
            
            <div className="space-y-2">
              {/* Commissions from Dvir */}
              {dvirBookings.map(b => (
                <div key={`comm_${b.id}`} className="flex justify-between items-center p-4 glass-card rounded-xl border border-gold/20 bg-gold/5">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 rounded-lg bg-gold/15 text-gold">
                      <HandCoins size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">עמלה מתספורת דביר (לקוח: {b.customerName})</p>
                      <p className="text-[12px] text-white/40">{format(new Date(b.date), 'd בMMM yyyy', { locale: he })} • {b.timeSlot}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gold text-sm">+₪{Math.min(dvirCommissionRate, typeof b.price === 'number' ? b.price : getBarberPrice(state.settings, 'dvir'))}</span>
                </div>
              ))}

              {/* Direct Haircuts by Yoav */}
              {yoavBookings.map(b => {
                const cutPrice = typeof b.price === 'number' ? b.price : getBarberPrice(state.settings, 'yoav');
                return (
                  <div key={b.id} className="flex justify-between items-center p-4 glass-card rounded-xl border-white/5 border">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                        <Wallet size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">תספורת יואב: {b.customerName}</p>
                        <p className="text-[12px] text-white/40">{format(new Date(b.date), 'd בMMM yyyy', { locale: he })} • {b.timeSlot}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-400 text-sm">+₪{cutPrice}</span>
                  </div>
                );
              })}

              {/* Expenses */}
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center p-4 glass-card rounded-xl border-red-500/10 border bg-red-500/5">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                      <Receipt size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{exp.title}</p>
                      <p className="text-[12px] text-white/40">{format(new Date(exp.date), 'd בMMM yyyy', { locale: he })}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 gap-3">
                    <span className="font-bold text-red-500 text-sm">-₪{exp.amount}</span>
                    <button onClick={() => deleteExpense(exp.id)} className="w-8 h-8 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {yoavBookings.length === 0 && dvirBookings.length === 0 && filteredExpenses.length === 0 && (
                <div className="py-12 text-center text-white/30 italic text-sm glass-card rounded-2xl">
                  אין תנועות בחשבון יואב בתקופה זו
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DVIR */}
      {selectedBarber === 'dvir' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border-sky-500/20 border relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 w-36 h-36 bg-sky-500/10 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                ספר משני
              </span>
              <p className="text-[12px] uppercase tracking-[0.2em] font-bold text-white/40">חשבון דביר חניה</p>
            </div>

            <div>
              <p className="text-[11px] text-white/40 uppercase font-bold tracking-wider mb-1">
                רווח נקי שנשאר לדביר ({timeRange === 'all' ? 'כולל' : timeRange === 'this_month' ? 'חודש נוכחי' : 'חודש קודם'})
              </p>
              <h2 className="text-5xl font-serif font-bold text-sky-400">
                ₪{stats.dvir.netEarnings.toLocaleString()}
              </h2>
              <p className="text-xs text-white/40 mt-1">
                מכל תספורת (₪{state.settings.barbers?.dvir?.price ?? 35}), מופרשים ₪{dvirCommissionRate} ליואב והיתרה (₪{Math.max(0, (state.settings.barbers?.dvir?.price ?? 35) - dvirCommissionRate)}) עוברת לדביר
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[11px] text-white/40 font-bold">סך הכנסה ברוטו</p>
                <p className="font-bold text-white text-base">₪{stats.dvir.grossIncome}</p>
                <p className="text-[10px] text-white/30">{stats.dvir.cutsCount} תספורות</p>
              </div>

              <div className="p-3 rounded-xl bg-gold/5 border border-gold/20">
                <p className="text-[11px] text-gold font-bold">עמלה שהועברה ליואב</p>
                <p className="font-bold text-gold text-base">₪{stats.dvir.yoavCommission}</p>
                <p className="text-[10px] text-gold/60">₪{dvirCommissionRate} × {stats.dvir.cutsCount}</p>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
                <p className="text-[11px] text-sky-400 font-bold">נטו ביד לדביר</p>
                <p className="font-bold text-sky-400 text-base">₪{stats.dvir.netEarnings}</p>
                <p className="text-[10px] text-sky-400/60">₪{Math.max(0, (state.settings.barbers?.dvir?.price ?? 35) - dvirCommissionRate)} לתספורת</p>
              </div>
            </div>
          </div>

          {/* Activity for Dvir */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-lg text-sky-400 flex items-center gap-2">
              <Scissors size={18} />
              <span>תספורות דביר חניה ({dvirBookings.length})</span>
            </h3>

            <div className="space-y-2">
              {dvirBookings.map(b => {
                const cutPrice = typeof b.price === 'number' ? b.price : getBarberPrice(state.settings, 'dvir');
                const yoavComm = Math.min(dvirCommissionRate, cutPrice);
                const dvirNet = Math.max(0, cutPrice - yoavComm);

                return (
                  <div key={b.id} className="p-4 glass-card rounded-xl border-white/5 border space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                          <Wallet size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">תספורת: {b.customerName}</p>
                          <p className="text-[12px] text-white/40">{format(new Date(b.date), 'd בMMM yyyy', { locale: he })} • {b.timeSlot}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="text-base font-bold text-sky-400 block">+₪{dvirNet} נטו</span>
                        <span className="text-[11px] text-white/40">מחיר מלא: ₪{cutPrice}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[11px] text-white/40 px-1">
                      <span>עמלה מועברת ליואב: <strong className="text-gold">₪{yoavComm}</strong></span>
                      <span>רווח לדביר: <strong className="text-sky-400">₪{dvirNet}</strong></span>
                    </div>
                  </div>
                );
              })}

              {dvirBookings.length === 0 && (
                <div className="py-12 text-center text-white/30 italic text-sm glass-card rounded-2xl">
                  אין עדיין תספורות רשומות לדביר חניה בתקופה זו
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALL */}
      {selectedBarber === 'all' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/10 border relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
            
            <p className="text-[12px] uppercase tracking-[0.3em] font-bold text-white/40">
              מאזן כולל - מספרה ({timeRange === 'all' ? 'כל הזמנים' : timeRange === 'this_month' ? 'חודש נוכחי' : 'חודש קודם'})
            </p>
            <h2 className={`text-5xl font-serif font-bold ${stats.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ₪{stats.net.toLocaleString()}
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 space-x-reverse p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="p-2 bg-green-500/20 rounded-lg"><ArrowUpRight className="text-green-500" size={16} /></div>
                <div>
                  <p className="text-[12px] uppercase text-white/40 font-bold">סך הכנסות (ברוטו)</p>
                  <p className="font-bold text-white">₪{stats.income}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="p-2 bg-red-500/20 rounded-lg"><ArrowDownRight className="text-red-500" size={16} /></div>
                <div>
                  <p className="text-[12px] uppercase text-white/40 font-bold">סך הוצאות</p>
                  <p className="font-bold text-white">₪{stats.expenses}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif font-bold text-xl">כל הפעילות בעסק ({completedBookings.length + filteredExpenses.length} פריטים)</h3>
            <div className="space-y-2">
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="flex justify-between items-center p-4 glass-card rounded-xl border-white/5 border">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Receipt className="text-white/20" size={18} />
                    <div>
                      <p className="text-sm font-bold">{exp.title}</p>
                      <p className="text-[12px] text-white/40">{format(new Date(exp.date), 'd בMMM yyyy', { locale: he })}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 gap-3">
                    <span className="font-bold text-red-500">₪{exp.amount} -</span>
                    <button onClick={() => deleteExpense(exp.id)} className="w-10 h-10 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center transition-all active:scale-90">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {completedBookings.map(b => {
                const barberId = b.barberId || 'yoav';
                const barberName = b.barberName || (barberId === 'dvir' ? 'דביר חניה' : 'יואב מלכה');
                const price = typeof b.price === 'number' ? b.price : getBarberPrice(state.settings, barberId);

                return (
                  <div key={b.id} className="flex justify-between items-center p-4 glass-card rounded-xl border-white/5 border">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Wallet className="text-gold/40" size={18} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">שירות: {b.customerName}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            barberId === 'dvir' 
                              ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' 
                              : 'bg-gold/15 text-gold border-gold/30'
                          }`}>
                            {barberName}
                          </span>
                        </div>
                        <p className="text-[12px] text-white/40">{format(new Date(b.date), 'd בMMM yyyy', { locale: he })} • {b.timeSlot}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-400">₪{price} +</span>
                  </div>
                );
              })}

              {completedBookings.length === 0 && filteredExpenses.length === 0 && (
                <div className="py-12 text-center text-white/30 italic text-sm glass-card rounded-2xl">
                  אין פעילות רשומה בעסק בתקופה זו
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinance;
