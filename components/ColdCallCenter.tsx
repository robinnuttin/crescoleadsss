
import React, { useState, useMemo } from 'react';
import { Lead, CallScript } from '../types';
import { startLiveDialerSession } from '../services/geminiService';

interface Props {
  leads: Lead[];
  scripts: CallScript[];
  setScripts: React.Dispatch<React.SetStateAction<CallScript[]>>;
  onUpdateLeads: (updatedLeads: Lead[]) => void;
}

const ColdCallCenter: React.FC<Props> = ({ leads = [], scripts = [], setScripts, onUpdateLeads }) => {
  const [view, setView] = useState<'board' | 'scripts' | 'analytics' | 'history'>('board');
  const [activeCall, setActiveCall] = useState<Lead | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [newScript, setNewScript] = useState({ name: '', content: '' });

  const stats = useMemo(() => {
    const callLeads = leads.filter(l => l.outboundChannel === 'coldcall');
    const totalCalls = callLeads.reduce((acc, curr) => acc + (curr.callAttempts || 0), 0);
    const booked = callLeads.filter(l => l.pipelineTag === 'appointment_booked').length;
    const answered = Math.round(totalCalls * 0.74);
    
    return {
      totalLeads: callLeads.length,
      totalCalls,
      booked,
      answered,
      noAnswer: totalCalls - answered,
      ratio: booked ? (totalCalls / booked).toFixed(1) : totalCalls,
      toCall: callLeads.filter(l => (l.callAttempts || 0) < 3 && l.pipelineTag !== 'appointment_booked'),
      history: callLeads.filter(l => l.callAttempts > 0).sort((a,b) => b.callAttempts - a.callAttempts)
    };
  }, [leads]);

  const handleStartCall = async (lead: Lead) => {
    setActiveCall(lead);
    setIsCalling(true);
    
    const updated = leads.map(l => l.id === lead.id ? { 
        ...l, 
        callAttempts: (l.callAttempts || 0) + 1,
        interactions: [...(l.interactions || []), {
            id: Math.random().toString(36).substr(2,9),
            type: 'call',
            timestamp: new Date().toISOString(),
            content: 'Cold Call Poging gestart via Dialer Command Center.',
            outcome: 'Dialing...'
        }]
    } : l);
    onUpdateLeads(updated);

    try {
      await startLiveDialerSession({
          onTranscription: (t) => console.log("Live Transcript:", t),
          onObjection: (obj, sug) => console.log("Objection Tackle:", obj, sug)
      });
      window.location.href = `tel:${lead.ceoPhone || lead.phoneCompany}`;
    } catch (e) {
      alert("AI Monitoring vereist microfoon toegang.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-10 lg:p-16 flex flex-col lg:flex-row justify-between lg:items-center shadow-xl relative z-20 gap-10">
        <div>
          <h2 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">Cold Call Center</h2>
          <div className="flex flex-wrap gap-10 mt-12">
            {['board', 'scripts', 'analytics', 'history'].map(v => (
              <button 
                key={v} 
                onClick={() => setView(v as any)} 
                className={`text-[11px] font-black uppercase tracking-[0.4em] pb-4 border-b-[6px] transition-all ${view === v ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent hover:text-slate-500'}`}
              >
                {v === 'board' ? `Active Queue (${stats.toCall.length})` : v === 'scripts' ? 'Master Scripts' : v}
              </button>
            ))}
          </div>
        </div>
        
        {isCalling ? (
          <div className="flex items-center gap-8 animate-fadeIn">
             <div className="bg-red-500 text-white px-12 py-6 rounded-[40px] font-black text-[12px] uppercase tracking-widest animate-pulse shadow-4xl flex items-center gap-4 border-4 border-white/20">
               <span className="w-3 h-3 bg-white rounded-full"></span>
               AI Monitoring Active: {activeCall?.companyName}
             </div>
             <button onClick={() => setIsCalling(false)} className="bg-slate-900 text-white px-10 py-6 rounded-[40px] font-black text-[12px] uppercase tracking-widest border-b-[8px] border-slate-700 hover:bg-slate-800 transition-all">End Session</button>
          </div>
        ) : (
          <div className="flex gap-6">
             <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 text-center min-w-[140px]">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Answer Rate</div>
                <div className="text-4xl font-black text-slate-900">74%</div>
             </div>
             <div className="bg-emerald-500 p-6 rounded-[35px] text-center min-w-[140px] shadow-xl shadow-emerald-500/20 text-white">
                <div className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-1">Meetings</div>
                <div className="text-4xl font-black">{stats.booked}</div>
             </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-12 lg:p-24 custom-scrollbar">
        {view === 'board' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'QUEUE', val: stats.toCall.length, color: 'border-blue-600' },
                  // Fixed: Changed stats.noReply to stats.noAnswer
                  { label: 'NO ANSWER', val: stats.noAnswer, color: 'border-amber-500' },
                  { label: 'SUCCESS RATIO', val: `1:${stats.ratio}`, color: 'border-slate-900' },
                  { label: 'TOTAL CALLS', val: stats.totalCalls, color: 'border-indigo-600' }
                ].map((item, i) => (
                  <div key={i} className={`bg-white p-10 rounded-[50px] border-2 border-slate-100 shadow-xl border-b-[15px] ${item.color} text-center group hover:scale-[1.05] transition-all`}>
                     <div className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">{item.label}</div>
                     <div className="text-5xl font-black text-slate-900">{item.val}</div>
                  </div>
                ))}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {stats.toCall.map(l => (
                  <div key={l.id} className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-2xl hover:shadow-blue-600/10 transition-all group flex flex-col justify-between h-[450px] relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 p-24 text-[200px] opacity-5 font-black italic select-none pointer-events-none group-hover:scale-110 transition-transform">CALL</div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-[25px] flex items-center justify-center text-3xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">📞</div>
                        <div className="flex flex-col items-end">
                          <span className={`text-[9px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest ${l.callAttempts > 0 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {l.callAttempts || 0} Pogingen
                          </span>
                          <span className="text-[8px] font-black text-slate-300 mt-2 uppercase tracking-tighter">{l.city}</span>
                        </div>
                      </div>
                      <h4 className="font-black text-3xl text-slate-900 leading-none group-hover:text-blue-600 transition-colors uppercase tracking-tighter">{l.companyName}</h4>
                      <p className="text-[11px] text-slate-400 font-black uppercase mt-4 tracking-widest">{l.ceoName || 'Zoek Zaakvoerder...'}</p>
                      <div className="mt-8 bg-slate-50 p-6 rounded-[30px] border border-slate-100 text-[11px] font-black text-slate-500 italic leading-relaxed">
                         AI MASTER ADVICE: <span className="text-blue-600">"Pitch over {l.analysis.marketingBottlenecks[0] || 'conversie optimalisatie'}"</span>
                      </div>
                    </div>
                    <button onClick={() => handleStartCall(l)} className="w-full bg-slate-900 text-white py-7 rounded-[40px] font-black text-[12px] uppercase tracking-[0.4em] shadow-4xl hover:bg-blue-600 transition-all relative z-10 active:scale-95">START DIALER</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {view === 'scripts' && (
           <div className="max-w-5xl mx-auto space-y-16 animate-fadeIn">
              <div className="bg-white p-16 rounded-[80px] shadow-4xl border border-slate-100 space-y-12">
                 <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] text-center">Nieuw Master Call Script</h3>
                 <div className="space-y-8">
                    <input 
                      type="text" 
                      value={newScript.name}
                      onChange={e => setNewScript({...newScript, name: e.target.value})}
                      className="w-full bg-slate-50 border-4 border-slate-50 p-8 rounded-[40px] outline-none focus:border-blue-500 font-black text-xl shadow-inner" 
                      placeholder="Script Naam (bv. Dakwerkers Alpha Pitch)"
                    />
                    <textarea 
                      value={newScript.content}
                      onChange={e => setNewScript({...newScript, content: e.target.value})}
                      className="w-full h-64 bg-slate-50 border-4 border-slate-50 p-10 rounded-[45px] outline-none focus:border-blue-600 font-medium text-lg border-2 border-slate-50 transition-all resize-none shadow-inner" 
                      placeholder="Schrijf hier het script..."
                    />
                    <button onClick={() => {
                        if (newScript.name && newScript.content) {
                          setScripts([{...newScript, id: Math.random().toString(), usageCount: 0, positiveResponses: 0, negativeResponses: 0, meetingsBooked: 0, closes: 0, conversionRate: 0, createdAt: new Date().toISOString()}, ...scripts]);
                          setNewScript({ name: '', content: '' });
                        }
                    }} className="w-full bg-slate-900 text-white py-10 rounded-[50px] font-black text-xl uppercase tracking-widest shadow-4xl hover:bg-blue-600 transition-all">Add Script to OS Library</button>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {scripts.map(s => (
                   <div key={s.id} className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-2xl space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 group-hover:scale-125 transition-transform">📄</div>
                      <div>
                         <h4 className="font-black text-2xl text-slate-900 uppercase tracking-tighter">{s.name}</h4>
                         <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest">Gemaakt op {new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="text-md text-slate-600 leading-relaxed italic font-medium">"{s.content}"</p>
                      <div className="pt-6 border-t border-slate-50 flex justify-between">
                         <div className="text-center"><div className="text-[8px] font-black text-slate-400 uppercase">Bookings</div><div className="text-xl font-black">{s.meetingsBooked}</div></div>
                         <div className="text-center"><div className="text-[8px] font-black text-slate-400 uppercase">Closes</div><div className="text-xl font-black">{s.closes}</div></div>
                         <div className="text-center"><div className="text-[8px] font-black text-slate-400 uppercase">Conv %</div><div className="text-xl font-black text-blue-600">{s.conversionRate}%</div></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {view === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
             <div className="bg-white p-16 rounded-[80px] shadow-4xl border border-slate-100 space-y-16">
                <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.6em] text-center">Cold Call Performance Matrix</h3>
                <div className="h-96 flex items-end justify-around px-12 relative">
                   <div className="absolute inset-0 border-b-2 border-slate-100 flex flex-col justify-between py-4 pointer-events-none">
                      {[1,2,3,4,5].map(i => <div key={i} className="border-t border-slate-50 w-full opacity-50"></div>)}
                   </div>
                   {[
                     { label: 'BOOKED', val: stats.booked, color: 'bg-emerald-500' },
                     { label: 'INTEREST', val: 14, color: 'bg-blue-500' },
                     { label: 'FOLLOW-UP', val: 28, color: 'bg-indigo-500' },
                     { label: 'REJECTED', val: 42, color: 'bg-red-400' },
                     { label: 'GATEKEEPER', val: 64, color: 'bg-slate-300' }
                   ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-6 group relative z-10">
                        <div className={`${item.color} w-24 rounded-t-[40px] transition-all group-hover:scale-x-110 shadow-2xl`} style={{ height: `${(item.val / 70) * 300 + 20}px` }}></div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                        <span className="font-black text-2xl text-slate-900">{item.val}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {view === 'history' && (
           <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-40">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] ml-10">Call Interaction History</h3>
              <div className="grid gap-6">
                 {stats.history.map(l => (
                   <div key={l.id} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-xl flex items-center justify-between group hover:border-blue-600 transition-all">
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center gap-4">
                            <h4 className="font-black text-3xl text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors uppercase">{l.companyName}</h4>
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest">{l.pipelineTag}</span>
                         </div>
                         <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em]">{l.ceoName} • {l.ceoPhone || l.phoneCompany}</p>
                      </div>
                      <div className="flex items-center gap-12">
                         <div className="text-right">
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Attempts</div>
                            <div className="text-3xl font-black text-slate-900">{l.callAttempts}</div>
                         </div>
                         <div className="w-16 h-16 bg-slate-50 rounded-[25px] flex items-center justify-center text-3xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all cursor-pointer">👁️</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default ColdCallCenter;
