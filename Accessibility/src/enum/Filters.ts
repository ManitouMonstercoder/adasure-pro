import { TEXT_SELECTORS } from "./Selectors";
import IToolConfig from "../types/IToolConfig";

export interface IFilters {
    [key: string]: IToolConfig
}

export const FILTERS: IFilters = {
    'dark-contrast': {
        id: 'dark-contrast',
        selector: 'html.asw-dark-contrast',
        styles: {
            'color': '#FFFFFF',
            'fill': '#FFFFFF',
            'background-color': '#000000'
        },
        childrenSelector: [...TEXT_SELECTORS, 'div', 'span', 'section', 'article', 'main', 'aside', 'header', 'footer']
    },
    'light-contrast': {
        id: 'light-contrast',
        selector: 'html.asw-light-contrast',
        styles: {
            'color': '#000000',
            'fill': '#000000',
            'background-color': '#FFFFFF'
        },
        childrenSelector: [...TEXT_SELECTORS, 'div', 'span', 'section', 'article', 'main', 'aside', 'header', 'footer']
    },
    'high-contrast': {
        id: 'high-contrast',
        selector: 'html.asw-high-contrast',
        styles: {
            'filter': 'contrast(125%)'
        },
        childrenSelector: ['body', '*']
    },
    'high-saturation': {
        id: 'high-saturation',
        selector: 'html.asw-high-saturation',
        styles: {
            'filter': 'saturate(200%)'
        },
        childrenSelector: ['body', '*']
    },
    'low-saturation': {
        id: 'low-saturation',
        selector: 'html.asw-low-saturation',
        styles: {
            'filter': 'saturate(50%)'
        },
        childrenSelector: ['body', '*']
    },
    'monochrome': {
        id: 'monochrome',
        selector: 'html.asw-monochrome',
        styles: {
            'filter': 'grayscale(100%)'
        },
        childrenSelector: ['body', '*']
    }
}

export default FILTERS