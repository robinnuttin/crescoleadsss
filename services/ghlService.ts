import { GoogleGenAI } from "@google/genai";
import { Lead, UserConfig } from "../types";

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

export const syncToGHL = async (lead: Lead, extraTags: string[], config?: UserConfig): Promise<string | null> => {
  const token = config?.tokens?.ghl?.access_token || 'pit-6d6e5af4-d7fd-431d-9cab-28efcd0df436';
  
  try {
    const sourceTag = lead.outboundChannel === 'coldcall' ? 'Bron: Cold Call' :
                      lead.outboundChannel === 'coldsms' ? 'Bron: Cold SMS' :
                      lead.outboundChannel === 'coldemail' ? 'Bron: Cold Email' : 'Bron: Onbekend';

    const tags = [...new Set([...extraTags, sourceTag, 'LeadScraper Pro X'])];

    const contactData = {
      firstName: lead.ceoName ? lead.ceoName.split(' ')[0] : 'Contact',
      lastName: lead.ceoName ? lead.ceoName.split(' ').slice(1).join(' ') : lead.companyName,
      name: lead.companyName,
      email: lead.ceoEmail || lead.emailCompany,
      phone: lead.ceoPhone || lead.phoneCompany,
      website: lead.website,
      tags: tags,
      customFields: [
        { key: 'sector', value: lead.sector },
        { key: 'cresco_profile', value: lead.crescoProfile },
        { key: 'lead_source_detail', value: lead.outboundChannel }
      ]
    };

    const response = await fetch(`${GHL_BASE_URL}/contacts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28'
      },
      body: JSON.stringify(contactData)
    });

    if (response.ok) {
      const result = await response.json();
      return result.contact.id;
    } else {
        const search = await fetch(`${GHL_BASE_URL}/contacts/?email=${encodeURIComponent(lead.ceoEmail || lead.emailCompany)}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28' }
        });
        if (search.ok) {
            const res = await search.json();
            return res.contacts?.[0]?.id || null;
        }
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const analyzeGHLPipeline = async (leads: Lead[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const channelMetrics = leads.reduce((acc: any, lead) => {
    const channel = lead.outboundChannel || 'unassigned';
    const tag = lead.pipelineTag || 'pending';
    if (!acc[channel]) acc[channel] = {};
    acc[channel][tag] = (acc[channel][tag] || 0) + 1;
    return acc;
  }, {});

  const prompt = `Analyseer de volgende sales pipeline data van een marketing agency:
  Totaal Leads: ${leads.length}
  Verdeling per kanaal en status: ${JSON.stringify(channelMetrics)}
  
  Geef een scherp, strategisch advies in het Nederlands over hoe de conversie naar afspraken verhoogd kan worden. 
  Benoem specifieke kansen op basis van de data. Maximaal 150 woorden.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "De AI kon op dit moment geen analyse genereren.";
  } catch (error) {
    console.error("Pipeline analysis failed:", error);
    return "Er is een fout opgetreden bij het genereren van de AI-analyse. Probeer het later opnieuw.";
  }
};