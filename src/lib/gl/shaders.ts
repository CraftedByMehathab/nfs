// One oversized triangle covering the viewport; v_uv is the image coordinate
// with the origin at the top-left, matching the corner editor.
export const VERTEX_SHADER = `#version 300 es
out vec2 v_uv;

void main() {
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = vec2(corner.x, 1.0 - corner.y);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

// Both textures are sRGB, so sampling returns linear light; the result is
// encoded back to sRGB on output.
export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_photo;
uniform sampler2D u_floor;
uniform sampler2D u_mask;
uniform mat3 u_imageToPlane;
uniform vec2 u_tiles;
uniform float u_opacity;

in vec2 v_uv;
out vec4 outColor;

vec3 toSrgb(vec3 linear) {
  vec3 low = linear * 12.92;
  vec3 high = 1.055 * pow(linear, vec3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(0.0031308, linear));
}

void main() {
  vec3 photo = texture(u_photo, v_uv).rgb;

  // Map this pixel onto the floor plane, where the perspective corners are the
  // unit square. The texture repeats, so the floor can extend beyond them.
  vec3 plane = u_imageToPlane * vec3(v_uv, 1.0);
  vec2 st = plane.xy / plane.z;
  vec3 floorColor = texture(u_floor, st * u_tiles).rgb;

  // The mask is white where the floor finish is shown, with a soft edge.
  float coverage = texture(u_mask, v_uv).r;
  // Pixels at or beyond the plane's horizon are never floor.
  if (plane.z <= 0.0) coverage = 0.0;

  outColor = vec4(toSrgb(mix(photo, floorColor, coverage * u_opacity)), 1.0);
}
`;
