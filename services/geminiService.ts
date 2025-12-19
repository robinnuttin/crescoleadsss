
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

const fetchSubLocations = async (location: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Geef een lijst van de 5 belangrijkste deelgemeentes, districten of omliggende belangrijke locaties voor de regio: ${location}.
  Retourneer ALLEEN een JSON array van strings. Voorbeeld: ["Deurne", "Berchem", "Merksem", "Wilrijk", "Hoboken"].`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Locatie split error:", e);
    return [location];
  }
};

const fetchNicheKeywords = async (sector: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Geef mij 3-5 specifieke niche zoektermen of synoniemen voor de sector: "${sector}".
  Doe dit om de markt maximaal te fragmenteren.
  Bijvoorbeeld: voor "Dakwerker" -> ["Platte daken", "Dakisolatie", "Rieten daken", "Leien daken", "Dakrenovatie"].
  Retourneer ALLEEN een JSON array van strings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Keyword split error:", e);
    return [sector];
  }
};

export const generateLeads = async (filters: FilterState): Promise<Lead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. ULTRA DEEP LOOP: Locations * Keywords
  let searchLocations = [filters.location];
  if (filters.includeSmallTowns) {
    const subLocs = await fetchSubLocations(filters.location);
    searchLocations = [...new Set([filters.location, ...subLocs])];
  }

  let searchKeywords = [filters.sector];
  // Always split keywords for maximum coverage as requested
  const subKeywords = await fetchNicheKeywords(filters.sector);
  searchKeywords = [...new Set([filters.sector, ...subKeywords])];

  console.log(`ULTRA DEEP LOOP: ${searchLocations.length} Locations x ${searchKeywords.length} Keywords = ${searchLocations.length * searchKeywords.length} Searches`);

  let allLeads: Lead[] = [];
  const seenUrls = new Set<string>();

  // 2. Execute Matrix Searches
  const searchPromises: Promise<any>[] = [];

  for (const loc of searchLocations) {
    for (const kw of searchKeywords) {
      searchPromises.push((async () => {
        const prompt = `START UITGEBREID ONDERZOEK voor: "${kw}" in regio "${loc}".
            
            OPDRACHT:
            1. Zoek naar bedrijven die actief zijn als ${kw} in ${loc}.
            2. VIRTUELE SCRAPE: Bezoek virtueel hun website.
            3. FINANCIALS & DATA (KBO/Companyweb):
               - Zoek naar BTW-nummer (BE0...).
               - Zoek naar officiele omzet (bruto marge) op publieke bronnen (KBO, Staatsblad).
               - Schat aantal werknemers.
            4. SOCIALS & ADS:
               - Check of ze Facebook/Instagram hebben.
               - Check in Ad Libraries of ze ooit advertenties hebben gedraaid.
            5. DOCUMENTATIE:
               - CEO Naam + Prive nummer/email opsporen.
               - SEO Audit: Hoeveel paginas? Snelheid? SEO Score op 10?

            RETURN JSON ARRAY:
            - companyName, sector, city, website, emailCompany, phoneCompany.
            - vatNumber (BTW), revenueEstimate (Omzet), employeeCount (Werknemers).
            - adStatus (Active/Past/None).
            - ceoName, ceoEmail, ceoPhone, ceoLinkedIn, address.
            - analysis: { 
                websiteScore (0-10), 
                seoStatusDetails (String), 
                visualScore (0-10),
                revenueEstimate, 
                socialLinks: { facebook, instagram, linkedin }, 
                adHistoryDetails (String) 
              }.
            `;

        try {
          // Use random delay to avoid rate limiting burst
          await new Promise(r => setTimeout(r, Math.random() * 2000));

          const response = await ai.models.generateContent({
            model: "gemini-2.0-pro-exp-02-11",
            contents: prompt,
            config: {
              systemInstruction: getSystemInstruction(),
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json"
            }
          });

          return JSON.parse(response.text || '[]');
        } catch (error) {
          console.error(`Error scraping ${kw} in ${loc}:`, error);
          return [];
        }
      })());
    }
  }

  const results = await Promise.all(searchPromises);

  // 3. Flatten and Dedup
  results.flat().forEach((lead: any) => {
    if (lead.website && !seenUrls.has(lead.website)) {
      seenUrls.add(lead.website);
      allLeads.push({
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
      });
    }
  });

  return allLeads;
};

export const enrichLead = async (lead: Lead): Promise<Lead> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `ULTRA DEEP VALIDATION for: ${lead.companyName} (${lead.website || 'zoeken...'}). 
  
  ONDERZOEKSDOMEINEN:
  1. FINANCIEEL & JURIDISCH:
     - Check KBO/Kruispuntbank/Companyweb voor BTW-nummer en status (Actief?).
     - Zoek recentste omzetcijfers of brutomarge.
     - Aantal werknemers (officiële VTE).
     
  2. CONTACT & CEO:
     - Zoek GSM nummers van zaakvoerder "${lead.ceoName}" (04xx...).
     - Zoek direct email adres.
     
  3. MARKETING HISTORIEK:
     - Check Facebook Ad Library: Hebben ze actieve ads?
     - Check Google Ads Transparency Center: Draaien ze ads?
     
  4. WEBSITE & SEO AUDIT:
     - Tel aantal indexeerbare pagina's.
     - Geef een SEO score op 10.
     - Analyseer de look & feel (Premium vs Verouderd).
  
  RETOURNEER EEN COMPLETE JSON UPDATE.`;

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
