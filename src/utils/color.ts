export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 0, g: 0, b: 0 };
}

export function hslToCssString(h: number, s: number, l: number): string {
    h = h % 360;
    if (h < 0) h += 360;
    return `hsl(${h}, ${s * 100}%, ${l * 100}%)`;
}
