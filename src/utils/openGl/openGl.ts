
export function bindAudioDataToTexture(audioData: Uint8Array, gl: WebGLRenderingContext) {
    // Check if audioData is an ArrayBuffer
    let data = audioData;
    if (!ArrayBuffer.isView(data)) {
        data = new Uint8Array(data);
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, data.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
}
export function initTexture(gl: WebGLRenderingContext) {
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
}
function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (shader === null) {
        console.error('Unable to initialize the shader: shader is null');
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Check if the shader compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

export function initShaderProgram(gl: WebGLRenderingContext, vs: string, fs: string) {

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    if (shaderProgram === null) {
        console.error('Unable to initialize the shader program: shaderProgram is null');
        return null;
    }
    if (vertexShader === null) {
        console.error('Unable to initialize the shader program: vertexShader is null');
        return null;
    }
    if (fragmentShader === null) {
        console.error('Unable to initialize the shader program: fragmentShader is null');
        return null;
    }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Check if the program was linked successfully
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}
