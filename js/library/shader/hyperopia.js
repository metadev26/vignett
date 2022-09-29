/**
 * Sepia tone shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */ 
import {
	Vector2
} from '../three.js/build/three.module.js';

 const Hyperopia = {

	uniforms: {

		'tDiffuse': { value: null },
		'sizing' : {value: 0.6},
		'density' : {value: 0.5},
		'smoothObjectPadding' : {value: 0.33},
		'iResolution' : {value : new Vector2( 1600, 900)}
	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;
		uniform float sizing;
		uniform float density;
		uniform float edge;
		uniform float smoothObjectPadding;
		uniform vec2 iResolution;
		varying vec2 vUv ;
		float mouseSize = 2.0;
		
     	vec2 uv;
		
		 
		lowp vec4 blur(in sampler2D tex, in highp vec2 uv, in highp vec2 resolution)
		{
			highp vec2 r = 1.0 / resolution;
			
			const lowp float off = 5.0;
			const lowp float v = off * 2.0 + 1.0;
			const lowp float d = 1.0 / (v * v);
		
			lowp vec4 color = vec4(0.0);
			for (float x = -off; x <= off; x++)
			{
				for (float y = -off; y <= off; y++)
				{
					highp vec2 coord = vec2(uv.x + x * r.x, uv.y + y * r.y);
					color += texture2D(tex, coord) * d;
				}
			}
				
			return color;
		}
		
		void main() {
			mouseSize = mouseSize * sizing;

			uv = vUv;
			
			vec3 col = texture2D(tDiffuse, uv).rgb;
			float x = 768.0;
			float den = 1.0/density;
			float xTime = 768.0 * den; 
			lowp vec4 blurColor= blur(tDiffuse, uv, vec2(xTime,x));
		
			float aspectRatio = 1.5;
			vec2 objectCenter =vec2 (0.5, 1.0);
		
			vec2 v = uv - objectCenter;
			float size = mouseSize / 2.0;
			float smoothSize = size * smoothObjectPadding;
			float circleMix = smoothstep( size,size - smoothSize, length(v));
			blurColor.rgb = mix(blurColor.rgb, col.rgb, circleMix);
		
			gl_FragColor = vec4(blurColor.rgb, 1.0);
		
		}`

};

export { Hyperopia };
