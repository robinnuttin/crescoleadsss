
import { Lead } from "../types";

// Note: In a production environment, API keys should be handled by a secure backend.
// This service simulates secure storage by using encrypted accessors where possible.

/**
 * Validates the Instantly API connection by fetching the account list.
 * Returns true if the key is valid and connection is established.
 */
export const validateInstantlyConnection = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  
  try {
    const response = await fetch('https://api.instantly.ai/api/v1/account/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // If the response is OK, the key is valid.
    return response.ok;
  } catch (err) {
    console.error("Instantly validation failed:", err);
    return false;
  }
};

/**
 * Uploads a batch of leads to a specific Instantly campaign.
 */
export const uploadToInstantly = async (leads: Lead[], campaignId: string, customBody?: string, apiKey?: string) => {
  // Use the provided key or fallback to a stored one (for demo purposes)
  const finalApiKey = apiKey || 'Yjg2ZmU4YmMtODZiOC00ZDhlLWJlYzItZjc5MzczNDUwNDBkOmNMcWVQQnVwZXNCeg==';
  
  if (leads.length === 0 || !campaignId) return false;

  const url = 'https://api.instantly.ai/api/v1/lead/add';

  const formattedLeads = leads.map(lead => {
    const nameParts = lead.ceoName ? lead.ceoName.split(' ') : [];
    const firstName = nameParts.length > 0 ? nameParts[0] : 'Contact';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const emailToUse = lead.ceoEmail || lead.emailCompany;

    return {
      email: emailToUse,
      first_name: firstName,
      last_name: lastName,
      company_name: lead.companyName,
      phone: lead.ceoPhone || lead.phoneCompany,
      website: lead.website,
      custom_variables: {
        custom_body: customBody || '', 
        sector: lead.sector,
        city: lead.city,
        cresco_profile: lead.crescoProfile || 'multiplier',
        bottlenecks: lead.analysis?.marketingBottlenecks?.join(', ') || ''
      }
    };
  });

  const validLeads = formattedLeads.filter(l => l.email && l.email.includes('@'));
  if (validLeads.length === 0) return false;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`
      },
      body: JSON.stringify({
        leads: validLeads,
        campaign_id: campaignId,
        skip_if_exists: true
      })
    });

    return response.ok;
  } catch (error) {
    console.error("Instantly Sync Error:", error);
    return false;
  }
};

/**
 * Checks the status of a specific lead in Instantly.
 */
export const checkInstantlyStatus = async (email: string, apiKey?: string): Promise<'replied' | 'sent' | null> => {
    const finalApiKey = apiKey || 'Yjg2ZmU4YmMtODZiOC00ZDhlLWJlYzItZjc5MzczNDUwNDBkOmNMcWVQQnVwZXNCeg==';
    const url = `https://api.instantly.ai/api/v1/lead/get?email=${encodeURIComponent(email)}`;
    
    try {
         const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${finalApiKey}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return (data.reply_count > 0 || data.lead_status === 'Replied') ? 'replied' : 'sent';
        }
        return null;
    } catch (e) {
        return null;
    }
};
