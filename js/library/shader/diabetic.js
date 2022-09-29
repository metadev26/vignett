/**
 * Sepia tone shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */


 const Diabetic = {
    
	uniforms: {

		'tDiffuse': { value: null },
        'randNoise' : { value : 0.5},
        'randBlur' : { value : 0.8},
        'aspect' : {value : 1.0},
        'shape' : {value : 5.},
        'big': { value: 0.35 },
        'severity': { value: 0.6 },

	},
	vertexShader: /* glsl */`

		varying vec2 vUv;
        
		void main() {

            vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            
		}`,

        fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;
        uniform float randNoise;
        uniform float aspect;
        uniform float randBlur;
        uniform float shape;
        uniform float big;
        uniform float severity;
        #define iTime randNoise
        #define ITERATIONS 50
        #define TAU  6.28318530718
        varying vec2 vUv;

        float random (in vec2 st) { 
            return fract(sin(dot(st.xy,vec2(12.9898,78.233))) * 43758.5453123);
        }

        float noise (in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f*f*(3.0-2.0*f);
            return mix(a, b, u.x) + 
                    (c - a)* u.y * (1.0 - u.x) + 
                    (d - b) * u.x * u.y;
        }


        //-------------------------------------------------------------------------------------------
        // Use last part of hash function to generate new random radius and angle...
        vec2 Sample(inout vec2 r)
        {
            r = fract(r * vec2(33.3983, 43.4427));
            return r-.5;
            //return sqrt(r.x+.001) * vec2(sin(r.y * TAU), cos(r.y * TAU))*.5; // <<=== circular sampling.
        }

        //-------------------------------------------------------------------------------------------
        #define HASHSCALE 443.8975
        vec2 Hash22(vec2 p)
        {
            vec3 p3 = fract(vec3(p.xyx) * HASHSCALE);
            p3 += dot(p3, p3.yzx+19.19);
            return fract(vec2((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y));
        }

        //-------------------------------------------------------------------------------------------
        vec3 Blur(vec2 uv, float radius)
        {
            radius = radius * .02;
            
            vec2 circle = vec2(radius) * vec2((1.0/aspect), 1.0);
            
            // Remove the time reference to prevent random jittering if you don't like it.
            vec2 random = Hash22(uv);

            // Do the blur here...
            vec3 acc = vec3(0.0);
            for (int i = 0; i < ITERATIONS; i++)
            {
                acc += texture2D(tDiffuse, uv + circle * Sample(random), radius*10.0).xyz;
            }
            return acc / float(ITERATIONS);
        }

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
            float time = iTime * 1.;									// adjust time
            vec2 uv = vUv;	// center coordinates
            float dist = pow(length(uv), 0.5);
            float uvDeformMult = 1. + dist * cos(noise(uv * 2.) + 2. * noise(uv * 3.) + time);
            uv *= 1. + 0.15 * sin(time) * uvDeformMult;
            float divisor = 1.;
            float col = min(
                smoothstep(0.0, 0.0, abs(sin(uv.x * divisor))),
                smoothstep(0.0, 0.0, abs(sin(uv.y * divisor)))
            );
            //gl_FragColor = vec4(vec3(col),1.0)* texture2D(tDiffuse, uv);

             gl_FragColor = vec4(Blur(uv , 1.0 - abs(sin(uv.x*uv.y*randBlur+2.85))*4.0), 1.0);

             //blob

            vec3 bgCol = vec3(0.0);
            vec3 circCol = vec3(0.0);
            vec2 uv1 = vUv;
            //warp uv space to make the circle warp based on uv coord and time
            vec2 warpUv = uv1 + noise2d(uv1 * 10. + shape) * 0.1;
            
            //draw circle in center with 0.4 radius using the warped uv space
            float circ = circle(warpUv,vec2(0.5),0.35); 

            vec3 col2 = mix(bgCol,circCol,circ);
            
            //add grain
            //modulate hi-res noise for grain with a low res noise for the gradients
            float grain = noise2d(uv1 * 1. + shape) * noise2d(uv1 * 6. + shape);
            //only draw noise inside a 0.35 radius circle and turn down strength
            float circInner = circle(warpUv,vec2(0.5),big);

            grain *= circInner * severity;
            col2 -= grain;
            
            // Output to screen
            gl_FragColor += vec4(col2,1.0);

		}`

};

export { Diabetic };
