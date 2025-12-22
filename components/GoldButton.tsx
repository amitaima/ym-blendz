import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'pink' | 'outline';
  fullWidth?: boolean;
}

const GoldButton: React.FC<ButtonProps> = ({ children, variant = 'gold', fullWidth = false, className = '', ...props }) => {
  const baseStyles = "relative py-4 px-8 rounded-xl font-bold uppercase tracking-widest text-base transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 overflow-hidden";
  const widthStyle = fullWidth ? 'w-full' : '';
  
  const variants = {
    gold: "bg-gradient-to-br from-gold-dark via-gold-light to-gold-bronze text-black shadow-[0_0_20px_rgba(191,149,63,0.3)]",
    pink: "bg-gradient-to-r from-pinkAccent to-[#FF3399] text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]",
    outline: "border-2 border-gold text-gold bg-transparent"
  };

  return (
    <button className={`${baseStyles} ${widthStyle} ${variants[variant]} ${className}`} {...props}>
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
      {variant !== 'outline' && (
         <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity rounded-xl"></div>
      )}
    </button>
  );
};

export default GoldButton;