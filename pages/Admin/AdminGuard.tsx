
import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { Lock, Mail, ChevronRight, Eye, EyeOff } from 'lucide-react';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdminAuthenticated, setAdminAuthenticated } = useApp();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;
    
    const validUsers = [
      { email: 'yoav.malka@gmail.com', password: 'yoav1234' },
      { email: 'amitai.malka@gmail.com', password: 'amitai1234' }
    ];

    const isValid = validUsers.some(u => u.email === email.toLowerCase() && u.password === password);

    if (isValid) {
      setAdminAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isAdminAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shadow-[0_0_30px_rgba(191,149,63,0.1)]">
        <Lock className="text-gold w-8 h-8" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-serif italic gold-text-gradient">Admin Portal</h2>
        <p className="text-white/40 text-sm">Authorized access only</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4 max-w-xs">
        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              placeholder="Email address"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 focus:border-gold outline-none transition-all text-sm"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40 w-4 h-4" />
            <input 
              type={showPassword ? "text" : "password"} 
              value={formData.password}
              onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 pr-12 focus:border-gold outline-none transition-all text-sm"
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
        </div>

        {error && (
          <p className="text-pinkAccent text-[10px] font-bold uppercase tracking-widest animate-pulse">
            Invalid credentials
          </p>
        )}

        <GoldButton fullWidth type="submit">
          Unlock Dashboard <ChevronRight size={16} />
        </GoldButton>
      </form>
    </div>
  );
};

export default AdminGuard;
