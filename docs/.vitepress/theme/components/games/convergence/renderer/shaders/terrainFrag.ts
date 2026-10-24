export const terrainFragmentShader = `
  uniform vec3 uBaseColor;
  uniform vec3 uLineColor;
  uniform float uGridSize;
  uniform float uLineWidth;
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  float gridMask(vec2 coord, float width) {
    vec2 cell = fract(coord);
    float distX = min(cell.x, 1.0 - cell.x);
    float distY = min(cell.y, 1.0 - cell.y);
    float edge = min(distX, distY);
    return smoothstep(width, 0.0, edge);
  }

  void main() {
    vec2 gridCoord = (vWorldPosition.xz + vec2(uGridSize * 0.5)) / 1.0;
    float lines = gridMask(gridCoord, uLineWidth);
    float shimmer = 0.04 * sin((vWorldPosition.x + vWorldPosition.z) * 0.25 + uTime * 0.5);
    vec3 color = mix(uBaseColor, uLineColor, lines) + shimmer;
    gl_FragColor = vec4(color, 1.0);
  }
`;
