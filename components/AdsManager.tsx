
import React from 'react';

const AdsManager: React.FC = () => {
  return (
    <div className="p-10 bg-slate-50 min-h-full space-y-12 pb-48 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Ads Command</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Beheer je Google & Meta campagnes</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-[#1877F2] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all hover:scale-105">Koppel Meta Ads</button>
          <button className="bg-white text-slate-900 border-2 border-slate-200 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50">Koppel Google Ads</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-12 rounded-[50px] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center py-40 space-y-8">
           <div className="text-8xl">📈</div>
           <div className="space-y-4">
             <h3 className="text-3xl font-black tracking-tight text-slate-900">Geen actieve campagnes gekoppeld</h3>
             <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">Verbind je advertentie-accounts om ROAS, Spend en Lead-cost direct in je CrescoFlow funnels te integreren.</p>
           </div>
           <button className="bg-slate-900 text-white px-12 py-5 rounded-[30px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/30">Start Nu</button>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl border-l-[12px] border-blue-500">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">AI Ads Strategie</h4>
              <p className="text-sm leading-relaxed text-slate-300 italic italic font-medium">"Op basis van je huidige leads voor dakwerkers in Antwerpen, suggereert Master Brain een Meta Retargeting campagne gericht op 'CEO/Eigenaar' profielen met een focus op ROI video testimonials."</p>
           </div>
           
           <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global KPIs</h4>
              <div className="grid gap-4">
                 <div className="flex justify-between border-b border-slate-50 pb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Gem. CPL</span>
                    <span className="font-black">€0.00</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-50 pb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Totaal Spend</span>
                    <span className="font-black">€0.00</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Totaal ROAS</span>
                    <span className="font-black">0.0x</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdsManager;
