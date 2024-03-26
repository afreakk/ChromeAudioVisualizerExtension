const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = 'fixed';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.zIndex = '1000';
canvas.style.pointerEvents = 'none';
document.body.insertBefore(canvas, document.body.firstChild);

function bindAudioTexture(audioData) {
  // Check if audioData is an ArrayBuffer
  if (!ArrayBuffer.isView(audioData)) {
    audioData = new Uint8Array(audioData);
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, audioData.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, audioData);
}
function initTexture(gl) {
  let tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Check if the shader compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

// Function to initialize and link the shader program
function initShaderProgram(gl, vs, fs) {

  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Check if the program was linked successfully
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}
const gl = canvas.getContext('webgl');

function initSunFlowerScene(gl) {
  const vs = `
    attribute vec4 vertexPosition;
    void main() {
        gl_Position = vertexPosition;
    }
    `;

  const fs = `
    precision mediump float;
    uniform vec2 resolution;
    uniform float time;
    uniform sampler2D audioTexture;

    // Parameters
    const float radius = 0.2;
    const float barHeight = 0.9;
    const float PI = 3.141592653589793;
    float random(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    const vec3 innerColor = vec3(1.0, 1.0, 0.0);
    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 uv = fragCoord.xy / resolution.xy;

      // Center the coordinates
      vec2 centeredUV = uv * 2.0 - 1.0;
      centeredUV.x *= resolution.x / resolution.y;

      // Flip the Y axis to create symmetry
      if (centeredUV.x >= 0.0)
      {
        centeredUV.y = -centeredUV.y;
      }

      // Noice
      float noise = random(uv + time);

      // Convert UV to polar coordinates
      float angle = atan(centeredUV.x, centeredUV.y);
      if(angle < 0.0) angle += 1.0 * PI;

      float dist = length(centeredUV);
      float index = angle / (1.0 * PI);
      float audioValue = texture2D(audioTexture, vec2(index, 0.0)).x;
      if (audioValue < 0.01)
      {
        audioValue = 0.01 + sin(noise) * 0.01;
      }


      float dynamicMidRadius = radius + audioValue * barHeight * 0.5;
      float dynamicOuterRadius = radius + audioValue * barHeight;
      vec3 outerColor = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.0, 0.6), smoothstep(radius, dynamicOuterRadius, dist));;
      vec3 color = mix(innerColor, outerColor, smoothstep(radius, dynamicMidRadius, dist));
      color *= 1.0 - smoothstep(dynamicMidRadius, dynamicOuterRadius, dist);

      gl_FragColor = vec4(color, 1.0); // Color based on intensit
    }
  `;

  // Vertex data for a square
  const vertices = new Float32Array([
    -1.0, 1.0,
    -1.0, -1.0,
    1.0, 1.0,
    1.0, -1.0,
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let audioTexture = initTexture(gl);

  const shaderProgram = initShaderProgram(gl, vs, fs);

  gl.useProgram(shaderProgram);


  const audioTextureUniformLocation = gl.getUniformLocation(shaderProgram, 'audioTexture');
  const position = gl.getAttribLocation(shaderProgram, 'vertexPosition');
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);
  const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, 'resolution');
  const timeUniformLocation = gl.getUniformLocation(shaderProgram, "time");
  return [audioTexture, audioTextureUniformLocation, resolutionUniformLocation, timeUniformLocation];
}


function renderSunFlowerScene({ gl, audioData, audioTexture, audioTextureUniformLocation, resolutionUniformLocation, timeUniformLocation }) {

  // Update audio texture
  bindAudioTexture(audioData);
  // Update canvas size
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  // Updated time
  const timeInSeconds = performance.now() / 1000.0;
  gl.uniform1f(timeUniformLocation, timeInSeconds);

  // Bind texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, audioTexture);
  gl.uniform1i(audioTextureUniformLocation, 0);

  // Draw the quad
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};
function initSynthBarsScene(gl) {
  const vs = `
    attribute vec4 vertexPosition;
    void main() {
        gl_Position = vertexPosition;
    }
    `;

  const fs = `
    precision mediump float;
    uniform vec2 resolution;
    uniform float time;
    uniform sampler2D audioTexture;

    const float segs = 40.0;
    float random(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec2 uv = fragCoord / resolution;

      float bands = segs * resolution.x / resolution.y * 0.5;
      vec2 p;
      p.x = floor(uv.x * bands) / bands;
      p.y = floor(uv.y * segs) / segs;

      float fft = texture2D(audioTexture, vec2(p.x, 0.0)).x;

      // color
      vec3 color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 1.0), sqrt(uv.y));

      // mask for bar graph
      float mask = (p.y < fft) ? 1.0 : 0.1;

      // led shape
      vec2 d = fract((uv - p) * vec2(bands, segs)) - 0.5;
      float led = smoothstep(0.5, 0.35, abs(d.x)) * smoothstep(0.5, 0.35, abs(d.y));
      vec3 ledColor = led*color*mask;

      // Horizontal line
      float lineSpeed = 0.2;
      float lineThickness = 0.005;
      float linePosition = mod(time * lineSpeed, 1.0);    
      float distanceFromLine = abs(uv.y - linePosition);
      if(distanceFromLine < lineThickness) {
        ledColor += 0.1;
      }

      // White noice for
      float noise = random(uv + time);
      ledColor += noise * 0.06;

      gl_FragColor = vec4(ledColor, 1.0);
    }
    `;

  // Vertex data for a square
  const vertices = new Float32Array([
    -1.0, 1.0,
    -1.0, -1.0,
    1.0, 1.0,
    1.0, -1.0,
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let audioTexture = initTexture(gl);

  const shaderProgram = initShaderProgram(gl, vs, fs);

  gl.useProgram(shaderProgram);


  const audioTextureUniformLocation = gl.getUniformLocation(shaderProgram, 'audioTexture');
  const position = gl.getAttribLocation(shaderProgram, 'vertexPosition');
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);
  const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, 'resolution');
  const timeUniformLocation = gl.getUniformLocation(shaderProgram, "time");
  return [audioTexture, audioTextureUniformLocation, resolutionUniformLocation, timeUniformLocation];
}


function renderSynthBarsScene({ gl, audioData, audioTexture, audioTextureUniformLocation, resolutionUniformLocation, timeUniformLocation }) {

  // Update audio texture
  bindAudioTexture(audioData);
  // Update canvas size
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  // Updated time
  const timeInSeconds = performance.now() / 1000.0;
  gl.uniform1f(timeUniformLocation, timeInSeconds);

  // Bind texture
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, audioTexture);
  gl.uniform1i(audioTextureUniformLocation, 0);

  // Draw the quad
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};


