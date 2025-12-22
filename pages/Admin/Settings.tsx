
import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
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
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-32 text-right">
      <div className="flex items-center space-x-3 space-x-reverse">
        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
          <SettingsIcon className="text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold gold-text-gradient leading-tight">הגדרות עסק</h1>
          <p className="text-[12px] text-white/40 uppercase font-bold tracking-widest">קבע את ברירות המחדל של החנות</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 border space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <DollarSign size={18} className="text-gold" />
            <h3 className="font-bold text-sm tracking-tight">תמחור שירות</h3>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] uppercase font-bold text-white/30 tracking-widest mr-1">מחיר לתספורת (ש"ח)</label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold font-bold">₪</span>
              <input 
                type="number"
                value={formData.pricePerCut}
                onChange={e => setFormData(p => ({ ...p, pricePerCut: parseInt(e.target.value) || 0 }))}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 pr-10 focus:border-gold outline-none transition-all font-bold text-right"
              />
            </div>
          </div>
          <p className="text-[12px] text-white/30 italic px-1 leading-relaxed">
            מחיר זה משמש לחישוב הכנסות בספר החשבונות כאשר תור מסומן כ'הושלם'.
          </p>
        </div>

        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 border space-y-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Clock size={18} className="text-gold" />
            <h3 className="font-bold text-sm tracking-tight">הגדרות תורים</h3>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] uppercase font-bold text-white/30 tracking-widest mr-1">אורך תור (דקות)</label>
            <select 
              value={formData.slotDuration}
              onChange={e => setFormData(p => ({ ...p, slotDuration: parseInt(e.target.value) }))}
              className="w-full bg-black border border-white/10 rounded-2xl p-4 focus:border-gold outline-none transition-all font-bold appearance-none text-right"
            >
              <option value={15}>15 דקות</option>
              <option value={30}>30 דקות</option>
              <option value={45}>45 דקות</option>
              <option value={60}>60 דקות</option>
            </select>
          </div>
          <div className="bg-gold/5 p-4 rounded-2xl border border-gold/10 flex items-start space-x-3 space-x-reverse">
            <Info size={16} className="text-gold shrink-0 mt-0.5" />
            <p className="text-[12px] text-white/60 leading-relaxed">
              שינוי אורך התור משפיע על חלוקת משמרות חדשות לחלונות זמן פנויים. תורים קיימים לא יושפעו.
            </p>
          </div>
        </div>

        {saved && (
          <div className="text-center text-green-500 text-xs font-bold uppercase tracking-widest animate-in zoom-in">
            ✓ ההגדרות עודכנו בהצלחה
          </div>
        )}

        <GoldButton fullWidth onClick={handleSave}>
          <Save size={18} /> החל שינויים
        </GoldButton>
      </div>

      <div className="p-8 text-center opacity-20 grayscale">
        <Scissors className="mx-auto mb-2" size={32} />
        <p className="text-[8px] uppercase font-bold tracking-[0.5em]">גרסת מערכת 1.4.2</p>
      </div>
    </div>
  );
};

export default AdminSettings;