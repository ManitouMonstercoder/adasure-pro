/**
 * AdaSure Pro - Premium Compliance Reporting System
 * Tracks accessibility usage and generates compliance reports for businesses
 */

export interface ComplianceMetrics {
    sessionId: string;
    domain: string;
    timestamp: number;
    featuresUsed: string[];
    sessionDuration: number;
    userAgent: string;
    ipHash: string; // Hashed IP for privacy
    complianceScore: number;
}

export interface ComplianceReport {
    domain: string;
    period: string;
    totalSessions: number;
    uniqueUsers: number;
    mostUsedFeatures: { feature: string; usage: number }[];
    complianceMetrics: {
        averageScore: number;
        improvementSuggestions: string[];
        wcagCompliance: string;
    };
    generatedAt: number;
}

class ComplianceReporting {
    private apiEndpoint: string;
    private apiKey: string;
    private sessionMetrics: ComplianceMetrics;
    private features: Set<string> = new Set();

    constructor(apiKey: string, domain?: string) {
        this.apiKey = apiKey;
        this.apiEndpoint = this.getSecureEndpoint('compliance');

        this.sessionMetrics = {
            sessionId: this.generateSessionId(),
            domain: domain || window.location.hostname,
            timestamp: Date.now(),
            featuresUsed: [],
            sessionDuration: 0,
            userAgent: navigator.userAgent,
            ipHash: '',
            complianceScore: 100
        };

        this.startSessionTracking();
    }

    private generateSessionId(): string {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    public trackFeatureUsage(featureName: string, enabled: boolean): void {
        if (enabled && !this.features.has(featureName)) {
            this.features.add(featureName);
            this.sessionMetrics.featuresUsed.push(featureName);
            this.updateComplianceScore();
        }
    }

    private updateComplianceScore(): void {
        // Calculate compliance score based on feature usage
        const baseScore = 100;
        const featureBonus = this.features.size * 2; // +2 points per accessibility feature used
        this.sessionMetrics.complianceScore = Math.min(100, baseScore + featureBonus);
    }

    private startSessionTracking(): void {
        // Track session duration
        const startTime = Date.now();

        window.addEventListener('beforeunload', () => {
            this.sessionMetrics.sessionDuration = Date.now() - startTime;
            this.sendMetrics();
        });

        // Send metrics every 5 minutes for long sessions
        setInterval(() => {
            this.sessionMetrics.sessionDuration = Date.now() - startTime;
            this.sendMetrics();
        }, 300000); // 5 minutes
    }

    private async sendMetrics(): Promise<void> {
        try {
            await fetch(this.apiEndpoint + '/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-AdaSure-Domain': this.sessionMetrics.domain
                },
                body: JSON.stringify(this.sessionMetrics)
            });
        } catch (error) {
            console.warn('AdaSure Pro: Failed to send compliance metrics', error);
        }
    }

    public async generateComplianceReport(period: string = '30d'): Promise<ComplianceReport | null> {
        try {
            const response = await fetch(this.apiEndpoint + `/report?period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-AdaSure-Domain': this.sessionMetrics.domain
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('AdaSure Pro: Failed to generate compliance report', error);
        }
        return null;
    }

    public async downloadComplianceCertificate(): Promise<Blob | null> {
        try {
            const response = await fetch(this.apiEndpoint + '/certificate', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-AdaSure-Domain': this.sessionMetrics.domain
                }
            });

            if (response.ok) {
                return await response.blob();
            }
        } catch (error) {
            console.error('AdaSure Pro: Failed to download certificate', error);
        }
        return null;
    }

    private getSecureEndpoint(service: string): string {
        const baseUrl = (window as any).__ADASURE_API__ || 'https://api.adasure.pro/v1';
        return `${baseUrl}/${service}`;
    }

    public getSessionMetrics(): ComplianceMetrics {
        return { ...this.sessionMetrics };
    }
}

export default ComplianceReporting;