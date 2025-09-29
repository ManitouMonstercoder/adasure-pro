# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdaSure Pro - Premium ADA Compliance Widget - An enterprise-grade TypeScript accessibility solution that provides comprehensive ADA compliance, analytics, and reporting for business websites. Priced at $50/month or $499/year for premium features.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development watch mode (rebuilds on file changes)
npm run watch

# Production build (minified)
npm run build

# Production build with optimizations
npm run build:prod
```

## Architecture Overview

### Core Structure
- **Entry Point**: `src/entry.ts` - Secure initialization with premium features and security management
- **Main Plugin**: `src/sienna.ts` - Core accessibility logic with premium feature integration
- **Security Layer**: `src/security/SecurityManager.ts` - Enterprise-grade security and XSS protection
- **Premium Features**: `src/features/` - Business-focused compliance and analytics modules
- **Build System**: Custom esbuild with commercial licensing and security headers

### Key Directories

#### Core System
- `src/tools/` - Accessibility feature implementations with benefit-focused naming
- `src/views/` - Premium UI components with modern business design
- `src/utils/` - Enhanced utility functions with security improvements
- `src/globals/` - Configuration management with API key support

#### Premium Features
- `src/features/ComplianceReporting.ts` - ADA compliance tracking and reporting
- `src/features/AnalyticsDashboard.ts` - Business analytics and ROI metrics
- `src/features/ApiKeyManager.ts` - Enterprise authentication and plan validation
- `src/features/PremiumFeatures.ts` - Premium feature orchestration

#### Security & Internationalization
- `src/security/SecurityManager.ts` - CSP, XSS protection, rate limiting
- `src/i18n/` - Internationalization with business-focused messaging
- `src/locales/` - 40+ language files with benefit-focused copy

### Premium Configuration System

#### API Key Integration
```typescript
window.AdaSureConfig = {
  apiKey: "your-api-key",
  enableAnalytics: true,
  enableCompliance: true,
  enableReporting: true,
  dashboardContainer: "analytics-dashboard",
  customization: {
    brandColors: { primary: "#3b82f6", secondary: "#1d4ed8" },
    companyName: "Your Company"
  }
};
```

#### Security Configuration
- Content Security Policy (CSP) enforcement
- DOM integrity monitoring and XSS prevention
- Rate limiting (100 requests/minute default)
- Input sanitization and data encryption
- Security event logging and monitoring

### Tool Architecture (Enhanced)

Each accessibility tool follows enterprise patterns:
- **Configuration objects** with enhanced selectors and security validation
- **Benefit-focused naming** (e.g., "Enhanced Visibility" vs "Big Cursor")
- **Premium tracking** - Usage analytics and compliance scoring
- **Security validation** - Input sanitization and CSP compliance

### Business Features

#### Compliance Reporting
- Real-time ADA compliance scoring
- Session tracking and feature usage analytics
- Compliance certificate generation
- Legal audit trail and documentation

#### Analytics Dashboard
- Business impact metrics and ROI calculations
- User demographics and device analytics
- Feature adoption and retention tracking
- Compliance alerts and improvement suggestions

#### Enterprise Security
- API key validation and plan enforcement
- Rate limiting and abuse protection
- XSS/CSRF protection and DOM monitoring
- Secure data storage and transmission

### Development Patterns

#### Security-First Development
- All user input must be sanitized via `SecurityManager.sanitizeInput()`
- API calls require rate limiting validation
- Premium features require API key validation
- DOM modifications require integrity checks

#### Premium Feature Development
- Features must integrate with `PremiumFeatures.trackFeature()`
- Business messaging should focus on benefits over features
- UI components should support custom branding
- Analytics tracking should provide business insights

#### Error Handling
- Graceful degradation for free users
- Secure error logging without exposing sensitive data
- Fallback initialization for network failures
- Security event monitoring and alerting

## Business Value Proposition

### Target Market: Businesses paying $50/month for:
- **Legal Compliance Protection** - Avoid ADA lawsuits and penalties
- **Business Analytics** - ROI tracking and user insights
- **Professional Support** - Enterprise-grade security and reliability
- **Custom Branding** - White-label options for agencies
- **Compliance Reporting** - Audit-ready documentation and certificates