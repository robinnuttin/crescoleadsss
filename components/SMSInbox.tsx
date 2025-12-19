
import React, { useState, useMemo } from 'react';
import { Lead, Campaign } from '../types';
import { syncToGHL } from '../services/ghlService';
import LeadDetailModal from './LeadDetailModal';

interface Props {
  leads: Lead[];
  campaigns: Campaign[];
  onUpdateLeads: (updatedLeads: Lead[]) => void;
}

const SMSInbox: React.FC<Props> = ({ leads, campaigns, onUpdateLeads }) => {
  const [view, setView] = useState<'pending' | 'active' | 'analytics' | 'history'>('pending');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [smsCopy, setSmsCopy] = useState('Hé {{first_name}}, Robin van CrescoFlow hier! Ik zag jullie website en vroeg me af of jullie nog plek hebben voor 5 extra opdrachten per maand in {{city}}?');

  const smsLeads = useMemo(() => leads.filter(l => l.outboundChannel === 'coldsms'), [leads]);
  const pendingLeads = smsLeads.filter(l => !l.ghlSynced);
  const activeLeads = smsLeads.filter(l => l.ghlSynced);

  const stats = useMemo(() => {
    const total = activeLeads.length || 1;
    const replied = leads.filter(l => (l.pipelineTag === 'replied' || l.pipelineTag === 'appointment_booked' || l.pipelineTag === 'closed') && l.outboundChannel === 'coldsms').length;
    const booked = leads.filter(l => (l.pipelineTag === 'appointment_booked' || l.pipelineTag === 'closed') && l.outboundChannel === 'coldsms').length;
    return {
      total: activeLeads.length,
      replied,
      noReply: activeLeads.length - replied,
      booked,
      replyRate: Math.round((replied / total) * 100),
      bookedRate: Math.round((booked / total) * 100),
      positive: 82, 
      negative: 12,
      unclear: 6
    };
  }, [activeLeads, leads]);

  const handleBulkSync = async () => {
    if (pendingLeads.length === 0) return;
    setIsProcessing(true);
    const batch = pendingLeads.slice(0, 75);
    const updated = [...leads];
    
    for (const lead of batch) {
      const ghlId = await syncToGHL(lead, ['SMS Outbound', 'Batch_75']);
      if (ghlId) {
        const idx = updated.findIndex(l => l.id === lead.id);
        updated[idx] = { 
            ...lead, 
            ghlSynced: true, 
            ghlContactId: ghlId, 
            pipelineTag: 'sent',
            interactions: [...(lead.interactions || []), {
              id: Math.random().toString(36).substr(2,9),
              type: 'sms',
              timestamp: new Date().toISOString(),
              content: smsCopy.replace('{{first_name}}', lead.ceoName || 'Contact').replace('{{city}}', lead.city),
              outcome: 'sent'
            }]
        };
      }
    }
    
    onUpdateLeads(updated);
    setIsProcessing(false);
    alert(`${batch.length} leads toegevoegd aan GHL SMS Flow!`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-8 lg:p-12 flex flex-col lg:flex-row justify-between lg:items-center gap-10 shadow-xl relative z-10">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">SMS Command Center</h2>
          <div className="flex flex-wrap gap-8 mt-10">
            {['pending', 'active', 'analytics', 'history'].map(v => (
              <button key={v} onClick={() => setView(v as any)} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-3 transition-all border-b-4 ${view === v ? 'text-amber-600 border-amber-600' : 'text-slate-300 border-transparent'}`}>
                {v === 'pending' ? `Queue (${pendingLeads.length})` : v === 'active' ? `Actief (${activeLeads.length})` : v}
              </button>
            ))}
          </div>
        </div>
        <button 
          disabled={isProcessing || pendingLeads.length === 0}
          onClick={handleBulkSync}
          className="bg-slate-900 text-white px-16 py-6 rounded-[35px] font-black text-xs uppercase tracking-[0.4em] shadow-3xl shadow-slate-900/40 hover:scale-[1.03] transition-all disabled:opacity-20 flex items-center gap-6"
        >
          {isProcessing ? <span className="animate-spin text-xl">↻</span> : '🚀 PUSH BATCH (75)'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 lg:p-20 custom-scrollbar">
        {view === 'pending' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
            <div className="bg-amber-600 text-white p-16 rounded-[80px] shadow-3xl relative overflow-hidden border-l-[25px] border-amber-700">
               <div className="absolute top-0 right-0 p-16 text-[200px] opacity-10 font-black leading-none pointer-events-none italic select-none">SMS</div>
               <h3 className="text-xs font-black text-amber-200 uppercase tracking-[0.6em] mb-10 relative z-10">Master Outreach Template</h3>
               <textarea 
                value={smsCopy}
                onChange={e => setSmsCopy(e.target.value)}
                className="w-full h-48 bg-white/10 p-10 rounded-[35px] border-4 border-white/20 text-xl font-black outline-none focus:bg-white/20 transition-all placeholder-white/30 resize-none shadow-inner relative z-10"
                placeholder="Schrijf je pitch hier..."
               />
               <div className="flex justify-between items-center mt-10 relative z-10 px-4">
                  <div className="flex gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/10">{"{{first_name}}"}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/10">{"{{city}}"}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-amber-200 uppercase tracking-widest">GHL AI Predictive ROI</div>
                    <div className="text-2xl font-black">42% Positieve Reacties</div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {pendingLeads.map(l => (
                 <div key={l.id} className="bg-white p-10 rounded-[45px] border border-slate-100 shadow-2xl flex justify-between items-center hover:shadow-amber-600/10 transition-all group cursor-pointer" onClick={() => setSelectedLead(l)}>
                    <div>
                      <div className="font-black text-slate-800 text-2xl group-hover:text-amber-600 transition-colors tracking-tight">{l.companyName}</div>
                      <div className="text-[11px] text-slate-400 font-bold uppercase mt-2 tracking-widest">📱 {l.ceoPhone || l.phoneCompany}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all shadow-inner text-xl font-black">→</div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
            {/* Visual Bar Charts for SMS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white p-12 rounded-[60px] shadow-2xl border border-slate-100 space-y-10">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center">SMS Pipeline Volume</h3>
                  <div className="h-80 flex items-end justify-around px-10 relative">
                     <div className="absolute inset-0 border-b border-slate-100 flex flex-col justify-between py-2 pointer-events-none">
                        {[1,2,3,4].map(i => <div key={i} className="border-t border-slate-50 w-full"></div>)}
                     </div>
                     {[
                        { label: 'SENT', val: stats.total, color: 'bg-slate-900' },
                        { label: 'REPLIED', val: stats.replied, color: 'bg-amber-500' },
                        { label: 'NO REPLY', val: stats.noReply, color: 'bg-slate-300' },
                        { label: 'BOOKED', val: stats.booked, color: 'bg-emerald-500' }
                     ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-4 group relative z-10">
                           <div className={`${item.color} w-20 rounded-t-2xl transition-all group-hover:scale-x-110`} style={{ height: `${(item.val / (stats.total || 1)) * 250 + 10}px` }}></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                           <span className="text-xl font-black text-slate-900">{item.val}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white p-12 rounded-[60px] shadow-2xl border border-slate-100 space-y-10">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center">Response Sentiment Analysis</h3>
                  <div className="h-80 flex items-end justify-center gap-16">
                     {[
                        { label: 'POSITIEF', val: stats.positive, color: 'bg-emerald-500' },
                        { label: 'NEGATIEF', val: stats.negative, color: 'bg-red-500' },
                        { label: 'ONDUIDELIJK', val: stats.unclear, color: 'bg-amber-400' }
                     ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-4 group">
                           <div className={`${item.color} w-24 rounded-t-3xl transition-all group-hover:scale-x-110`} style={{ height: `${item.val * 2.5}px` }}></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                           <span className="text-2xl font-black text-slate-900">{item.val}%</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Reply Rate</div>
                  <div className="text-4xl font-black text-amber-500">{stats.replyRate}%</div>
               </div>
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Conversion (Booked)</div>
                  <div className="text-4xl font-black text-emerald-500">{stats.bookedRate}%</div>
               </div>
               <div className="bg-slate-900 p-8 rounded-[40px] shadow-sm text-center">
                  <div className="text-[10px] font-black text-blue-400 uppercase mb-2">Avg. Cost per Reply</div>
                  <div className="text-4xl font-black text-white">€0.42</div>
               </div>
            </div>
          </div>
        )}

        {view === 'active' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fadeIn">
             {activeLeads.map(l => (
               <div key={l.id} className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-3xl flex flex-col justify-between hover:shadow-amber-600/5 transition-all cursor-pointer group" onClick={() => setSelectedLead(l)}>
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <h3 className="font-black text-slate-900 text-2xl tracking-tighter leading-none group-hover:text-amber-600 transition-colors">{l.companyName}</h3>
                      <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-200">GHL Live Sync</span>
                    </div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-10 italic leading-relaxed bg-slate-50 p-6 rounded-[25px]">
                      "{l.interactions?.slice(-1)[0]?.content.slice(0, 100) || "Wachten op antwoord..."}..."
                    </div>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-5 rounded-[30px] font-black text-[12px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl">Monitor Chat</button>
               </div>
             ))}
           </div>
        )}

        {view === 'history' && (
           <div className="text-center py-60 bg-white rounded-[100px] border-4 border-dashed border-slate-100 animate-fadeIn">
              <div className="text-[150px] mb-12 opacity-5 select-none grayscale">💬</div>
              <p className="font-black uppercase tracking-[0.6em] text-slate-400">Memory Empty: Geen SMS historiek gevonden.</p>
           </div>
        )}
      </div>
      <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
};

export default SMSInbox;
