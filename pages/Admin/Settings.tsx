
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../store/AppContext';
import { useImages } from '../../store/ImageContext';
import GoldButton from '../../components/GoldButton';
import { Settings as SettingsIcon, DollarSign, Clock, Save, Scissors, ImageUp, Replace, Loader2, User, Award } from 'lucide-react';
import { getBarberPrice, getDvirCommission } from '../../constants';

const AdminSettings: React.FC = () => {
  const { state, updateSettings } = useApp();
  const { homePageImages, uploadHomePageImage } = useImages();

  const [formData, setFormData] = useState({
    yoavPrice: getBarberPrice(state.settings, 'yoav'),
    dvirPrice: getBarberPrice(state.settings, 'dvir'),
    dvirCommission: getDvirCommission(state.settings),
    slotDuration: state.settings.slotDuration || 30
  });

  useEffect(() => {
    setFormData({
      yoavPrice: getBarberPrice(state.settings, 'yoav'),
      dvirPrice: getBarberPrice(state.settings, 'dvir'),
      dvirCommission: getDvirCommission(state.settings),
      slotDuration: state.settings.slotDuration || 30
    });
  }, [state.settings]);

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSave = () => {
    updateSettings({
      pricePerCut: formData.yoavPrice,
      slotDuration: formData.slotDuration,
      dvirYoavCommission: formData.dvirCommission,
      barbers: {
        yoav: {
          id: 'yoav',
          name: 'יואב מלכה',
          price: formData.yoavPrice,
          role: 'main'
        },
        dvir: {
          id: 'dvir',
          name: 'דביר חניה',
          price: formData.dvirPrice,
          role: 'secondary',
          yoavCommission: formData.dvirCommission
        }
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(prev => [...prev, index]);
    try {
      await uploadHomePageImage(file, index);
    } catch (error) {
      console.error("Image upload failed:", error);
      // Optionally, show an error to the user
    } finally {
      setUploading(prev => prev.filter(i => i !== index));
    }
  };

  const triggerImageUpload = (index: number) => {
    if (uploading.includes(index)) return;
    fileInputRefs.current[index]?.click();
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
            <ImageUp size={18} className="text-gold" />
            <h3 className="font-bold text-sm tracking-tight">תמונות דף הבית</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => {
              const isLoading = uploading.includes(index);
              return (
                <div 
                  key={index}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-white/20 flex items-center justify-center transition-colors group ${isLoading ? 'cursor-wait' : 'cursor-pointer hover:bg-white/5'}`}
                  onClick={() => triggerImageUpload(index)}
                >
                  {homePageImages[index] ? (
                    <>
                      <img src={homePageImages[index]} alt={`Homepage image ${index + 1}`} className={`w-full h-full object-cover transition-opacity ${isLoading ? 'opacity-30' : ''}`} />
                      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isLoading ? '!opacity-0' : ''}`}>
                        <Replace size={24} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className={`text-center text-white/40 transition-opacity ${isLoading ? 'opacity-30' : ''}`}>
                      <ImageUp size={24} className="mx-auto mb-2" />
                      <p className="text-xs">העלה תמונה</p>
                    </div>
                  )}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="animate-spin text-white" size={32} />
                    </div>
                  )}
                  <input 
                    type="file"
                    ref={el => {fileInputRefs.current[index] = el}}
                    accept="image/*"
                    onChange={(e) => handleImageChange(index, e)}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>
              )
            })}
          </div>
           <p className="text-[12px] text-white/30 italic px-1 leading-relaxed">
            אפשר להעלות עד 6 תמונות שיוצגו בדף הבית. לחץ על תמונה כדי להחליפה.
          </p>
        </div>

        <div className="glass-card p-6 rounded-[2.5rem] border-white/5 border space-y-6">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <DollarSign size={18} className="text-gold" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">תמחור שירות לפי ספר</h3>
              <p className="text-[12px] text-white/40">קבע את מחיר התספורת לכל אחד מהספרים</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Yoav Malka */}
            <div className="p-4 rounded-2xl bg-black/40 border border-gold/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                  ספר ראשי
                </span>
                <div className="flex items-center gap-2 text-gold font-serif font-bold text-base">
                  <User size={16} />
                  <span>יואב מלכה</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-white/40 tracking-wider block">מחיר לתספורת (ש"ח)</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold font-bold">₪</span>
                  <input 
                    type="number"
                    value={formData.yoavPrice}
                    onChange={e => setFormData(p => ({ ...p, yoavPrice: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/15 rounded-xl p-3 pr-10 focus:border-gold outline-none transition-all font-bold text-right text-lg text-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                כל ההכנסה (100%) נרשמת בחשבון של יואב.
              </p>
            </div>

            {/* Dvir Haniya */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  ספר משני
                </span>
                <div className="flex items-center gap-2 text-white font-serif font-bold text-base">
                  <User size={16} className="text-sky-400" />
                  <span>דביר חניה</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-white/40 tracking-wider block">מחיר לתספורת (ש"ח)</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-400 font-bold">₪</span>
                  <input 
                    type="number"
                    value={formData.dvirPrice}
                    onChange={e => setFormData(p => ({ ...p, dvirPrice: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/15 rounded-xl p-3 pr-10 focus:border-sky-400 outline-none transition-all font-bold text-right text-lg text-white"
                  />
                </div>
              </div>
              <div className="space-y-1 pt-1 border-t border-white/5">
                <label className="text-[11px] uppercase font-bold text-gold tracking-wider block">עמלה ליואב מכל תספורת של דביר (ש"ח)</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold font-bold">₪</span>
                  <input 
                    type="number"
                    min={0}
                    max={formData.dvirPrice}
                    value={formData.dvirCommission}
                    onChange={e => setFormData(p => ({ ...p, dvirCommission: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-gold/30 rounded-xl p-3 pr-10 focus:border-gold outline-none transition-all font-bold text-right text-lg text-gold"
                  />
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/60 space-y-1 leading-snug">
                <div className="flex justify-between">
                  <span>עמלה מועברת ליואב:</span>
                  <span className="font-bold text-gold">₪{formData.dvirCommission}</span>
                </div>
                <div className="flex justify-between">
                  <span>רווח נקי שנשאר לדביר:</span>
                  <span className="font-bold text-sky-400">₪{Math.max(0, formData.dvirPrice - formData.dvirCommission)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="glass-card p-6 rounded-[2.5rem] border-white/5 border space-y-4">
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
              <option value={30}>30 דקות</option>
              <option value={45}>45 דקות</option>
              <option value={60}>60 דקות</option>
            </select>
          </div>
        </div> */}

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
