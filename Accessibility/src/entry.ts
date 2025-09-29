import sienna from "./sienna";
import { getDefaultLanguage } from "./i18n/getDefaultLanguage";
import { getScriptDataAttribute } from "./utils/getScriptDataAttribute";
import observeHTMLLang from "./utils/observeHTMLLang";
import { loadLanguages } from "@/i18n/Languages";
import SecurityManager from "./security/SecurityManager";
import PremiumFeatures from "./features/PremiumFeatures";

// Global configuration interface
declare global {
    interface Window {
        AdaSureConfig?: any;
        SiennaPlugin?: any;
        adasurePro?: any;
    }
}

async function initialize() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        document.removeEventListener('readystatechange', initialize);

        // Initialize security manager first
        const securityConfig = {
            enableCSP: true,
            enableIntegrityChecks: true,
            allowedDomains: [window.location.hostname],
            rateLimitConfig: {
                maxRequests: 100,
                windowMs: 60000 // 1 minute
            }
        };

        const securityManager = SecurityManager.getInstance(securityConfig);

        // Check for premium configuration
        const premiumConfig = window.AdaSureConfig;
        let premiumFeatures: PremiumFeatures | null = null;

        if (premiumConfig?.apiKey) {
            // Validate API key and initialize premium features
            premiumFeatures = new PremiumFeatures({
                apiKey: securityManager.sanitizeInput(premiumConfig.apiKey),
                enableAnalytics: premiumConfig.enableAnalytics,
                enableCompliance: premiumConfig.enableCompliance,
                enableReporting: premiumConfig.enableReporting,
                dashboardContainer: premiumConfig.dashboardContainer,
                customization: premiumConfig.customization
            });
        }

        // Initialize core widget
        const options = {
            lang: getDefaultLanguage(),
            position: getScriptDataAttribute("position") || premiumConfig?.position || "bottom-right",
            offset: getScriptDataAttribute("offset")?.split(",").map(Number) || premiumConfig?.offset || [32, 32],
            size: getScriptDataAttribute("size") || premiumConfig?.size || 64,
            premiumFeatures
        };

        await loadLanguages();

        // Initialize the main widget
        window.SiennaPlugin = sienna({
            options
        });

        // Set up feature tracking for premium customers
        if (premiumFeatures) {
            const originalTrackFeature = window.SiennaPlugin.trackFeature || (() => {});
            window.SiennaPlugin.trackFeature = (featureName: string, enabled: boolean) => {
                premiumFeatures.trackFeature(featureName, enabled);
                originalTrackFeature(featureName, enabled);
            };
        }

        if (!getScriptDataAttribute("disableObserveLang") && !premiumConfig?.disableObserveLang) {
            observeHTMLLang();
        }

        // Enable secure mode for premium customers
        if (premiumConfig?.enableSecureMode) {
            securityManager.enableSecureMode();
        }

        console.info('AdaSure Pro: Accessibility widget loaded successfully');
    }
}

// Enhanced error handling
window.addEventListener('error', (event) => {
    console.error('AdaSure Pro: Initialization error:', event.error);

    // Fallback initialization for basic functionality
    if (!window.SiennaPlugin) {
        setTimeout(() => {
            try {
                const basicOptions = {
                    lang: getDefaultLanguage(),
                    position: "bottom-right",
                    offset: [32, 32],
                    size: 64
                };

                loadLanguages().then(() => {
                    window.SiennaPlugin = sienna({ options: basicOptions });
                });
            } catch (fallbackError) {
                console.error('AdaSure Pro: Fallback initialization failed:', fallbackError);
            }
        }, 1000);
    }
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Initialize if the script is appended to the DOM when document.readyState is completed
    initialize();
} else {
    // Use readystatechange for async support
    document.addEventListener("readystatechange", initialize);
}

