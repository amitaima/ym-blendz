
import React, { useState, useRef } from 'react';
import { useApp } from '../../store/AppContext';
import { useImages } from '../../store/ImageContext';
import GoldButton from '../../components/GoldButton';
import { Settings as SettingsIcon, DollarSign, Clock, Save, Scissors, ImageUp, Replace, Loader2 } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const { state, updateSettings } = useApp();
  const { homePageImages, uploadHomePageImage } = useImages();

  const [formData, setFormData] = useState({
    pricePerCut: state.settings.pricePerCut,
    slotDuration: state.settings.slotDuration
  });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<number[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSave = () => {
    updateSettings(formData);
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
