/**
 * AdaSure Pro - Cloudflare Authentication & User Management
 * Handles user registration, authentication, and session management via Cloudflare Workers
 */

export interface UserAccount {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    subscriptionStatus: 'active' | 'inactive' | 'trialing' | 'canceled';
    apiKeys: ApiKeyInfo[];
    createdAt: Date;
    lastLogin?: Date;
}

export interface ApiKeyInfo {
    id: string;
    name: string;
    keyHash: string;
    lastUsed?: Date;
    isActive: boolean;
    domain?: string;
}

export interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    planId: string;
    recaptchaToken: string;
}

class CloudflareAuth {
    private workerUrl: string;
    private zoneId: string;
    private sessionToken: string | null = null;

    constructor() {
        this.workerUrl = this.getEnvVar('CLOUDFLARE_WORKERS_URL');
        this.zoneId = this.getEnvVar('CLOUDFLARE_ZONE_ID');
        this.loadSession();
    }

    private getEnvVar(key: string): string {
        const envVars = (window as any).__ADASURE_ENV__ || {};
        return envVars[key] || this.getDefaultConfig()[key];
    }

    private getDefaultConfig(): Record<string, string> {
        return {
            CLOUDFLARE_WORKERS_URL: 'https://adasure-auth.example.workers.dev',
            CLOUDFLARE_ZONE_ID: 'placeholder_zone_id'
        };
    }

    private loadSession(): void {
        this.sessionToken = localStorage.getItem('adasure_session_token');
    }

    private saveSession(token: string): void {
        this.sessionToken = token;
        localStorage.setItem('adasure_session_token', token);
    }

    private clearSession(): void {
        this.sessionToken = null;
        localStorage.removeItem('adasure_session_token');
        sessionStorage.removeItem('adasure_api_key');
    }

    public async signup(signupData: SignupData): Promise<{ success: boolean; message: string; userId?: string }> {
        try {
            const response = await fetch(`${this.workerUrl}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Recaptcha-Token': signupData.recaptchaToken
                },
                body: JSON.stringify({
                    email: signupData.email,
                    password: signupData.password,
                    firstName: signupData.firstName,
                    lastName: signupData.lastName,
                    companyName: signupData.companyName,
                    planId: signupData.planId,
                    source: 'widget_signup'
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Trigger welcome email and setup process
                await this.triggerWelcomeFlow(result.userId);
                return { success: true, message: 'Account created successfully', userId: result.userId };
            } else {
                return { success: false, message: result.error || 'Signup failed' };
            }
        } catch (error) {
            console.error('AdaSure Pro: Signup failed', error);
            return { success: false, message: 'Network error during signup' };
        }
    }

    public async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: UserAccount }> {
        try {
            const response = await fetch(`${this.workerUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                this.saveSession(result.token);
                await this.updateLastLogin();
                return { success: true, token: result.token, user: result.user };
            } else {
                return { success: false };
            }
        } catch (error) {
            console.error('AdaSure Pro: Login failed', error);
            return { success: false };
        }
    }

    public async logout(): Promise<void> {
        if (this.sessionToken) {
            try {
                await fetch(`${this.workerUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.sessionToken}`
                    }
                });
            } catch (error) {
                console.error('AdaSure Pro: Logout error', error);
            }
        }
        this.clearSession();
    }

    public async getCurrentUser(): Promise<UserAccount | null> {
        if (!this.sessionToken) return null;

        try {
            const response = await fetch(`${this.workerUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            if (response.ok) {
                return await response.json();
            } else {
                this.clearSession();
                return null;
            }
        } catch (error) {
            console.error('AdaSure Pro: Failed to get current user', error);
            return null;
        }
    }

    public async generateApiKey(name: string, domain?: string): Promise<{ apiKey: string; keyId: string } | null> {
        if (!this.sessionToken) return null;

        try {
            const response = await fetch(`${this.workerUrl}/api-keys/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionToken}`
                },
                body: JSON.stringify({ name, domain })
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('AdaSure Pro: Failed to generate API key', error);
            return null;
        }
    }

    public async revokeApiKey(keyId: string): Promise<boolean> {
        if (!this.sessionToken) return false;

        try {
            const response = await fetch(`${this.workerUrl}/api-keys/${keyId}/revoke`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('AdaSure Pro: Failed to revoke API key', error);
            return false;
        }
    }

    public async requestPasswordReset(email: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.workerUrl}/auth/password-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            return response.ok;
        } catch (error) {
            console.error('AdaSure Pro: Password reset request failed', error);
            return false;
        }
    }

    public async resetPassword(token: string, newPassword: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.workerUrl}/auth/password-reset/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, password: newPassword })
            });

            return response.ok;
        } catch (error) {
            console.error('AdaSure Pro: Password reset failed', error);
            return false;
        }
    }

    public async updateProfile(updates: Partial<UserAccount>): Promise<boolean> {
        if (!this.sessionToken) return false;

        try {
            const response = await fetch(`${this.workerUrl}/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionToken}`
                },
                body: JSON.stringify(updates)
            });

            return response.ok;
        } catch (error) {
            console.error('AdaSure Pro: Profile update failed', error);
            return false;
        }
    }

    private async updateLastLogin(): Promise<void> {
        if (!this.sessionToken) return;

        try {
            await fetch(`${this.workerUrl}/auth/update-login`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
        } catch (error) {
            console.error('AdaSure Pro: Failed to update last login', error);
        }
    }

    private async triggerWelcomeFlow(userId: string): Promise<void> {
        try {
            await fetch(`${this.workerUrl}/webhooks/welcome`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, timestamp: Date.now() })
            });
        } catch (error) {
            console.error('AdaSure Pro: Welcome flow trigger failed', error);
        }
    }

    public async validateRecaptcha(token: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.workerUrl}/auth/validate-recaptcha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const result = await response.json();
            return result.success && result.score > 0.5; // Minimum score threshold
        } catch (error) {
            console.error('AdaSure Pro: Recaptcha validation failed', error);
            return false;
        }
    }

    public isAuthenticated(): boolean {
        return !!this.sessionToken;
    }

    public getSessionToken(): string | null {
        return this.sessionToken;
    }

    // Analytics and tracking methods
    public async trackEvent(event: string, properties: Record<string, any>): Promise<void> {
        if (!this.sessionToken) return;

        try {
            await fetch(`${this.workerUrl}/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.sessionToken}`
                },
                body: JSON.stringify({
                    event,
                    properties: {
                        ...properties,
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    }
                })
            });
        } catch (error) {
            console.error('AdaSure Pro: Event tracking failed', error);
        }
    }

    public async getUsageMetrics(): Promise<any> {
        if (!this.sessionToken) return null;

        try {
            const response = await fetch(`${this.workerUrl}/analytics/usage`, {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('AdaSure Pro: Failed to get usage metrics', error);
            return null;
        }
    }
}

export default CloudflareAuth;