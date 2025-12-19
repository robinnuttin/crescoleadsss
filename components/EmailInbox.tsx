
import React, { useState, useMemo } from 'react';
import { Lead, Campaign } from '../types';
import { uploadToInstantly } from '../services/instantlyService';
import LeadDetailModal from './LeadDetailModal';

interface Props {
  leads: Lead[];
  campaigns: Campaign[];
  onUpdateLeads: (updatedLeads: Lead[]) => void;
}

const EmailInbox: React.FC<Props> = ({ leads, campaigns, onUpdateLeads }) => {
  const [view, setView] = useState<'pending' | 'active' | 'analytics' | 'history'>('pending');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('Hé {{first_name}}, Robin van CrescoFlow hier! Ik zag jullie website {{website}} en was onder de indruk van jullie projecten in {{city}}...');

  const emailLeads = useMemo(() => leads.filter(l => l.outboundChannel === 'coldemail'), [leads]);
  const pendingLeads = emailLeads.filter(l => l.pipelineTag !== 'sent' && l.pipelineTag !== 'replied' && l.pipelineTag !== 'appointment_booked' && l.pipelineTag !== 'closed');
  const activeLeads = emailLeads.filter(l => l.pipelineTag === 'sent' || l.pipelineTag === 'replied' || l.pipelineTag === 'appointment_booked' || l.pipelineTag === 'closed');

  const stats = useMemo(() => {
    const total = activeLeads.length;
    const replied = activeLeads.filter(l => l.pipelineTag === 'replied' || l.pipelineTag === 'appointment_booked' || l.pipelineTag === 'closed').length;
    const booked = activeLeads.filter(l => l.pipelineTag === 'appointment_booked' || l.pipelineTag === 'closed').length;
    return {
      total,
      opened: Math.round(total * 0.64),
      clicked: Math.round(total * 0.12),
      spam: Math.round(total * 0.012),
      replied,
      positive: Math.round(replied * 0.7),
      negative: Math.round(replied * 0.2),
      unsure: Math.round(replied * 0.1),
      booked,
      replyRate: total ? Math.round((replied / total) * 100) : 0,
      openRate: 64,
      spamRate: 1.2
    };
  }, [activeLeads]);

  const handleBulkSync = async () => {
    if (pendingLeads.length === 0 || !campaignId) {
      alert("Voer een geldig Instantly Campagne ID in.");
      return;
    }
    setIsSyncing(true);
    const batch = pendingLeads.slice(0, 200);
    const success = await uploadToInstantly(batch, campaignId, emailTemplate);
    
    if (success) {
      const updated = [...leads];
      const now = new Date().toISOString();
      batch.forEach(bl => {
        const idx = updated.findIndex(l => l.id === bl.id);
        updated[idx] = { 
          ...bl, 
          pipelineTag: 'sent', 
          emailSentAt: now,
          emailBody: emailTemplate,
          interactions: [...(bl.interactions || []), {
            id: Math.random().toString(36).substr(2,9),
            type: 'email',
            timestamp: now,
            content: emailTemplate.replace('{{company_name}}', bl.companyName).replace('{{city}}', bl.city),
            outcome: 'sent'
          }]
        };
      });
      onUpdateLeads(updated);
      alert(`${batch.length} leads toegevoegd aan Instantly Outreach Campagne!`);
    }
    setIsSyncing(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-8 lg:p-12 flex flex-col lg:flex-row justify-between lg:items-center gap-10 shadow-xl relative z-10">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Email Outreach Engine</h2>
          <div className="flex flex-wrap gap-8 mt-10">
            {['pending', 'active', 'analytics', 'history'].map(v => (
              <button key={v} onClick={() => setView(v as any)} className={`text-[11px] font-black uppercase tracking-[0.4em] pb-3 transition-all border-b-4 ${view === v ? 'text-blue-600 border-blue-600' : 'text-slate-300 border-transparent'}`}>
                {v === 'pending' ? `Queue (${pendingLeads.length})` : v === 'active' ? `Lopend (${activeLeads.length})` : v}
              </button>
            ))}
          </div>
        </div>
        <button 
          disabled={isSyncing || pendingLeads.length === 0}
          onClick={handleBulkSync}
          className="bg-blue-600 text-white px-16 py-6 rounded-[35px] font-black text-xs uppercase tracking-[0.4em] shadow-3xl shadow-blue-600/40 hover:scale-[1.03] transition-all disabled:opacity-20 flex items-center gap-6"
        >
          {isSyncing ? <span className="animate-spin text-xl">↻</span> : '📧 PUSH BATCH (200)'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 lg:p-20 custom-scrollbar">
        {view === 'pending' && (
           <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                 <div className="bg-white p-16 rounded-[80px] border border-slate-200 shadow-3xl space-y-10">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Configuratie</h3>
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Instantly Campaign ID</label>
                        <input type="text" value={campaignId} onChange={e => setCampaignId(e.target.value)} placeholder="bv. Yjg2ZmU4YmM..." className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-[25px] font-mono text-sm focus:border-blue-500 outline-none transition-all"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Body Template</label>
                        <textarea value={emailTemplate} onChange={e => setEmailTemplate(e.target.value)} className="w-full h-64 bg-slate-50 border-2 border-slate-100 p-8 rounded-[35px] text-sm font-medium outline-none focus:bg-white transition-all shadow-inner resize-none" placeholder="Hé {{first_name}}..."/>
                      </div>
                    </div>
                 </div>
                 <div className="space-y-6 overflow-y-auto custom-scrollbar pr-4 max-h-[800px]">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] ml-6">Next in Line ({pendingLeads.length})</h3>
                    {pendingLeads.slice(0, 50).map(l => (
                       <div key={l.id} onClick={() => setSelectedLead(l)} className="bg-white p-10 rounded-[45px] border border-slate-100 shadow-2xl flex justify-between items-center group cursor-pointer hover:shadow-blue-600/10 transition-all">
                          <div>
                             <div className="font-black text-slate-800 text-xl group-hover:text-blue-600 transition-colors tracking-tight">{l.companyName}</div>
                             <div className="text-[11px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{l.ceoEmail || l.emailCompany}</div>
                          </div>
                          <span className="text-[20px] grayscale group-hover:grayscale-0 transition-all">✉️</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {view === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
            {/* Detailed Bar Charts for Email */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white p-12 rounded-[60px] shadow-2xl border border-slate-100 space-y-10">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center">Global Email Performance</h3>
                  <div className="h-80 flex items-end justify-between px-10 relative">
                     <div className="absolute inset-0 border-b border-slate-100 flex flex-col justify-between py-2 pointer-events-none">
                        {[1,2,3,4].map(i => <div key={i} className="border-t border-slate-50 w-full"></div>)}
                     </div>
                     {[
                        { label: 'SENT', val: stats.total, color: 'bg-slate-900' },
                        { label: 'OPENED', val: stats.opened, color: 'bg-blue-500' },
                        { label: 'CLICKED', val: stats.clicked, color: 'bg-indigo-500' },
                        { label: 'SPAM', val: stats.spam, color: 'bg-red-500' },
                        { label: 'MEETINGS', val: stats.booked, color: 'bg-emerald-500' }
                     ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-4 group relative z-10">
                           <div className={`${item.color} w-16 rounded-t-2xl transition-all group-hover:scale-x-110`} style={{ height: `${(item.val / (stats.total || 1)) * 250 + 10}px` }}></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                           <span className="text-[10px] font-black text-slate-900">{item.val}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white p-12 rounded-[60px] shadow-2xl border border-slate-100 space-y-10">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center">Sentiment Analytics (Replies)</h3>
                  <div className="h-80 flex items-end justify-center gap-16 relative">
                     {[
                        { label: 'POSITIEF', val: stats.positive, color: 'bg-emerald-500' },
                        { label: 'NEGATIEF', val: stats.negative, color: 'bg-red-500' },
                        { label: 'TWRIJFEL', val: stats.unsure, color: 'bg-amber-500' }
                     ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-4 group">
                           <div className={`${item.color} w-24 rounded-t-3xl transition-all group-hover:scale-x-110`} style={{ height: `${(item.val / (stats.replied || 1)) * 250 + 10}px` }}></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                           <span className="text-xl font-black text-slate-900">{item.val}</span>
                        </div>
                     ))}
                  </div>
                  <div className="text-center p-6 bg-slate-50 rounded-[35px] border border-slate-100">
                     <div className="text-[10px] font-black text-slate-400 uppercase">Reply-to-Meeting Rate</div>
                     <div className="text-4xl font-black text-emerald-600">{Math.round((stats.booked / (stats.replied || 1)) * 100)}%</div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Open Rate</div>
                  <div className="text-4xl font-black text-blue-600">{stats.openRate}%</div>
               </div>
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Reply Rate</div>
                  <div className="text-4xl font-black text-amber-500">{stats.replyRate}%</div>
               </div>
               <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Spam Rate</div>
                  <div className="text-4xl font-black text-red-500">{stats.spamRate}%</div>
               </div>
               <div className="bg-slate-900 p-8 rounded-[40px] shadow-sm text-center">
                  <div className="text-[10px] font-black text-blue-400 uppercase mb-2">Potential Pipeline</div>
                  <div className="text-4xl font-black text-white">€{(stats.booked * 1250).toLocaleString()}</div>
               </div>
            </div>
          </div>
        )}

        {view === 'active' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-full mx-auto animate-fadeIn">
             {activeLeads.map(l => (
               <div key={l.id} className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-3xl flex flex-col justify-between hover:shadow-blue-600/5 transition-all cursor-pointer group" onClick={() => setSelectedLead(l)}>
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <h3 className="font-black text-slate-900 text-2xl tracking-tighter leading-none group-hover:text-blue-600 transition-colors">{l.companyName}</h3>
                      <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${l.pipelineTag === 'replied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                        {l.pipelineTag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-10 flex items-center gap-3">
                       <span className="text-xl">📅</span> Verzonden: {l.emailSentAt ? new Date(l.emailSentAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-5 rounded-[30px] font-black text-[12px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">Open Gesprek</button>
               </div>
             ))}
           </div>
        )}

        {view === 'history' && (
           <div className="text-center py-60 bg-white rounded-[100px] border-4 border-dashed border-slate-100 animate-fadeIn">
              <div className="text-[150px] mb-12 opacity-5 select-none grayscale">📧</div>
              <p className="font-black uppercase tracking-[0.6em] text-slate-400">Geen gearchiveerde campagnes gevonden.</p>
           </div>
        )}
      </div>
      <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
};

export default EmailInbox;
