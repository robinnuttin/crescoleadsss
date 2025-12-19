
import React, { useState, useMemo } from 'react';
import { MeetSession, Lead } from '../types';
import { enrichLead } from '../services/geminiService';

interface Props {
  sessions: MeetSession[];
  setSessions: React.Dispatch<React.SetStateAction<MeetSession[]>>;
  onUpdateLeads: (leads: Lead[]) => void;
}

const SalesMeet: React.FC<Props> = ({ sessions = [], setSessions, onUpdateLeads }) => {
  const [view, setView] = useState<'schedule' | 'analytics' | 'history' | 'new_lead'>('schedule');
  const [isProcessingLead, setIsProcessingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({ name: '', company: '', email: '', website: '', phone: '', info: '' });

  const stats = useMemo(() => {
    const total = sessions.length || 0;
    const closed = sessions.filter(s => s.outcome === 'closed').length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    return { 
      total, 
      closed, 
      completed,
      closingRate: completed ? Math.round((closed / completed) * 100) : 0,
      avgDeal: 1450,
      oneInX: closed ? Math.round(completed / (closed || 1)) : (completed || 0),
      totalRevenue: closed * 1450
    };
  }, [sessions]);

  const handleCreateLeadAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingLead(true);
    
    try {
        let baseLead: Lead = {
            id: Math.random().toString(36).substr(2, 9),
            companyName: newLeadForm.company,
            ceoName: newLeadForm.name,
            website: newLeadForm.website,
            emailCompany: newLeadForm.email,
            phoneCompany: newLeadForm.phone,
            ceoEmail: newLeadForm.email,
            ceoPhone: newLeadForm.phone,
            sector: newLeadForm.info || 'Handmatige Lead',
            city: 'Manual Input',
            analysis: { 
                websiteScore: 5, performanceScore: 5, marketingBottlenecks: ['Manueel toegevoegd'], seoStatus: 'Gemiddeld',
                socialFollowers: '0', offerReason: 'Sales Call in progress', recommendedChannel: 'sales_call', 
                qualificationNotes: 'Direct entry', pagesCount: 0, visualScore: 5
            },
            crescoProfile: 'multiplier',
            outboundChannel: 'sales_call',
            pipelineTag: 'appointment_booked',
            scrapedAt: new Date().toISOString(),
            callAttempts: 1, interactions: [], confidenceScore: 100
        };

        const researched = await enrichLead(baseLead);
        onUpdateLeads([researched]);

        const newSession: MeetSession = {
          id: Math.random().toString(36).substr(2, 9),
          leadId: researched.id,
          leadName: researched.ceoName || researched.companyName,
          email: researched.ceoEmail,
          website: researched.website,
          date: 'Nu Actief',
          status: 'completed',
          transcript: [{ role: 'system', text: 'Sessie gestart. Deep Research voltooid.', timestamp: new Date().toISOString() }],
          leadSource: 'sales_call',
          outcome: 'follow_up'
        };

        setSessions([newSession, ...sessions]);
        setIsProcessingLead(false);
        setView('schedule');
        setNewLeadForm({ name: '', company: '', email: '', website: '', phone: '', info: '' });
        alert(`Deep Research voltooid voor ${researched.companyName}. Lead data gesynchroniseerd.`);
    } catch (err) {
        console.error("Deep research error:", err);
        setIsProcessingLead(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900">
      <div className="bg-white px-12 py-10 flex flex-col lg:flex-row justify-between lg:items-center border-b border-slate-200 shadow-sm gap-8">
        <div className="space-y-4">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Closing Command</h2>
          <div className="flex gap-8 mt-10">
            {['schedule', 'analytics', 'history', 'new_lead'].map(v => (
              <button key={v} onClick={() => setView(v as any)} className={`text-[10px] font-black uppercase tracking-[0.2em] pb-3 border-b-4 transition-all ${view === v ? 'text-emerald-600 border-emerald-600' : 'text-slate-300 border-transparent hover:text-slate-500'}`}>
                {v === 'new_lead' ? '➕ NIEUWE OPPORTUNITY' : v === 'schedule' ? 'Live Board' : v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
           <div className="bg-emerald-50 px-8 py-5 rounded-[35px] border-2 border-emerald-100 text-center">
              <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Closing Rate</div>
              <div className="text-4xl font-black text-emerald-600">{stats.closingRate}%</div>
           </div>
           <div className="bg-slate-900 px-8 py-5 rounded-[35px] text-center text-white relative overflow-hidden">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ratio</div>
              <div className="text-4xl font-black">1 op {stats.oneInX}</div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 lg:p-20 custom-scrollbar">
        {view === 'new_lead' && (
          <div className="max-w-4xl mx-auto bg-white p-16 rounded-[80px] shadow-3xl border border-slate-100 animate-fadeIn">
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-10 text-center">Invoeren Nieuwe Sales Opportunity</h3>
             <form onSubmit={handleCreateLeadAndStart} className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Zaakvoerder</label>
                   <input required type="text" value={newLeadForm.name} onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[25px] font-bold text-lg focus:border-emerald-500 outline-none transition-all" placeholder="bv. Jan Peeters" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Bedrijfsnaam</label>
                   <input required type="text" value={newLeadForm.company} onChange={e => setNewLeadForm({...newLeadForm, company: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[25px] font-bold text-lg focus:border-emerald-500 outline-none transition-all" placeholder="bv. Peeters Dakwerken" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Website URL</label>
                   <input required type="url" value={newLeadForm.website} onChange={e => setNewLeadForm({...newLeadForm, website: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[25px] font-bold text-lg focus:border-emerald-500 outline-none transition-all" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">E-mail</label>
                   <input required type="email" value={newLeadForm.email} onChange={e => setNewLeadForm({...newLeadForm, email: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[25px] font-bold text-lg focus:border-emerald-500 outline-none transition-all" placeholder="info@bedrijf.be" />
                </div>
                <div className="col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Niche Info (voor AI Deep Research)</label>
                   <textarea value={newLeadForm.info} onChange={e => setNewLeadForm({...newLeadForm, info: e.target.value})} className="w-full h-32 bg-slate-50 border-2 border-slate-50 p-6 rounded-[25px] font-medium outline-none focus:border-emerald-500 transition-all resize-none" placeholder="bv. Gespecialiseerd in hellende daken..." />
                </div>
                <button type="submit" disabled={isProcessingLead} className="col-span-2 bg-slate-900 text-white py-8 rounded-[35px] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
                   {isProcessingLead ? 'Deep Research & Website Scraping Bezig...' : 'Systeem Starten & Deep Research'}
                </button>
             </form>
          </div>
        )}

        {view === 'schedule' && (
           <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6">Live Sales Board</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {sessions.map(s => (
                      <div key={s.id} className="bg-white border border-slate-100 p-10 rounded-[60px] space-y-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                         <div className="flex justify-between items-start relative z-10">
                            <div>
                               <h4 className="font-black text-3xl text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tighter">{s.leadName}</h4>
                               <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest">{s.date} • {s.leadSource}</p>
                            </div>
                            <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.outcome === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                               {s.outcome || s.status}
                            </div>
                         </div>
                         <div className="flex gap-4 relative z-10">
                            <button className="flex-1 bg-slate-900 text-white py-5 rounded-[30px] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95">Deelnemen aan Call</button>
                            <button className="bg-slate-50 text-slate-400 px-6 py-5 rounded-[30px] font-black text-[10px] uppercase hover:bg-slate-100 transition-all">Analyse</button>
                         </div>
                      </div>
                    ))}
              </div>
           </div>
        )}

        {view === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-12 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center">
                   <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Total Deals</div>
                   <div className="text-4xl font-black">{stats.completed}</div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center">
                   <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Closed</div>
                   <div className="text-4xl font-black text-emerald-600">{stats.closed}</div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm text-center">
                   <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Win Rate</div>
                   <div className="text-4xl font-black text-blue-600">{stats.closingRate}%</div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[40px] text-white text-center">
                   <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Total Revenue</div>
                   <div className="text-4xl font-black text-emerald-400">€{stats.totalRevenue.toLocaleString()}</div>
                </div>
             </div>

             <div className="bg-white p-12 rounded-[60px] shadow-2xl border border-slate-100 space-y-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center">Maandelijkse Revenue Groei</h3>
                <div className="h-64 flex items-end justify-around px-10 relative">
                   {[
                     { label: 'JAN', val: 8400 },
                     { label: 'FEB', val: 12600 },
                     { label: 'MAR', val: stats.totalRevenue || 15400 }
                   ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-4 group">
                        <div className="bg-emerald-500 w-32 rounded-t-3xl transition-all hover:scale-x-105" style={{ height: `${item.val / 100}px` }}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{item.label}</span>
                        <span className="font-black text-sm">€{item.val.toLocaleString()}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {view === 'history' && (
           <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6">Sessie Historiek</h3>
              {sessions.filter(s => s.status === 'completed' || s.status === 'cancelled').map(s => (
                <div key={s.id} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm flex items-center justify-between group">
                   <div className="flex-1">
                      <h4 className="font-black text-2xl text-slate-900 group-hover:text-emerald-600 transition-colors">{s.leadName}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest">{s.date} • {s.outcome || 'No outcome set'}</p>
                   </div>
                   <div className={`px-8 py-3 rounded-full font-black text-[9px] uppercase tracking-widest ${s.outcome === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {s.outcome || s.status}
                   </div>
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default SalesMeet;
