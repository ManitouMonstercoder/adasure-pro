/**
 * AdaSure Pro - Enterprise API Key Management System
 * Secure authentication and configuration for business customers
 */

export interface ApiKeyConfig {
    apiKey: string;
    domain: string;
    plan: 'starter' | 'professional' | 'enterprise';
    features: string[];
    limits: {
        monthlySessions: number;
        analyticsRetention: number; // days
        reportsPerMonth: number;
    };
    expiresAt?: number;
    isValid: boolean;
}

export interface ApiKeyValidationResponse {
    valid: boolean;
    config?: ApiKeyConfig;
    error?: string;
}

class ApiKeyManager {
    private static instance: ApiKeyManager;
    private config: ApiKeyConfig | null = null;
    private validationEndpoint: string;

    private constructor() {
        this.validationEndpoint = this.getSecureEndpoint('auth/validate');
    }

    public static getInstance(): ApiKeyManager {
        if (!ApiKeyManager.instance) {
            ApiKeyManager.instance = new ApiKeyManager();
        }
        return ApiKeyManager.instance;
    }

    public async validateApiKey(apiKey: string, domain?: string): Promise<ApiKeyValidationResponse> {
        try {
            const targetDomain = domain || window.location.hostname;

            const response = await fetch(this.validationEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    domain: targetDomain,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                const data = await response.json();

                if (data.valid) {
                    this.config = data.config;
                    this.storeConfigSecurely(data.config);
                    return { valid: true, config: data.config };
                } else {
                    return { valid: false, error: data.error || 'Invalid API key' };
                }
            } else {
                return { valid: false, error: 'Failed to validate API key' };
            }
        } catch (error) {
            console.error('AdaSure Pro: API key validation failed', error);
            return { valid: false, error: 'Network error during validation' };
        }
    }

    private storeConfigSecurely(config: ApiKeyConfig): void {
        // Store encrypted config in sessionStorage (not localStorage for security)
        const encrypted = this.encryptConfig(config);
        sessionStorage.setItem('adasure_config', encrypted);
    }

    private encryptConfig(config: ApiKeyConfig): string {
        // Simple obfuscation (in production, use proper encryption)
        const jsonString = JSON.stringify(config);
        return btoa(jsonString).split('').reverse().join('');
    }

    private decryptConfig(encrypted: string): ApiKeyConfig | null {
        try {
            const reversed = encrypted.split('').reverse().join('');
            const jsonString = atob(reversed);
            return JSON.parse(jsonString);
        } catch {
            return null;
        }
    }

    public getConfig(): ApiKeyConfig | null {
        if (this.config) {
            return this.config;
        }

        // Try to load from sessionStorage
        const stored = sessionStorage.getItem('adasure_config');
        if (stored) {
            this.config = this.decryptConfig(stored);
            return this.config;
        }

        return null;
    }

    public isFeatureEnabled(featureName: string): boolean {
        const config = this.getConfig();
        return config?.features.includes(featureName) || false;
    }

    public isPlanValid(): boolean {
        const config = this.getConfig();
        if (!config) return false;

        // Check if API key is expired
        if (config.expiresAt && Date.now() > config.expiresAt) {
            return false;
        }

        return config.isValid;
    }

    public getPlanLimits(): ApiKeyConfig['limits'] | null {
        return this.getConfig()?.limits || null;
    }

    public async refreshConfig(): Promise<boolean> {
        const config = this.getConfig();
        if (!config) return false;

        const validation = await this.validateApiKey(config.apiKey, config.domain);
        return validation.valid;
    }

    public clearConfig(): void {
        this.config = null;
        sessionStorage.removeItem('adasure_config');
    }

    public generateInstallCode(apiKey: string, options: any = {}): string {
        const config = {
            apiKey,
            position: options.position || 'bottom-right',
            size: options.size || 64,
            features: options.features || ['all'],
            ...options
        };

        return `
<!-- AdaSure Pro - ADA Compliance Widget -->
<script>
(function() {
    window.AdaSureConfig = ${JSON.stringify(config, null, 2)};
    var script = document.createElement('script');
    script.src = 'https://cdn.adasure.pro/widget/adasure-pro.min.js';
    script.async = true;
    document.head.appendChild(script);
})();
</script>
<!-- End AdaSure Pro -->`.trim();
    }

    public showInstallationInstructions(): void {
        const config = this.getConfig();
        if (!config) {
            alert('Please validate your API key first');
            return;
        }

        const installCode = this.generateInstallCode(config.apiKey);

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: monospace;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 32px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80%;
                overflow-y: auto;
            ">
                <h3 style="margin-top: 0; color: #1e293b;">AdaSure Pro Installation</h3>
                <p style="color: #64748b; margin-bottom: 20px;">
                    Copy and paste this code into your website's &lt;head&gt; section:
                </p>
                <textarea readonly style="
                    width: 100%;
                    height: 200px;
                    font-family: monospace;
                    font-size: 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 12px;
                    background: #f8fafc;
                ">${installCode}</textarea>
                <div style="margin-top: 20px; text-align: right;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    private getSecureEndpoint(service: string): string {
        const baseUrl = (window as any).__ADASURE_API__ || 'https://api.adasure.pro/v1';
        return `${baseUrl}/${service}`;
    }
}

export default ApiKeyManager;