/**
 * Two pass Gaussian blur filter (horizontal and vertical blur shaders)
 * - described in http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
 *   and used in http://www.cake23.de/traveling-wavefronts-lit-up.html
 *
 * - 9 samples per pass
 * - standard deviation 2.7
 * - "h" and "v" parameters should be set to "1 / width" and "1 / height"
 */

var Strabismus = {

  uniforms: {

    'tDiffuse': { value: null },
    'h': { value: 0.5 }

  },

  vertexShader: /* glsl */`

    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

  fragmentShader: /* glsl */`

    uniform sampler2D tDiffuse;
    uniform float h;

    varying vec2 vUv;

    void main() {

      vec4 sum = vec4( 0.0 );

      sum += texture2D( tDiffuse, vec2( vUv.x + 0.01 * h, vUv.y ) ) * 0.5;
      sum += texture2D( tDiffuse, vec2( vUv.x - 0.01 * h, vUv.y ) ) * 0.5;

      gl_FragColor = sum;

    }`

};

export { Strabismus };
