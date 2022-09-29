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

        uniform float amount;
        uniform float severity;
        uniform float pngColor;
        uniform float pngPos;
        uniform float aspect;
        uniform float translucency;
        uniform float uResolutionX;
        uniform float uResolutionY;
		uniform sampler2D tDiffuse;
        #define u_time 2.0
        #define iTime 4.0
        varying  vec2 vUv;

        const float cloudscale = 8.0;
        const float speed = 0.03;
        const float clouddark = 0.5;// pngColor
        const float cloudlight = 0.01;
        const float cloudcover = 0.00;
        const float cloudalpha = 2.0;
        const float skytint = 0.0;

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




        vec2 hash( vec2 p ) {
            p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
            return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }

        float noise( in vec2 p ) {
            const float K1 = 0.366025404; // (sqrt(3)-1)/2;
            const float K2 = 0.211324865; // (3-sqrt(3))/6;
            vec2 i = floor(p + (p.x+p.y)*K1);   
            vec2 a = p - i + (i.x+i.y)*K2;
            vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); //vec2 of = 0.5 + 0.5*vec2(sign(a.x-a.y), sign(a.y-a.x));
            vec2 b = a - o + K2;
            vec2 c = a - 1.0 + 2.0*K2;
            vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
            vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
            return dot(n, vec3(70.0));  
        }

        float fbm(vec2 n) {
            float total = 0.0, amplitude = 0.1;
            for (int i = 0; i < 1; i++) {
                total += noise(n) * amplitude;
                n = m * n;
                amplitude *= 0.1;
            }
            return total;
        }

        vec2 hash22(vec2 p)
        {
            p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
            return -1.0 + 2.0 * fract(sin(p)*43758.5453123);
        }

        float nos(vec2 p)
        {
            const float K1 = 0.366025404; // (sqrt(3)-1)/2;
            const float K2 = 0.211324865; // (3-sqrt(3))/6;
            vec2 i = floor(p + (p.x + p.y) * K1);
            vec2 a = p - (i - (i.x + i.y) * K2);
            vec2 o = (a.x < a.y) ? vec2(0.0, 1.0) : vec2(1.0, 0.0);
            vec2 b = a - o + K2;
            vec2 c = a - 1.0 + 2.0 * K2;
            vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
            vec3 n = h * h * h * h * vec3(dot(a, hash22(i)), dot(b, hash22(i + o)), dot(c, hash22(i + 1.0)));
            return dot(vec3(70.0, 70.0, 70.0), n);
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
			float circleMix = smoothstep( 0.3, 0.1, length(v));
            highp vec4 blurColor;
			blurColor.rgb = mix(texture2D(tDiffuse, vUv).rgb, fogcolor.rgb, circleMix);
            
            gl_FragColor = vec4(blurColor.rgb,1.0);

            // vec2 uResolution = vec2 (uResolutionX, uResolutionY);
            // uv -= 0.5;
            // uv.x *= aspect;
            // vec3 sky = gl_FragColor.rgb;
            // vec3 col1 = vec3(0.0);

            // vec2 nos_pos = uv - 0.5 + vec2(min(fract(iTime) - 2.0, 0.0), pngPos);
            // vec2 abs_n_p = vec2(abs(nos_pos));
            // vec3 Col = gl_FragColor.rgb;
            // Col *= 4.0 * min(0.5 * nos(3.0 * nos_pos) + 0.5, 0.25);
            // gl_FragColor = vec4(clamp(Col, 0.0, 1.0), 1.0);

		}`
};

export { AMDdry };
