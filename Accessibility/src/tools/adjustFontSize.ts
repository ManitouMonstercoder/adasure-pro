import {
    ICON_SELECTOR
} from '@/enum/Selectors';

const FONT_SIZE_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,a,dl,dt,li,ol,th,td,span,blockquote,label,button,input,textarea,select,.asw-text';
const ICON_SELECTOR_SET = new Set(ICON_SELECTOR);
const EXCLUDED_SELECTORS = ['.asw-menu', '.asw-widget', '.asw-btn', '.asw-menu-btn'];

export default function adjustFontSize(multiply: number = 1) {
    document
        .querySelectorAll(FONT_SIZE_SELECTOR)
        .forEach((el: HTMLElement) => {
            // Skip elements that contain any class in ICON_SELECTOR_SET
            if ([...el.classList].some(cls => ICON_SELECTOR_SET.has(cls))) {
                return;
            }

            // Skip our widget elements
            if (EXCLUDED_SELECTORS.some(selector => el.closest(selector))) {
                return;
            }

            // Skip if element is invisible or has no content
            if (el.offsetParent === null || el.textContent?.trim() === '') {
                return;
            }

            // Get the original font size
            let orgFontSize = Number(el.dataset.aswOrgFontSize);

            if (!orgFontSize) {
                const computedStyle = window.getComputedStyle(el);
                orgFontSize = parseFloat(computedStyle.fontSize);
                el.dataset.aswOrgFontSize = String(orgFontSize);
            }

            // Calculate and apply new font size with bounds checking
            const newFontSize = Math.max(8, Math.min(72, orgFontSize * multiply));
            el.style.setProperty('font-size', `${newFontSize}px`, 'important');
        });

    // Store the current multiplier for potential reset
    document.documentElement.dataset.aswFontMultiplier = String(multiply);
}