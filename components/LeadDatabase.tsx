
import React, { useState, useMemo } from 'react';
import { Lead, FilterState } from '../types';
import ResultsTable from './ResultsTable';
import FilterPanel from './FilterPanel';
import { enrichLead } from '../services/geminiService';
import LeadDetailModal from './LeadDetailModal';

interface Props {
  allLeads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
}

const LeadDatabase: React.FC<Props> = ({ allLeads, onUpdateLeads }) => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [view, setView] = useState<'all' | 'followup'>('all');
  
  const [dbFilters, setDbFilters] = useState<FilterState>({
    sector: '', 
    location: '', 
    includeSmallTowns: true, 
    requireEmail: false, 
    requirePhone: false,
    phoneTypes: ['landline', 'mobile_be'], 
    requireCeoName: false, 
    requireCeoMobile: false,
    requireCeoEmail: false, 
    minReviewCount: 0, 
    minReviewScore: 0, 
    adPlatforms: [], 
    adTiming: 'all',
    seoFilter: 'all',
    requireSocials: false,
    employeeCount: '', 
    crescoProfile: null,
    websiteScoreMin: 1,
    minPerformanceScore: 1,
    minPagesCount: 0
  });

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1);
        const newLeads = rows.map(row => {
            const cols = row.split(',');
            return {
                id: Math.random().toString(36).substr(2, 9),
                companyName: cols[0] || 'Onbekend',
                website: cols[1] || '',
                phoneCompany: cols[2] || '',
                emailCompany: cols[3] || '',
                ceoName: '',
                ceoEmail: '',
                ceoPhone: '',
                interactions: [],
                crescoProfile: null,
                sector: 'Import',
                city: 'Import',
                analysis: { 
                    socialFollowers: '', 
                    offerReason: '', 
                    marketingBottlenecks: [], 
                    visualScore: 0, 
                    recommendedChannel: 'coldcall', 
                    qualificationNotes: '', 
                    pagesCount: 0, 
                    seoStatus: 'Slecht', 
                    websiteScore: 0,
                    performanceScore: 0 
                },
                imported: true,
                callAttempts: 0,
                callNotes: [],
                confidenceScore: 0,
                // Added scrapedAt to satisfy required Lead property
                scrapedAt: new Date().toISOString()
            } as Lead;
        });
        onUpdateLeads(newLeads);
    };
    reader.readAsText(file);
  };

  const enrichAll = async () => {
      setIsEnriching(true);
      const toEnrich = allLeads.filter(l => l.imported && !l.ceoName);
      const enriched = [];
      for (const l of toEnrich) {
          const res = await enrichLead(l);
          enriched.push(res);
      }
      onUpdateLeads(enriched);
      setIsEnriching(false);
  };

  const filteredLeads = useMemo(() => {
    return allLeads.filter(l => {
      let match = true;
      if (view === 'followup' && !l.isFollowUp) match = false;
      if (dbFilters.sector && !l.sector?.toLowerCase().includes(dbFilters.sector.toLowerCase())) match = false;
      if (dbFilters.location && !l.city?.toLowerCase().includes(dbFilters.location.toLowerCase())) match = false;
      
      // Website Quality Filters
      if (dbFilters.websiteScoreMin && (l.analysis?.websiteScore || 0) < dbFilters.websiteScoreMin) match = false;
      if (dbFilters.minPerformanceScore && (l.analysis?.performanceScore || 0) < dbFilters.minPerformanceScore) match = false;
      if (dbFilters.seoFilter !== 'all' && l.analysis?.seoStatus !== dbFilters.seoFilter) match = false;
      if (dbFilters.minPagesCount && (l.analysis?.pagesCount || 0) < dbFilters.minPagesCount) match = false;

      return match;
    });
  }, [allLeads, dbFilters, view]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Master Database</h2>
            <div className="flex gap-6 mt-4">
              <button 
                onClick={() => setView('all')} 
                className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-all ${view === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
              >
                Alle Leads ({allLeads.length})
              </button>
              <button 
                onClick={() => setView('followup')} 
                className={`text-[11px] font-black uppercase tracking-widest pb-1 transition-all ${view === 'followup' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-400'}`}
              >
                Follow-up Lijst ({allLeads.filter(l => l.isFollowUp).length})
              </button>
            </div>
          </div>
          <div className="flex gap-4">
              <label className="bg-slate-100 hover:bg-slate-200 px-6 py-3 rounded-2xl cursor-pointer text-sm font-bold transition-all flex items-center gap-2">
                  📥 Import CSV
                  <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
              </label>
              <button 
                onClick={enrichAll}
                disabled={isEnriching}
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-blue-500/30 hover:scale-105 transition-all disabled:opacity-50"
              >
                  {isEnriching ? 'AI ENRICHING...' : '✨ DEEP AI ENRICHMENT'}
              </button>
          </div>
      </div>
      <div className="flex-1 overflow-y-auto">
          <FilterPanel filters={dbFilters} setFilters={setDbFilters} onSubmit={() => {}} isProcessing={false} mode="filter" />
          <div className="px-8 pb-32">
            {view === 'followup' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredLeads.map(l => (
                  <div key={l.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group" onClick={() => setSelectedLead(l)}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="px-4 py-1.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full border border-amber-200">
                        {l.crmCategory || 'Follow-up'}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{l.city}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{l.companyName}</h4>
                    <p className="text-xs text-slate-500 mt-2 italic">"{l.analysis.offerReason.slice(0, 100)}..."</p>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase">Confidence</div>
                      <div className="text-lg font-black text-blue-600">{l.confidenceScore}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {view === 'all' && <ResultsTable leads={filteredLeads} onLeadClick={setSelectedLead} />}
          </div>
      </div>

      <LeadDetailModal 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)} 
        onUpdateLead={(updated) => {
          onUpdateLeads([updated]);
          setSelectedLead(updated);
        }}
      />
    </div>
  );
};

export default LeadDatabase;
