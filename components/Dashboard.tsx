
import React, { useMemo, useState } from 'react';
import { Lead, Campaign, FBConversation, MeetSession, FilterState } from '../types';
import { askCoach } from '../services/geminiService';

interface Props {
  allLeads: Lead[];
  campaigns: Campaign[];
  fbConversations: FBConversation[];
  sessions: MeetSession[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onScrape: () => void;
  isScraping: boolean;
}

const Dashboard: React.FC<Props> = ({ 
  allLeads, 
  campaigns, 
  fbConversations, 
  sessions, 
  filters, 
  setFilters, 
  onScrape, 
  isScraping 
}) => {
  const [activeFunnel, setActiveFunnel] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const stats = useMemo(() => {
    const getStats = (channel: string) => {
      const leads = allLeads.filter(l => l.outboundChannel === channel);
      const total = leads.length || 0;
      const contacted = leads.filter(l => ['sent', 'replied', 'appointment_booked', 'closed'].includes(l.pipelineTag || '')).length;
      const replied = leads.filter(l => ['replied', 'appointment_booked', 'closed'].includes(l.pipelineTag || '')).length;
      const interested = leads.filter(l => (l.confidenceScore > 75 && ['replied', 'appointment_booked', 'closed'].includes(l.pipelineTag || ''))).length;
      const booked = leads.filter(l => ['appointment_booked', 'closed'].includes(l.pipelineTag || '')).length;
      const closed = leads.filter(l => l.pipelineTag === 'closed').length;

      return { total, contacted, replied, interested, booked, closed, spam: channel === 'coldemail' ? Math.round(contacted * 0.08) : 0 };
    };

    return {
      email: getStats('coldemail'),
      sms: getStats('coldsms'),
      call: getStats('coldcall'),
      fb: {
        total: fbConversations.length || 0,
        contacted: fbConversations.length,
        replied: fbConversations.filter(c => c.interestScore > 40).length,
        interested: fbConversations.filter(c => c.interestScore > 75).length,
        booked: fbConversations.filter(c => c.meetingBooked).length,
        closed: fbConversations.filter(c => c.meetingClosed).length,
        outage: false
      },
      closing: {
        total: sessions.length || 0,
        contacted: sessions.filter(s => s.status !== 'cancelled').length,
        replied: sessions.filter(s => s.status === 'completed').length,
        interested: sessions.filter(s => s.status === 'completed' && s.outcome !== 'no_close').length,
        booked: sessions.filter(s => s.status === 'completed').length,
        closed: sessions.filter(s => s.outcome === 'closed').length,
      }
    };
  }, [allLeads, fbConversations, sessions]);

  // System Health Monitor
  const systemAlerts = useMemo(() => {
    const alerts = [];
    if (stats.email.spam > (stats.email.contacted * 0.15)) alerts.push({ type: 'error', channel: 'Email', msg: 'Hoge Spam-rate gedetecteerd (>15%). Check SMTP warm-up.' });
    if (stats.call.total > 0 && stats.call.contacted < (stats.call.total * 0.1)) alerts.push({ type: 'warning', channel: 'Cold Call', msg: 'Lage Pickup-rate. Pas bel-tijden aan naar namiddag.' });
    if (allLeads.length > 0 && !stats.email.total && !stats.sms.total) alerts.push({ type: 'info', channel: 'System', msg: 'Lead Distributie actief: Wachten op API sync.' });
    return alerts;
  }, [stats, allLeads]);

  const handleAiAction = async (channelId: string, type: 'coach' | 'copy') => {
    setAiResponse(null);
    setIsAiProcessing(true);
    const channelStats = stats[channelId as keyof typeof stats];
    const prompt = type === 'coach' 
      ? `Analyseer ${channelId} metrics: ${JSON.stringify(channelStats)}. Geef 3 harde ROI optimalisaties.` 
      : `Schrijf copy voor ${channelId} op basis van deze data. Focus op direct closing.`;
    
    try {
      const response = await askCoach(prompt, { channelId, stats: channelStats });
      setAiResponse(response);
    } catch (e) {
      setAiResponse("Fout bij AI analyse.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const FunnelSegment = ({ label, value, color, startH, endH, isLast }: { label: string, value: number, color: string, startH: number, endH: number, isLast: boolean }) => {
    const topStart = (100 - startH) / 2;
    const bottomStart = 100 - topStart;
    const topEnd = (100 - endH) / 2;
    const bottomEnd = 100 - topEnd;

    return (
      <div 
        className="flex-1 h-full relative group"
        style={{
          clipPath: `polygon(0% ${topStart}%, 100% ${topEnd}%, 100% ${bottomEnd}%, 0% ${bottomStart}%)`,
          marginLeft: '-1px' // Total overlap for seamlessness
        }}
      >
        <div className={`${color} w-full h-full flex flex-col items-center justify-center transition-all duration-200 group-hover:brightness-125 border-r border-white/5`}>
          <span className="text-white font-black text-3xl drop-shadow-2xl">{value}</span>
          <span className="text-[9px] text-white/90 font-black uppercase tracking-[0.2em] mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>
    );
  };

  const FunnelRow = ({ title, data, id, colors }: { title: string, data: any, id: string, colors: string[] }) => {
    const isActive = activeFunnel === id;
    const heights = [100, 88, 76, 64, 52, 40];

    return (
      <div className="bg-white rounded-[60px] shadow-2xl border border-slate-100 overflow-hidden mb-10 transition-all hover:translate-y-[-4px]">
        <div className="p-12 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-8">
              <div className={`w-6 h-20 rounded-full ${colors[0]} shadow-2xl`}></div>
              <div>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">{title}</h3>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Seamless Revenue Stream</p>
              </div>
            </div>
            <button 
              onClick={() => { setActiveFunnel(isActive ? null : id); setAiResponse(null); }}
              className={`px-10 py-5 rounded-[30px] font-black uppercase tracking-widest transition-all border-2 text-xs
                ${isActive ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}
              `}
            >
              {isActive ? 'Sluit Deep Dive' : 'Open KPI Matrix'}
            </button>
          </div>

          <div className="w-full h-48 flex items-center">
            <FunnelSegment label="Totaal" value={data.total} color={colors[0]} startH={heights[0]} endH={heights[1]} isLast={false} />
            <FunnelSegment label="Contact" value={data.contacted} color={colors[1]} startH={heights[1]} endH={heights[2]} isLast={false} />
            <FunnelSegment label="Replies" value={data.replied} color={colors[2]} startH={heights[2]} endH={heights[3]} isLast={false} />
            <FunnelSegment label="Interesse" value={data.interested} color={colors[3]} startH={heights[3]} endH={heights[4]} isLast={false} />
            <FunnelSegment label="Booked" value={data.booked} color={colors[4]} startH={heights[4]} endH={heights[5]} isLast={false} />
            <FunnelSegment label="Closed" value={data.closed} color={colors[5]} startH={heights[5]} endH={heights[5]} isLast={true} />
          </div>

          <div className="flex justify-between px-4 mt-6">
            {['Inbound Pool', 'Outbound Live', 'Responses', 'Qualified', 'Agendapunt', 'Closed Win'].map(l => (
              <span key={l} className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full text-center opacity-50">{l}</span>
            ))}
          </div>
        </div>

        {isActive && (
          <div className="px-12 pb-16 pt-8 animate-slideUp border-t border-slate-50 grid grid-cols-1 lg:grid-cols-3 gap-12 bg-slate-50/50">
            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Performance Intelligence</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-500">Contact-to-Reply</span>
                  <span className="text-2xl font-black text-blue-600">{data.contacted ? Math.round((data.replied/data.contacted)*100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-500">Reply-to-Meeting</span>
                  <span className="text-2xl font-black text-amber-500">{data.replied ? Math.round((data.booked/data.replied)*100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-500">Overall Win Rate</span>
                  <span className="text-2xl font-black text-emerald-500">{data.total ? Math.round((data.closed/data.total)*100) : 0}%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-12 rounded-[50px] shadow-3xl flex flex-col justify-between border-l-[25px] border-blue-600 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 text-[200px] opacity-10 font-black italic select-none">AI</div>
              <div className="relative z-10">
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-6">Brain Optimization Feed</h4>
                {isAiProcessing ? (
                  <div className="flex items-center gap-4 py-4">
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="text-sm font-black text-blue-400 uppercase tracking-widest">Processing Data...</span>
                  </div>
                ) : aiResponse ? (
                  <div className="text-base leading-relaxed text-slate-200 font-medium animate-fadeIn bg-white/5 p-6 rounded-3xl border border-white/10">{aiResponse}</div>
                ) : (
                  <p className="text-base leading-relaxed text-slate-300 font-medium italic">Klik op AI Coach voor een realtime optimalisatie plan van dit kanaal.</p>
                )}
              </div>
              <div className="flex gap-6 relative z-10 mt-10">
                <button 
                  onClick={() => handleAiAction(id, 'copy')}
                  disabled={isAiProcessing}
                  className="flex-1 bg-blue-600 py-6 rounded-[30px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                >
                  Regenerate Copy
                </button>
                <button 
                  onClick={() => handleAiAction(id, 'coach')}
                  disabled={isAiProcessing}
                  className="flex-1 bg-white/10 py-6 rounded-[30px] font-black text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10 active:scale-95 disabled:opacity-50"
                >
                  AI Strategist
                </button>
              </div>
            </div>

            <div className="bg-blue-600 text-white p-12 rounded-[50px] shadow-4xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 text-[180px] opacity-10 font-black">€</div>
              <div>
                <h4 className="text-xs font-black text-blue-100 uppercase tracking-widest mb-4">Pipeline Valuation</h4>
                <div className="text-7xl font-black tracking-tighter">€{(data.booked * 1650).toLocaleString()}</div>
                <p className="text-[11px] font-bold text-blue-200 mt-4 uppercase tracking-[0.3em] opacity-80">Sync: GHL & Instantly Live</p>
              </div>
              <div className="bg-white/10 p-8 rounded-[40px] border border-white/20 mt-10">
                <div className="text-[10px] font-black uppercase text-blue-100 mb-2">Realized Revenue</div>
                <div className="text-4xl font-black text-emerald-300">€{(data.closed * 1650).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-10 lg:p-24 h-full overflow-y-auto bg-slate-50 space-y-16 pb-96 custom-scrollbar">
      {/* SYSTEM ALERTS */}
      {systemAlerts.length > 0 && (
        <div className="space-y-4 animate-slideIn">
           {systemAlerts.map((alert, i) => (
             <div key={i} className={`p-6 rounded-[30px] border-2 flex items-center gap-6 shadow-xl ${alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                <span className="text-2xl">{alert.type === 'error' ? '🚫' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <div>
                  <span className="font-black uppercase text-xs tracking-widest mr-4">[{alert.channel}]</span>
                  <span className="font-bold text-sm">{alert.msg}</span>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-16">
        <div className="space-y-8">
          <h2 className="text-[140px] font-black text-slate-900 tracking-tighter leading-[0.75] uppercase select-none">Command Center</h2>
          <div className="flex items-center gap-6 ml-8">
             <div className="w-5 h-5 bg-emerald-500 rounded-full animate-pulse shadow-2xl shadow-emerald-500/50"></div>
             <p className="text-slate-400 text-[14px] font-black uppercase tracking-[0.8em]">Revenue Control OS V5.0</p>
          </div>
        </div>
        <div className="bg-slate-900 px-20 py-16 rounded-[100px] shadow-5xl text-center border-b-[30px] border-blue-600 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 text-[200px] opacity-10 font-black italic select-none group-hover:translate-x-6 transition-transform">KPI</div>
           <div className="text-[14px] font-black text-blue-400 uppercase tracking-[0.6em] mb-6 relative z-10">Total Booked Sessions</div>
           <div className="text-[180px] font-black text-white tracking-tighter leading-none relative z-10 drop-shadow-3xl">
              {stats.email.booked + stats.sms.booked + stats.call.booked + stats.fb.booked}
           </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-12 rounded-[70px] shadow-4xl border border-slate-100 flex flex-wrap gap-12 items-center animate-slideUp">
         <div className="flex-1 min-w-[450px] relative group">
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-300 font-black text-3xl group-focus-within:text-blue-600 transition-colors">🔍</span>
            <input 
              type="text" 
              value={filters.sector}
              onChange={e => setFilters(prev => ({ ...prev, sector: e.target.value }))}
              placeholder="Search Sector (e.g. Roofers, SaaS)..." 
              className="w-full bg-slate-50 border-[6px] border-slate-50 rounded-[50px] pl-28 pr-12 py-12 text-2xl font-black outline-none focus:border-blue-100 focus:bg-white transition-all shadow-inner"
            />
         </div>
         <div className="flex-1 min-w-[450px] relative group">
            <span className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-300 font-black text-3xl group-focus-within:text-blue-600 transition-colors">📍</span>
            <input 
              type="text" 
              value={filters.location}
              onChange={e => setFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Target Region..." 
              className="w-full bg-slate-50 border-[6px] border-slate-50 rounded-[50px] pl-28 pr-12 py-12 text-2xl font-black outline-none focus:border-blue-100 focus:bg-white transition-all shadow-inner"
            />
         </div>
         <button 
           onClick={onScrape} 
           disabled={isScraping || !filters.sector || !filters.location}
           className="bg-blue-600 text-white px-24 py-12 rounded-[50px] font-black text-lg uppercase tracking-widest shadow-5xl shadow-blue-600/50 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-20 flex items-center gap-8"
         >
            {isScraping ? (
              <><span className="animate-spin text-3xl">↻</span> Researching...</>
            ) : 'INITIATE DEEP SCRAPE'}
         </button>
      </div>

      {/* FUNNELS */}
      <div className="space-y-6">
        <FunnelRow 
          title="Email Engine (Instantly)" 
          data={stats.email} 
          id="email" 
          colors={['bg-blue-900', 'bg-blue-700', 'bg-blue-600', 'bg-blue-500', 'bg-amber-600', 'bg-emerald-600']} 
        />
        <FunnelRow 
          title="SMS Master Flow (GHL)" 
          data={stats.sms} 
          id="sms" 
          colors={['bg-orange-900', 'bg-orange-700', 'bg-orange-600', 'bg-orange-500', 'bg-amber-600', 'bg-emerald-600']} 
        />
        <FunnelRow 
          title="Cold Call Command" 
          data={stats.call} 
          id="call" 
          colors={['bg-slate-900', 'bg-slate-700', 'bg-slate-600', 'bg-slate-500', 'bg-amber-600', 'bg-emerald-600']} 
        />
        <FunnelRow 
          title="Facebook Messenger AI" 
          data={stats.fb} 
          id="fb" 
          colors={['bg-indigo-900', 'bg-indigo-700', 'bg-indigo-600', 'bg-indigo-500', 'bg-amber-600', 'bg-emerald-600']} 
        />
        <FunnelRow 
          title="Sales Closing Hub" 
          data={stats.closing} 
          id="closing" 
          colors={['bg-emerald-900', 'bg-emerald-800', 'bg-emerald-700', 'bg-emerald-600', 'bg-amber-600', 'bg-emerald-600']} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
