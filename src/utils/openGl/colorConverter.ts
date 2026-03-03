export function hexToRGBNormalized(color: string | number): Float32Array {
    // dat.gui can return color values as numbers (e.g. 0xff0000)
    if (typeof color === 'number') {
        const r = ((color >> 16) & 0xff) / 255;
        const g = ((color >> 8) & 0xff) / 255;
        const b = (color & 0xff) / 255;
        return new Float32Array([r, g, b]);
    }
    if (typeof color !== 'string') {
        return new Float32Array([0, 0, 0]);
    }
    const hex = color.replace(/^#/, '');
    if (hex.length !== 6) {
        return new Float32Array([0, 0, 0]);
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return new Float32Array([r, g, b]);
}
