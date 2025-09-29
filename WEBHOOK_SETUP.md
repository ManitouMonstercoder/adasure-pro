# 🔗 Stripe Webhook Configuration Guide

## Webhook Endpoint URL
After deploying your Cloudflare Worker, your webhook URL will be:

```
https://adasure-api.YOUR_SUBDOMAIN.workers.dev/payments/webhook
```

## 🎯 Required Stripe Webhook Events

Configure these events in your Stripe Dashboard:

### Subscription Events
- `customer.subscription.created` - New subscription started
- `customer.subscription.updated` - Plan changed or billing updated
- `customer.subscription.deleted` - Subscription cancelled

### Payment Events
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment

### Customer Events (Optional)
- `customer.created` - New customer created
- `customer.updated` - Customer details updated

## ⚙️ Stripe Dashboard Setup Steps

1. **Login to Stripe Dashboard**
   - Go to [dashboard.stripe.com](https://dashboard.stripe.com)

2. **Navigate to Webhooks**
   - Developers → Webhooks → Add endpoint

3. **Add Endpoint**
   - **Endpoint URL**: `https://adasure-api.YOUR_SUBDOMAIN.workers.dev/payments/webhook`
   - **Events to send**: Select the events listed above
   - **Version**: Latest API version

4. **Get Webhook Secret**
   - After creating, click on the webhook
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add this to your environment variables as `STRIPE_WEBHOOK_SECRET`

## 🔐 Security Configuration

The webhook handler includes:
- **Signature verification** using Stripe's signing secret
- **Replay attack protection** with timestamp validation
- **Rate limiting** to prevent abuse
- **Error handling** with proper HTTP status codes

## 🧪 Testing Webhooks

### Using Stripe CLI (Development)
```bash
# Install Stripe CLI
stripe listen --forward-to https://adasure-api.YOUR_SUBDOMAIN.workers.dev/payments/webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### Manual Testing
1. Create a test subscription in Stripe Dashboard
2. Check Cloudflare Worker logs for webhook events
3. Verify user account updates in your system

## 📊 Webhook Event Handling

Your worker automatically handles:

- **New Subscription** → Activate user account, send welcome email
- **Payment Success** → Update billing status, send receipt
- **Payment Failed** → Send dunning email, suspend account if needed
- **Subscription Cancelled** → Deactivate features, send cancellation email
- **Plan Changed** → Update user permissions and features

## 🚨 Monitoring & Alerts

Monitor webhook delivery in:
- **Stripe Dashboard** → Webhooks → Your endpoint → Recent deliveries
- **Cloudflare Dashboard** → Workers → Analytics → Error rates
- **Worker Logs** for debugging failed webhook processing

## 🔄 Retry Logic

Stripe automatically retries failed webhooks:
- **Retry Schedule**: Immediate, 1 hour, 6 hours, 12 hours, then daily
- **Total Attempts**: Up to 3 days
- **Success Criteria**: HTTP 200-299 response

Make sure your webhook handler returns proper HTTP status codes!