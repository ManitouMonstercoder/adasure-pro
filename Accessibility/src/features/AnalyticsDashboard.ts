/**
 * AdaSure Pro - Premium Analytics Dashboard
 * Real-time accessibility analytics for business customers
 */

export interface AnalyticsData {
    dailyUsage: { date: string; sessions: number; features: number }[];
    popularFeatures: { name: string; usage: number; trend: number }[];
    userDemographics: {
        devices: { type: string; percentage: number }[];
        browsers: { name: string; percentage: number }[];
        assistiveTech: { detected: boolean; type?: string }[];
    };
    complianceMetrics: {
        currentScore: number;
        weeklyTrend: number;
        improvements: string[];
        alerts: string[];
    };
    businessInsights: {
        peakUsageTimes: string[];
        userRetention: number;
        featureAdoption: number;
        roi: {
            potentialLawsuits: number;
            savedCosts: number;
            enhancedReach: number;
        };
    };
}

class AnalyticsDashboard {
    private apiEndpoint: string;
    private apiKey: string;
    private domain: string;
    private dashboardContainer: HTMLElement | null = null;

    constructor(apiKey: string, domain?: string) {
        this.apiKey = apiKey;
        this.domain = domain || window.location.hostname;
        this.apiEndpoint = this.getSecureEndpoint('analytics');
    }

    public async fetchAnalytics(timeframe: string = '30d'): Promise<AnalyticsData | null> {
        try {
            const response = await fetch(`${this.apiEndpoint}/dashboard?timeframe=${timeframe}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-AdaSure-Domain': this.domain
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('AdaSure Pro: Failed to fetch analytics', error);
        }
        return null;
    }

    public renderDashboard(containerId: string): void {
        this.dashboardContainer = document.getElementById(containerId);
        if (!this.dashboardContainer) {
            console.error('AdaSure Pro: Dashboard container not found');
            return;
        }

        this.fetchAnalytics().then(data => {
            if (data) {
                this.displayAnalytics(data);
            }
        });
    }

    private displayAnalytics(data: AnalyticsData): void {
        if (!this.dashboardContainer) return;

        this.dashboardContainer.innerHTML = `
            <div class="adasure-dashboard">
                <div class="dashboard-header">
                    <h2>AdaSure Pro Analytics</h2>
                    <div class="compliance-score">
                        <span class="score-value">${data.complianceMetrics.currentScore}</span>
                        <span class="score-label">Compliance Score</span>
                        <span class="score-trend ${data.complianceMetrics.weeklyTrend >= 0 ? 'positive' : 'negative'}">
                            ${data.complianceMetrics.weeklyTrend >= 0 ? '↗' : '↘'} ${Math.abs(data.complianceMetrics.weeklyTrend)}%
                        </span>
                    </div>
                </div>

                <div class="dashboard-grid">
                    <div class="analytics-card">
                        <h3>Feature Usage</h3>
                        <div class="feature-list">
                            ${data.popularFeatures.map(feature => `
                                <div class="feature-item">
                                    <span class="feature-name">${feature.name}</span>
                                    <span class="feature-usage">${feature.usage} uses</span>
                                    <span class="feature-trend ${feature.trend >= 0 ? 'up' : 'down'}">
                                        ${feature.trend >= 0 ? '↗' : '↘'}${Math.abs(feature.trend)}%
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>Business Impact</h3>
                        <div class="roi-metrics">
                            <div class="roi-item">
                                <span class="roi-value">$${data.businessInsights.roi.savedCosts.toLocaleString()}</span>
                                <span class="roi-label">Potential Legal Costs Avoided</span>
                            </div>
                            <div class="roi-item">
                                <span class="roi-value">${data.businessInsights.roi.enhancedReach}%</span>
                                <span class="roi-label">Increased Market Reach</span>
                            </div>
                            <div class="roi-item">
                                <span class="roi-value">${data.businessInsights.userRetention}%</span>
                                <span class="roi-label">User Retention Rate</span>
                            </div>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>User Demographics</h3>
                        <div class="demographics">
                            <div class="demo-section">
                                <h4>Devices</h4>
                                ${data.userDemographics.devices.map(device => `
                                    <div class="demo-item">
                                        <span>${device.type}</span>
                                        <span>${device.percentage}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>Compliance Alerts</h3>
                        <div class="alerts">
                            ${data.complianceMetrics.alerts.map(alert => `
                                <div class="alert-item">
                                    <span class="alert-icon">⚠️</span>
                                    <span class="alert-text">${alert}</span>
                                </div>
                            `).join('')}
                        </div>

                        <div class="improvements">
                            <h4>Suggested Improvements</h4>
                            ${data.complianceMetrics.improvements.map(improvement => `
                                <div class="improvement-item">
                                    <span class="improvement-icon">💡</span>
                                    <span class="improvement-text">${improvement}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="dashboard-actions">
                    <button class="btn-primary" onclick="window.adasurePro.downloadReport()">
                        Download Compliance Report
                    </button>
                    <button class="btn-secondary" onclick="window.adasurePro.downloadCertificate()">
                        Get Compliance Certificate
                    </button>
                </div>
            </div>
        `;

        this.injectDashboardStyles();
    }

    private injectDashboardStyles(): void {
        if (document.getElementById('adasure-dashboard-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'adasure-dashboard-styles';
        styles.textContent = `
            .adasure-dashboard {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }

            .compliance-score {
                text-align: center;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
            }

            .score-value {
                display: block;
                font-size: 32px;
                font-weight: 700;
            }

            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 24px;
            }

            .analytics-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .analytics-card h3 {
                margin-bottom: 16px;
                color: #1e293b;
                font-weight: 600;
            }

            .feature-item, .roi-item, .demo-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }

            .btn-primary, .btn-secondary {
                padding: 12px 24px;
                border-radius: 8px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                margin-right: 12px;
            }

            .btn-primary {
                background: #3b82f6;
                color: white;
            }

            .btn-secondary {
                background: #e2e8f0;
                color: #1e293b;
            }
        `;

        document.head.appendChild(styles);
    }

    public async downloadReport(): Promise<void> {
        try {
            const response = await fetch(`${this.apiEndpoint}/report/download`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-AdaSure-Domain': this.domain
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `adasure-compliance-report-${this.domain}-${new Date().toISOString().split('T')[0]}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('AdaSure Pro: Failed to download report', error);
        }
    }

    private getSecureEndpoint(service: string): string {
        const baseUrl = (window as any).__ADASURE_API__ || 'https://api.adasure.pro/v1';
        return `${baseUrl}/${service}`;
    }
}

export default AnalyticsDashboard;