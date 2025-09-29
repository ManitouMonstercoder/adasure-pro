/**
 * AdaSure Pro - Premium Features Integration
 * Combines all premium features for enterprise customers
 */

import ComplianceReporting from './ComplianceReporting';
import AnalyticsDashboard from './AnalyticsDashboard';
import ApiKeyManager from './ApiKeyManager';

export interface PremiumConfig {
    apiKey: string;
    enableAnalytics?: boolean;
    enableCompliance?: boolean;
    enableReporting?: boolean;
    dashboardContainer?: string;
    customization?: {
        brandColors?: {
            primary: string;
            secondary: string;
        };
        logo?: string;
        companyName?: string;
    };
}

class PremiumFeatures {
    private complianceReporting: ComplianceReporting | null = null;
    private analyticsDashboard: AnalyticsDashboard | null = null;
    private apiKeyManager: ApiKeyManager;
    private config: PremiumConfig;

    constructor(config: PremiumConfig) {
        this.config = config;
        this.apiKeyManager = ApiKeyManager.getInstance();
        this.initialize();
    }

    private async initialize(): Promise<void> {
        // Validate API key first
        const validation = await this.apiKeyManager.validateApiKey(this.config.apiKey);

        if (!validation.valid) {
            console.error('AdaSure Pro: Invalid API key', validation.error);
            this.showUpgradePrompt();
            return;
        }

        console.info('AdaSure Pro: Enterprise features activated');

        // Initialize premium features based on plan
        if (this.config.enableCompliance !== false && this.apiKeyManager.isFeatureEnabled('compliance')) {
            this.complianceReporting = new ComplianceReporting(this.config.apiKey);
        }

        if (this.config.enableAnalytics !== false && this.apiKeyManager.isFeatureEnabled('analytics')) {
            this.analyticsDashboard = new AnalyticsDashboard(this.config.apiKey);

            if (this.config.dashboardContainer) {
                this.analyticsDashboard.renderDashboard(this.config.dashboardContainer);
            }
        }

        // Apply custom branding if provided
        if (this.config.customization) {
            this.applyCustomBranding();
        }

        // Set up global access for dashboard functions
        this.setupGlobalAccess();
    }

    public trackFeature(featureName: string, enabled: boolean): void {
        if (this.complianceReporting) {
            this.complianceReporting.trackFeatureUsage(featureName, enabled);
        }
    }

    private applyCustomBranding(): void {
        if (!this.config.customization) return;

        const style = document.createElement('style');
        style.id = 'adasure-custom-branding';

        let css = '';

        if (this.config.customization.brandColors) {
            const { primary, secondary } = this.config.customization.brandColors;
            css += `
                .asw-menu-header {
                    background: linear-gradient(135deg, ${primary} 0%, ${secondary || primary} 100%) !important;
                }
                .asw-menu-btn {
                    background: linear-gradient(135deg, ${primary} 0%, ${secondary || primary} 100%) !important;
                }
                .asw-btn.asw-selected {
                    border-color: ${primary} !important;
                }
                .asw-btn.asw-selected svg,
                .asw-btn.asw-selected span {
                    fill: ${primary} !important;
                    color: ${primary} !important;
                }
            `;
        }

        if (this.config.customization.companyName) {
            // Update footer branding
            const footer = document.querySelector('.asw-footer a');
            if (footer) {
                footer.innerHTML = `Protected by <span style="font-weight:700;color:inherit;">${this.config.customization.companyName} + AdaSure Pro</span>`;
            }
        }

        if (css) {
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    private setupGlobalAccess(): void {
        // Expose functions globally for dashboard buttons
        (window as any).adasurePro = {
            downloadReport: () => this.downloadComplianceReport(),
            downloadCertificate: () => this.downloadComplianceCertificate(),
            refreshAnalytics: () => this.refreshAnalytics(),
            showInstallCode: () => this.apiKeyManager.showInstallationInstructions()
        };
    }

    public async downloadComplianceReport(period: string = '30d'): Promise<void> {
        if (!this.complianceReporting) {
            console.warn('AdaSure Pro: Compliance reporting not enabled');
            return;
        }

        try {
            const report = await this.complianceReporting.generateComplianceReport(period);
            if (report) {
                // Convert report to downloadable format
                const reportData = new Blob([JSON.stringify(report, null, 2)], {
                    type: 'application/json'
                });

                const url = URL.createObjectURL(reportData);
                const a = document.createElement('a');
                a.href = url;
                a.download = `adasure-compliance-report-${report.domain}-${report.period}.json`;
                a.click();
                URL.revokeObjectURL(url);

                this.showNotification('Compliance report downloaded successfully', 'success');
            }
        } catch (error) {
            this.showNotification('Failed to download compliance report', 'error');
        }
    }

    public async downloadComplianceCertificate(): Promise<void> {
        if (!this.complianceReporting) {
            console.warn('AdaSure Pro: Compliance reporting not enabled');
            return;
        }

        try {
            const certificate = await this.complianceReporting.downloadComplianceCertificate();
            if (certificate) {
                const url = URL.createObjectURL(certificate);
                const a = document.createElement('a');
                a.href = url;
                a.download = `adasure-compliance-certificate-${Date.now()}.pdf`;
                a.click();
                URL.revokeObjectURL(url);

                this.showNotification('Compliance certificate downloaded successfully', 'success');
            }
        } catch (error) {
            this.showNotification('Failed to download compliance certificate', 'error');
        }
    }

    public async refreshAnalytics(): Promise<void> {
        if (this.analyticsDashboard && this.config.dashboardContainer) {
            this.analyticsDashboard.renderDashboard(this.config.dashboardContainer);
            this.showNotification('Analytics refreshed', 'success');
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    private showUpgradePrompt(): void {
        // Show upgrade prompt for invalid API keys
        const promptDiv = document.createElement('div');
        promptDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
            z-index: 999999;
            max-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        promptDiv.innerHTML = `
            <div style="margin-bottom: 12px;">
                <strong>Upgrade to AdaSure Pro</strong>
            </div>
            <div style="font-size: 14px; margin-bottom: 16px; opacity: 0.9;">
                Unlock enterprise compliance reporting, analytics, and premium support.
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="window.open('https://adasure.pro/pricing', '_blank')" style="
                    background: white;
                    color: #3b82f6;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 12px;
                ">Upgrade Now</button>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                ">Later</button>
            </div>
        `;

        document.body.appendChild(promptDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            promptDiv.remove();
        }, 10000);
    }

    public getSessionMetrics() {
        return this.complianceReporting?.getSessionMetrics() || null;
    }

    public isFeatureEnabled(feature: string): boolean {
        return this.apiKeyManager.isFeatureEnabled(feature);
    }
}

export default PremiumFeatures;