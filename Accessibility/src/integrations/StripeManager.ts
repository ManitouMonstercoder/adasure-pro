/**
 * AdaSure Pro - Stripe Payment Integration
 * Handles subscriptions, payments, and billing management
 */

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    stripePriceId: string;
}

export interface CustomerData {
    customerId: string;
    email: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
    currentPlan?: SubscriptionPlan;
    nextBillingDate?: Date;
}

class StripeManager {
    private stripe: any;
    private publicKey: string;
    private apiEndpoint: string;

    constructor() {
        this.publicKey = this.getEnvVar('STRIPE_PUBLIC_KEY');
        this.apiEndpoint = this.getEnvVar('ADASURE_API_BASE_URL');
        this.initializeStripe();
    }

    private getEnvVar(key: string): string {
        // In production, these would be loaded from secure environment
        const envVars = (window as any).__ADASURE_ENV__ || {};
        return envVars[key] || this.getDefaultConfig()[key];
    }

    private getDefaultConfig(): Record<string, string> {
        return {
            STRIPE_PUBLIC_KEY: 'pk_live_placeholder',
            ADASURE_API_BASE_URL: 'https://api.adasure.pro/v1'
        };
    }

    private async initializeStripe(): Promise<void> {
        try {
            // Load Stripe.js dynamically
            if (!(window as any).Stripe) {
                const script = document.createElement('script');
                script.src = 'https://js.stripe.com/v3/';
                script.async = true;

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            this.stripe = (window as any).Stripe(this.publicKey);
        } catch (error) {
            console.error('AdaSure Pro: Failed to initialize Stripe', error);
        }
    }

    public getAvailablePlans(): SubscriptionPlan[] {
        return [
            {
                id: 'professional',
                name: 'Professional',
                price: 50,
                interval: 'month',
                stripePriceId: this.getEnvVar('STRIPE_PROFESSIONAL_PRICE_ID'),
                features: [
                    'Complete ADA compliance toolkit',
                    'Real-time analytics dashboard',
                    'Compliance reporting and certificates',
                    'Custom branding options',
                    'Priority support'
                ]
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: 499,
                interval: 'year',
                stripePriceId: this.getEnvVar('STRIPE_ENTERPRISE_PRICE_ID'),
                features: [
                    'Everything in Professional',
                    'Advanced analytics and ROI tracking',
                    'Custom implementation support',
                    'Legal consultation included',
                    'SLA guarantee',
                    'Save 17% with annual billing'
                ]
            }
        ];
    }

    public async createCheckoutSession(planId: string, customerEmail?: string): Promise<string | null> {
        try {
            const plan = this.getAvailablePlans().find(p => p.id === planId);
            if (!plan) {
                throw new Error('Invalid plan selected');
            }

            const response = await fetch(`${this.apiEndpoint}/payments/create-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: plan.stripePriceId,
                    customerEmail,
                    successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/pricing`,
                    metadata: {
                        planId: plan.id,
                        planName: plan.name
                    }
                })
            });

            const { sessionId } = await response.json();
            return sessionId;
        } catch (error) {
            console.error('AdaSure Pro: Failed to create checkout session', error);
            return null;
        }
    }

    public async redirectToCheckout(sessionId: string): Promise<void> {
        if (!this.stripe) {
            await this.initializeStripe();
        }

        const { error } = await this.stripe.redirectToCheckout({ sessionId });

        if (error) {
            console.error('AdaSure Pro: Checkout redirect failed', error);
            throw new Error('Payment initialization failed');
        }
    }

    public async createCustomerPortalSession(customerId: string): Promise<string | null> {
        try {
            const response = await fetch(`${this.apiEndpoint}/payments/create-portal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerId,
                    returnUrl: `${window.location.origin}/dashboard`
                })
            });

            const { portalUrl } = await response.json();
            return portalUrl;
        } catch (error) {
            console.error('AdaSure Pro: Failed to create portal session', error);
            return null;
        }
    }

    public async getCustomerData(customerId: string): Promise<CustomerData | null> {
        try {
            const response = await fetch(`${this.apiEndpoint}/customers/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`
                }
            });

            return await response.json();
        } catch (error) {
            console.error('AdaSure Pro: Failed to fetch customer data', error);
            return null;
        }
    }

    public async cancelSubscription(subscriptionId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiEndpoint}/subscriptions/${subscriptionId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getApiKey()}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('AdaSure Pro: Failed to cancel subscription', error);
            return false;
        }
    }

    public async validateApiKey(apiKey: string): Promise<CustomerData | null> {
        try {
            const response = await fetch(`${this.apiEndpoint}/auth/validate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('AdaSure Pro: API key validation failed', error);
            return null;
        }
    }

    private getApiKey(): string {
        return sessionStorage.getItem('adasure_api_key') || '';
    }

    public formatPrice(cents: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(cents / 100);
    }

    public calculateSavings(monthlyPrice: number, yearlyPrice: number): number {
        const yearlyEquivalent = monthlyPrice * 12;
        return Math.round(((yearlyEquivalent - yearlyPrice) / yearlyEquivalent) * 100);
    }

    // Webhook handler for Stripe events (server-side)
    public handleWebhook(event: any): void {
        switch (event.type) {
            case 'customer.subscription.created':
                this.handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                this.handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                this.handleSubscriptionCanceled(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                this.handlePaymentSucceeded(event.data.object);
                break;
            case 'invoice.payment_failed':
                this.handlePaymentFailed(event.data.object);
                break;
            default:
                console.log(`AdaSure Pro: Unhandled webhook event: ${event.type}`);
        }
    }

    private handleSubscriptionCreated(subscription: any): void {
        console.log('AdaSure Pro: New subscription created', subscription.id);
        // Activate customer account, generate API key, send welcome email
    }

    private handleSubscriptionUpdated(subscription: any): void {
        console.log('AdaSure Pro: Subscription updated', subscription.id);
        // Update customer limits, features, billing cycle
    }

    private handleSubscriptionCanceled(subscription: any): void {
        console.log('AdaSure Pro: Subscription canceled', subscription.id);
        // Deactivate account, revoke API keys, send cancellation email
    }

    private handlePaymentSucceeded(invoice: any): void {
        console.log('AdaSure Pro: Payment succeeded', invoice.id);
        // Send receipt, update billing status
    }

    private handlePaymentFailed(invoice: any): void {
        console.log('AdaSure Pro: Payment failed', invoice.id);
        // Send payment failure notification, retry logic
    }
}

export default StripeManager;