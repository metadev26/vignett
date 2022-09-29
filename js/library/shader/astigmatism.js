/**
 * Sepia tone shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */
 import {
	Vector2
} from '../three.js/build/three.module.js';
 const Astigmatism = {
    
	uniforms: {

		'tDiffuse': { value: null },
    'angle' :{ value: 120},
    'aspect' :{ value: 0.0},

	},
	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`
        #define PI 3.14159265
        #define Degree /180.*PI
        #define ratio 0.5
        uniform float aspect;
        uniform float angle;
		    uniform sampler2D tDiffuse;

        varying vec2 vUv;

      float fishEyeCorrection (float fov, vec2 uv) {
          float x = uv.x;
          float y = uv.y;
          float z = 1.0/tan(fov * ratio);


          float xy_len = length(uv);//sqrt(x*x+y*y);

          //float a = atan(x, y);
          float b = atan(xy_len, z);
          float k = 2.0*b/(xy_len*fov);

          return k;
      }

		void main() {
          
      float fov = angle Degree;
    
      vec2 uv = vUv*2.0 - 1.0;
    
      // float aspect = resolution.x/resolution.y;
      uv.y /= 1.0;
      
      float k = fishEyeCorrection (fov, uv); 
      vec2 new_uv;
      
      
           new_uv = vec2(uv.x/k, uv.y); //more fisheye
  
      vec3 col = texture2D(tDiffuse, (new_uv+1.0) / 2.0).rgb;
  
      // Output to screen
      gl_FragColor = vec4(col,1.0);

		}`

};

export { Astigmatism };
