import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { ReactNode, useEffect } from 'react';
import { Loader } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { isAdminAuthenticated, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdminAuthenticated) {
      navigate('/');
    }
  }, [loading, isAdminAuthenticated, navigate]);

  if (loading || !isAdminAuthenticated) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shadow-[0_0_30px_rgba(191,149,63,0.1)]">
          <Loader className="text-gold w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-bold italic gold-text-gradient">Verifying Access</h2>
          <p className="text-white/40 text-sm">Please wait...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
