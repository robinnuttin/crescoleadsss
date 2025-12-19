
import React, { useState } from 'react';

interface Props {
  activeApp: string;
  setActiveApp: (app: string) => void;
  totalLeadsCount: number;
}

const Sidebar: React.FC<Props> = ({ activeApp, setActiveApp, totalLeadsCount }) => {
  const [isOpen, setIsOpen] = useState(false);

  const apps = [
    { id: 'dashboard', name: 'Command Center', icon: '📊' },
    { id: 'lead-scraper', name: 'Leads Scraper', icon: '🔍' },
    { id: 'database', name: 'Centrale Database', icon: '🗄️' },
    { id: 'ghl-manager', name: 'GHL Control', icon: '🔗' },
    { id: 'cold-calls', name: 'Cold Call Command', icon: '📞' },
    { id: 'email-pipeline', name: 'Email Outreach', icon: '📧' },
    { id: 'sms-pipeline', name: 'SMS Outreach', icon: '💬' },
    { id: 'facebook-pipeline', name: 'FB Funnel', icon: '👥' },
    { id: 'sales-meet', name: 'Sales Closing', icon: '🎥' },
    { id: 'ai-coach', name: 'AI Master Brain', icon: '🧠' },
    { id: 'settings', name: 'Instellingen', icon: '⚙️' }
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 left-6 z-50 bg-slate-900 text-white p-3 rounded-2xl shadow-2xl"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        )}
      </button>

      <div className={`
        fixed left-0 top-0 h-screen bg-slate-900 text-white shadow-[20px_0_50px_rgba(0,0,0,0.2)] z-40 transition-all duration-500 ease-in-out
        ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0 lg:w-80'}
      `}>
        <div className="p-12 border-b border-slate-800/50">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white tracking-tighter leading-none">
            CRESCOFLOW OS
          </h1>
          <p className="text-slate-500 text-[10px] mt-2 uppercase font-black tracking-[0.4em]">Advanced Brain V4.2</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-6 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => {
                setActiveApp(app.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-5 px-6 py-4 rounded-3xl text-[12px] font-black uppercase tracking-widest transition-all
                ${activeApp === app.id 
                  ? 'bg-blue-600 text-white shadow-3xl shadow-blue-900/50 scale-[1.05]' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'}
              `}
            >
              <span className="text-2xl">{app.icon}</span>
              {app.name}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-8 border-t border-slate-800/50 bg-slate-900">
          <div className="bg-slate-800/40 rounded-[35px] p-6 border border-slate-700/50 flex justify-between items-center group cursor-default">
               <div>
                  <div className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest group-hover:text-blue-400 transition-colors">Leads Database</div>
                  <div className="text-3xl font-black text-white leading-none">{totalLeadsCount}</div>
               </div>
               <div className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity">🗄️</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
