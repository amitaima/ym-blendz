
import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
// Added Scissors to imports
import { Settings as SettingsIcon, DollarSign, Clock, Save, Info, Scissors } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const { state, updateSettings } = useApp();
  const [formData, setFormData] = useState({
    pricePerCut: state.settings.pricePerCut,
    slotDuration: state.settings.slotDuration
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({
      ...state.settings,
      pricePerCut: formData.pricePerCut,
      slotDuration: formData.slotDuration
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-32">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
          <SettingsIcon className="text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-serif italic gold-text-gradient leading-tight">Business Setup</h1>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Configure Shop Defaults</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Pricing Section */}
        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 border space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={18} className="text-gold" />
            <h3 className="font-bold text-sm tracking-tight">Service Pricing</h3>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest ml-1">Price per Cut (NIS)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-bold">₪</span>
              <input 
                type="number"
                value={formData.pricePerCut}
                onChange={e => setFormData(p => ({ ...p, pricePerCut: parseInt(e.target.value) || 0 }))}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 pl-10 focus:border-gold outline-none transition-all font-bold"
              />
            </div>
          </div>
          <p className="text-[10px] text-white/30 italic px-1 leading-relaxed">
            This price is used to calculate revenue in the ledger when a booking is marked as completed.
          </p>
        </div>

        {/* Time Settings Section */}
        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 border space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock size={18} className="text-gold" />
            <h3 className="font-bold text-sm tracking-tight">Booking Logic</h3>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest ml-1">Slot Duration (Minutes)</label>
            <select 
              value={formData.slotDuration}
              onChange={e => setFormData(p => ({ ...p, slotDuration: parseInt(e.target.value) }))}
              className="w-full bg-black border border-white/10 rounded-2xl p-4 focus:border-gold outline-none transition-all font-bold appearance-none"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>
          <div className="bg-gold/5 p-4 rounded-2xl border border-gold/10 flex items-start space-x-3">
            <Info size={16} className="text-gold shrink-0 mt-0.5" />
            <p className="text-[10px] text-white/60 leading-relaxed">
              Changing duration affects how new availability blocks are sliced into bookable slots. 
              Existing bookings remain unchanged.
            </p>
          </div>
        </div>

        {saved && (
          <div className="text-center text-green-500 text-xs font-bold uppercase tracking-widest animate-in zoom-in">
            ✓ Settings updated successfully
          </div>
        )}

        <GoldButton fullWidth onClick={handleSave}>
          <Save size={18} /> Apply Changes
        </GoldButton>
      </div>

      <div className="p-8 text-center opacity-20 grayscale">
        <Scissors className="mx-auto mb-2" size={32} />
        <p className="text-[8px] uppercase font-bold tracking-[0.5em]">System Version 1.4.2</p>
      </div>
    </div>
  );
};

export default AdminSettings;
