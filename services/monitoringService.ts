import { UserConfig } from '../types';

interface HealthStatus {
    ghl: boolean;
    instantly: boolean;
    lastChecked: string;
}

const checkGHL = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        // Mocking a lightweight ping to a safe endpoint or just checking connectivity
        // In real prod, this would hit GET /locations/{locationId} or similar
        await fetch('https://api.gohighlevel.com/lc/v2/locations/me', {
            headers: { Authorization: `Bearer ${apiKey}`, Version: '2021-07-28' }
        });
        return true;
    } catch (e) {
        return false;
    }
};

const checkInstantly = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        await fetch('https://api.instantly.ai/api/v1/authenticate', {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        return true;
    } catch (e) {
        return false;
    }
};

export const startMonitoring = (config: UserConfig, onStatusUpdate: (status: HealthStatus) => void) => {
    // Initial check
    const runCheck = async () => {
        const ghlStatus = await checkGHL(config.ghlApiKey);
        const instantlyStatus = await checkInstantly(config.instantlyApiKey);

        onStatusUpdate({
            ghl: ghlStatus,
            instantly: instantlyStatus,
            lastChecked: new Date().toISOString()
        });
    };

    runCheck();

    // Poll every 60 seconds
    const interval = setInterval(runCheck, 60000);
    return () => clearInterval(interval);
};
