#version 300 es
precision mediump float;

layout(location = 0) in vec3 vertPosition;
layout(location = 1) in vec3 vertNormal;
out vec3 fragPos;
out vec3 fragNormal;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main() {
	fragPos = vertPosition;
	fragNormal = (transpose(inverse(view * model)) * vec4(vertNormal, 1.0)).xyz;
	gl_Position = projection * view * model * vec4(vertPosition, 1.0);
}