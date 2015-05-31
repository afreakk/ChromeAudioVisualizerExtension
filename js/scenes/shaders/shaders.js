var shaders = {};
/* Shader data models. 
 * required for new shader data model
 * shader.{name}
 * shader.{name}.vShader - string - vertex shader
 * shader.{name}.fShader - string - fragment shader
 * shader.{name}.uniforms - string[] - uniform variables
 * shader.{name}.attributes - string[] - attribute variables */

/* twoDShader - 
 * used in: SinusColorMix */
shaders.twoDShader={};
shaders.twoDShader.vShader = [
'attribute vec2 position;',
'void main() {',
'	gl_Position = vec4( vec3(position, 0.0), 1.0 );',
'}'
].join('\n'),

shaders.twoDShader.fShader = [
'uniform float high;',
'uniform float low;',
'uniform float mid;',
'uniform vec2 resolution;',
'void main( void ) {',
'	vec2 position = - 1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;',
'	float red = abs( sin( position.x * position.y + low  ) );',
'	float green = abs( sin( position.x * position.y + mid  ) );',
'	float blue = abs( sin( position.x * position.y + high  ) );',
'	gl_FragColor = vec4( red, green, blue, 1.0 );',
'}'
].join('\n');

shaders.twoDShader.uniforms = [
	'high',
	'low',
	'mid',
	'resolution'
],
shaders.twoDShader.attributes = [
	'position'
];

/* threeDShader - 
 * used in: */
shaders.threeDShader={};
shaders.threeDShader.vShader = [
'attribute vec3 position;',
'attribute vec2 aTxCoords;',
'uniform mat4 projectionMatrix;',
'uniform mat4 worldMatrix;',
'uniform mat4 modelMatrix;',
'varying vec3 v_pos;',
'varying vec2 vTxCoord;',
'void main() {',
'	gl_Position = projectionMatrix*worldMatrix*modelMatrix*vec4( position, 1.0 );',
'	v_pos = position;',
'	vTxCoord = aTxCoords;',
'}'
].join('\n'),
shaders.threeDShader.fShader = [
'uniform float time;',
'uniform vec2 resolution;',
'uniform vec3 colorInfluence;',
'uniform sampler2D uSampler;',
'varying vec3 v_pos;',
'varying vec2 vTxCoord;',
'void main( void ) {',
'	vec4 texture = texture2D(uSampler, vec2(vTxCoord.s, vTxCoord.t));',
'	float red = abs(	sin( abs(v_pos.x * v_pos.y *v_pos.z) + time * colorInfluence.r 	) );',
'	float green= abs(	sin( abs(v_pos.x * v_pos.y *v_pos.z) + time * colorInfluence.g	) );',
'	float blue = abs(	sin( abs(v_pos.x * v_pos.y *v_pos.z) + time * colorInfluence.b	) );',
'	gl_FragColor = vec4( red, green, blue, 1.0 )+texture;',
'}'
].join('\n'),

shaders.threeDShader.uniforms = [
	'projectionMatrix',
	'worldMatrix',
	'modelMatrix',
	'time',
	'resolution',
	'colorInfluence'
],
shaders.threeDShader.attributes = [
	'position',
	'aTxCoords'
],
shaders.setUniforms = function(program, uniforms)
{
	for(uniform of uniforms)
		shaders.uLocSet(program, uniform);
},
shaders.setAttributes = function(program, attributes)
{
	for(var attribute of attributes)
		shaders.aLocSet(program, attribute);
},
shaders.aLocSet=function(program, name)
{
	program[name] = gl.getAttribLocation(program, name);
},
shaders.uLocSet=function(program, name)
{
	program[name] = gl.getUniformLocation(program, name);
};
