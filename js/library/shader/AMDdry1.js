/**
 * Sepia tone shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */


 const AMDdry = {
    
	uniforms: {

		'tDiffuse': { value: null },
        'severity': {value : 0.3},
        'pngColor' : {value : 0.8},
        'pngPos' : { value : 50.0},
        'translucency' : {value : 0.5},
        'aspect' : {value : null},
        'uResolutionX' : {value : null},
        'uResolutionY' : {value : null},

	},
	vertexShader: /* glsl */`
        
        precision lowp float;
		varying lowp vec2 vUv;
        
		void main() {

            vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            
		}`,

        fragmentShader: /* glsl */`

        precision lowp float;
        uniform lowp float amount;
        uniform lowp float severity;
        uniform lowp float pngColor;
        uniform lowp float pngPos;
        uniform lowp float aspect;
        uniform lowp float translucency;
        uniform lowp float uResolutionX;
        uniform lowp float uResolutionY;
		uniform lowp sampler2D tDiffuse;
        #define u_time 2.0
        #define iTime 4.0
        varying lowp vec2 vUv;

        const float cloudscale = 1.5;
        const float speed = 0.03;
        const float clouddark = 0.555;
        const float cloudlight = 0.55;
        const float cloudcover = 0.05;
        const float cloudalpha = 4.1;
        const float skytint = 0.3;
        const vec3 skycolour1 = vec3(0.2, 0.4, 0.6);
        const vec3 skycolour2 = vec3(0.4, 0.7, 1.0);

        const mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
        
        float R21 (vec2 p) {
            return fract(sin(dot(p.xy, vec2(2.3245,5.234)))*123.5632145);
        }
        
        float NoiseValue (vec2 uv) {
            vec2 gv = fract(uv);
            vec2 id = floor(uv);
            
            gv = gv * gv * (3. - 2. * gv);
        
            float a = R21(id);
            float b = R21(id + vec2(1., 0.));
            float c = R21(id + vec2(0., 1.));
            float d = R21(id + vec2(1., 1.));
        
            return mix(a, b, gv.x) + (c - a)* gv.y * (1. - gv.x) + (d - b) * gv.x * gv.y;
        }
        float circle(in vec2 _st, in vec2 pos, in float _radius){   
            vec2 dist = _st - pos;    
            return 1. - smoothstep(_radius, _radius + 0.3, dot(dist,dist)*4.0);//control second parm to fade border
        }
        
        float SmoothNoise (vec2 uv) {
        
            float value = 0.;
            float amplitude = severity;
        
            for (int i = 0; i < 8; i++) { //add layer for 8 times so , we can control strength by it
                value += NoiseValue(uv) * amplitude;
                uv *= 2.;
                amplitude *= 0.5;
            }
            
            return value;
        }

        //cloud_______________________________________________

        vec2 hash( vec2 p ) 
        {
            p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
            return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }

        float noise( in vec2 p )
        {
            const float K1 = 0.366025404; // (sqrt(3)-1)/2;
            const float K2 = 0.211324865; // (3-sqrt(3))/6;

            vec2  i = floor( p + (p.x+p.y)*K1 );
            vec2  a = p - i + (i.x+i.y)*K2;
            float m = step(a.y,a.x); 
            vec2  o = vec2(m,1.0-m);
            vec2  b = a - o + K2;
            vec2  c = a - 1.0 + 2.0*K2;
            vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
            vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
            return dot( n, vec3(70.0) );
        }

        const mat2 m2 = mat2(1.6,  1.2, -1.2,  1.6);

        float fbm4(vec2 p) {
            float amp = 0.5;
            float h = 0.0;
            for (int i = 0; i < 1; i++) {
                float n = noise(p);
                h += amp * n;
                amp *= 0.5;
                p = m2 * p ;
            }
            
            return  0.5 + 0.5*h;
        }


		void main() {
            vec2 uv = vUv;
            vec3 col = vec3(0.);
            vec2 rn = vec2(0.);
            rn.x = SmoothNoise(uv + 1.984 * vec2(1.7,9.2)+ 0.158*iTime );
            rn.y = SmoothNoise(uv + 1. * vec2(8.3,2.8)+ 0.126*iTime);

            col += SmoothNoise(uv+rn*2.5);

            highp vec4 fogcolor = mix(vec4(col,1.0), texture2D(tDiffuse, uv),1.0 - translucency);
            vec2 objectCenter =vec2 (0.5,0.5);
			vec2 v = vUv - objectCenter;
			float circleMix = smoothstep( 0.3,0.1, length(v));
            highp vec4 blurColor;
			blurColor.rgb = mix(texture2D(tDiffuse, vUv).rgb, fogcolor.rgb, circleMix);
            
            gl_FragColor = vec4(blurColor.rgb,1.0);

            vec2 uResolution = vec2 (uResolutionX, uResolutionY);
            vec2 p = gl_FragCoord.xy / uResolution.y;
            uv -= 0.5;
            uv.x *= aspect;
            vec3 sky = gl_FragColor.rgb;
            vec3 col1 = vec3(0.0);

            // layer1
            vec3 cloudCol = vec3(pngColor);
            uv += 10.0;
            
            float speed      = 1.0;
            float brightness = 0.75;
            float cover      = 0.6;
            
            float zoom = 3.0; // Multiplier of UV, a higher number is for "zooming out"
            
            float n1 = fbm4(uv*zoom+(pngPos*(speed/30.))); // +iTime is for moving left, -iTime is for moving right
            col1 = mix( sky, cloudCol, smoothstep(cover, brightness, n1));
             gl_FragColor = vec4(col1,1.0);

		}`
};

export { AMDdry };
