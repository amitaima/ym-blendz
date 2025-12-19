import React, { useState, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths, startOfToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Phone, Clock, User, Trash2, Plus, Calendar as CalendarIcon, X, Briefcase, AlertCircle, AlertTriangle, Send } from 'lucide-react';
import { BookingStatus, TimeBlock, Booking } from '../../types';
import GoldButton from '../../components/GoldButton';

const AdminBookings: React.FC = () => {
  const { state, deleteBooking, updateBookingStatus, updateDayAvailability } = useApp();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(startOfToday());
  const [isAddingShift, setIsAddingShift] = useState(false);
  
  // Conflict Management State
  const [shiftToDeleteIndex, setShiftToDeleteIndex] = useState<number | null>(null);
  const [conflictedBookings, setConflictedBookings] = useState<Booking[]>([]);

  // Custom Time Selector State
  const [startTime, setStartTime] = useState({ hour: '09', min: '00' });
  const [endTime, setEndTime] = useState({ hour: '12', min: '00' });

  const formattedSelectedDay = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : '';
  const currentBlocks = selectedDay ? (state.settings.customAvailability?.[formattedSelectedDay] || []) : [];

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(viewDate),
      end: endOfMonth(viewDate)
    });
  }, [viewDate]);

  const selectedDayBookings = useMemo(() => {
    if (!selectedDay) return [];
    return state.bookings
      .filter(b => isSameDay(parseISO(b.date), selectedDay))
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [state.bookings, selectedDay]);

  const getBookingsCount = (date: Date) => {
    return state.bookings.filter(b => isSameDay(parseISO(b.date), date) && b.status !== BookingStatus.CANCELED).length;
  };

  const handleAddBlock = () => {
    if (!selectedDay) return;
    const startStr = `${startTime.hour}:${startTime.min}`;
    const endStr = `${endTime.hour}:${endTime.min}`;
    
    if (startStr >= endStr) {
      alert("Start time must be before end time");
      return;
    }

    const updated = [...currentBlocks, { start: startStr, end: endStr }].sort((a, b) => a.start.localeCompare(b.start));
    updateDayAvailability(formattedSelectedDay, updated);
    setIsAddingShift(false);
  };

  const handleRemoveBlockRequest = (index: number) => {
    const blockToRemove = currentBlocks[index];
    
    const conflicts = selectedDayBookings.filter(b => 
      b.status !== BookingStatus.CANCELED &&
      b.timeSlot >= blockToRemove.start &&
      b.timeSlot < blockToRemove.end
    );

    if (conflicts.length > 0) {
      setConflictedBookings(conflicts);
      setShiftToDeleteIndex(index);
    } else {
      const updated = currentBlocks.filter((_, i) => i !== index);
      updateDayAvailability(formattedSelectedDay, updated);
    }
  };

  const confirmDeleteShiftWithConflicts = () => {
    if (shiftToDeleteIndex === null || !selectedDay) return;

    conflictedBookings.forEach(b => {
      console.log(`[SMS MOCK] To: ${b.customerPhone} - Dear ${b.customerName}, unfortunately your appointment on ${b.date} at ${b.timeSlot} has been canceled due to schedule changes. Please book a new slot.`);
      updateBookingStatus(b.id, BookingStatus.CANCELED);
    });

    const updated = currentBlocks.filter((_, i) => i !== shiftToDeleteIndex);
    updateDayAvailability(formattedSelectedDay, updated);

    setShiftToDeleteIndex(null);
    setConflictedBookings([]);
  };

  const isClosed = currentBlocks.length === 0;

  const hours = Array.from({ length: 15 }, (_, i) => (i + 8).toString().padStart(2, '0'));
  const minutes = ['00', '30'];

  const toggleDaySelection = (date: Date) => {
    if (selectedDay && isSameDay(date, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(date);
      setIsAddingShift(false);
    }
  };

  const handleBookingDelete = (id: string) => {
    // Immediate state update via store
    deleteBooking(id);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif italic gold-text-gradient">Schedule</h1>
        <div className="flex space-x-2">
          <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 glass-card rounded-lg text-gold transition-transform active:scale-90"><ChevronLeft size={20} /></button>
          <span className="px-3 py-2 glass-card rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center">
            {format(viewDate, 'MMM yyyy')}
          </span>
          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 glass-card rounded-lg text-gold transition-transform active:scale-90"><ChevronRight size={20} /></button>
        </div>
      </div>

      {shiftToDeleteIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-sm rounded-[2.5rem] p-8 border-gold/20 border space-y-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="text-red-500 w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-serif italic text-white leading-tight gold-text-gradient">Schedule Conflict</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                You are trying to remove a shift that has <span className="text-gold font-bold">{conflictedBookings.length} active booking(s)</span>.
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/60 text-left space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className="text-red-500" />
                <span className="font-bold text-red-500 uppercase tracking-widest text-[8px]">Important Action</span>
              </div>
              <p>Continuing will <span className="text-white font-bold underline">cancel all appointments</span> within this time block and notify clients via SMS.</p>
              <div className="pt-2 flex items-center gap-2 text-gold">
                <Send size={12} />
                <span className="text-[10px] font-bold uppercase">Auto-Notify Clients Enabled</span>
              </div>
            </div>

            <div className="space-y-3">
              <GoldButton fullWidth onClick={confirmDeleteShiftWithConflicts} className="bg-red-600 text-white shadow-red-900/40">
                Delete & Notify Users
              </GoldButton>
              <button 
                onClick={() => setShiftToDeleteIndex(null)} 
                className="w-full py-4 text-xs uppercase tracking-widest font-bold text-white/40 hover:text-white transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-white/30 py-2">{d}</div>
        ))}
        {Array.from({ length: getDay(daysInMonth[0]) }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {daysInMonth.map(date => {
          const count = getBookingsCount(date);
          const isSelected = selectedDay && isSameDay(date, selectedDay);
          const isTodayDate = isSameDay(date, startOfToday());
          const dateStr = format(date, 'yyyy-MM-dd');
          const blocks = state.settings.customAvailability?.[dateStr] || [];
          const closed = blocks.length === 0;
          
          return (
            <button
              key={dateStr}
              onClick={() => toggleDaySelection(date)}
              className={`relative h-12 flex flex-col items-center justify-center rounded-xl border transition-all duration-300
                ${isSelected ? 'bg-gold border-gold text-black shadow-[0_0_15px_rgba(191,149,63,0.4)] z-10 scale-105' : 'glass-card border-white/5 text-white/60'}
                ${isTodayDate && !isSelected ? 'border-gold/50 text-gold shadow-[inset_0_0_10px_rgba(191,149,63,0.1)]' : ''}
                ${closed && !isSelected ? 'opacity-20' : ''}`}
            >
              <span className="text-xs font-bold">{format(date, 'd')}</span>
              {/* Visible dots mean bookings exist or availability */}
              {count > 0 && (
                <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-black' : 'bg-gold animate-pulse'}`} />
              )}
              {!closed && (
                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] ${isSelected ? 'bg-black' : 'bg-green-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Availability Management */}
      <div className="glass-card p-6 rounded-[2.5rem] border-gold/10 border space-y-6 shadow-2xl relative overflow-hidden min-h-[120px] flex flex-col justify-center">
        {selectedDay ? (
          <>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center border border-gold/20">
                  <Briefcase size={18} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-serif italic text-lg leading-tight gold-text-gradient">{format(selectedDay, 'EEEE')}</h3>
                  <p className="text-[10px] text-gold/60 uppercase tracking-widest font-bold">{format(selectedDay, 'MMM do, yyyy')}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border transition-colors ${isClosed ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-green-500/30 text-green-500 bg-green-500/5'}`}>
                {isClosed ? 'Off Day' : 'Working'}
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] uppercase font-bold text-gold/40 tracking-widest">Active Shifts</p>
                <button 
                  onClick={() => setIsAddingShift(!isAddingShift)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAddingShift ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-gold/10 text-gold border-gold/30'} border`}
                >
                  {isAddingShift ? <X size={16} /> : <Plus size={16} />}
                </button>
              </div>

              {!isClosed && (
                <div className="grid grid-cols-1 gap-2">
                  {currentBlocks.map((block, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 group hover:border-gold/30 transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center text-gold">
                          <Clock size={14} />
                        </div>
                        <span className="font-bold text-sm tracking-tight">{block.start} <span className="text-white/20 mx-1">→</span> {block.end}</span>
                      </div>
                      <button onClick={() => handleRemoveBlockRequest(idx)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isClosed && !isAddingShift && (
                <div className="text-center py-4">
                  <p className="text-white/20 text-xs italic">No shifts configured for this day.</p>
                </div>
              )}
            </div>

            {isAddingShift && (
              <div className="space-y-5 pt-4 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                <div className="bg-white/5 p-5 rounded-3xl border border-gold/20 space-y-6">
                  <p className="text-[10px] uppercase font-bold text-gold tracking-widest text-center">Configure New Shift</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="text-[8px] uppercase font-bold text-white/30 text-center tracking-tighter">Start Time</p>
                      <div className="flex gap-1">
                        <select 
                          value={startTime.hour} 
                          onChange={e => setStartTime(p => ({ ...p, hour: e.target.value }))}
                          className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-center outline-none focus:border-gold appearance-none"
                        >
                          {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select 
                          value={startTime.min} 
                          onChange={e => setStartTime(p => ({ ...p, min: e.target.value }))}
                          className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-center outline-none focus:border-gold appearance-none"
                        >
                          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="text-white/20 pt-6">
                      <ChevronRight size={16} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-[8px] uppercase font-bold text-white/30 text-center tracking-tighter">End Time</p>
                      <div className="flex gap-1">
                        <select 
                          value={endTime.hour} 
                          onChange={e => setEndTime(p => ({ ...p, hour: e.target.value }))}
                          className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-center outline-none focus:border-gold appearance-none"
                        >
                          {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select 
                          value={endTime.min} 
                          onChange={e => setEndTime(p => ({ ...p, min: e.target.value }))}
                          className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-center outline-none focus:border-gold appearance-none"
                        >
                          {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <GoldButton fullWidth onClick={handleAddBlock} className="py-3 text-xs">
                    <Plus size={16} /> Save Shift
                  </GoldButton>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/30 italic text-sm">Select a date to manage availability</p>
          </div>
        )}
      </div>

      {/* Selected Day Agenda */}
      <div className="space-y-4">
        <h3 className="font-serif italic text-xl flex items-center gap-2 gold-text-gradient">
          Daily Agenda 
          {selectedDayBookings.length > 0 && <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded-full not-italic border border-gold/10">{selectedDayBookings.length}</span>}
        </h3>
        <div className="space-y-3">
          {selectedDayBookings.length > 0 ? selectedDayBookings.map(booking => (
            <div key={booking.id} className="glass-card p-5 rounded-3xl border-white/10 border space-y-4 shadow-lg hover:border-gold/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gold/10 p-2.5 rounded-xl border border-gold/20">
                    <Clock className="text-gold" size={16} />
                  </div>
                  <span className="font-bold text-gold tracking-tight">{booking.timeSlot}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[8px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${
                    booking.status === BookingStatus.CANCELED ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                    booking.status === BookingStatus.COMPLETED ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-gold/10 border-gold/20 text-gold'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pl-10 border-t border-white/5 pt-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm font-bold">
                    <User size={14} className="text-white/40" />
                    <span className="text-white">{booking.customerName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-white/40">
                    <Phone size={12} />
                    <a href={`tel:${booking.customerPhone}`} className="hover:text-gold transition-colors">{booking.customerPhone}</a>
                  </div>
                </div>
                <div className="flex gap-2">
                  {booking.status === BookingStatus.UPCOMING && (
                    <button 
                      onClick={() => updateBookingStatus(booking.id, BookingStatus.COMPLETED)}
                      className="w-10 h-10 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    >
                      <CheckIcon size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleBookingDelete(booking.id)}
                    className="w-10 h-10 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center transition-all active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center glass-card rounded-3xl border-dashed border border-white/10 text-white/20 italic text-sm">
              {selectedDay ? 'No appointments scheduled.' : 'Select a date above.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default AdminBookings;