let renderScene = false;
let audioData = new Uint8Array(100);
// const [audioTexture, audioTextureUniformLocation, resolutionUniformLocation, timeUniformLocation] = initSynthBarsScene(gl);
const [audioTexture, audioTextureUniformLocation, resolutionUniformLocation, timeUniformLocation] = initSunFlowerScene(gl);

// Event handlers
function startRenderingEventHandler(message) {
  if (message.target = 'content' && message.action === 'start-rendering') {
    // Intiate scene
    if (!renderScene) {
      canvas.style.pointerEvents = 'auto';
      renderScene = true;
    }
    // Update audio data
    audioData = message.data;
  }
}
function stopRenderingEventHandler(message) {
  if (message.target = 'content' && message.action === 'stop-rendering') {
    renderScene = false;
    gl.clear(gl.COLOR_BUFFER_BIT);
    canvas.style.pointerEvents = 'none';
  }
}

// Event listeners
chrome.runtime.onMessage.addListener(async (message) => {
  startRenderingEventHandler(message);
});
chrome.runtime.onMessage.addListener(async (message) => {
  stopRenderingEventHandler(message);
});


function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (renderScene) {
    // renderSynthBarsScene({ gl, audioData, audioTexture, audioTextureUniformLocation, resolutionUniformLocation, timeUniformLocation });
    renderSunFlowerScene({ gl, audioData, audioTexture, audioTextureUniformLocation, resolutionUniformLocation, timeUniformLocation });
  }
  requestAnimationFrame(render);
};
render();
