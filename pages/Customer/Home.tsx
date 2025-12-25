import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { Scissors, Clock, MapPin } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';


const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  const sliderImages = [
    '/images/haircut1.jpg',
    '/images/haircut2.jpg',
    '/images/haircut3.jpg',
    '/images/haircut4.jpg'
  ];

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Hero Section */}
      <Swiper
        modules={[Pagination, Autoplay]}
        observer={true}
        observeParents={true}
        spaceBetween={10}
        slidesPerView={1.2}
        centeredSlides={true}
        loop={true}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        className="h-64 rounded-3xl hero-swiper"
        style={{
          '--swiper-pagination-color': '#BF953F',
          '--swiper-pagination-bullet-inactive-color': '#FFF',
          '--swiper-pagination-bullet-inactive-opacity': '0.3',
          '--swiper-pagination-bottom': '16px',
        } as React.CSSProperties}
      >
        {sliderImages.map((imageUrl, index) => (
          <SwiperSlide key={index} className="rounded-3xl overflow-hidden">
            <img 
              src={imageUrl}
              alt={`Haircut inspiration ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center space-y-2 border-gold/10 border shadow-lg">
          <Scissors className="text-gold w-6 h-6" />
          <span className="text-base font-semibold text-white/80">מחיר תספורת</span>
          <span className="text-lg font-bold gold-text-gradient">₪{state.settings.pricePerCut}</span>
        </div>
        <div className="glass-card p-4 rounded-2xl flex flex-col items-center text-center space-y-2 border-gold/10 border shadow-lg">
          <Clock className="text-gold w-6 h-6" />
          <span className="text-base font-semibold text-white/80">זמן מוערך</span>
          <span className="text-lg font-bold gold-text-gradient">{state.settings.slotDuration} דק'</span>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border-gold/5 border flex items-center space-x-4 space-x-reverse shadow-md">
        <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
          <MapPin className="text-gold w-6 h-6" />
        </div>
        <div className="text-right">
          <h3 className="text-base font-bold text-white">מורשת, לבנה 294</h3>
          <p className="text-base text-white/40">סטודיו פרטי ויוקרתי</p>
        </div>
      </div>

      {/* CTA - Updated to Pink and 'Secure Your Blend' */}
      <div className="pt-4">
        <GoldButton variant="pink" fullWidth onClick={() => navigate('/book')} className="h-16 shadow-2xl">
          שריין תור
        </GoldButton>
      </div>

      {/* Quote */}
      <div className="text-center py-6 px-4" dir="ltr">
        <p className="font-en-serif font-bold italic text-white/30 text-lg">
          {/* "תספורת היא רק תספורת, עד שאתה מקבל <span className="gold-text-gradient font-bold">בלנד.</span>" */}
          "Life is to short for even one bad hairday..."
        </p>
        <div className="w-1 h-1 bg-pinkAccent/40 rounded-full mx-auto mt-4 animate-pulse shadow-[0_0_8px_rgba(255,0,127,0.4)]"></div>
      </div>
    </div>
  );
};

export default CustomerHome;