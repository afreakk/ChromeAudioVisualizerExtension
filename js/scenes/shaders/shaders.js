var shaders = {};

shaders.twoDVShader = [
"attribute vec2 position;",
"void main() {",
"	gl_Position = vec4( vec3(position, 0.0), 1.0 );",
"}"
].join("\n"),

shaders.threeDShader = [
"attribute vec3 position;",
"uniform mat4 projectionMatrix;",
"uniform mat4 worldMatrix;",
"uniform mat4 modelMatrix;",
"varying vec3 v_pos;",
"void main() {",
"	gl_Position = projectionMatrix*worldMatrix*modelMatrix*vec4( position, 1.0 );",
"}"
].join("\n"),

shaders.fShader = [
"uniform float time;",
"uniform vec2 resolution;",
"uniform vec3 colorInfluence;",
"void main( void ) {",
"	vec2 position = - 1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;",
"	float red = abs( sin( position.x * position.y + time * colorInfluence.r ) );",
"	float green = abs( sin( position.x * position.y + time * colorInfluence.g ) );",
"	float blue = abs( sin( position.x * position.y + time * colorInfluence.b ) );",
"	gl_FragColor = vec4( red, green, blue, 1.0 );",
"}"
].join("\n");

shaders.fShaderThreeD = [
"uniform float time;",
"uniform vec2 resolution;",
"uniform vec3 colorInfluence;",
"varying vec3 v_pos;",
"void main( void ) {",
"	float red = abs(	sin( abs(v_pos.x * v_pos.y *v_pos.z) + time * colorInfluence.r 	) );",
"	float green= abs(	sin( abs(v_pos.x * v_pos.y *v_pos.z) + time * colorInfluence.g	) );",
"	float blue = abs(	sin( abs(v_pos.x * v_pos.y *v_pos.z) + time * colorInfluence.b	) );",
"	gl_FragColor = vec4( red, green, blue, 1.0 );",
"}"
].join("\n");
