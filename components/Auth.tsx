import React, { useState, useEffect } from 'react';
import { UserConfig, AccountData } from '../types';

interface Props {
  onAuthComplete: (account: AccountData) => void;
}

const Auth: React.FC<Props> = ({ onAuthComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const currentUser = localStorage.getItem('crescoflow_current_user');
    if (currentUser === 'nuttinrobin@gmail.com') {
      const usersDb = JSON.parse(localStorage.getItem('crescoflow_users_db') || '{}');
      if (usersDb[currentUser]) {
        onAuthComplete(usersDb[currentUser]);
      }
    }
  }, []);

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      if (email === 'nuttinrobin@gmail.com' && password === 'Crescoflow123%') {
        const usersDb = JSON.parse(localStorage.getItem('crescoflow_users_db') || '{}');
        const targetEmail = email;
        
        if (!usersDb[targetEmail]) {
          usersDb[targetEmail] = {
            leads: [],
            campaigns: [],
            fbConversations: [],
            scripts: [],
            sessions: [],
            config: {
              username: 'Robin Nutin',
              email: targetEmail,
              password,
              ghlApiKey: '',
              instantlyApiKey: '',
              companyWebsite: 'https://crescoflow.be',
              toneOfVoice: 'Professioneel, direct en gefocust op resultaat.',
              documents: [],
              trainingData: [],
              integrations: { gmail: false, calendar: false, ghl: false, instantly: false }
            }
          };
          localStorage.setItem('crescoflow_users_db', JSON.stringify(usersDb));
        }

        localStorage.setItem('crescoflow_current_user', targetEmail);
        onAuthComplete(usersDb[targetEmail]);
      } else {
        alert("Ongeldige inloggegevens. Gebruik het master account.");
      }
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="bg-white p-12 lg:p-20 rounded-[80px] shadow-2xl w-full max-w-xl space-y-10 animate-scaleUp relative z-10 border border-white/20 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-slate-900 rounded-[30px] flex items-center justify-center text-4xl shadow-2xl rotate-12 mx-auto border-b-4 border-blue-600">🧠</div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none">CrescoFlow</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.6em]">Master Outbound OS</p>
        </div>

        <form onSubmit={handleAction} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-6">Master Account</label>
            <input 
                type="text" 
                className="w-full bg-slate-50 border-4 border-slate-100 p-6 rounded-[35px] outline-none focus:border-blue-500 font-black text-lg transition-all" 
                placeholder="nuttinrobin@gmail.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-6">Master Key</label>
            <input 
                type="password" 
                className="w-full bg-slate-50 border-4 border-slate-100 p-6 rounded-[35px] outline-none focus:border-blue-500 font-black text-lg transition-all" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
            />
          </div>
          <button 
            type="submit" 
            disabled={isProcessing} 
            className="w-full bg-slate-900 text-white p-8 rounded-[40px] font-black text-md shadow-3xl hover:bg-blue-600 transition-all uppercase tracking-[0.3em] active:scale-95"
          >
            {isProcessing ? 'Verifiëren...' : 'Ontsluit Systeem'}
          </button>
        </form>
        <div className="flex items-center justify-center gap-3">
           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Database Syncing Active • 24h Backup Mirroring</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;