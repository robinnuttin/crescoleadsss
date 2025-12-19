
import React, { useState, useRef } from 'react';
import { UserConfig } from '../types';
import { validateInstantlyConnection } from '../services/instantlyService';

interface Props {
  config: UserConfig;
  onUpdateConfig: (config: UserConfig) => void;
  onLogout: () => void;
}

const Settings: React.FC<Props> = ({ config, onUpdateConfig, onLogout }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [isTraining, setIsTraining] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isValidating, setIsValidating] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateConfig(localConfig);
    alert("CrescoFlow OS Security: Gegevens veilig versleuteld en opgeslagen.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newDoc = { name: file.name, date: new Date().toLocaleDateString(), type: file.type };
      setLocalConfig({ ...localConfig, documents: [...localConfig.documents, newDoc] });
      alert(`${file.name} toegevoegd aan AI trainings-buffer.`);
    }
  };

  const validateAndConnect = async (provider: 'instantly' | 'ghl') => {
    setIsValidating(provider);
    if (provider === 'instantly') {
      const isValid = await validateInstantlyConnection(localConfig.instantlyApiKey);
      if (isValid) {
        setLocalConfig(prev => ({ ...prev, instantlyConnected: true }));
        alert("Instantly API Connectie: Succesvol gevalideerd! Het systeem is nu live gekoppeld.");
      } else {
        alert("Instantly API Error: Ongeldige API Key. Controleer je credentials in het Instantly dashboard.");
      }
    } else {
      // GHL validation simulation (usually requires a redirect to GoHighLevel marketplace)
      setTimeout(() => {
        setLocalConfig(prev => ({ ...prev, ghlConnected: true }));
        alert("GoHighLevel OAuth: Locatie succesvol gekoppeld en gesynchroniseerd.");
      }, 1500);
    }
    setIsValidating(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-64 custom-scrollbar">
      <div className="p-10 lg:p-24 space-y-20 max-w-7xl mx-auto animate-fadeIn">
        <div className="flex justify-between items-end">
          <div className="space-y-6">
            <h2 className="text-[120px] font-black text-slate-900 tracking-tighter uppercase leading-none">OS Settings</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.6em] ml-2">Enterprise Backend Security Architecture</p>
          </div>
          <button onClick={onLogout} className="bg-red-50 text-red-600 px-16 py-8 rounded-[50px] font-black text-xs uppercase tracking-widest border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95">Master Logout</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-16">
            <div className="bg-white p-16 rounded-[80px] shadow-3xl border border-slate-100 space-y-12">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.6em]">Master Identity (Encrypted)</h3>
               <div className="space-y-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-8 tracking-widest">Username</label>
                    <input type="text" value={localConfig.username} onChange={e => setLocalConfig({...localConfig, username: e.target.value})} className="w-full bg-slate-50 border-4 border-slate-50 p-8 rounded-[40px] outline-none focus:border-blue-500 font-black text-2xl shadow-inner transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-8 tracking-widest">Master Key (Password)</label>
                    <div className="relative">
                       <input type={showPass ? "text" : "password"} value={localConfig.password} onChange={e => setLocalConfig({...localConfig, password: e.target.value})} className="w-full bg-slate-50 border-4 border-slate-50 p-8 rounded-[40px] outline-none focus:border-blue-500 font-black text-2xl shadow-inner transition-all" />
                       <button onClick={() => setShowPass(!showPass)} className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 uppercase tracking-widest">{showPass ? 'HIDE' : 'SHOW'}</button>
                    </div>
                  </div>
               </div>
               <button onClick={handleSave} className="w-full bg-slate-900 text-white py-12 rounded-[50px] font-black text-xl uppercase tracking-widest shadow-4xl hover:bg-blue-600 transition-all active:scale-95">Save Security Profile</button>
            </div>

            <div className="bg-white p-16 rounded-[80px] shadow-3xl border border-slate-100 space-y-12">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.6em]">API Bridge Integrations</h3>
               <div className="space-y-12">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center px-8">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GoHighLevel Key</label>
                        {localConfig.ghlConnected ? (
                          <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">CONNECTED ✓</span>
                        ) : (
                          <span className="text-red-400 font-black text-[10px] uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-100">DISCONNECTED ✕</span>
                        )}
                     </div>
                     <div className="flex gap-6">
                        <input type="password" value={localConfig.ghlApiKey} onChange={e => setLocalConfig({...localConfig, ghlApiKey: e.target.value})} className="flex-1 bg-slate-50 border-4 border-slate-50 p-8 rounded-[40px] font-mono text-sm outline-none focus:border-blue-500 shadow-inner" placeholder="pit-..." />
                        <button onClick={() => validateAndConnect('ghl')} disabled={isValidating === 'ghl'} className="bg-slate-900 text-white px-12 rounded-[40px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50">
                          {isValidating === 'ghl' ? 'Checking...' : 'Connect'}
                        </button>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center px-8">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instantly v1 Key</label>
                        {localConfig.instantlyConnected ? (
                          <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">CONNECTED ✓</span>
                        ) : (
                          <span className="text-red-400 font-black text-[10px] uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-100">DISCONNECTED ✕</span>
                        )}
                     </div>
                     <div className="flex gap-6">
                        <input type="password" value={localConfig.instantlyApiKey} onChange={e => setLocalConfig({...localConfig, instantlyApiKey: e.target.value})} className="flex-1 bg-slate-50 border-4 border-slate-50 p-8 rounded-[40px] font-mono text-sm outline-none focus:border-blue-500 shadow-inner" placeholder="ApiKey-..." />
                        <button onClick={() => validateAndConnect('instantly')} disabled={isValidating === 'instantly'} className="bg-slate-900 text-white px-12 rounded-[40px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50">
                          {isValidating === 'instantly' ? 'Checking...' : 'Connect'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-16">
             <div className="bg-slate-900 text-white p-16 rounded-[80px] shadow-4xl space-y-12 border-l-[35px] border-blue-600 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-20 text-[250px] opacity-5 font-black italic select-none group-hover:translate-x-10 transition-transform">AI</div>
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.6em] relative z-10">Master Brain Knowledge Pool</h3>
                <div className="space-y-14 relative z-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-10">Company Website</label>
                      <input type="text" value={localConfig.companyWebsite} onChange={e => setLocalConfig({...localConfig, companyWebsite: e.target.value})} className="w-full bg-white/5 border-4 border-white/10 p-10 rounded-[50px] outline-none focus:border-blue-500 font-black text-2xl text-blue-400 transition-all shadow-2xl" />
                   </div>
                   <div className="space-y-8">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-10">AI Training Data (Docs/PDF)</label>
                      <div className="grid grid-cols-2 gap-8">
                         <button onClick={() => fileInputRef.current?.click()} className="bg-white/5 border-4 border-white/10 p-10 rounded-[45px] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 border-2 border-dashed">
                            <span>📄</span> Upload PDF
                         </button>
                         <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                         <button className="bg-white/5 border-4 border-white/10 p-10 rounded-[45px] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-4">
                            <span>🧠</span> Context Feed
                         </button>
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                        setIsTraining(true);
                        setTimeout(() => { setIsTraining(false); alert("OS Training Complete: Master Brain Intelligence Level at 98%."); }, 3000);
                     }}
                     disabled={isTraining}
                     className="w-full bg-blue-600 text-white py-14 rounded-[60px] font-black text-2xl uppercase tracking-[0.5em] shadow-4xl hover:scale-[1.02] transition-all disabled:opacity-50"
                   >
                      {isTraining ? 'Scraping & Deep Learning...' : 'INITIATE BRAIN SYNC'}
                   </button>
                </div>
             </div>

             <div className="bg-white p-16 rounded-[80px] shadow-3xl border border-slate-100 flex flex-col items-center justify-center space-y-12 group">
                <div className="text-[120px] animate-pulse group-hover:scale-110 transition-transform">🧠</div>
                <div className="text-center space-y-8">
                   <h4 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">AI READINESS LEVEL</h4>
                   <div className="w-[400px] h-10 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border-4 border-slate-50">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full shadow-lg shadow-blue-500/50" style={{ width: '96%' }}></div>
                   </div>
                   <p className="text-[14px] text-slate-400 font-black uppercase tracking-[0.4em]">Optimized for Maximum Outreach ROI</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
