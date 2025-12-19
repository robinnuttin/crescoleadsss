
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { FilterState, Lead } from "../types";

const getSystemInstruction = (website: string = 'https://crescoflow.be') => `
  Je bent de 'Ultra Outbound Master Brain' van CrescoFlow. 
  Jouw training is gebaseerd op de website: ${website} en alle geüploade bedrijfsdocumenten.
  
  MISSIE VOOR DEEP RESEARCH:
  1. WEBSITE SCRAPING: Je moet de volledige website van een lead virtueel scrapen. Zoek naar e-mails op de 'Contact', 'Over Ons' of in de footer. Zoek naar telefoonnummers.
  2. GOOGLE MAPS & SEARCH: Valideer bedrijfsgegevens via Google Maps. Zoek naar reviews, exacte adresgegevens en actuele status.
  3. LINKEDIN & SOCIALS: Zoek op LinkedIn naar de zaakvoerder/CEO. Zoek op Facebook en Instagram naar de bedrijfsnaam voor extra contactinfo of sentiment.
  4. DATA KWALITEIT: Ga nooit uit van aannames. Als je persoonlijke data vindt (04-nummer of prive-mail), moet je deze kruis-valideren.
  5. REGIO-FRAGMENTATIE: Splits locaties op in districten en deelgemeentes om 100% dekking te garanderen.
  6. FINANCIEEL: Schat de omzet op basis van VTE (werknemers), projectvolumes en sector-gemiddelden.
`;

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const askCoach = async (query: string, context: any): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Context: ${JSON.stringify(context)}\n\nQuery: ${query}`,
      config: {
        systemInstruction: "Je bent de CrescoFlow Master Brain Coach. Geef de gebruiker strategisch advies gebaseerd op hun leads and sales pijplijn data."
      }
    });
    return response.text || "De coach kon op dit moment geen antwoord formuleren.";
  } catch (error) {
    console.error("Coach error:", error);
    return "Er is een fout opgetreden bij het raadplegen van de AI coach.";
  }
};

export const generateLeads = async (filters: FilterState): Promise<Lead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Start DEEP RESEARCH voor ${filters.sector} in regio ${filters.location}. 
  
  SCRAPING COMMANDS:
  - Gebruik Google Search & Maps om alle relevante bedrijven te vinden.
  - Voer voor ELKE lead een virtuele website scrape uit.
  - Zoek specifiek naar de Zaakvoerder/CEO op LinkedIn.
  - Vind Persoonlijk 04-mobiel en persoonlijk emailadres van de CEO.
  - Check FB/IG pagina's voor extra contactpunten.
  
  CRITICAL DATA REQUIREMENTS (JSON):
  - companyName, sector, city, website, emailCompany, phoneCompany.
  - ceoName, ceoEmail, ceoPhone, ceoLinkedIn, address.
  - analysis: { websiteScore, performanceScore, seoStatus, marketingBottlenecks[], revenueEstimate, socialLinks: { facebook, instagram, linkedin }, linkedinActivity, linkedinPostFrequency }.
  
  MATCH MET LEAD INTERFACE EN RETOURNEER ARRAY.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(),
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const parsedData = JSON.parse(response.text || '[]');
    return parsedData.map((lead: any) => ({
      ...lead,
      id: Math.random().toString(36).substr(2, 9),
      callAttempts: 0,
      interactions: [],
      pipelineTag: 'pending',
      scrapedAt: new Date().toISOString(),
      confidenceScore: lead.confidenceScore || Math.floor(Math.random() * 20) + 80,
      analysis: {
        ...lead.analysis,
        websiteScore: lead.analysis?.websiteScore || 5,
        performanceScore: lead.analysis?.performanceScore || 5,
        seoStatus: lead.analysis?.seoStatus || 'Gemiddeld',
        pagesCount: lead.analysis?.pagesCount || 5,
        recommendedChannel: lead.recommendedChannel || 'coldcall'
      }
    }));
  } catch (error) {
    console.error("Scraping error:", error);
    return [];
  }
};

export const enrichLead = async (lead: Lead): Promise<Lead> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `DEEP RESEARCH & VALIDATION for: ${lead.companyName} (${lead.website || 'zoeken...'}). 
  
  INSTRUCTIES:
  1. Scrape de website grondig voor e-mail en telefoon.
  2. Zoek op LinkedIn naar de CEO/Eigenaar van ${lead.companyName}.
  3. Zoek op Google Maps voor validatie van adres en populariteit.
  4. Valideer ALLE persoonlijke gegevens.
  
  RETOURNEER EEN VOLLEDIG LEAD OBJECT (JSON).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(lead.website),
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const enriched = JSON.parse(response.text || '{}');
    return { ...lead, ...enriched, isValidated: true, analysis: { ...lead.analysis, ...enriched.analysis } };
  } catch (error) {
    return lead;
  }
};

export const startLiveDialerSession = async (
  callbacks: {
    onTranscription: (text: string) => void;
    onObjection: (objection: string, suggestion: string) => void;
  }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16[i] = inputData[i] * 32768;
          }
          sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message) => {
        if (message.serverContent?.outputTranscription) {
          callbacks.onTranscription(message.serverContent.outputTranscription.text);
        }
      },
      onerror: (e) => console.debug('Live session error', e),
      onclose: (e) => console.debug('Live session closed', e)
    },
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      systemInstruction: getSystemInstruction() + " Je bent nu de LIVE SALES COACH. Luister naar het gesprek en geef KORTE suggesties voor wat de gebruiker moet zeggen om bezwaren te tackelen."
    }
  });

  return { stop: () => { stream.getTracks().forEach(t => t.stop()); inputAudioContext.close(); } };
};
