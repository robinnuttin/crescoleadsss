
import React from 'react';
import { Lead, AdStatus } from '../types';

interface Props {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

const ResultsTable: React.FC<Props> = ({ leads, onLeadClick }) => {
  if (leads.length === 0) return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-white mx-6 rounded-lg border border-slate-200 border-dashed">
        <p className="font-medium">Geen leads gevonden voor deze filters.</p>
      </div>
  );

  return (
    <div className="mx-6 pb-12 mt-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b">
                <th className="p-4 w-64">Bedrijf</th>
                <th className="p-4">Strategisch Offer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Match</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y">
              {leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => onLeadClick?.(lead)}
                  className="hover:bg-slate-50 transition-colors align-top cursor-pointer group"
                >
                  <td className="p-4">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{lead.companyName}</div>
                    <div className="text-[10px] text-blue-600 font-bold">{lead.sector}</div>
                  </td>
                  <td className="p-4 max-w-sm">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border mb-2 inline-block ${
                        lead.crescoProfile === 'domination' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        lead.crescoProfile === 'multiplier' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                        {lead.crescoProfile}
                    </span>
                    <p className="text-xs text-slate-600 italic">"{lead.analysis.offerReason}"</p>
                  </td>
                  <td className="p-4">
                      <div className="text-xs font-bold text-slate-700">{lead.ceoName || 'Onbekend'}</div>
                      <div className="text-[10px] text-slate-500">{lead.ceoPhone || lead.phoneCompany}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-600">{lead.confidenceScore}%</span>
                      {lead.isFollowUp && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="In follow-up list"></span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
