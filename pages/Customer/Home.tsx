import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { Scissors, Clock, MapPin } from 'lucide-react';

const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Hero Section */}
      <div className="relative h-52 rounded-3xl overflow-hidden gold-border-gradient group shadow-[0_0_30px_rgba(191,149,63,0.1)]">
        <img 
          src="https://images.unsplash.com/photo-1592647420148-bfcc177e2117?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D/400/300" 
          alt="מספרה" 
          className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="absolute bottom-6 right-6 text-right">
          <h2 className="text-3xl font-serif font-bold italic mb-1 gold-text-gradient">תספורות מדויקות</h2>
          <p className="text-white/60 text-sm font-light">מעצבים את הזהות הייחודית שלך מאז 2024</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center space-y-2 border-gold/10 border shadow-lg">
          <Scissors className="text-gold w-6 h-6" />
          <span className="text-xs font-semibold text-white/80">מחיר תספורת</span>
          <span className="text-lg font-bold gold-text-gradient">₪{state.settings.pricePerCut}</span>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center space-y-2 border-gold/10 border shadow-lg">
          <Clock className="text-gold w-6 h-6" />
          <span className="text-xs font-semibold text-white/80">זמן מוערך</span>
          <span className="text-lg font-bold gold-text-gradient">{state.settings.slotDuration} דק'</span>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border-gold/5 border flex items-center space-x-4 space-x-reverse shadow-md">
        <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
          <MapPin className="text-gold w-6 h-6" />
        </div>
        <div className="text-right">
          <h3 className="text-sm font-bold text-white">מורשת, לבנה 294</h3>
          <p className="text-xs text-white/40">סטודיו פרטי ויוקרתי</p>
        </div>
      </div>

      {/* CTA - Updated to Pink and 'Secure Your Blend' */}
      <div className="pt-4">
        <GoldButton variant="pink" fullWidth onClick={() => navigate('/book')} className="h-16 shadow-2xl">
          שריין תור
        </GoldButton>
      </div>

      {/* Quote */}
      <div className="text-center py-6 px-4">
        <p className="font-serif font-bold italic text-white/30 text-lg">
          "תספורת היא רק תספורת, עד שאתה מקבל <span className="gold-text-gradient font-bold">בלנד.</span>"
          {/* "A haircut is just a haircut, until you get a <span className="gold-text-gradient font-bold">Blend.</span>" */}
        </p>
        <div className="w-1 h-1 bg-pinkAccent/40 rounded-full mx-auto mt-4 animate-pulse shadow-[0_0_8px_rgba(255,0,127,0.4)]"></div>
      </div>
    </div>
  );
};

export default CustomerHome;