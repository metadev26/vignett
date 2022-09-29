/**
 * Sepia tone shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */


 const AMDwet = {
    
	uniforms: {

		'tDiffuse': { value: null },
		'strength': { value: 0.1 },
		'size': { value: 0.5 },
		'laxis': { value: 0.5 },
		'saxis': { value: 0.5 },
		'time': { value: 0.5 },
		'severity': { value: 0.6 },
		'big': { value: 0.35 },

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
        uniform float strength;
        uniform float size;
        uniform float laxis;
        uniform float time;
        uniform float saxis;
        uniform float severity;
        uniform float big;
        varying vec2 vUv;
        #define PI 3.14159
        float blur = 8.0; // blur strength
        vec2 position  = vec2(0.5,.3);

        //2D NOISE cheap value noise
        //returns 0 - 1

        float random2d(vec2 n) { 
            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        //returns 1 for inside circ, 0 for outside
        float circle(in vec2 _st, in vec2 pos, in float _radius){   
            vec2 dist = _st - pos;    
            return 1. - smoothstep(_radius, _radius + 0.3, dot(dist,dist)*4.0);//control second parm to fade border
        }
        

        float noise2d(vec2 p){
            vec2 ip = floor(p);
            vec2 u = fract(p);
            u = u*u*(3.0-2.0*u);

            float res = mix(
                mix(random2d(ip),random2d(ip+vec2(1.0,0.0)),u.x),
                mix(random2d(ip+vec2(0.0,1.0)),random2d(ip+vec2(1.0,1.0)),u.x),u.y);
            return res*res;
        }



		void main() {

            float effectRadius = size;
            float effectAngle = strength * PI ;
            
            vec2 center = vec2(0.5,0.5);
            center = center == vec2(0., 0.) ? vec2(.5, .5) : center;
            
            vec2 uv = vUv - center;
            
            float len = length(uv * vec2(1./laxis, 1./saxis));//vec2(radius of horizental, vertical radius)
            float angle = atan(uv.y, uv.x) + effectAngle * smoothstep(effectRadius, 0., len);
            float radius = length(uv);
        
            gl_FragColor = texture2D(tDiffuse, vec2(radius * cos(angle), radius * sin(angle)) + center);
         

            // Normalized pixel coordinates (from 0 to 1)
           
           
            //define greyscale colors
            vec3 bgCol = vec3(0.0);
            vec3 circCol = vec3(0.0);
            vec2 uv1 = vUv;
            //warp uv space to make the circle warp based on uv coord and time
            vec2 warpUv = uv1 + noise2d(uv1 * 10. + time) * 0.1;
            
            //draw circle in center with 0.4 radius using the warped uv space
            float circ = circle(warpUv,vec2(0.5),0.35); 

            vec3 col = mix(bgCol,circCol,circ);
            
            //add grain
            //modulate hi-res noise for grain with a low res noise for the gradients
            float grain = noise2d(uv1 * 1. + time) * noise2d(uv1 * 6. + time);
            //only draw noise inside a 0.35 radius circle and turn down strength
            float circInner = circle(warpUv,vec2(0.5),big);

            grain *= circInner * severity;
            col -= grain;
            
            // Output to screen
            gl_FragColor += vec4(col,1.0);


		}`

};

export { AMDwet };
