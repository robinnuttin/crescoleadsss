
import React, { useState, useEffect, useRef } from 'react';
import { FilterState, CrescoProfile } from '../types';

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onSubmit: () => void;
  onStop?: () => void;
  isProcessing: boolean;
  mode: 'scrape' | 'filter';
}

const COMMON_SECTORS = [
  "Dakwerkers", "Loodgieters", "Elektriciens", "Zonnepanelen", "Warmtepompen", "HVAC", 
  "Immobiliën", "Advocaten", "Tandartsen", "Boekhouders", "Tuinaannemers", "Schilders"
];

const CITIES = [
  "Antwerpen", "Gent", "Brugge", "Leuven", "Mechelen", "Hasselt", "Turnhout", "Eindhoven", "Rotterdam"
];

const FilterPanel: React.FC<Props> = ({ filters, setFilters, onSubmit, onStop, isProcessing, mode }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sectorSuggestions, setSectorSuggestions] = useState<string[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'sector'|'location'|null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActiveSuggestionField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof FilterState, item: any) => {
    const current = (filters[key] as any[]) || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    handleChange(key, updated);
  };

  const handleInputChange = (field: 'sector'|'location', value: string) => {
    handleChange(field, value);
    if (value.length >= 1) {
        const list = field === 'sector' ? COMMON_SECTORS : CITIES;
        const filtered = list.filter(s => s.toLowerCase().startsWith(value.toLowerCase())).slice(0, 8);
        if (field === 'sector') setSectorSuggestions(filtered);
        else setCitySuggestions(filtered);
        setActiveSuggestionField(field);
    } else {
        setActiveSuggestionField(null);
    }
  };

  const isFormValid = mode === 'scrape' ? (filters.sector && filters.location) : true;

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm p-8 lg:p-10 rounded-[50px] mx-4 lg:mx-10 mt-6" ref={wrapperRef}>
      
      {/* ICP PAKKET SELECTIE */}
      <div className="mb-10 pb-8 border-b border-slate-100 overflow-x-auto">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Target ICP Strategy (Ideal Customer Profile)</label>
        <div className="flex gap-4 min-w-[750px]">
            {['foundation', 'multiplier', 'domination'].map((p: any) => (
                <button
                    key={p}
                    onClick={() => handleChange('crescoProfile', filters.crescoProfile === p ? null : p)}
                    className={`flex-1 p-8 rounded-[32px] border-2 transition-all text-left relative group ${
                        filters.crescoProfile === p ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 hover:border-blue-100'
                    }`}
                >
                    <div className="text-3xl mb-3">{p === 'foundation' ? '🌱' : p === 'multiplier' ? '⚡' : '👑'}</div>
                    <div className="font-black text-slate-900 uppercase text-xs tracking-tight">{p} Package</div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed opacity-70">
                      {p === 'foundation' ? 'Omzet < €1M, slechte SEO, geen ads.' : p === 'multiplier' ? 'Omzet €1M-€3M, mist conversie & ads.' : 'Omzet > €3M, marktleider ambities.'}
                    </p>
                    {filters.crescoProfile === p && <span className="absolute top-4 right-4 text-blue-600 text-xl font-black">✓</span>}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end relative">
        <div className="md:col-span-4 relative">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Product/Dienst (Niche)</label>
          <input 
            type="text" 
            value={filters.sector}
            onChange={(e) => handleInputChange('sector', e.target.value)}
            placeholder="bv. Dakwerkers, HVAC..."
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-100 focus:bg-white transition-all shadow-inner"
          />
          {activeSuggestionField === 'sector' && sectorSuggestions.length > 0 && (
            <div className="absolute z-50 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl mt-2 p-2 animate-slideIn">
              {sectorSuggestions.map(s => <div key={s} onClick={() => { handleChange('sector', s); setActiveSuggestionField(null); }} className="px-4 py-3 hover:bg-blue-50 rounded-xl cursor-pointer text-sm font-bold text-slate-700">{s}</div>)}
            </div>
          )}
        </div>

        <div className="md:col-span-4 relative">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Hoofdlocatie / Regio</label>
          <input 
            type="text" 
            value={filters.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Stad of provincie..."
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-100 focus:bg-white transition-all shadow-inner"
          />
          {activeSuggestionField === 'location' && citySuggestions.length > 0 && (
            <div className="absolute z-50 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl mt-2 p-2 animate-slideIn">
              {citySuggestions.map(s => <div key={s} onClick={() => { handleChange('location', s); setActiveSuggestionField(null); }} className="px-4 py-3 hover:bg-blue-50 rounded-xl cursor-pointer text-sm font-bold text-slate-700">{s}</div>)}
            </div>
          )}
        </div>

        <div className="md:col-span-4 flex gap-3">
          {isProcessing ? (
            <button onClick={onStop} className="flex-1 py-5 rounded-3xl font-black text-white bg-red-500 shadow-xl shadow-red-500/20 hover:scale-[1.02] transition-all text-xs tracking-widest uppercase">STOP ONDERZOEK</button>
          ) : (
            <button onClick={onSubmit} disabled={!isFormValid} className="flex-1 py-5 rounded-3xl font-black text-white bg-blue-600 shadow-xl shadow-blue-500/20 disabled:bg-slate-200 hover:scale-[1.02] transition-all text-xs tracking-widest uppercase">Start Deep Scrape</button>
          )}
          <button onClick={() => setShowAdvanced(!showAdvanced)} className={`p-5 rounded-3xl transition-all shadow-sm ${showAdvanced ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          </button>
        </div>
      </div>

      {showAdvanced && (
          <div className="mt-10 pt-10 border-t border-slate-50 grid grid-cols-1 md:grid-cols-4 gap-12 animate-fadeIn">
              <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Socials</h4>
                  <div className="grid gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={filters.requireEmail} onChange={e => handleChange('requireEmail', e.target.checked)} className="rounded-lg"/> Email verplicht</label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={filters.requirePhone} onChange={e => handleChange('requirePhone', e.target.checked)} className="rounded-lg"/> Telefoon verplicht</label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={filters.requireCeoName} onChange={e => handleChange('requireCeoName', e.target.checked)} className="rounded-lg"/> CEO Naam verplicht</label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={filters.requireSocials} onChange={e => handleChange('requireSocials', e.target.checked)} className="rounded-lg"/> Socials (FB/IG) verplicht</label>
                  </div>
              </div>

              <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Website Quality</h4>
                  <div className="space-y-3">
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 mb-1 uppercase">Min. Website Score (1-10)</div>
                        <input 
                            type="range" min="1" max="10" 
                            value={filters.websiteScoreMin || 1} 
                            onChange={e => handleChange('websiteScoreMin', parseInt(e.target.value))} 
                            className="w-full accent-blue-600"
                        />
                        <div className="text-right text-[10px] font-black text-blue-600">{filters.websiteScoreMin || 1}/10</div>
                    </div>
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 mb-1 uppercase">Min. Performance (1-10)</div>
                        <input 
                            type="range" min="1" max="10" 
                            value={filters.minPerformanceScore || 1} 
                            onChange={e => handleChange('minPerformanceScore', parseInt(e.target.value))} 
                            className="w-full accent-emerald-600"
                        />
                        <div className="text-right text-[10px] font-black text-emerald-600">{filters.minPerformanceScore || 1}/10</div>
                    </div>
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 mb-1 uppercase">SEO Niveau</div>
                        <select value={filters.seoFilter} onChange={e => handleChange('seoFilter', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border border-slate-100">
                            <option value="all">Alle SEO Niveaus</option>
                            <option value="Slecht">Slechte SEO</option>
                            <option value="Gemiddeld">Gemiddelde SEO</option>
                            <option value="Goed">Goede SEO</option>
                        </select>
                    </div>
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 mb-1 uppercase">Min. Pagina's</div>
                        <input 
                            type="number" 
                            value={filters.minPagesCount || ''} 
                            onChange={e => handleChange('minPagesCount', parseInt(e.target.value))} 
                            placeholder="bv. 5" 
                            className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border border-slate-100"
                        />
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financieel (KBO/C-Web)</h4>
                  <div className="space-y-3">
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 mb-1">OMZET RANGE (€M)</div>
                        <div className="flex gap-2">
                            <input type="number" step="0.5" value={filters.minRevenue || ''} onChange={e => handleChange('minRevenue', parseFloat(e.target.value))} placeholder="Min" className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border border-slate-100"/>
                            <input type="number" step="0.5" value={filters.maxRevenue || ''} onChange={e => handleChange('maxRevenue', parseFloat(e.target.value))} placeholder="Max" className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border border-slate-100"/>
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 mb-1">WERKNEMERS (VTE)</div>
                        <div className="flex gap-2">
                            <input type="number" value={filters.minEmployees || ''} onChange={e => handleChange('minEmployees', parseInt(e.target.value))} placeholder="Min" className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border border-slate-100"/>
                            <input type="number" value={filters.maxEmployees || ''} onChange={e => handleChange('maxEmployees', parseInt(e.target.value))} placeholder="Max" className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border border-slate-100"/>
                        </div>
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advertenties & Telefoon</h4>
                  <select value={filters.adTiming} onChange={e => handleChange('adTiming', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold outline-none border border-slate-100 mb-3">
                      <option value="all">Alle Ad Historiek</option>
                      <option value="active_now">Nu Actief</option>
                      <option value="past_only">Enkel Verleden</option>
                      <option value="no_ads">Geen Ads</option>
                  </select>
                  <div className="flex gap-2 mb-4">
                    {['Google', 'Meta'].map(plat => (
                      <button key={plat} onClick={() => toggleArrayItem('adPlatforms', plat)} className={`flex-1 p-2 rounded-xl text-[10px] font-black border-2 transition-all ${filters.adPlatforms?.includes(plat as any) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}>{plat}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['mobile_be', 'landline', 'corp', '05'].map(t => (
                      <button key={t} onClick={() => toggleArrayItem('phoneTypes', t)} className={`p-2 rounded-xl text-[9px] font-black border-2 transition-all truncate ${filters.phoneTypes?.includes(t as any) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}>
                        {t === 'mobile_be' ? 'Mobiel' : t === 'landline' ? 'Vast' : t === 'corp' ? 'Corp' : '05-Nummer'}
                      </button>
                    ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FilterPanel;
