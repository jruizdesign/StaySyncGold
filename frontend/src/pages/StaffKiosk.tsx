import React, { useState } from 'react';
import { Card, Button } from '../components/UIComponents';
import { Clock, CheckCircle, LogOut, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const StaffKiosk: React.FC = () => {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');
  const [action, setAction] = useState<'In' | 'Out' | null>(null);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleClear = () => setPin('');
  
  const handleSubmit = (type: 'In' | 'Out') => {
    if (pin.length === 4) {
      setAction(type);
      setStatus('success');
      // Reset after 3 seconds
      setTimeout(() => {
        setPin('');
        setStatus('idle');
        setAction(null);
      }, 3000);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-emerald-500 text-white p-12 rounded-2xl shadow-2xl text-center max-w-md w-full animate-in zoom-in duration-300">
          <CheckCircle className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">Success!</h1>
          <p className="text-xl opacity-90">Clocked {action} at {new Date().toLocaleTimeString()}</p>
          <p className="mt-8 text-sm opacity-75">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-slate-900 text-white p-6 shadow-md flex justify-between items-center">
         <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-gold-500" />
            <h1 className="text-2xl font-bold">Staff Kiosk</h1>
         </div>
         <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
           <ArrowLeft className="w-4 h-4" /> Back to Admin
         </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Status Panel */}
          <div className="space-y-6">
            <Card className="h-full flex flex-col justify-center items-center p-12 bg-white border-none shadow-xl">
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">{new Date().toLocaleDateString()}</h2>
              <h1 className="text-6xl font-bold text-slate-900 tracking-tight mb-8">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </h1>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => handleSubmit('In')}
                  disabled={pin.length !== 4}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-6 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95"
                >
                  <Clock className="w-8 h-8" />
                  <span className="text-xl font-bold">Clock In</span>
                </button>
                <button 
                  onClick={() => handleSubmit('Out')}
                  disabled={pin.length !== 4}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-6 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95"
                >
                  <LogOut className="w-8 h-8" />
                  <span className="text-xl font-bold">Clock Out</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Numpad */}
          <Card className="p-8 border-none shadow-xl bg-slate-50">
            <div className="mb-8">
              <label className="block text-center text-slate-500 mb-4 font-medium">Enter 4-Digit PIN</label>
              <div className="flex justify-center gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-12 h-16 rounded-lg border-2 flex items-center justify-center text-3xl font-bold transition-all ${
                    pin[i] 
                      ? 'border-gold-500 bg-white text-slate-900 shadow-md scale-105' 
                      : 'border-slate-200 bg-slate-100'
                  }`}>
                    {pin[i] ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num.toString())}
                  className="h-16 rounded-xl bg-white shadow-sm border border-slate-200 hover:bg-gold-50 hover:border-gold-200 active:bg-gold-100 text-2xl font-semibold text-slate-700 transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <div className="col-span-1"></div>
              <button
                onClick={() => handleNumClick('0')}
                className="h-16 rounded-xl bg-white shadow-sm border border-slate-200 hover:bg-gold-50 hover:border-gold-200 active:bg-gold-100 text-2xl font-semibold text-slate-700 transition-all active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleClear}
                className="h-16 rounded-xl bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-600 transition-all flex items-center justify-center active:scale-95"
              >
                Clear
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffKiosk;