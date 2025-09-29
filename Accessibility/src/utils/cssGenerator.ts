import IToolConfig from "../types/IToolConfig";
import addStylesheet from "./addStylesheet";

const browserPrefixes = ['-o-', '-ms-', '-moz-', '-webkit-', ''];
const propertiesNeedPrefix = ["filter"];

export function generateCSS(styles: object): string {
    let css = "";

    if(styles) {
        for(let key in styles) {
            let prefixes = propertiesNeedPrefix.includes(key) ? browserPrefixes : [""];
            prefixes.forEach((prefix: string) => {
                css += `${prefix}${key}: ${styles[key]} !important; `;
            })
        }
    }

    return css.trim();
}

export interface IWrapCSSToSelectorArgs {
    selector: string,
    childrenSelector: string[]
    css: string
}

export function wrapCSSToSelector({
    selector,
    childrenSelector = [""],
    css
}: IWrapCSSToSelectorArgs): string {
    let output = "";

    childrenSelector.forEach(childSelector => {
        const fullSelector = childSelector ? `${selector} ${childSelector}` : selector;
        output += `${fullSelector} { ${css} } `;
    })

    return output.trim();
}

export function generateCSSFromConfig(config: IToolConfig): string {
    let output = "";

    if (config) {
        const generatedCSS = generateCSS(config.styles);

        if (generatedCSS && config.selector) {
            output += wrapCSSToSelector({
                selector: config.selector,
                childrenSelector: config.childrenSelector || [""],
                css: generatedCSS
            });
        } else if (generatedCSS) {
            output += generatedCSS;
        }

        // Append any additional CSS
        if (config.css) {
            output += " " + config.css;
        }
    }

    return output.trim();
}

export function injectToolCSS(config: IToolConfig) {
    let {
        id="",
        enable=false
    } = config;

    let toolId = `asw-${ id }`

    if(enable) {
        let css = generateCSSFromConfig(config);

        addStylesheet({
            css, 
            id: toolId
        });
    } else {
        document.getElementById(toolId)?.remove();
    }

    document.documentElement.classList.toggle(toolId, enable);
}