import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Lead, Campaign, FBConversation, CallScript, MeetSession, UserConfig, AccountData } from '../types';

interface CrescoDB extends DBSchema {
    leads: {
        key: string;
        value: Lead;
        indexes: { 'by-website': string; 'by-email': string; 'by-vat': string };
    };
    campaigns: { key: string; value: Campaign };
    conversations: { key: string; value: FBConversation };
    scripts: { key: string; value: CallScript };
    sessions: { key: string; value: MeetSession };
    config: { key: string; value: UserConfig };
    logs: { key: number; value: { timestamp: string; type: string; message: string; data?: any }; autoIncrement: true };
}

const DB_NAME = 'crescoflow_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CrescoDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<CrescoDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Leads Store
                const leadStore = db.createObjectStore('leads', { keyPath: 'id' });
                leadStore.createIndex('by-website', 'website', { unique: false });
                leadStore.createIndex('by-email', 'emailCompany', { unique: false });
                leadStore.createIndex('by-vat', 'vatNumber', { unique: false });

                // Other Stores
                db.createObjectStore('campaigns', { keyPath: 'id' });
                db.createObjectStore('conversations', { keyPath: 'id' });
                db.createObjectStore('scripts', { keyPath: 'id' });
                db.createObjectStore('sessions', { keyPath: 'id' });
                db.createObjectStore('config', { keyPath: 'email' });
                db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
            },
        });
    }
    return dbPromise;
};

// --- DEDUPLICATION ENGINE ---
export const isDuplicate = async (lead: Lead): Promise<boolean> => {
    const db = await initDB();

    // Check VAT (Strongest signal)
    if (lead.vatNumber) {
        const existing = await db.getFromIndex('leads', 'by-vat', lead.vatNumber);
        if (existing) return true;
    }

    // Check Website
    if (lead.website) {
        const existing = await db.getFromIndex('leads', 'by-website', lead.website);
        if (existing) return true;
    }

    // Check Email
    if (lead.emailCompany && lead.emailCompany !== 'onbekend' && lead.emailCompany !== '') {
        const existing = await db.getFromIndex('leads', 'by-email', lead.emailCompany);
        if (existing) return true;
    }

    return false;
};

// --- CRUD OPERATIONS ---

export const saveLead = async (lead: Lead) => {
    const db = await initDB();
    await db.put('leads', lead);
    await logActivity('LEAD_SAVED', `Lead stored: ${lead.companyName}`, { id: lead.id });
};

export const bulkSaveLeads = async (leads: Lead[]): Promise<number> => {
    const db = await initDB();
    const tx = db.transaction('leads', 'readwrite');
    let savedCount = 0;

    for (const lead of leads) {
        const dup = await isDuplicate(lead);
        if (!dup) {
            await tx.store.put(lead);
            savedCount++;
        }
    }
    await tx.done;
    return savedCount;
};

export const getAllLeads = async (): Promise<Lead[]> => {
    const db = await initDB();
    return db.getAll('leads');
};

export const saveConfig = async (config: UserConfig) => {
    const db = await initDB();
    await db.put('config', config);
};

export const getConfig = async (email: string): Promise<UserConfig | undefined> => {
    const db = await initDB();
    return db.get('config', email);
};

// Save other entities
export const saveCampaign = async (c: Campaign) => (await initDB()).put('campaigns', c);
export const saveConversation = async (c: FBConversation) => (await initDB()).put('conversations', c);
export const saveScript = async (s: CallScript) => (await initDB()).put('scripts', s);
export const saveSession = async (s: MeetSession) => (await initDB()).put('sessions', s);

// Load all data (for initial hydration)
export const loadAccountData = async (email: string): Promise<AccountData> => {
    const db = await initDB();
    const [leads, campaigns, fbConversations, scripts, sessions, config] = await Promise.all([
        db.getAll('leads'),
        db.getAll('campaigns'),
        db.getAll('conversations'),
        db.getAll('scripts'),
        db.getAll('sessions'),
        db.get('config', email)
    ]);

    return {
        leads,
        campaigns,
        fbConversations,
        scripts,
        sessions,
        config: config! // config should exist if logged in
    };
};

// --- LOGGING & BACKUP ---

const logActivity = async (type: string, message: string, data?: any) => {
    const db = await initDB();
    await db.put('logs', { timestamp: new Date().toISOString(), type, message, data });
};

export const createBackup = async () => {
    const db = await initDB();
    const backup = {
        leads: await db.getAll('leads'),
        campaigns: await db.getAll('campaigns'),
        conversations: await db.getAll('conversations'),
        scripts: await db.getAll('scripts'),
        sessions: await db.getAll('sessions'),
        config: await db.getAll('config'),
        logs: await db.getAll('logs'),
        backupDate: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CrescoFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    await logActivity('BACKUP_CREATED', 'User initiated manual backup');
};
