
import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import GoldButton from '../../components/GoldButton';
import { Plus, Receipt, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

const AdminFinance: React.FC = () => {
  const { state, addExpense, getFinancialStats } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newExp, setNewExp] = useState({ title: '', amount: 0 });
  const stats = getFinancialStats();

  const handleAddExpense = () => {
    if (!newExp.title || newExp.amount <= 0) return;
    addExpense({
      ...newExp,
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setNewExp({ title: '', amount: 0 });
    setShowAdd(false);
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif italic gold-text-gradient">Ledger</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="p-3 bg-gold/10 text-gold rounded-xl border border-gold/30"
        >
          <Plus size={20} />
        </button>
      </div>

      {showAdd && (
        <div className="glass-card p-6 rounded-2xl border-gold/20 border space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gold-light">Add Expense</h3>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Title (e.g. New Clippers)"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-gold outline-none text-sm"
              value={newExp.title}
              onChange={e => setNewExp(p => ({ ...p, title: e.target.value }))}
            />
            <input 
              type="number" 
              placeholder="Amount (₪)"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-gold outline-none text-sm"
              value={newExp.amount || ''}
              onChange={e => setNewExp(p => ({ ...p, amount: parseFloat(e.target.value) }))}
            />
            <GoldButton fullWidth onClick={handleAddExpense}>Record Expense</GoldButton>
          </div>
        </div>
      )}

      {/* Main Stats Card */}
      <div className="glass-card p-8 rounded-[2rem] border-gold/10 border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-2">Current Net Balance</p>
        <h2 className={`text-5xl font-bold ${stats.net >= 0 ? 'text-white' : 'text-red-500'}`}>
          ₪{stats.net}
        </h2>
        
        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg"><ArrowUpRight className="text-green-500" size={16} /></div>
            <div>
              <p className="text-[8px] uppercase text-white/40 font-bold">Total Sales</p>
              <p className="font-bold">₪{stats.income}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 rounded-lg"><ArrowDownRight className="text-red-500" size={16} /></div>
            <div>
              <p className="text-[8px] uppercase text-white/40 font-bold">Overhead</p>
              <p className="font-bold">₪{stats.expenses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h3 className="font-serif italic text-xl">Recent Activity</h3>
        <div className="space-y-2">
          {state.expenses.slice().reverse().map(exp => (
            <div key={exp.id} className="flex justify-between items-center p-4 glass-card rounded-xl border-white/5 border">
              <div className="flex items-center space-x-3">
                <Receipt className="text-white/20" size={18} />
                <div>
                  <p className="text-sm font-bold">{exp.title}</p>
                  <p className="text-[10px] text-white/40">{format(new Date(exp.date), 'MMM do')}</p>
                </div>
              </div>
              <span className="font-bold text-red-400">-₪{exp.amount}</span>
            </div>
          ))}
          {state.bookings.filter(b => b.status === 'completed').slice().reverse().map(b => (
            <div key={b.id} className="flex justify-between items-center p-4 glass-card rounded-xl border-white/5 border">
              <div className="flex items-center space-x-3">
                <Wallet className="text-gold/40" size={18} />
                <div>
                  <p className="text-sm font-bold">Service: {b.customerName}</p>
                  <p className="text-[10px] text-white/40">{format(new Date(b.date), 'MMM do')}</p>
                </div>
              </div>
              <span className="font-bold text-green-400">+₪{state.settings.pricePerCut}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
