
import React, { useState, useEffect } from 'react';
import { getAuth, applyActionCode } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GoldButton from '../../components/GoldButton';
import { CheckCircle, AlertTriangle, Mail, ArrowRight, Home } from 'lucide-react';

const VerifyEmailScreen: React.FC = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const actionCode = urlParams.get('oobCode');

    if (actionCode) {
      handleVerifyEmail(auth, actionCode);
    } else {
      setStatus('error');
      setError("קוד האימות חסר. לא ניתן להמשיך.");
    }
  }, []);

  const handleVerifyEmail = async (auth: any, actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      switch (error.code) {
        case 'auth/expired-action-code':
          setError("קוד האימות פג תוקף. יש לבקש קישור חדש.");
          break;
        case 'auth/invalid-action-code':
          setError("קוד האימות אינו תקין. ייתכן שכבר השתמשת בו.");
          break;
        case 'auth/user-disabled':
          setError("החשבון שלך הושבת.");
          break;
        case 'auth/user-not-found':
            setError("לא נמצא חשבון שמשויך לקוד הזה.");
            break;
        default:
          setError("אירעה שגיאה באימות המייל. נסה שוב.");
      }
      console.error("Email verification error:", error);
    }
  };
  
  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center space-y-4 p-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Mail className="mx-auto text-gold w-12 h-12 mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold font-serif gold-text-gradient">מאמת את המייל...</h2>
            <p className="text-white/60 text-sm">רק רגע, אנחנו מוודאים שהכל תקין.</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-4 p-4">
            <CheckCircle className="mx-auto text-green-400 w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold font-serif gold-text-gradient">אימות המייל הושלם</h2>
            <p className="text-white/60 text-sm">
              תודה! כתובת המייל שלך אומתה בהצלחה. כעת תוכל להתחבר לחשבונך.
            </p>
            <GoldButton fullWidth onClick={() => navigate('/auth')}><ArrowRight size={16}/> המשך להתחברות</GoldButton>
          </div>
        );
      case 'error':
        return (
           <div className="text-center space-y-4 p-4">
            <AlertTriangle className="mx-auto text-pinkAccent w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold font-serif gold-text-gradient">שגיאה באימות</h2>
            <p className="text-pinkAccent text-sm font-bold uppercase tracking-widest text-center py-2">
              {error}
            </p>
            <div className='flex gap-2 w-full'>
              <GoldButton fullWidth onClick={() => navigate('/auth')} variant='pink'>
                <ArrowRight size={16}/> חזור למסך ההתחברות
              </GoldButton>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden text-right" dir="rtl">
       <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-pinkAccent opacity-5 rounded-full blur-[100px]"></div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="glass-card p-8 rounded-[2.5rem] border-gold/20 border shadow-2xl">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailScreen;
