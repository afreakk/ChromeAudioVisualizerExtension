export interface FrequencyBands {
    bass: number;
    mid: number;
    high: number;
}

const BASS_END = 0.15;
const MID_END = 0.5;

export function getFrequencyBands(audioData: number[], sensitivity: number = 1.0): FrequencyBands {
    const len = audioData.length;
    if (len === 0) return { bass: 0, mid: 0, high: 0 };
    const bassEnd = Math.floor(len * BASS_END);
    const midEnd = Math.floor(len * MID_END);
    let bassSum = 0, midSum = 0, highSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += audioData[i] || 0;
    for (let i = bassEnd; i < midEnd; i++) midSum += audioData[i] || 0;
    for (let i = midEnd; i < len; i++) highSum += audioData[i] || 0;
    return {
        bass: (bassSum / bassEnd / 255) * sensitivity,
        mid: (midSum / (midEnd - bassEnd) / 255) * sensitivity,
        high: (highSum / (len - midEnd) / 255) * sensitivity,
    };
}
