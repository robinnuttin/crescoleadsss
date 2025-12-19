
import React, { useState } from 'react';
import { Lead } from '../types';
import { uploadToInstantly } from '../services/instantlyService';
import { syncToGHL } from '../services/ghlService';

interface Props {
  leads: Lead[];
  onUpdateLeads: (updatedLeads: Lead[]) => void;
  onBack: () => void;
  onNavigateToInbox: () => void;
}

const CampaignStaging: React.FC<Props> = ({ leads, onUpdateLeads, onBack, onNavigateToInbox }) => {
  const [campaignId, setCampaignId] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSmsSyncing, setIsSmsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const callLeads = leads.filter(l => l.outboundChannel === 'coldcall');
  const smsLeads = leads.filter(l => l.outboundChannel === 'coldsms');
  const emailLeads = leads.filter(l => l.outboundChannel === 'coldemail');

  const handleSyncToInstantly = async () => {
    if (!campaignId) {
        alert("Vul eerst een Instantly Campagne ID in.");
        return;
    }

    setIsSyncing(true);
    const success = await uploadToInstantly(emailLeads, campaignId, emailBody);
    
    if (success) {
        const timestamp = new Date().toISOString();
        // Fixed mapping to ensure Lead type consistency and pipelineTag literal assignment
        const updatedLeads: Lead[] = leads.map(l => {
            if (l.outboundChannel === 'coldemail') {
                return { 
                    ...l, 
                    pipelineTag: 'sent' as const, 
                    emailSentAt: timestamp, 
                    emailBody: emailBody 
                };
            }
            return l;
        });
        
        onUpdateLeads(updatedLeads);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
    }
    setIsSyncing(false);
  };

  const handleSyncSmsToGHL = async () => {
      setIsSmsSyncing(true);
      let successCount = 0;
      
      const updatedLeads = [...leads];
      for (let i = 0; i < updatedLeads.length; i++) {
          const lead = updatedLeads[i];
          if (lead.outboundChannel === 'coldsms' && !lead.ghlSynced) {
              const ghlId = await syncToGHL(lead, ['Outbound SMS']);
              if (ghlId) {
                  updatedLeads[i] = { ...lead, ghlContactId: ghlId, ghlSynced: true };
                  successCount++;
              }
          }
      }

      if (successCount > 0) {
          onUpdateLeads(updatedLeads);
          alert(`${successCount} leads gesynchroniseerd naar GoHighLevel SMS workflow!`);
      } else {
          alert("Geen nieuwe SMS leads om te synchroniseren.");
      }
      setIsSmsSyncing(false);
  };

  const downloadSegmentCsv = (segmentLeads: Lead[], filename: string) => {
    const headers = ["Bedrijf", "CEO", "Telefoon", "Email", "Score", "Adres"];
    const rows = segmentLeads.map(l => 
        `"${l.companyName}","${l.ceoName}","${l.ceoPhone||l.phoneCompany}","${l.ceoEmail||l.emailCompany}","${l.confidenceScore}","${l.address}"`
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
         <div>
            <h2 className="text-xl font-bold text-slate-800">Campagne Staging</h2>
            <p className="text-sm text-slate-500">Koppel je leads aan Instantly of GoHighLevel.</p>
         </div>
         <div className="flex gap-3">
             <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium text-sm">
                 ← Terug
             </button>
             {syncSuccess && (
                 <button onClick={onNavigateToInbox} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded font-bold text-sm border border-emerald-200">
                     Naar Inbox →
                 </button>
             )}
         </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 grid grid-cols-3 gap-6">
        
        {/* COL 1: COLD CALL */}
        <div className="bg-white rounded-lg border border-red-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-red-100 bg-red-50">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-red-800 flex items-center gap-2">📞 Cold Call</h3>
                    <span className="bg-white text-red-800 text-xs font-bold px-2 py-1 rounded-full">{callLeads.length}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {callLeads.map(lead => (
                    <div key={lead.id} className="p-3 border border-slate-100 rounded text-sm">
                        <div className="font-bold text-slate-800">{lead.companyName}</div>
                        <div className="text-xs text-slate-500">{lead.ceoPhone || lead.phoneCompany}</div>
                    </div>
                ))}
            </div>
            <div className="p-4">
                <button onClick={() => downloadSegmentCsv(callLeads, 'cold_calls')} className="w-full bg-white border border-slate-300 py-2 rounded text-sm font-bold">Download CSV</button>
            </div>
        </div>

        {/* COL 2: SMS (GoHighLevel Sync) */}
        <div className="bg-white rounded-lg border border-amber-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-amber-100 bg-amber-50">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-amber-800 flex items-center gap-2">💬 GHL SMS Workflow</h3>
                    <span className="bg-white text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{smsLeads.length}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {smsLeads.map(lead => (
                    <div key={lead.id} className="p-3 border border-slate-100 rounded text-sm flex justify-between items-center">
                        <div>
                            <div className="font-bold text-slate-800">{lead.companyName}</div>
                            <div className="text-xs text-slate-500">{lead.ceoPhone || lead.phoneCompany}</div>
                        </div>
                        {lead.ghlSynced && <span className="text-emerald-500 text-xs font-bold">✓ GHL</span>}
                    </div>
                ))}
            </div>
            <div className="p-4 border-t bg-amber-50/30">
                <button 
                    onClick={handleSyncSmsToGHL}
                    disabled={isSmsSyncing || smsLeads.length === 0}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded shadow-md transition-all disabled:bg-slate-300"
                >
                    {isSmsSyncing ? 'Synchroniseren...' : '🚀 Push naar GHL SMS Workflow'}
                </button>
                <p className="text-[10px] text-amber-700 mt-2 text-center italic">Wordt getagged met "Outbound SMS" in GHL.</p>
            </div>
        </div>

        {/* COL 3: EMAIL (Instantly Sync) */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-blue-100 bg-blue-50">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">📧 Instantly Sync</h3>
                    <span className="bg-white text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{emailLeads.length}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <input type="text" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} placeholder="Instantly Campaign ID" className="w-full border p-2 rounded text-sm font-mono"/>
                <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email intro..." className="w-full border p-2 rounded text-sm h-32 resize-none"/>
            </div>
            <div className="p-4 border-t bg-blue-50/30">
                <button onClick={handleSyncToInstantly} disabled={isSyncing || emailLeads.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow-md transition-all">
                    {isSyncing ? 'Bezig...' : '📧 Start Email Campagne'}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CampaignStaging;
