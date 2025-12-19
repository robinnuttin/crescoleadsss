
import React, { useState, useMemo } from 'react';
import { Lead, GHLCustomValue } from '../types';
import { syncToGHL } from '../services/ghlService';

interface Props {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
}

const GHLManager: React.FC<Props> = ({ leads, onUpdateLeads }) => {
  const [view, setView] = useState<'pipeline' | 'custom-values' | 'settings'>('pipeline');
  const [customValues, setCustomValues] = useState<GHLCustomValue[]>([
    { 
        id: 'cv_1', name: 'Email Outreach Copy', value: 'Hé {{contact.first_name}}, ik zag jullie website...', 
        lastUpdated: new Date().toISOString(), history: [] 
    },
    { 
        id: 'cv_2', name: 'SMS Pitch Copy', value: 'Robin van CrescoFlow hier! Hebben jullie plek voor 10 nieuwe dakwerken projecten?', 
        lastUpdated: new Date().toISOString(), history: [] 
    }
  ]);

  const stats = useMemo(() => {
    const total = leads.filter(l => l.ghlSynced).length;
    const pending = leads.filter(l => !l.ghlSynced && l.isValidated).length;
    return { total, pending };
  }, [leads]);

  const handleUpdateCV = (id: string, newValue: string) => {
    setCustomValues(prev => prev.map(cv => {
        if (cv.id === id) {
            return {
                ...cv,
                history: [{ value: cv.value, date: cv.lastUpdated }, ...cv.history].slice(0, 10),
                value: newValue,
                lastUpdated: new Date().toISOString()
            };
        }
        return cv;
    }));
  };

  const handleSyncToGHL = async (lead: Lead) => {
    const successId = await syncToGHL(lead, ['Import App']);
    if (successId) {
        onUpdateLeads([{ ...lead, ghlSynced: true, ghlContactId: successId }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-8 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">GHL Engine Control</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Directe sync & Pijplijn beheer</p>
        </div>
        <div className="flex gap-4">
             <button onClick={() => setView('pipeline')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${view === 'pipeline' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'bg-slate-100 text-slate-400'}`}>Pipeline</button>
             <button onClick={() => setView('custom-values')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${view === 'custom-values' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'bg-slate-100 text-slate-400'}`}>Custom Values</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {view === 'pipeline' && (
            <div className="max-w-7xl mx-auto space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">In de Wachtrij (App Leads)</h3>
                        <div className="space-y-4">
                            {leads.filter(l => !l.ghlSynced && l.isValidated).map(l => (
                                <div key={l.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-500/30 transition-all">
                                    <div>
                                        <div className="font-bold text-slate-800">{l.companyName}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{l.sector} • {l.city}</div>
                                    </div>
                                    <button onClick={() => handleSyncToGHL(l)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all">Push to GHL</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 text-6xl">🔗</div>
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">GHL Live Status</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-xs font-bold text-slate-400">Totaal in GHL</span>
                                <span className="text-2xl font-black">{stats.total}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-xs font-bold text-slate-400">Pijplijn: Afspraken</span>
                                <span className="text-2xl font-black text-emerald-400">{leads.filter(l => l.pipelineTag === 'appointment_booked').length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Conversaties Actief</span>
                                <span className="text-2xl font-black text-blue-400">{leads.filter(l => l.pipelineTag === 'replied').length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {view === 'custom-values' && (
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-blue-600 text-white p-10 rounded-[40px] shadow-2xl">
                    <h3 className="text-xs font-black text-blue-100 uppercase tracking-widest mb-4">KPI Tracking via Custom Values</h3>
                    <p className="text-sm leading-relaxed opacity-80">
                        De app houdt automatisch bij wanneer je een copy aanpast. AI Master Brain analyseert de performance intervallen om te bepalen welk script het hoogste conversie-percentage behaalt.
                    </p>
                </div>

                {customValues.map(cv => (
                    <div key={cv.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{cv.name}</h4>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Last Updated: {new Date(cv.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        <textarea 
                            value={cv.value}
                            onChange={(e) => handleUpdateCV(cv.id, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[30px] text-sm font-medium outline-none focus:border-blue-500 transition-all h-32 resize-none"
                        />
                        {cv.history.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Script Historiek</h5>
                                <div className="grid gap-2">
                                    {cv.history.map((h, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-[10px] border border-slate-100 italic">
                                            <span className="truncate max-w-[70%]">"{h.value}"</span>
                                            <span className="text-slate-400 font-black">{new Date(h.date).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default GHLManager;
