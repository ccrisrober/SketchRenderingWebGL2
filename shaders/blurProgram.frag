#version 300 es
precision highp float;
uniform sampler2D dataTexture;

out vec4 fragColor;
in vec2 texCoord;

void main() {
	const vec2 samples[12] = vec2[](
		vec2(-0.326212, -0.405805),
		vec2(-0.840144, -0.073580),
		vec2(-0.695914,  0.457137),
		vec2(-0.203345,  0.620716),
		vec2( 0.962340, -0.194983),
		vec2( 0.473434, -0.480026),
		vec2( 0.519456,  0.767022),
		vec2( 0.185461, -0.893124),
		vec2( 0.507431,  0.064425),
		vec2( 0.896420,  0.412458),
		vec2(-0.321940, -0.932615),
		vec2(-0.791559, -0.597705)
	);

	float sum = texture(dataTexture, texCoord).r;
	for (int i = 0; i < 12; i++){
		sum += texture(dataTexture, texCoord + 0.0025 * samples[i]).r;
	}

	fragColor = vec4(vec3(sum/13.0), 1.0);
}