
import React, { useState } from 'react';
import { Lead } from '../types';

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onUpdateLead?: (lead: Lead) => void;
}

const LeadDetailModal: React.FC<Props> = ({ lead, onClose, onUpdateLead }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  if (!lead) return null;

  const handleAddToFollowUp = () => {
    if (!onUpdateLead) return;
    setIsUpdating(true);
    
    // Categorization logic based on visual score and profiles
    let category = 'Algemeen Prospect';
    if (lead.analysis.visualScore > 8) category = 'High-End Client';
    if (lead.crescoProfile === 'domination') category = 'Enterprise Target';
    if (lead.analysis.websiteScore < 4) category = 'Urgent Optimization';

    const updatedLead: Lead = {
      ...lead,
      isFollowUp: true,
      crmCategory: category,
      interactions: [
        ...lead.interactions,
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'call',
          timestamp: new Date().toISOString(),
          content: `Lead handmatig toegevoegd aan follow-up lijst in categorie: ${category}.`,
          outcome: 'Marked for Follow-up'
        }
      ]
    };

    onUpdateLead(updatedLead);
    setTimeout(() => {
      setIsUpdating(false);
      alert(`${lead.companyName} is toegevoegd aan de follow-up lijst (${category})`);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[60px] shadow-2xl overflow-hidden flex flex-col relative border border-white/20">
        <button 
          onClick={onClose}
          className="absolute top-10 right-10 w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl hover:bg-slate-200 transition-all z-10 shadow-lg"
        >
          ✕
        </button>

        <div className="p-16 overflow-y-auto custom-scrollbar space-y-16">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-12 gap-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{lead.companyName}</h2>
              <div className="flex flex-wrap gap-4">
                <span className="bg-blue-600 text-white text-[11px] font-black px-5 py-2 rounded-full uppercase tracking-widest">{lead.sector}</span>
                <span className="bg-slate-100 text-slate-500 text-[11px] font-black px-5 py-2 rounded-full uppercase tracking-widest">{lead.city}</span>
                <span className="bg-emerald-100 text-emerald-600 text-[11px] font-black px-5 py-2 rounded-full uppercase tracking-widest border border-emerald-200">Confidence: {lead.confidenceScore}%</span>
                {lead.isFollowUp && (
                  <span className="bg-amber-100 text-amber-700 text-[11px] font-black px-5 py-2 rounded-full uppercase tracking-widest border border-amber-200">
                    Follow-up List ({lead.crmCategory})
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 text-center min-w-[200px]">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gevonden Omzet</div>
                <div className="text-3xl font-black text-blue-600 mt-1">{lead.analysis.revenueEstimate || '€1M+ Est.'}</div>
              </div>
              <button 
                onClick={handleAddToFollowUp}
                disabled={isUpdating || lead.isFollowUp}
                className={`w-full py-4 rounded-[30px] font-black text-[11px] uppercase tracking-widest transition-all shadow-xl
                  ${lead.isFollowUp 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-900/20 active:scale-95'}
                `}
              >
                {isUpdating ? 'Bezig...' : lead.isFollowUp ? '✓ In Follow-up' : '➕ Voeg toe aan Follow-up'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Column */}
            <div className="lg:col-span-2 space-y-12">
              <div className="space-y-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Beslissingsnemer (CEO)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-blue-50/50 rounded-[40px] border border-blue-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-4xl opacity-10 group-hover:scale-125 transition-transform">👤</div>
                    <div className="text-[10px] font-black text-blue-400 uppercase mb-2">Persoonlijke Gegevens</div>
                    <div className="text-xl font-black text-slate-900">{lead.ceoName || 'Zoeken op LinkedIn...'}</div>
                    <div className="text-sm font-bold text-slate-600 mt-2">{lead.ceoEmail || 'geen_prive_mail@cresco.be'}</div>
                    <div className="text-sm font-bold text-blue-600 mt-1">{lead.ceoPhone || 'Geen mobiel nr.'}</div>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4">
                    <div className="text-[10px] font-black text-slate-400 uppercase">Website & Socials</div>
                    <a href={lead.website} target="_blank" className="block text-sm font-black text-blue-600 hover:underline truncate">{lead.website}</a>
                    <div className="flex gap-4 pt-2">
                       {lead.analysis.socialLinks?.facebook && <a href={lead.analysis.socialLinks.facebook} target="_blank" className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-xs font-black">FB</a>}
                       {lead.analysis.socialLinks?.instagram && <a href={lead.analysis.socialLinks.instagram} target="_blank" className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-black">IG</a>}
                       {(lead.ceoLinkedIn || lead.analysis.socialLinks?.linkedin) && <a href={lead.ceoLinkedIn || lead.analysis.socialLinks?.linkedin} target="_blank" className="w-10 h-10 bg-[#0077b5] rounded-full flex items-center justify-center text-white text-xs font-black">LI</a>}
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn Insights */}
              <div className="space-y-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">LinkedIn Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-3">
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Recent Activity</div>
                    <p className="text-sm text-slate-700 font-medium italic leading-relaxed">
                      {lead.analysis.linkedinActivity ? `"${lead.analysis.linkedinActivity}"` : "Geen recente activiteit gedetecteerd."}
                    </p>
                  </div>
                  <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-3">
                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Post Frequency</div>
                    <div className="text-2xl font-black text-slate-900">
                      {lead.analysis.linkedinPostFrequency || "Niet beschikbaar"}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Gebaseerd op AI-analyse van feed</p>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="space-y-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Interactie Historie</h3>
                <div className="space-y-6">
                  {(!lead.interactions || lead.interactions.length === 0) && (
                    <div className="text-center py-20 bg-slate-50 rounded-[50px] border-2 border-dashed border-slate-200 text-slate-400 italic font-medium">Nog geen eerdere gesprekken of campagnes uitgevoerd.</div>
                  )}
                  {lead.interactions?.map((item, i) => (
                    <div key={item.id} className="p-10 bg-white rounded-[45px] border border-slate-100 shadow-sm flex gap-8 items-start relative group hover:shadow-xl transition-all">
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-xl shadow-inner
                        ${item.type === 'call' ? 'bg-red-50 text-red-500' : item.type === 'email' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'}
                      `}>
                        {item.type === 'call' ? '📞' : item.type === 'email' ? '📧' : '💬'}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between">
                          <div className="font-black text-slate-900 uppercase text-xs tracking-widest">{item.type} Outreach</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(item.timestamp).toLocaleString()}</div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{item.content}"</p>
                        {item.outcome && <span className="inline-block px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-widest mt-2">{item.outcome}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Stats Column */}
            <div className="space-y-12">
               <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">AI Analyse</h3>
                  <div className="p-8 bg-slate-900 text-white rounded-[50px] shadow-2xl space-y-6 border-l-[10px] border-blue-600">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Strategisch Offer</div>
                    <div className="text-lg font-black uppercase italic tracking-tight">{lead.crescoProfile || 'Multiplier'} Package</div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">"{lead.analysis.offerReason}"</p>
                    <div className="h-px bg-white/10"></div>
                    <div className="space-y-4">
                       <div className="text-[10px] font-black text-slate-500 uppercase">Gedetecteerde Bottlenecks</div>
                       {lead.analysis.marketingBottlenecks?.map((b,i) => (
                         <div key={i} className="flex gap-3 text-xs items-center text-slate-200">
                           <span className="text-blue-400">⚡</span> {b}
                         </div>
                       ))}
                    </div>
                  </div>
               </div>

               <div className="p-8 bg-slate-50 rounded-[45px] border border-slate-100 space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Infrastructuur</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                       <div className="text-[8px] font-black text-slate-400 uppercase">SEO Score</div>
                       <div className="text-xl font-black text-slate-900">{lead.analysis.websiteScore}/10</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                       <div className="text-[8px] font-black text-emerald-400 uppercase">Performance</div>
                       <div className="text-xl font-black text-emerald-600">{lead.analysis.performanceScore || '?'}/10</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm col-span-2">
                       <div className="text-[8px] font-black text-slate-400 uppercase">Pagina's</div>
                       <div className="text-xl font-black text-slate-900">{lead.analysis.pagesCount || '3-8'}</div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
