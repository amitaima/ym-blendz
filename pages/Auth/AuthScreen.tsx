
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { Mail, Lock, User, Phone, Scissors, ChevronLeft, Eye, EyeOff, Sparkles, Send, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthScreen: React.FC = () => {
  const { login, signup, loginWithGoogle, resendVerificationEmail } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<'initial' | 'sending' | 'sent'>('initial');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      setMode('signup');
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        const { verified } = await login(formData.email, formData.password);
        if (!verified) {
          setNeedsVerification(true);
        }
      } else {
        await signup({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password });
        setEmailVerificationSent(true);
      }
    } catch (err: any) {
      // Firebase error mapping
      let friendlyMessage = "אירעה שגיאה בלתי צפויה.";
      if (err.code) {
          switch (err.code) {
              case 'auth/user-not-found':
              case 'auth/wrong-password':
                  friendlyMessage = "האימייל או הסיסמה שהזנת אינם נכונים.";
                  break;
              case 'auth/invalid-email':
                  friendlyMessage = "כתובת האימייל אינה תקינה.";
                  break;
              case 'auth/email-already-in-use':
                  friendlyMessage = "האימייל הזה כבר רשום במערכת.";
                  break;
              case 'auth/weak-password':
                  friendlyMessage = "הסיסמה צריכה להכיל לפחות 6 תווים.";
                  break;
              case 'auth/too-many-requests':
                  friendlyMessage = "יותר מדי ניסיונות. נסה שוב מאוחר יותר.";
                  break;
              default:
                friendlyMessage = err.message;
          }
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendStatus('sending');
    setError('');
    try {
      await resendVerificationEmail();
      setResendStatus('sent');
    } catch (error) {
      setError("שליחת המייל נכשלה. נסה שוב בעוד רגע.");
      setResendStatus('initial');
    }
  }

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      setError(error.message || "ההתחברות עם גוגל נכשלה. נסה שוב.");
      setIsLoading(false);
    }
  };

  const resetAuthState = () => {
    setMode('login');
    setError('');
    setNeedsVerification(false);
    setEmailVerificationSent(false);
    setResendStatus('initial');
    setIsLoading(false);
  };

  const SecondaryButton = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="w-full text-center py-3 mt-4 rounded-xl glass-card border-white/10 hover:border-gold/30 transition-all active:scale-95 group text-sm text-white/60 group-hover:text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2"
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden text-right" dir="rtl">
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -left-24 w-80 h-80 bg-pinkAccent opacity-5 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10 space-y-8"
      >
        <div className="text-center space-y-2">
           <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full glass-card border-gold/30 border flex items-center justify-center shadow-[0_0_30px_rgba(191,149,63,0.1)]">
              <Scissors className="text-gold w-10 h-10 rotate-90" />
            </div>
          </div>
          <h1 className="text-4xl font-en-serif italic font-bold gold-text-gradient tracking-tighter">
            YM BLENDZ
          </h1>
          <p className="text-[12px] uppercase tracking-[0.4em] text-white/30 font-semibold">Grooming Excellence</p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border-gold/20 border space-y-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {emailVerificationSent ? (
              <motion.div key="verificationSent" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-center space-y-4 p-4">
                <Mail className="mx-auto text-gold w-12 h-12 mb-4" />
                <h2 className="text-2xl font-bold font-serif gold-text-gradient">אמת את האימייל שלך</h2>
                <p className="text-white/60 text-sm">
                  הצלחה! שלחנו קישור אימות אל <strong className='text-white'>{formData.email}</strong>. יש לבדוק את תיבת הדואר הנכנס ותיקיית הספאם.
                </p>
                <SecondaryButton onClick={resetAuthState}><ArrowRight size={12}/> חזרה להתחברות</SecondaryButton>
              </motion.div>
            ) : needsVerification ? (
              <motion.div key="needsVerification" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-center space-y-4 p-4">
                <Send className="mx-auto text-gold w-12 h-12 mb-4" />
                <h2 className="text-2xl font-bold font-serif gold-text-gradient">נדרש אימות</h2>
                <p className="text-white/60 text-sm">
                  האימייל <strong className='text-white'>{formData.email}</strong> אינו מאומת. יש לבדוק את תיבת הדואר הנכנס או לבקש קישור חדש.
                </p>
                {error && <p className="text-pinkAccent text-sm font-bold uppercase tracking-widest text-center py-2">{error}</p>}
                <GoldButton className='shadow-xl' fullWidth onClick={handleResendVerification} disabled={resendStatus === 'sending' || resendStatus === 'sent'} variant="pink">
                  {resendStatus === 'initial' && <><Send size={16}/> שלח קישור חדש</>}
                  {resendStatus === 'sending' && 'שולח...'}
                  {resendStatus === 'sent' && <><CheckCircle size={16}/> נשלח בהצלחה!</>}
                </GoldButton>
                <SecondaryButton onClick={resetAuthState}><ArrowRight size={12}/> חזרה להתחברות</SecondaryButton>
              </motion.div>
            ) : (
              <motion.div key="authForm" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                <div className="flex justify-center gap-8 mb-4 border-b border-white/5 pb-4">
                  <button 
                    onClick={() => { setMode('login'); setError(''); }}
                    className={`text-sm uppercase font-bold tracking-widest transition-all ${mode === 'login' ? 'text-gold' : 'text-white/30'}`}
                  >
                    התחברות
                  </button>
                  <button 
                    onClick={() => { setMode('signup'); setError(''); }}
                    className={`text-sm uppercase font-bold tracking-widest transition-all ${mode === 'signup' ? 'text-gold' : 'text-white/30'}`}
                  >
                    הרשמה
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        {mode === 'signup' && (
                        <>
                            <div className="relative">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="שם מלא"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 focus:border-gold outline-none transition-all text-sm"
                                value={formData.name}
                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                required
                            />
                            </div>
                            <div className="relative">
                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
                            <input 
                                type="tel" 
                                placeholder="מספר טלפון"
                                className="w-full bg-white/5 text-right border border-white/10 rounded-2xl p-4 pr-12 focus:border-gold outline-none transition-all text-sm"
                                value={formData.phone}
                                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                required
                            />
                            </div>
                        </>
                        )}
                        
                        <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
                        <input 
                            type="email" 
                            placeholder="כתובת אימייל"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 focus:border-gold outline-none transition-all text-sm"
                            value={formData.email}
                            onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                            required
                        />
                        </div>
                        
                        <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="סיסמה"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 pl-12 focus:border-gold outline-none transition-all text-sm"
                            value={formData.password}
                            onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-gold transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        </div>
                    </motion.div>
                    </AnimatePresence>

                    {error && (
                    <p className="text-pinkAccent text-[12px] font-bold uppercase tracking-widest text-center animate-pulse">
                        {error}
                    </p>
                    )}

                    <div className="space-y-4 pt-2">
                    <GoldButton fullWidth type="submit" variant={mode === 'signup' ? 'pink' : 'gold'} disabled={isLoading}>
                        {isLoading ? 'מעבד נתונים...' : (mode === 'login' ? 'התחבר' : 'צור חשבון')} 
                        {!isLoading && <ChevronLeft size={16} />}
                    </GoldButton>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">או</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                    </div>

                    <button 
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl glass-card border-white/10 hover:border-gold/30 transition-all active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="text-[12px] uppercase font-bold tracking-widest text-white/60 group-hover:text-white transition-colors">
                        {mode === 'login' ? 'התחבר עם Google' : 'הירשם עם Google'}
                        </span>
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4 group-hover:opacity-100 opacity-60 transition-opacity" alt="Google" />
                    </button>
                    </div>
                </form>
              </motion.div>
            )}
            </AnimatePresence>
        </div>

        <div className="text-center">
          <p className="text-[14px] text-white/20 uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles size={10} className="text-gold" />
            חווית סטודיו פרטית ויוקרתית
            <Sparkles size={10} className="text-gold" />
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
