export function hexToRGBNormalized(color: string): Float32Array {
    if (typeof color !== 'string') {
        throw new Error('Invalid input: HEX color must be a string.');
    }
    const hex = color.replace(/^#/, '');
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return new Float32Array([r, g, b]);
}
