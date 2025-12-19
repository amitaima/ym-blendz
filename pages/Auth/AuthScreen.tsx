
import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { Mail, Lock, User, Phone, Scissors, ChevronRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthScreen: React.FC = () => {
  const { login, signup } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'login') {
      const result = login(formData.email, formData.password);
      if (!result.success) {
        setError('Invalid credentials. Please try again.');
      }
    } else {
      if (!formData.name || !formData.phone || !formData.email || !formData.password) {
        setError('All fields are required.');
        return;
      }
      signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
    }
  };

  const handleGoogleAuth = () => {
    // Mock Google Auth logic
    console.log("Mock Google Auth triggered");
    // In a real app, this would redirect to Google OAuth
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-pinkAccent opacity-5 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full glass-card border-gold/30 border flex items-center justify-center shadow-[0_0_30px_rgba(191,149,63,0.1)]">
              <Scissors className="text-gold w-10 h-10 -rotate-90" />
            </div>
          </div>
          <h1 className="text-4xl font-serif italic font-bold gold-text-gradient tracking-tighter">
            YM BLENDZ
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-semibold">Grooming Excellence</p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border-gold/20 border space-y-6 shadow-2xl">
          <div className="flex justify-center gap-8 mb-4 border-b border-white/5 pb-4">
            <button 
              onClick={() => { setMode('login'); setError(''); }}
              className={`text-xs uppercase font-bold tracking-widest transition-all ${mode === 'login' ? 'text-gold' : 'text-white/30'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(''); }}
              className={`text-xs uppercase font-bold tracking-widest transition-all ${mode === 'signup' ? 'text-gold' : 'text-white/30'}`}
            >
              Join Us
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {mode === 'signup' && (
                  <>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:border-gold outline-none transition-all text-sm"
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
                      <input 
                        type="tel" 
                        placeholder="Phone Number"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:border-gold outline-none transition-all text-sm"
                        value={formData.phone}
                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 focus:border-gold outline-none transition-all text-sm"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 pr-12 focus:border-gold outline-none transition-all text-sm"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-gold transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {error && (
              <p className="text-pinkAccent text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
                {error}
              </p>
            )}

            <div className="space-y-4 pt-2">
              <GoldButton fullWidth type="submit" variant={mode === 'signup' ? 'pink' : 'gold'}>
                {mode === 'login' ? 'Sign In' : 'Create Account'} <ChevronRight size={16} />
              </GoldButton>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-white/10"></div>
                <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">OR</span>
                <div className="h-px flex-1 bg-white/10"></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl glass-card border-white/10 hover:border-gold/30 transition-all active:scale-95 group"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4 group-hover:opacity-100 opacity-60 transition-opacity" alt="Google" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 group-hover:text-white transition-colors">
                  {mode === 'login' ? 'Login with Google' : 'Signup with Google'}
                </span>
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-white/20 uppercase tracking-widest flex items-center justify-center gap-2">
            <Sparkles size={10} className="text-gold" />
            Luxury Private Studio Experience
            <Sparkles size={10} className="text-gold" />
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
