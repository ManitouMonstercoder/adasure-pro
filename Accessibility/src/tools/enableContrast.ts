import { injectToolCSS } from "@/utils/cssGenerator";
import { FILTERS } from "@/enum/Filters";

export default function enableContrast(contrast) {
    // Remove all existing contrast classes
    const contrastClasses = Object.keys(FILTERS).map(key => `asw-${key}`);
    contrastClasses.forEach(className => {
        document.documentElement.classList.remove(className);
        document.getElementById(`asw-${FILTERS[key.replace('asw-', '')]?.id}`)?.remove();
    });

    if (!contrast || !FILTERS[contrast]) {
        return;
    }

    const filter = FILTERS[contrast];

    // Apply the selected contrast filter
    injectToolCSS({
        ...filter,
        enable: true
    });

    // Add the corresponding class to html element
    document.documentElement.classList.add(`asw-${contrast}`);
}