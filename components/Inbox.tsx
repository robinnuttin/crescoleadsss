
import React, { useState } from 'react';
import { Lead } from '../types';
import { checkInstantlyStatus } from '../services/instantlyService';
import { syncToGHL } from '../services/ghlService';

interface Props {
  leads: Lead[];
  onUpdateLeads: (updatedLeads: Lead[]) => void;
}

const Inbox: React.FC<Props> = ({ leads, onUpdateLeads }) => {
  const [isChecking, setIsChecking] = useState(false);
  
  // Handled optional tracking fields for sorting
  const sentLeads = leads.filter(l => l.pipelineTag === 'sent' || l.pipelineTag === 'replied').sort((a,b) => {
      return (new Date(b.emailSentAt || 0).getTime() - new Date(a.emailSentAt || 0).getTime());
  });

  const handleCheckStatus = async () => {
    setIsChecking(true);
    let updatedCount = 0;
    let ghlPushedCount = 0;
    
    const newLeads = [...leads];

    for (let i = 0; i < newLeads.length; i++) {
        const lead = newLeads[i];
        if (lead.pipelineTag === 'sent') {
            const email = lead.ceoEmail || lead.emailCompany;
            if (email) {
                const status = await checkInstantlyStatus(email);
                if (status === 'replied') {
                    // Lead heeft geantwoord! Update lokaal met nieuwe tracking velden
                    newLeads[i] = {
                        ...lead,
                        pipelineTag: 'replied' as const,
                        replyReceived: true,
                        replyDate: new Date().toISOString()
                    };
                    updatedCount++;

                    // PUSH NAAR GHL MET TAG "Interesse"
                    const ghlId = await syncToGHL(newLeads[i], ['Interesse', 'Replied Instantly']);
                    if (ghlId) {
                        newLeads[i].ghlContactId = ghlId;
                        newLeads[i].ghlSynced = true;
                        ghlPushedCount++;
                    }
                }
            }
        }
    }

    if (updatedCount > 0) {
        onUpdateLeads(newLeads);
        alert(`${updatedCount} antwoorden gevonden! ${ghlPushedCount} leads gepusht naar GHL met tag 'Interesse'.`);
    } else {
        alert("Geen nieuwe antwoorden gevonden.");
    }
    
    setIsChecking(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
       <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
         <div>
            <h2 className="text-xl font-bold text-slate-800">Email Inbox & Monitoring</h2>
            <p className="text-sm text-slate-500">Replies worden automatisch naar GHL gepusht als 'Interesse'.</p>
         </div>
         <button onClick={handleCheckStatus} disabled={isChecking} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded font-bold text-sm flex items-center gap-2">
             {isChecking ? <span className="animate-spin text-lg">↻</span> : <span>↻</span>}
             Check Status & Sync GHL
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
          {sentLeads.length === 0 ? (
              <div className="text-center text-slate-400 mt-20">📭 Nog geen verzonden campagnes.</div>
          ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                  {sentLeads.map(lead => (
                      <div key={lead.id} className={`bg-white rounded-lg border shadow-sm p-4 transition-all ${lead.pipelineTag === 'replied' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'}`}>
                          <div className="flex justify-between items-start">
                              <div>
                                  <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-slate-800">{lead.companyName}</h3>
                                      {lead.pipelineTag === 'replied' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Interesse (GHL)</span>}
                                  </div>
                                  <div className="text-sm text-slate-500">{lead.ceoEmail || lead.emailCompany}</div>
                              </div>
                              <div className="text-xs text-slate-400">{lead.emailSentAt ? new Date(lead.emailSentAt).toLocaleDateString() : ''}</div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default Inbox;
