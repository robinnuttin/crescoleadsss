import React from 'react';
import { FilterState } from '../types';

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onScrape: () => void;
  isScraping: boolean;
}

const FilterSidebar: React.FC<Props> = ({ filters, setFilters, onScrape, isScraping }) => {
  
  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Helper to map complex phoneTypes array to simple UI state
  const currentPhoneType = (() => {
    if (filters.phoneTypes.includes('landline') && filters.phoneTypes.includes('mobile_be')) return 'all';
    if (filters.phoneTypes.includes('mobile_be')) return 'mobile';
    if (filters.phoneTypes.includes('landline')) return 'landline';
    return 'all';
  })();

  // Helper to map adTiming to legacy UI state
  const currentAdHistory = (() => {
    if (filters.adTiming === 'active_now') return 'has_ads';
    if (filters.adTiming === 'no_ads') return 'no_ads';
    return 'all';
  })();

  return (
    <div className="w-96 bg-slate-900 border-r border-slate-700 h-screen overflow-y-auto flex flex-col p-6 fixed left-0 top-0 z-10">
      <h1 className="text-2xl font-bold text-blue-400 mb-2">LeadScraper Pro X</h1>
      <p className="text-slate-400 text-xs mb-6">Advanced AI Lead Generation & Enrichment</p>

      <div className="space-y-6 mb-20">
        
        {/* SECTION: NICHE & LOCATION */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Doelgroep</h2>
          
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1">Sector / Niche</label>
            <input 
              type="text" 
              value={filters.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              placeholder="bv. Dakwerkers, HVAC, Tandartsen..."
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1">Locatie (Stad/Provincie/Regio)</label>
            <input 
              type="text" 
              value={filters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="bv. Antwerpen, Vlaanderen..."
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={filters.includeSmallTowns}
              onChange={(e) => handleChange('includeSmallTowns', e.target.checked)}
              className="rounded bg-slate-700 border-slate-600"
            />
            <span className="text-xs text-slate-300">Inclusief kleine gemeentes</span>
          </div>
        </div>

        {/* SECTION: CONTACT REQUIREMENTS */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Contact Criteria</h2>
          
          <div className="flex flex-col gap-2 mb-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={filters.requireEmail} onChange={(e) => handleChange('requireEmail', e.target.checked)} />
              <span className="text-sm text-slate-300">Email verplicht</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={filters.requirePhone} onChange={(e) => handleChange('requirePhone', e.target.checked)} />
              <span className="text-sm text-slate-300">Telefoon verplicht</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={filters.requireCeoName} onChange={(e) => handleChange('requireCeoName', e.target.checked)} />
              <span className="text-sm text-slate-300">CEO/Zaakvoerder naam verplicht</span>
            </label>
          </div>

          <div>
             <label className="block text-xs text-slate-400 mb-1">Type Telefoonnummer</label>
             <select 
               value={currentPhoneType}
               onChange={(e) => {
                   const val = e.target.value;
                   let types: string[] = ['landline', 'mobile_be', 'mobile_nl'];
                   if (val === 'mobile') types = ['mobile_be', 'mobile_nl'];
                   if (val === 'landline') types = ['landline'];
                   handleChange('phoneTypes', types);
               }}
               className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
             >
               <option value="all">Alle nummers</option>
               <option value="mobile">Mobiel (04...) voorkeur</option>
               <option value="landline">Vaste lijn</option>
             </select>
          </div>
        </div>

        {/* SECTION: QUALITY & PERFORMANCE */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Kwaliteit & Validatie</h2>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Min. Reviews</label>
              <input 
                type="number" 
                value={filters.minReviewCount}
                onChange={(e) => handleChange('minReviewCount', parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Min. Score (0-5)</label>
              <input 
                type="number" 
                step="0.1"
                max="5"
                value={filters.minReviewScore}
                onChange={(e) => handleChange('minReviewScore', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION: ADS & TECH */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Advertenties & Tech</h2>
          
          <div className="mb-3">
            <label className="block text-xs text-slate-400 mb-1">Advertentie Historiek</label>
            <select 
               value={currentAdHistory}
               onChange={(e) => {
                   const val = e.target.value;
                   let timing = 'all';
                   if (val === 'has_ads') timing = 'active_now';
                   if (val === 'no_ads') timing = 'no_ads';
                   handleChange('adTiming', timing);
               }}
               className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
             >
               <option value="all">Alles</option>
               <option value="has_ads">Draait Ads (Google/Meta)</option>
               <option value="no_ads">Geen Ads historie</option>
             </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Grootte (Werknemers)</label>
            <input 
              type="text" 
              value={filters.employeeCount}
              onChange={(e) => handleChange('employeeCount', e.target.value)}
              placeholder="bv. 1-10, 50+"
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 bg-slate-900 border-t border-slate-700">
        <button 
          onClick={onScrape}
          disabled={isScraping || !filters.sector || !filters.location}
          className={`w-full py-3 rounded font-bold text-white shadow-lg transition-all 
            ${isScraping || !filters.sector || !filters.location
              ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
              : 'bg-blue-600 hover:bg-blue-50 shadow-blue-500/20'}`}
        >
          {isScraping ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scraping...
            </span>
          ) : 'START ONDERZOEK'}
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;