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
'	float red =  sin( position.x * position.y + low  ) ;',
'	float green =  sin( position.x * position.y + mid   );',
'	float blue =  sin( position.x * position.y + high   );',
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
 * used in: Box/World Scene */
shaders.threeDShader={};
shaders.threeDShader.vShader = [
'attribute vec3 position;',
'uniform mat4 projectionMatrix;',
'uniform mat4 worldMatrix;',
'uniform mat4 modelMatrix;',
'varying vec3 v_pos;',
'varying vec2 vTxCoord;',
'void main() {',
'	gl_Position = projectionMatrix*worldMatrix*modelMatrix*vec4( position, 1.0 );',
'	v_pos = position;',
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
	'position'
],
/* madnessShader - 
 * used in: MadnessScene */
shaders.madnessShader={};
shaders.madnessShader.vShader = [
'attribute vec2 position;',
'void main() {',
'	gl_Position = vec4( vec3(position, 0.0), 1.0 );',
'}'
].join('\n'),

shaders.madnessShader.fShader = [
'uniform float high;',
'uniform float low;',
'uniform float mid;',
'float lol=0.0;',
'uniform float madness;',
'uniform vec2 resolution;',
'void main( void ) {',
'	vec2 position = - 1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;',
'	float yq = (madness-position.y)*mid;',
'	float red = yq*abs( sin( (lol * high+position.y) * low*high));',
'	float green = yq*abs( sin( (position.x+lol) * mid*low  ) );',
'	float blue = yq*abs( sin( (position.y+lol) * high*mid  ) );',
'	gl_FragColor = vec4( red, green, blue, 1.0 );',
'	lol = lol +pow(low,high);',
'}'
].join('\n');

shaders.madnessShader.uniforms = [
	'high',
	'low',
	'mid',
	'resolution',
	'madness'
],
shaders.madnessShader.attributes = [
	'position'
];

/* dancingCubeShader - 
 * used in: dancingCubeScene */
shaders.dancingCubeShader={};
shaders.dancingCubeShader.vShader = [
'attribute vec4 position;',
'attribute vec3 vertexNormal;',
'uniform mat4 projectionMatrix;',
'uniform vec4 worldPos;',
'uniform mat4 modelViewMatrix;',
'uniform mat4 normalMatrix;',
'varying highp vec3 vLighting;',
'varying vec4 vPos;',
'void main() {',
'	vPos = vec4((position.xyz*worldPos.xyz), worldPos.w);',
'	gl_Position = projectionMatrix*modelViewMatrix*position;',

'   highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);',
'   highp vec3 directionalLightColor = vec3(1, 1, 1);',
'   highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));',
'   highp vec4 transformedNormal = normalMatrix * vec4(vertexNormal, 1.0);',
'   highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);',
'   vLighting = ambientLight + (directionalLightColor * directional);',
'}'
].join('\n'),
shaders.dancingCubeShader.fShader = [
'uniform vec3 colorInfluence;',
'uniform float cubeAlpha;',
'varying highp vec3 vLighting;',
'varying vec4 vPos;',
'void main( void ) {',
'	vec3 clr = vec3(colorInfluence.r*sin(vPos.x*0.01*vPos.w),colorInfluence.g*cos(vPos.y*0.01*vPos.w),colorInfluence.b*sin(vPos.z*0.01*vPos.w+0.34));',
'	gl_FragColor = vec4( vLighting*clr, vPos.w*cubeAlpha );',
'}'
].join('\n'),

shaders.dancingCubeShader.uniforms = [
	'cubeAlpha',
	'projectionMatrix',
	'modelViewMatrix',
	'normalMatrix',
	'colorInfluence',
	'worldPos'
],
shaders.dancingCubeShader.attributes = [
	'position',
	'vertexNormal',
];
/* xxx - 
 * used in: xxx */
shaders.xxx={};
shaders.xxx.vShader = [
'attribute vec4 position;',
'attribute vec3 vertexNormal;',
'uniform mat4 projectionMatrix;',
'uniform vec4 worldPos;',
'uniform vec4 space;',
'uniform mat4 modelViewMatrix;',
'uniform mat4 normalMatrix;',
'uniform float spaceZOffset;',
'varying highp vec3 vLighting;',
'varying vec4 vPos;',
'void main() {',
'	vec4 pp = projectionMatrix*modelViewMatrix*position;',
'	pp = vec4(sin(pp.x),cos(pp.y), sin(pp.z), (cos(pp.w)+spaceZOffset));',
'	pp = pp*space;',
'	gl_Position = pp;',
'	vPos = vec4((pp.xyz), worldPos.w);',

'   highp vec3 ambientLight = vec3(0.5, 0.5, 0.5);',
'   highp vec3 directionalLightColor = vec3(1, 1, 1);',
'   highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));',
'   highp vec4 transformedNormal = normalMatrix * vec4(vertexNormal, 1.0);',
'   highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);',
'   vLighting = ambientLight + (directionalLightColor * directional);',
'}'
].join('\n'),
shaders.xxx.fShader = [
'uniform vec3 colorInfluence;',
'uniform float cubeAlpha;',
'varying highp vec3 vLighting;',
'varying vec4 vPos;',
'void main( void ) {',
'	vec3 clr = vec3(colorInfluence.r*sin(vPos.x*0.01*vPos.w),colorInfluence.g*cos(vPos.y*0.01*vPos.w),colorInfluence.b*sin(vPos.z*0.01*vPos.w+0.34));',
'	gl_FragColor = vec4( vLighting*clr, vPos.w*cubeAlpha );',
'}'
].join('\n'),

shaders.xxx.uniforms = [
	'cubeAlpha',
	'projectionMatrix',
	'modelViewMatrix',
	'normalMatrix',
	'colorInfluence',
	'worldPos',
	'space',
	'spaceZOffset'
],
shaders.xxx.attributes = [
	'position',
	'vertexNormal',
];

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
	if(program[name] === -1) aError('couldnt get attribName:'+name+' from '+JSON.stringify(program, null, 4));
},
shaders.uLocSet=function(program, name)
{
	program[name] = gl.getUniformLocation(program, name);
};

