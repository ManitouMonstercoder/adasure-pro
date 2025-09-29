/**
 * AdaSure Pro - Security Manager
 * Implements enterprise-grade security best practices
 */

export interface SecurityConfig {
    enableCSP: boolean;
    enableIntegrityChecks: boolean;
    allowedDomains: string[];
    rateLimitConfig: {
        maxRequests: number;
        windowMs: number;
    };
}

class SecurityManager {
    private static instance: SecurityManager;
    private config: SecurityConfig;
    private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
    private integrityHashes: Map<string, string> = new Map();

    private constructor(config: SecurityConfig) {
        this.config = config;
        this.initialize();
    }

    public static getInstance(config?: SecurityConfig): SecurityManager {
        if (!SecurityManager.instance && config) {
            SecurityManager.instance = new SecurityManager(config);
        }
        return SecurityManager.instance;
    }

    private initialize(): void {
        this.setupCSP();
        this.setupIntegrityChecks();
        this.setupDOMProtection();
        this.setupEventListeners();
    }

    private setupCSP(): void {
        if (!this.config.enableCSP) return;

        // Set Content Security Policy headers (if not already set by server)
        const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!existingCSP) {
            const cspMeta = document.createElement('meta');
            cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
            cspMeta.setAttribute('content', [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://api.adasure.pro https://cdn.adasure.pro",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "connect-src 'self' https://api.adasure.pro",
                "img-src 'self' data: https:",
                "frame-src 'none'"
            ].join('; '));
            document.head.appendChild(cspMeta);
        }
    }

    private setupIntegrityChecks(): void {
        if (!this.config.enableIntegrityChecks) return;

        // Calculate and store hashes of critical files
        this.integrityHashes.set('main', this.calculateFileHash(document.documentElement.outerHTML));

        // Monitor for unauthorized modifications
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.validateDOMIntegrity(mutation);
                }
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: false
        });
    }

    private calculateFileHash(content: string): string {
        // Simple hash function (in production, use crypto.subtle.digest)
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    private validateDOMIntegrity(mutation: MutationRecord): void {
        // Check for suspicious script injections
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;

                // Check for unauthorized script tags
                if (element.tagName === 'SCRIPT') {
                    const src = element.getAttribute('src');
                    const allowedSources = [
                        'https://api.adasure.pro',
                        'https://cdn.adasure.pro',
                        'https://fonts.googleapis.com'
                    ];

                    if (src && !allowedSources.some(allowed => src.startsWith(allowed))) {
                        console.warn('AdaSure Pro: Unauthorized script detected and removed:', src);
                        element.remove();
                    }
                }

                // Check for inline event handlers
                Array.from(element.attributes || []).forEach((attr) => {
                    if (attr.name.startsWith('on')) {
                        console.warn('AdaSure Pro: Inline event handler detected and removed:', attr.name);
                        element.removeAttribute(attr.name);
                    }
                });
            }
        });
    }

    private setupDOMProtection(): void {
        // Prevent common XSS attacks
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName: string) {
            const element = originalCreateElement.call(document, tagName);

            if (tagName.toLowerCase() === 'script') {
                // Add integrity checks for dynamically created scripts
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name: string, value: string) {
                    if (name === 'src' && !SecurityManager.instance.isAllowedSource(value)) {
                        console.warn('AdaSure Pro: Blocked unauthorized script source:', value);
                        return;
                    }
                    originalSetAttribute.call(this, name, value);
                };
            }

            return element;
        };
    }

    private setupEventListeners(): void {
        // Monitor for security-related events
        window.addEventListener('error', (event) => {
            // Log security-related errors
            if (event.message.includes('CSP') || event.message.includes('CORS')) {
                this.logSecurityEvent('csp_violation', {
                    message: event.message,
                    source: event.filename,
                    line: event.lineno
                });
            }
        });

        // Monitor for unload events (potential data exfiltration)
        window.addEventListener('beforeunload', () => {
            this.clearSensitiveData();
        });
    }

    public isAllowedSource(url: string): boolean {
        const allowedPrefixes = [
            'https://api.adasure.pro',
            'https://cdn.adasure.pro',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ];

        return allowedPrefixes.some(prefix => url.startsWith(prefix));
    }

    public validateRequest(endpoint: string, clientId?: string): boolean {
        const key = clientId || 'anonymous';
        const now = Date.now();
        const windowMs = this.config.rateLimitConfig.windowMs;
        const maxRequests = this.config.rateLimitConfig.maxRequests;

        let requestData = this.requestCounts.get(key);

        if (!requestData || now > requestData.resetTime) {
            // Reset or initialize request count
            requestData = {
                count: 1,
                resetTime: now + windowMs
            };
            this.requestCounts.set(key, requestData);
            return true;
        }

        if (requestData.count >= maxRequests) {
            this.logSecurityEvent('rate_limit_exceeded', {
                clientId: key,
                endpoint,
                count: requestData.count
            });
            return false;
        }

        requestData.count++;
        return true;
    }

    public sanitizeInput(input: string): string {
        // Sanitize user input to prevent XSS
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    }

    public encryptSensitiveData(data: string, key?: string): string {
        // Simple encryption (in production, use crypto.subtle)
        const keyString = key || 'adasure-default-key';
        let encrypted = '';

        for (let i = 0; i < data.length; i++) {
            const keyChar = keyString.charCodeAt(i % keyString.length);
            const dataChar = data.charCodeAt(i);
            encrypted += String.fromCharCode(dataChar ^ keyChar);
        }

        return btoa(encrypted);
    }

    public decryptSensitiveData(encryptedData: string, key?: string): string {
        try {
            const keyString = key || 'adasure-default-key';
            const encrypted = atob(encryptedData);
            let decrypted = '';

            for (let i = 0; i < encrypted.length; i++) {
                const keyChar = keyString.charCodeAt(i % keyString.length);
                const encryptedChar = encrypted.charCodeAt(i);
                decrypted += String.fromCharCode(encryptedChar ^ keyChar);
            }

            return decrypted;
        } catch {
            return '';
        }
    }

    private logSecurityEvent(type: string, details: any): void {
        const event = {
            type,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            details
        };

        // In production, send to security monitoring service
        console.warn('AdaSure Pro Security Event:', event);

        // Store locally for analysis
        const events = JSON.parse(localStorage.getItem('adasure_security_events') || '[]');
        events.push(event);

        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }

        localStorage.setItem('adasure_security_events', JSON.stringify(events));
    }

    private clearSensitiveData(): void {
        // Clear sensitive data from memory and storage
        sessionStorage.removeItem('adasure_config');
        this.requestCounts.clear();
        this.integrityHashes.clear();
    }

    public getSecurityReport(): any {
        const events = JSON.parse(localStorage.getItem('adasure_security_events') || '[]');

        return {
            totalEvents: events.length,
            recentEvents: events.slice(-10),
            eventTypes: events.reduce((acc: any, event: any) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {}),
            lastCleanup: Date.now()
        };
    }

    public enableSecureMode(): void {
        // Enable additional security measures
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('selectstart', (e) => e.preventDefault());
        document.addEventListener('dragstart', (e) => e.preventDefault());

        // Disable F12 and other dev tools shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J'))) {
                e.preventDefault();
                console.warn('AdaSure Pro: Developer tools access blocked');
            }
        });
    }
}

export default SecurityManager;