/**
 * Sepia tone shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */
 import {
	Vector2
} from '../three.js/build/three.module.js';

 const SepiaShader = {
    
	uniforms: {

		'tDiffuse': { value: null },
		'amount': { value: 0.01 },

	},
	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`
    
        uniform float amount;
    
		uniform sampler2D tDiffuse;
        varying vec2 vUv;


        #define boxradius 0.9
        #define boxdarkness 0.75
        #define desat amount
        #define black vec3(0.0,0.0,0.0)
        #define sepia vec3(1.2, 1.0, 0.8)
        
        #define halfsies

        float blur = 8.0; // blur strength
        float size = 1.5; // radius size factor
        vec2 position  = vec2(0.5,.3);

		void main() {

            // vec2 uv = gl_FragCoord.xy / resolution.xy;
            // uv goes from 0 to 1
            
            vec4 ch0 = texture2D(tDiffuse,vUv);
            
            
            gl_FragColor = ch0 * 1.005;
            float lum = (gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) /2.9;
            gl_FragColor.rgb = gl_FragColor.rgb * (1.0 - desat) + sepia * vec3(lum,lum,lum) * desat;
            

            // float grey = dot(ch0.rgb, vec3(0.299, 0.587, 0.114));
    
            // vec3 sepiaColour = vec3(grey) * vec3(1.2, 1.0, 0.8);
            
            // ch0.rgb = mix(ch0.rgb, vec3(sepiaColour), 0.15);
            // gl_FragColor = ch0;
		}`

};

export { SepiaShader };
