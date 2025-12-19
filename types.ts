
export enum AdStatus {
  UNKNOWN = 'Onbekend',
  NONE = 'Geen',
  ACTIVE = 'Nu Actief',
  PAST = 'In Verleden'
}

export type CrescoProfile = 'foundation' | 'multiplier' | 'domination' | null;
export type OutboundChannel = 'coldcall' | 'coldsms' | 'coldemail' | 'fb_messenger' | 'sales_call';

export interface Message {
  role: 'bot' | 'user' | 'system';
  text: string;
  timestamp: string;
}

export interface FBConversation {
  id: string;
  leadName: string;
  summary: string;
  qualified: boolean;
  meetingBooked: boolean;
  meetingClosed: boolean;
  positiveSentiment: number;
  negativeSentiment: number;
  unsureSentiment: number;
  interestScore: number;
  transcript: Message[];
  contactInfoExchanged: {
    email?: string;
    phone?: string;
  };
  lastUpdate: string;
  analysisPerformed?: boolean;
}

export interface MeetSession {
  id: string;
  leadId?: string;
  leadName: string;
  email?: string;
  phone?: string;
  website?: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  transcript: Message[];
  summary?: string;
  outcome?: 'closed' | 'no_close' | 'follow_up';
  leadSource: OutboundChannel;
  revenue?: number;
  aiAdvice?: string;
}

export interface CallScript {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  usageCount: number;
  positiveResponses: number;
  negativeResponses: number;
  meetingsBooked: number;
  closes: number;
  conversionRate: number;
}

export interface Campaign {
  id: string;
  name: string;
  channel: OutboundChannel;
  startDate: string;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    spam: number;
    replied: number;
    positive: number;
    negative: number;
    unsure: number;
    booked: number;
    closed: number;
  };
}

export interface UserConfig {
  username: string;
  email: string;
  password?: string;
  ghlApiKey: string;
  instantlyApiKey: string;
  companyWebsite: string;
  toneOfVoice: string;
  documents: { name: string; date: string; type: string }[];
  trainingData: { source: string; content: string; date: string }[];
  integrations: {
    gmail: boolean;
    calendar: boolean;
    ghl: boolean;
    instantly: boolean;
  };
  tokens?: {
    [key: string]: {
      access_token: string;
      provider: string;
    }
  };
  ghlConnected?: boolean;
  instantlyConnected?: boolean;
}

export interface Lead {
  id: string;
  companyName: string;
  sector: string;
  city: string;
  website: string;
  emailCompany: string;
  phoneCompany: string;
  ceoName: string;
  ceoEmail: string; 
  ceoPhone: string;
  address?: string;
  analysis: {
    socialFollowers: string;
    offerReason: string;
    marketingBottlenecks: string[]; 
    visualScore: number;
    recommendedChannel: OutboundChannel;
    qualificationNotes: string;
    pagesCount: number;
    seoStatus: 'Slecht' | 'Gemiddeld' | 'Goed';
    websiteScore: number; 
    performanceScore: number;
    revenueEstimate?: string;
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    };
    linkedinActivity?: string;
    linkedinPostFrequency?: string;
  };
  crescoProfile: CrescoProfile;
  outboundChannel?: OutboundChannel;
  pipelineTag?: 'pending' | 'sent' | 'replied' | 'not_interested' | 'appointment_booked' | 'no_answer' | 'follow_up' | 'closed';
  scrapedAt: string;
  callAttempts: number;
  interactions: {
    id: string;
    type: string;
    timestamp: string;
    content: string;
    outcome?: string;
  }[];
  confidenceScore: number;
  isFollowUp?: boolean;
  adStatus?: string;
  vatNumber?: string;
  ceoSource?: string;
  reviewScore?: number;
  ghlSynced?: boolean;
  ghlContactId?: string;
  emailSentAt?: string;
  replyReceived?: boolean;
  replyDate?: string;
  emailBody?: string;
  imported?: boolean;
  crmCategory?: string;
  isValidated?: boolean;
  ceoLinkedIn?: string;
}

export interface FilterState {
  sector: string;
  location: string;
  includeSmallTowns: boolean;
  crescoProfile: CrescoProfile;
  requireEmail: boolean;
  requirePhone: boolean;
  requireCeoName: boolean;
  requireCeoMobile: boolean;
  requireCeoEmail: boolean;
  minReviewCount: number;
  minReviewScore: number;
  adTiming: string;
  adPlatforms: string[];
  phoneTypes: string[];
  seoFilter: string;
  requireSocials: boolean;
  employeeCount: string;
  websiteScoreMin: number;
  minPerformanceScore: number;
  minPagesCount: number;
  minRevenue?: number;
  maxRevenue?: number;
  minEmployees?: number;
  maxEmployees?: number;
}

export interface AccountData {
  leads: Lead[];
  campaigns: Campaign[];
  fbConversations: FBConversation[];
  scripts: CallScript[];
  sessions: MeetSession[];
  config: UserConfig;
}

export interface GHLCustomValue {
  id: string;
  name: string;
  value: string;
  lastUpdated: string;
  history: { value: string; date: string }[];
}
