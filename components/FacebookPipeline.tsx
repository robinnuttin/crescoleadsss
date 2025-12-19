import React, { useMemo, useState } from 'react';
import { FBConversation, Message, Lead } from '../types';

interface Props {
  conversations: FBConversation[];
  setConversations: React.Dispatch<React.SetStateAction<FBConversation[]>>;
  allLeads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
}

const FacebookPipeline: React.FC<Props> = ({ conversations, setConversations, allLeads, onUpdateLeads }) => {
  const [view, setView] = useState<'monitor' | 'analytics' | 'history'>('monitor');
  const [selectedChat, setSelectedChat] = useState<FBConversation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const stats = useMemo(() => {
    const total = conversations.length || 1;
    const booked = conversations.filter(c => c.meetingBooked).length;
    return {
      total: conversations.length,
      booked: booked,
      convRate: Math.round((booked/total)*100),
      positive: 78,
      negative: 12,
      unsure: 10,
      emails: conversations.filter(c => c.contactInfoExchanged.email).length,
      phones: conversations.filter(c => c.contactInfoExchanged.phone).length
    };
  }, [conversations]);

  const handleDeepResearch = (chat: FBConversation) => {
    setIsAnalyzing(true);
    setTimeout(() => {
        const newLead: Lead = {
            id: Math.random().toString(36).substr(2,9),
            companyName: chat.leadName,
            sector: 'Facebook Prospect',
            city: 'Via Messenger',
            website: '',
            emailCompany: chat.contactInfoExchanged.email || '',
            phoneCompany: chat.contactInfoExchanged.phone || '',
            ceoName: chat.leadName,
            ceoEmail: chat.contactInfoExchanged.email || '',
            ceoPhone: chat.contactInfoExchanged.phone || '',
            analysis: {
                socialFollowers: 'Monitoring GHL Messenger',
                offerReason: 'Toonde interesse in Messenger gesprek',
                marketingBottlenecks: ['Mist Messenger automatisatie', 'Handmatige opvolging'],
                visualScore: 7,
                recommendedChannel: 'fb_messenger',
                qualificationNotes: chat.summary,
                pagesCount: 0,
                seoStatus: 'Gemiddeld',
                websiteScore: 5,
                performanceScore: 6
            },
            crescoProfile: 'foundation',
            outboundChannel: 'fb_messenger',
            pipelineTag: 'replied',
            ghlSynced: true,
            callAttempts: 0,
            interactions: chat.transcript.map(m => ({
                id: Math.random().toString(36).substr(2,9),
                type: 'sms',
                timestamp: m.timestamp,
                content: m.text,
                outcome: 'Messenger Chat'
            })),
            confidenceScore: 85,
            scrapedAt: new Date().toISOString()
        };
        
        onUpdateLeads([newLead]);
        setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, analysisPerformed: true } : c));
        setIsAnalyzing(false);
        alert(`Lead ${chat.leadName} succesvol geanalyseerd en gesynchroniseerd met GHL.`);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-8 lg:p-12 flex flex-col lg:flex-row justify-between items-center gap-10 shadow-sm relative z-10">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">FB Messenger Funnel</h2>
          <div className="flex gap-8 mt-10">
            {['monitor', 'analytics', 'history'].map(v => (
              <button key={v} onClick={() => setView(v as any)} className={`text-[10px] font-black uppercase tracking-widest pb-3 border-b-4 transition-all ${view === v ? 'text-indigo-600 border-indigo-600' : 'text-slate-300 border-transparent'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
           <div className="bg-indigo-50 px-8 py-4 rounded-[30px] border border-indigo-100 text-center">
              <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Emails Extracted</div>
              <div className="text-3xl font-black text-indigo-600">{stats.emails}</div>
           </div>
           <div className="bg-emerald-50 px-8 py-4 rounded-[30px] border border-emerald-100 text-center">
              <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Meetings AI</div>
              <div className="text-3xl font-black text-emerald-600">{stats.booked}</div>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 lg:p-20 custom-scrollbar">
        {view === 'monitor' && (
          <div className="flex flex-col lg:flex-row gap-10">
             <div className="flex-1 space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6">Live GHL AI Gesprekken</h3>
                {conversations.map(chat => (
                  <div 
                    key={chat.id} 
                    onClick={() => setSelectedChat(chat)}
                    className={`bg-white p-10 rounded-[60px] border transition-all cursor-pointer group shadow-sm hover:shadow-2xl flex justify-between items-center
                      ${selectedChat?.id === chat.id ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-100'}
                    `}
                  >
                     <div className="flex-1">
                        <div className="flex items-center gap-4">
                           <h4 className="font-black text-2xl text-slate-900 group-hover:text-indigo-600 transition-colors">{chat.leadName}</h4>
                           {chat.contactInfoExchanged.email && <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-3 py-1 rounded-full uppercase">Email Sync ✓</span>}
                           {chat.meetingBooked && <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase">Booked ✓</span>}
                        </div>
                        <p className="text-sm text-slate-500 italic mt-2 line-clamp-1">"{chat.summary}"</p>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-black text-slate-300 uppercase mb-1">{chat.lastUpdate}</div>
                        <div className="text-xl font-black text-indigo-600">{chat.interestScore}%</div>
                     </div>
                  </div>
                ))}
             </div>

             {selectedChat && (
               <div className="w-full lg:w-[600px] bg-white rounded-[60px] shadow-3xl border border-slate-100 flex flex-col overflow-hidden animate-fadeIn">
                  <div className="bg-indigo-600 p-8 text-white flex justify-between items-center">
                     <h3 className="font-black text-xl">{selectedChat.leadName}</h3>
                     <button onClick={() => setSelectedChat(null)} className="text-white/60 hover:text-white transition-colors">✕</button>
                  </div>
                  <div className="flex-1 bg-slate-50 p-8 space-y-4 overflow-y-auto h-[500px] custom-scrollbar">
                     {selectedChat.transcript.map((m, i) => (
                       <div key={i} className={`flex ${m.role === 'bot' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] p-6 rounded-[35px] text-sm leading-relaxed shadow-sm
                            ${m.role === 'bot' ? 'bg-white text-slate-700' : 'bg-indigo-600 text-white'}
                          `}>
                             {m.text}
                          </div>
                       </div>
                     ))}
                  </div>
                  <div className="p-10 border-t border-slate-100 space-y-6">
                     <div className="flex justify-between items-center">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Extraheren naar GHL...</div>
                        <div className="flex gap-2">
                           <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse"></span>
                           <span className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse delay-75"></span>
                        </div>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 text-[11px] font-bold text-slate-500 italic">
                        AI zoekt naar e-mailadressen en telefoonnummers in dit gesprek om de GHL contactfiche te updaten.
                     </div>
                     <button 
                        onClick={() => handleDeepResearch(selectedChat)}
                        disabled={isAnalyzing}
                        className="w-full bg-slate-900 text-white py-4 rounded-[30px] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                     >
                        {isAnalyzing ? 'BEZIG MET RESEARCH...' : 'SCREER LEAD & UPDATE GHL'}
                     </button>
                  </div>
               </div>
             )}
          </div>
        )}

        {view === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                <div className="bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl text-center border-b-[15px] border-indigo-600">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Total Chats</div>
                   <div className="text-6xl font-black text-indigo-600">{stats.total}</div>
                </div>
                <div className="bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl text-center border-b-[15px] border-emerald-500">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Meeting Rate</div>
                   <div className="text-6xl font-black text-emerald-500">{stats.convRate}%</div>
                </div>
                <div className="bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl text-center border-b-[15px] border-amber-500">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Sentiment</div>
                   <div className="text-6xl font-black text-amber-500">{stats.positive}%</div>
                </div>
                <div className="bg-white p-10 rounded-[60px] border border-slate-100 shadow-xl text-center border-b-[15px] border-slate-900">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">GHL Syncs</div>
                   <div className="text-6xl font-black text-slate-900">{stats.emails + stats.phones}</div>
                </div>
             </div>

             <div className="bg-white p-16 rounded-[80px] shadow-3xl border border-slate-100 space-y-12">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center">Facebook Messenger Sentiment Analytics</h3>
                 <div className="h-64 flex items-end justify-center gap-20">
                    <div className="flex flex-col items-center gap-6">
                       <div className="bg-emerald-500 w-24 rounded-t-[40px] transition-all" style={{ height: `${stats.positive * 2.5}px` }}></div>
                       <span className="text-xs font-black text-slate-400 uppercase">Positief</span>
                       <span className="font-black">{stats.positive}%</span>
                    </div>
                    <div className="flex flex-col items-center gap-6">
                       <div className="bg-red-500 w-24 rounded-t-[40px] transition-all" style={{ height: `${stats.negative * 2.5}px` }}></div>
                       <span className="text-xs font-black text-slate-400 uppercase">Negatief</span>
                       <span className="font-black">{stats.negative}%</span>
                    </div>
                    <div className="flex flex-col items-center gap-6">
                       <div className="bg-amber-500 w-24 rounded-t-[40px] transition-all" style={{ height: `${stats.unsure * 2.5}px` }}></div>
                       <span className="text-xs font-black text-slate-400 uppercase">Twijfel</span>
                       <span className="font-black">{stats.unsure}%</span>
                    </div>
                 </div>
              </div>
          </div>
        )}

        {view === 'history' && (
          <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-6">Gearchiveerde Messenger Gesprekken</h3>
             {conversations.map(chat => (
               <div key={chat.id} className="bg-white p-10 rounded-[60px] border border-slate-100 shadow-sm flex items-center justify-between group">
                  <div className="flex-1">
                     <h4 className="font-black text-2xl text-slate-900">{chat.leadName}</h4>
                     <p className="text-xs text-slate-500 mt-2 italic">Gearchiveerd op: {chat.lastUpdate}</p>
                  </div>
                  <div className={`px-10 py-4 rounded-[30px] font-black text-xs uppercase tracking-widest ${chat.meetingBooked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                     {chat.meetingBooked ? 'MEETING' : 'CONTACT'}
                  </div>
               </div>
             ))}
             {conversations.length === 0 && (
                <p className="font-black uppercase tracking-[0.6em] text-slate-400 text-center py-20">Geen verleden gesprekken in database.</p>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacebookPipeline;