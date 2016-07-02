#version 300 es
precision highp float;

in vec3 fragPos;
in vec3 fragNormal;

out vec4 fragColor;

void main() {
	fragColor = vec4(normalize(fragNormal) * 0.5 + vec3(0.5), 1.0);
}
