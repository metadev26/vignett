/**
 * Sepia tone shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */


 const Retinal = {
    
	uniforms: {

		'tDiffuse': { value: null },
        'hairPos' : { value : 3.8},
        'blobPosition' : {value : 0.5},
        'size': { value: 0.95 },
        'blurEdge': { value: 0.1 },
	},
	vertexShader: /* glsl */`

		varying vec2 vUv;
        
		void main() {

            vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            
		}`,

        fragmentShader: /* glsl */`
    
        uniform float amount;
        uniform float severity;
        uniform float pngColor;
        uniform float hairPos;
        uniform float blobPosition;
		uniform sampler2D tDiffuse;
        uniform float size;
        uniform float blurEdge;
        #define iTime 4.0
        varying vec2 vUv;

        float rand(vec2 co)
        {
            return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
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

        //numLayers = Number of hair layers.
        //Higher value shows more layers of effects.
        //Lower value higher FPS.
        const int numLayers = 3;

        //Length of worm
        const int wormLength = 1;

        //Write output color from anywhere to see value of temporary variable.
        vec3 cout;

        float rand(vec3 pos)
        {
          vec3 p = pos + vec3(2.);
          vec3 fp = fract(p*p.yzx*222.)+vec3(2.);
          p.y *= p.z * fp.x;
          p.x *= p.y * fp.y;
          return
            fract
            (
                p.x*p.x
            );
        }

        float skewF(float n)
        {
            return (sqrt(n + 1.0) - 1.0)/n;
        }

        float unskewG(float n)
        {
            return (1.0/sqrt(n + 1.0) - 1.0)/n;
        }

        vec2 smplxNoise2DDeriv(vec2 x, float m, vec2 g)
        {
            vec2 dmdxy = min(dot(x, x) - vec2(0.5), 0.0);
            dmdxy = 8.*x*dmdxy*dmdxy*dmdxy;
            return dmdxy*dot(x, g) + m*g;
        }

        float smplxNoise2D(vec2 p, out vec2 deriv, float randKey, float roffset)
        {
            //i is a skewed coordinate of a bottom vertex of a simplex where p is in.
            vec2 i0 = floor(p + vec2( (p.x + p.y)*skewF(2.0) ));
            //x0, x1, x2 are unskewed displacement vectors.
            float unskew = unskewG(2.0);
            vec2 x0 = p - (i0 + vec2((i0.x + i0.y)*unskew));

            vec2 ii1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec2 ii2 = vec2(1.0);

            vec2 x1 = x0 - ii1 - vec2(unskew);
            vec2 x2 = x0 - ii2 - vec2(2.0*unskew);

            vec3 m = max(vec3(0.5) - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
            m = m*m;
            m = m*m;

            float r0 = 3.1416*2.0*rand(vec3(mod(i0, 16.0)/16.0, randKey));
            float r1 = 3.1416*2.0*rand(vec3(mod(i0 + ii1, 16.0)/16.0, randKey));
            float r2 = 3.1416*2.0*rand(vec3(mod(i0 + ii2, 16.0)/16.0, randKey));

            float randKey2 = randKey + 0.01;
            float spmin = 0.5;
            float sps = 2.0;
            float sp0 = spmin + sps*rand(vec3(mod(i0, 16.0)/16.0, randKey2));
            float sp1 = spmin + sps*rand(vec3(mod(i0 + ii1, 16.0)/16.0, randKey2));
            float sp2 = spmin + sps*rand(vec3(mod(i0 + ii2, 16.0)/16.0, randKey2));

            r0 += hairPos*sp0 + roffset;
            r1 += hairPos*sp1 + roffset;
            r2 += hairPos*sp2 + roffset;
            //Gradients;
            vec2 g0 = vec2(cos(r0), sin(r0));
            vec2 g1 = vec2(cos(r1), sin(r1));
            vec2 g2 = vec2(cos(r2), sin(r2));

            deriv = smplxNoise2DDeriv(x0, m.x, g0) + smplxNoise2DDeriv(x1, m.y, g1) + smplxNoise2DDeriv(x2, m.z, g2);
            return dot(m*vec3(dot(x0, g0), dot(x1, g1), dot(x2, g2)), vec3(1.0));
        //  return dot(m*vec3(length(x0), length(x1), length(x2)), vec3(1.0));
        }

        vec3 norm(vec2 deriv)
        {
            deriv *= 2000.0;
            vec3 tx = vec3(1.0, 0.0, deriv.x);
            vec3 ty = vec3(0.0, 1.0, deriv.y);
            return normalize(cross(tx, ty));
        }

		void main() {

            vec2 pos = vUv;
            vec2 centered = pos - vec2(0.0);
            vec4 image = texture2D(tDiffuse, vUv);
            vec4 color = vec4(1.0);
            
            // Create the vignette effect in black and white
            color.rgb *= 1.0 - smoothstep(size, size+blurEdge, length(centered));
            
            // Apply the vignette to the image
            color *= image;
            
            // Mix between the vignette version and the original to change the vignette opacity
            color = mix(image, color, 1.0);
            
            gl_FragColor = color;


            vec2 nos_pos = pos - 0.5 + vec2(min(fract(iTime) - 2.0, 0.0), blobPosition);
            vec2 abs_n_p = vec2(abs(nos_pos));
            vec3 Col = gl_FragColor.rgb;
            Col *= 4.0 * min(0.5 * nos(8.0 * nos_pos) + 0.5, 0.25);
            gl_FragColor = vec4(clamp(Col, 0.0, 1.0),1.0);


            vec2 uv = vUv;

            vec3 color2 = vec3(0.);
            float s = 1.0;
            for(int i=0; i<numLayers; ++i)
            {
                float sn = 0.0;
                float y = 0.0;
                
                vec2 deriv;
                float nx = smplxNoise2D(uv*s*4.0, deriv, 0.1+1./s, 0.0);
                float ny = smplxNoise2D(uv*s*4.0, deriv, 0.11+1./s, 0.0);
                for(int j=0; j<wormLength; ++j)
                {
                    vec2 deriv;

                    sn += smplxNoise2D(uv*s+vec2(1./s, 0.)+vec2(nx,ny)*4., deriv, 0.2+1./s, y);
                    color2 += vec3(norm(deriv).z)/s;
                    y += 0.1;
                }
                s *= 1.1;
            }
            color2 /= 4.;

            cout = color2;

            gl_FragColor = gl_FragColor - vec4(cout, 1.0) ;

		}`

};

export { Retinal };
