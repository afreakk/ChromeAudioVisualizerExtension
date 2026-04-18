declare module 'butterchurn' {
    const butterchurn: {
        createVisualizer(
            audioContext: AudioContext | null,
            canvas: HTMLCanvasElement,
            options?: {
                width?: number;
                height?: number;
                mesh_width?: number;
                mesh_height?: number;
                pixelRatio?: number;
                textureRatio?: number;
            },
        ): {
            loadPreset(preset: unknown, blendTime: number): void;
            setRendererSize(width: number, height: number): void;
            render(opts: {
                elapsedTime: number;
                audioLevels: {
                    timeByteArray: Uint8Array;
                    timeByteArrayL: Uint8Array;
                    timeByteArrayR: Uint8Array;
                };
                width: number;
            }): void;
        };
    };
    export default butterchurn;
}

declare module 'butterchurn-presets' {
    const butterchurnPresets: {
        getPresets(): Record<string, unknown>;
    };
    export default butterchurnPresets;
}

declare module 'dat.gui' {
    export class GUI {
        constructor(opts?: { autoPlace?: boolean; width?: number });
        add(
            target: object,
            propName: string,
            min?: number | string[] | Record<string, unknown>,
            max?: number,
            step?: number,
        ): GUIController;
        addColor(target: object, propName: string): GUIController;
        addFolder(name: string): GUI;
        removeFolder(folder: GUI): void;
        open(): void;
        close(): void;
        destroy(): void;
        domElement: HTMLElement;
    }

    export type GUIFolder = GUI;

    export class GUIController {
        onChange(fn: (value: unknown) => void): GUIController;
        onFinishChange(fn: (value: unknown) => void): GUIController;
        setValue(value: unknown): GUIController;
        getValue(): unknown;
        name(name: string): GUIController;
        listen(): GUIController;
        remove(): GUIController;
        min(min: number): GUIController;
        max(max: number): GUIController;
        step(step: number): GUIController;
        domElement: HTMLElement;
    }
}

declare module 'gl-matrix/mat4' {
    type Mat4 = Float32Array;
    export function create(): Mat4;
    export function clone(a: Mat4): Mat4;
    export function copy(out: Mat4, a: Mat4): Mat4;
    export function identity(out: Mat4): Mat4;
    export function transpose(out: Mat4, a: Mat4): Mat4;
    export function invert(out: Mat4, a: Mat4): Mat4 | null;
    export function multiply(out: Mat4, a: Mat4, b: Mat4): Mat4;
    export function translate(out: Mat4, a: Mat4, v: Float32Array | number[]): Mat4;
    export function scale(out: Mat4, a: Mat4, v: Float32Array | number[]): Mat4;
    export function rotate(out: Mat4, a: Mat4, rad: number, axis: Float32Array | number[]): Mat4;
    export function rotateX(out: Mat4, a: Mat4, rad: number): Mat4;
    export function rotateY(out: Mat4, a: Mat4, rad: number): Mat4;
    export function rotateZ(out: Mat4, a: Mat4, rad: number): Mat4;
    export function fromTranslation(out: Mat4, v: Float32Array | number[]): Mat4;
    export function fromRotation(out: Mat4, rad: number, axis: Float32Array | number[]): Mat4;
    export function fromScaling(out: Mat4, v: Float32Array | number[]): Mat4;
    export function perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4;
    export function ortho(
        out: Mat4,
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Mat4;
    export function lookAt(
        out: Mat4,
        eye: Float32Array | number[],
        center: Float32Array | number[],
        up: Float32Array | number[],
    ): Mat4;
}

declare module 'gl-matrix/vec3' {
    type Vec3 = Float32Array;
    export function create(): Vec3;
    export function clone(a: Vec3): Vec3;
    export function fromValues(x: number, y: number, z: number): Vec3;
    export function copy(out: Vec3, a: Vec3): Vec3;
    export function set(out: Vec3, x: number, y: number, z: number): Vec3;
    export function add(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function subtract(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function multiply(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function scale(out: Vec3, a: Vec3, b: number): Vec3;
    export function normalize(out: Vec3, a: Vec3): Vec3;
    export function dot(a: Vec3, b: Vec3): number;
    export function cross(out: Vec3, a: Vec3, b: Vec3): Vec3;
    export function length(a: Vec3): number;
    export function transformMat4(out: Vec3, a: Vec3, m: Float32Array): Vec3;
}

// Type aliases for gl-matrix namespace imports used as types
type mat4 = Float32Array;
type vec3 = Float32Array;
