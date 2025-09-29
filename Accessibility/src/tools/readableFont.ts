import { injectToolCSS } from "../utils/cssGenerator";
import IToolConfig from "../types/IToolConfig";
import { ALL_ELEMENT_SELECTORS, TEXT_SELECTORS } from "../enum/Selectors";

export const readableFontConfig: IToolConfig = {
    id: "readable-font",
    selector: `html.asw-readable-font`,
    childrenSelector: [...ALL_ELEMENT_SELECTORS, ...TEXT_SELECTORS],
    styles: {
        'font-family': 'OpenDyslexic, Atkinson Hyperlegible, Comic Sans MS, Verdana, Arial, sans-serif'
    },
    css: `
        @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        @font-face {
            font-family: 'OpenDyslexic';
            src: url('data:font/woff2;base64,d09GMgABAAAAAFRMAA4AAAAA...') format('woff2');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }

        html.asw-readable-font {
            --font-weight-normal: 400;
            --font-weight-bold: 700;
            --letter-spacing: 0.05em;
            --line-height: 1.6;
        }

        html.asw-readable-font * {
            letter-spacing: var(--letter-spacing) !important;
            line-height: var(--line-height) !important;
        }
    `
}

export default function readableFont(enable=false) {
    injectToolCSS({
        ...readableFontConfig,
        enable
    });

    // Manage the HTML class for proper CSS targeting
    if (enable) {
        document.documentElement.classList.add('asw-readable-font');
    } else {
        document.documentElement.classList.remove('asw-readable-font');
    }
}