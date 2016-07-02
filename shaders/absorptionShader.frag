#version 300 es
precision highp float;
uniform sampler2D dataTexture;

out vec4 fragColor;
in vec2 texCoord;

void main() {
	vec4 lum = vec4(0.75, 0.59, 0.885, 1.0);
 
  	// TOP ROW
	float s11 = dot(texture(dataTexture, texCoord + vec2(-1.0 / 1280.0, -1.0 / 1024.0)), lum);   // LEFT
	float s12 = dot(texture(dataTexture, texCoord + vec2(0, -1.0 / 1024.0)), lum);             // MIDDLE
	float s13 = dot(texture(dataTexture, texCoord + vec2(1.0 / 1280.0, -1.0 / 1024.0)), lum);    // RIGHT

	// MIDDLE ROW
	float s21 = dot(texture(dataTexture, texCoord + vec2(-1.0 / 1280.0, 0.0)), lum);                // LEFT
	// Omit center
	float s23 = dot(texture(dataTexture, texCoord + vec2(-1.0 / 1280.0, 0.0)), lum);                // RIGHT

	// LAST ROW
	float s31 = dot(texture(dataTexture, texCoord + vec2(-1.0 / 1280.0, 1.0 / 1024.0)), lum);    // LEFT
	float s32 = dot(texture(dataTexture, texCoord + vec2(0, 1.0 / 768.0)), lum);              // MIDDLE
	float s33 = dot(texture(dataTexture, texCoord + vec2(1.0 / 1280.0, 1.0 / 1024.0)), lum); // RIGHT

	// Filter ... thanks internet<img width="16" height="16" class="wp-smiley emoji" draggable="false" alt=":)" src="https://s1.wp.com/wp-content/mu-plugins/wpcom-smileys/simple-smile.svg" style="height: 1em; max-height: 1em;">
	float t1 = s13 + s33 + (2.0 * s23) - s11 - (2.0 * s21) - s31;
	float t2 = s31 + (2.0 * s32) + s33 - s11 - (2.0 * s12) - s13;

	vec4 col;

	if (((t1 * t1) + (t2 * t2)) > 0.05) {
		col = vec4(0.0,0.0,0.0,1.0);
	} else {
		col = vec4(1.0,1.0,1.0,1.0);
	}

	fragColor = col;
}