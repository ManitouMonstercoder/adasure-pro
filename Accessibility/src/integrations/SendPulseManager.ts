/**
 * AdaSure Pro - SendPulse Email Integration
 * Handles transactional emails and marketing automation
 */

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
}

export interface EmailData {
    to: string;
    templateId: string;
    variables: Record<string, any>;
}

class SendPulseManager {
    private apiUserId: string;
    private apiSecret: string;
    private fromEmail: string;
    private fromName: string;
    private baseUrl: string = 'https://api.sendpulse.com';
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.apiUserId = this.getEnvVar('SENDPULSE_API_USER_ID');
        this.apiSecret = this.getEnvVar('SENDPULSE_API_SECRET');
        this.fromEmail = this.getEnvVar('SENDPULSE_FROM_EMAIL');
        this.fromName = this.getEnvVar('SENDPULSE_FROM_NAME');
    }

    private getEnvVar(key: string): string {
        const envVars = (window as any).__ADASURE_ENV__ || {};
        return envVars[key] || this.getDefaultConfig()[key];
    }

    private getDefaultConfig(): Record<string, string> {
        return {
            SENDPULSE_API_USER_ID: 'your_sendpulse_user_id',
            SENDPULSE_API_SECRET: 'your_sendpulse_secret',
            SENDPULSE_FROM_EMAIL: 'noreply@adasure.pro',
            SENDPULSE_FROM_NAME: 'AdaSure Pro'
        };
    }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await fetch(`${this.baseUrl}/oauth/access_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'client_credentials',
                    client_id: this.apiUserId,
                    client_secret: this.apiSecret,
                }),
            });

            const data = await response.json();

            if (data.access_token) {
                this.accessToken = data.access_token;
                this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
                return this.accessToken;
            }

            throw new Error('Failed to get access token');
        } catch (error) {
            console.error('SendPulse: Failed to get access token', error);
            throw error;
        }
    }

    public async sendTransactionalEmail(emailData: EmailData): Promise<boolean> {
        try {
            const token = await this.getAccessToken();

            const response = await fetch(`${this.baseUrl}/smtp/emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: {
                        from: {
                            name: this.fromName,
                            email: this.fromEmail,
                        },
                        to: [
                            {
                                email: emailData.to,
                            },
                        ],
                        template: {
                            id: parseInt(emailData.templateId),
                            variables: emailData.variables,
                        },
                    },
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('SendPulse: Failed to send email', error);
            return false;
        }
    }

    public async sendWelcomeEmail(email: string, userData: any): Promise<boolean> {
        return this.sendTransactionalEmail({
            to: email,
            templateId: this.getEnvVar('WELCOME_EMAIL_TEMPLATE_ID'),
            variables: {
                user_name: `${userData.firstName} ${userData.lastName}`,
                company_name: userData.companyName || '',
                dashboard_url: `${this.getEnvVar('APP_URL')}/dashboard`,
                trial_days: this.getEnvVar('FREE_TRIAL_DAYS') || '14',
            },
        });
    }

    public async sendPaymentSuccessEmail(email: string, paymentData: any): Promise<boolean> {
        return this.sendTransactionalEmail({
            to: email,
            templateId: this.getEnvVar('PAYMENT_SUCCESS_TEMPLATE_ID'),
            variables: {
                plan_name: paymentData.planName,
                amount: paymentData.amount,
                next_billing_date: paymentData.nextBillingDate,
                dashboard_url: `${this.getEnvVar('APP_URL')}/dashboard`,
            },
        });
    }

    public async sendCancellationEmail(email: string, userData: any): Promise<boolean> {
        return this.sendTransactionalEmail({
            to: email,
            templateId: this.getEnvVar('CANCELLATION_TEMPLATE_ID'),
            variables: {
                user_name: `${userData.firstName} ${userData.lastName}`,
                cancellation_date: new Date().toLocaleDateString(),
                reactivate_url: `${this.getEnvVar('APP_URL')}/pricing`,
            },
        });
    }

    public async addToEmailList(email: string, listId: string, userData?: any): Promise<boolean> {
        try {
            const token = await this.getAccessToken();

            const response = await fetch(`${this.baseUrl}/addressbooks/${listId}/emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    emails: [
                        {
                            email: email,
                            variables: userData || {},
                        },
                    ],
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('SendPulse: Failed to add to email list', error);
            return false;
        }
    }

    public async removeFromEmailList(email: string, listId: string): Promise<boolean> {
        try {
            const token = await this.getAccessToken();

            const response = await fetch(`${this.baseUrl}/addressbooks/${listId}/emails/${email}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            return response.ok;
        } catch (error) {
            console.error('SendPulse: Failed to remove from email list', error);
            return false;
        }
    }

    public async getEmailStatistics(templateId: string): Promise<any> {
        try {
            const token = await this.getAccessToken();

            const response = await fetch(`${this.baseUrl}/smtp/emails/${templateId}/statistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                return await response.json();
            }

            return null;
        } catch (error) {
            console.error('SendPulse: Failed to get email statistics', error);
            return null;
        }
    }

    public async validateEmailAddress(email: string): Promise<boolean> {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    public async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
        return this.sendTransactionalEmail({
            to: email,
            templateId: 'password_reset_template_id', // Add to env vars
            variables: {
                reset_url: `${this.getEnvVar('APP_URL')}/reset-password?token=${resetToken}`,
                expires_in: '24 hours',
            },
        });
    }

    public async sendTrialEndingEmail(email: string, userData: any): Promise<boolean> {
        return this.sendTransactionalEmail({
            to: email,
            templateId: 'trial_ending_template_id', // Add to env vars
            variables: {
                user_name: `${userData.firstName} ${userData.lastName}`,
                days_remaining: userData.daysRemaining,
                upgrade_url: `${this.getEnvVar('APP_URL')}/pricing`,
            },
        });
    }

    // Marketing automation methods
    public async triggerMarketingCampaign(email: string, campaignId: string, userData?: any): Promise<boolean> {
        try {
            const token = await this.getAccessToken();

            const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/recipients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    emails: [
                        {
                            email: email,
                            variables: userData || {},
                        },
                    ],
                }),
            });

            return response.ok;
        } catch (error) {
            console.error('SendPulse: Failed to trigger marketing campaign', error);
            return false;
        }
    }

    public getAvailableTemplates(): EmailTemplate[] {
        return [
            {
                id: 'welcome_email',
                name: 'Welcome Email',
                subject: 'Welcome to AdaSure Pro - Your ADA Compliance Journey Starts Now',
            },
            {
                id: 'payment_success',
                name: 'Payment Success',
                subject: 'Payment Confirmed - Welcome to AdaSure Pro Premium',
            },
            {
                id: 'cancellation',
                name: 'Cancellation',
                subject: 'Your AdaSure Pro Subscription Has Been Cancelled',
            },
            {
                id: 'trial_ending',
                name: 'Trial Ending',
                subject: 'Your AdaSure Pro Trial Ends Soon - Upgrade Now',
            },
            {
                id: 'password_reset',
                name: 'Password Reset',
                subject: 'Reset Your AdaSure Pro Password',
            },
        ];
    }
}

export default SendPulseManager;