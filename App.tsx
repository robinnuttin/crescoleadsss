
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FilterPanel from './components/FilterPanel';
import ResultsTable from './components/ResultsTable';
import EmailInbox from './components/EmailInbox';
import SMSInbox from './components/SMSInbox';
import ColdCallCenter from './components/ColdCallCenter';
import Dashboard from './components/Dashboard';
import LeadDatabase from './components/LeadDatabase';
import AICoach from './components/AICoach';
import Settings from './components/Settings';
import GHLManager from './components/GHLManager';
import SalesMeet from './components/SalesMeet';
import FacebookPipeline from './components/FacebookPipeline';
import Auth from './components/Auth';
import { FilterState, Lead, UserConfig, Campaign, FBConversation, CallScript, MeetSession, AccountData } from './types';
import { generateLeads } from './services/geminiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeApp, setActiveApp] = useState('dashboard');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [latestScrapeResults, setLatestScrapeResults] = useState<Lead[]>([]); // New temporary state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [fbConversations, setFbConversations] = useState<FBConversation[]>([]);
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [sessions, setSessions] = useState<MeetSession[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  
  const [userConfig, setUserConfig] = useState<UserConfig>({
    username: 'Robin Nutin',
    email: 'nuttinrobin@gmail.com',
    ghlApiKey: '',
    instantlyApiKey: '',
    companyWebsite: 'https://crescoflow.be',
    toneOfVoice: 'Professioneel, direct, focus op ROI en direct closing.',
    documents: [],
    trainingData: [],
    integrations: { gmail: false, calendar: false, ghl: false, instantly: false }
  });

  const [filters, setFilters] = useState<FilterState>({
    sector: '', location: '', includeSmallTowns: true, crescoProfile: null, 
    requireEmail: false, requirePhone: false, requireCeoName: true, 
    requireCeoMobile: true, requireCeoEmail: true, minReviewCount: 0, 
    minReviewScore: 0, adTiming: 'all', adPlatforms: [], 
    phoneTypes: ['mobile_be', 'landline'], seoFilter: 'all', 
    requireSocials: false, employeeCount: '', websiteScoreMin: 1, 
    minPerformanceScore: 1, minPagesCount: 0
  });

  useEffect(() => {
    if (isAuthenticated && userConfig.email) {
      const dbPayload = {
        leads: allLeads,
        config: userConfig,
        campaigns,
        fbConversations,
        scripts,
        sessions
      };
      const usersDb = JSON.parse(localStorage.getItem('crescoflow_users_db') || '{}');
      usersDb[userConfig.email] = dbPayload;
      localStorage.setItem('crescoflow_users_db', JSON.stringify(usersDb));
    }
  }, [allLeads, userConfig, campaigns, fbConversations, scripts, sessions, isAuthenticated]);

  const routeLead = (l: Lead) => {
    // UPDATED DISTRIBUTION LOGIC
    const phone = (l.ceoPhone || l.phoneCompany || '').replace(/\s+/g, '');
    const hasEmail = !!(l.ceoEmail || l.emailCompany);
    
    if (phone.startsWith('04') || phone.startsWith('+324')) {
        l.outboundChannel = 'coldsms';
    } else if (hasEmail) {
        l.outboundChannel = 'coldemail';
    } else {
        l.outboundChannel = 'coldcall';
    }
    return l;
  };

  const handleUpdateLeads = (updatedLeads: Lead[]) => {
      setAllLeads(prev => {
          const map = new Map(prev.map(l => [l.id, l]));
          updatedLeads.forEach(l => {
              const routed = routeLead(l);
              map.set(routed.id, routed);
          });
          return Array.from(map.values());
      });
  };

  const handleScrape = async () => {
    setIsScraping(true);
    setLatestScrapeResults([]);
    try {
      const newLeads = await generateLeads(filters);
      const routedLeads = newLeads.map(routeLead);
      
      // Update permanent storage
      handleUpdateLeads(routedLeads);
      
      // Briefly show results in scraper then redirect
      setLatestScrapeResults(routedLeads);
      
      setTimeout(() => {
          setLatestScrapeResults([]); // Clear from scraper view
          setActiveApp('dashboard');   // Redirect to Command Center
      }, 3000);
      
    } catch (err) {
      console.error("Scrape failed:", err);
    } finally {
      setIsScraping(false);
    }
  };

  const onAuthComplete = (data: AccountData) => {
    setUserConfig(data.config);
    setAllLeads(data.leads || []);
    setCampaigns(data.campaigns || []);
    setFbConversations(data.fbConversations || []);
    setScripts(data.scripts || []);
    setSessions(data.sessions || []);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('crescoflow_current_user');
  };

  if (!isAuthenticated) return <Auth onAuthComplete={onAuthComplete} />;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      <Sidebar activeApp={activeApp} setActiveApp={setActiveApp} totalLeadsCount={allLeads.length} />

      <div className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-hidden relative">
            {activeApp === 'dashboard' && (
              <Dashboard 
                allLeads={allLeads} 
                campaigns={campaigns} 
                fbConversations={fbConversations} 
                sessions={sessions}
                filters={filters}
                setFilters={setFilters}
                onScrape={handleScrape}
                isScraping={isScraping}
              />
            )}
            {activeApp === 'lead-scraper' && (
                <div className="flex flex-col h-full overflow-y-auto pb-64 custom-scrollbar">
                    <FilterPanel filters={filters} setFilters={setFilters} onSubmit={handleScrape} isProcessing={isScraping} mode="scrape"/>
                    <div className="px-20 pb-40">
                        {isScraping && (
                          <div className="flex flex-col items-center justify-center py-40 gap-8 animate-pulse">
                             <div className="text-8xl">🔍</div>
                             <h3 className="text-3xl font-black text-slate-400 uppercase tracking-[0.4em]">Deep-Scraping Active...</h3>
                          </div>
                        )}
                        {latestScrapeResults.length > 0 && (
                          <div className="space-y-12">
                             <div className="bg-emerald-500 text-white p-10 rounded-[40px] shadow-2xl flex justify-between items-center animate-slideUp">
                                <div>
                                   <h4 className="text-2xl font-black uppercase tracking-tight">Success! {latestScrapeResults.length} New Leads Identified</h4>
                                   <p className="text-sm font-bold opacity-80">Distributing to Command Center Funnels...</p>
                                </div>
                                <div className="text-5xl font-black">✓</div>
                             </div>
                             <ResultsTable leads={latestScrapeResults} />
                          </div>
                        )}
                    </div>
                </div>
            )}
            {activeApp === 'database' && <LeadDatabase allLeads={allLeads} onUpdateLeads={handleUpdateLeads} />}
            {activeApp === 'email-pipeline' && <EmailInbox leads={allLeads} campaigns={campaigns} onUpdateLeads={handleUpdateLeads} />}
            {activeApp === 'sms-pipeline' && <SMSInbox leads={allLeads} campaigns={campaigns} onUpdateLeads={handleUpdateLeads} />}
            {activeApp === 'cold-calls' && <ColdCallCenter leads={allLeads} scripts={scripts} setScripts={setScripts} onUpdateLeads={handleUpdateLeads} />}
            {activeApp === 'facebook-pipeline' && <FacebookPipeline conversations={fbConversations} setConversations={setFbConversations} allLeads={allLeads} onUpdateLeads={handleUpdateLeads} />}
            {activeApp === 'ghl-manager' && <GHLManager leads={allLeads} onUpdateLeads={handleUpdateLeads} />}
            {activeApp === 'sales-meet' && <SalesMeet sessions={sessions} setSessions={setSessions} onUpdateLeads={handleUpdateLeads} />}
            {activeApp === 'ai-coach' && <AICoach allLeads={allLeads} />}
            {activeApp === 'settings' && <Settings config={userConfig} onUpdateConfig={setUserConfig} onLogout={handleLogout} />}
        </main>
      </div>
    </div>
  );
};

export default App;
