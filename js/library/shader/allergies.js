/**
 * Two pass Gaussian blur filter (horizontal and vertical blur shaders)
 * - described in http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
 *   and used in http://www.cake23.de/traveling-wavefronts-lit-up.html
 *
 * - 9 samples per pass
 * - standard deviation 2.7
 * - "h" and "v" parameters should be set to "1 / width" and "1 / height"
 */


var Allergies = {

  uniforms: {

    'tDiffuse': { value: null },
    'uResolutionX' : {value : null},
    'uResolutionY' : {value : null},
    'severity' : {value : 5.},
    'pos' : {value : 5.}
  },

  vertexShader: /* glsl */`

    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

  fragmentShader: /* glsl */`
    float pi = 3.141592654;
    uniform sampler2D tDiffuse;
    uniform float severity;
    uniform float pos;
    uniform float uResolutionX;
    uniform float uResolutionY;

    const float PI = 3.1415926535897932;

    //speed
    const float speed = 0.2;
    const float speed_x = 0.3;
    const float speed_y = 0.3;

    // refraction
    const float emboss = 0.5;
    const float intensity = 2.4;
    const int steps = 8;
    const float frequency = 6.0;
    const int angle = 7; // better when a prime

    // reflection
    const float delta = 60.;
    const float gain = 700.;
    const float reflectionCutOff = 0.0;
    const float reflectionIntensity = 0.;
    varying vec2 vUv;

   float col(vec2 coord,float time)
    {
      float delta_theta = 2.0 * PI / float(angle);
      float col = 0.0;
      float theta = 0.0;
      for (int i = 0; i < steps; i++)
      {
        vec2 adjc = coord;
        theta = delta_theta*float(i);
        adjc.x += cos(theta)*time*speed + time * speed_x;
        adjc.y -= sin(theta)*time*speed - time * speed_y;
        col = col + cos( (adjc.x*cos(theta) - adjc.y*sin(theta))*frequency)*intensity;
      }

      return cos(col);
    }

    // void main(  )
    // {   
    //     vec2 resolution = vec2(uResolutionX, uResolutionY);
    //     vec2 uv = vUv;
        
    //     gl_FragColor = (uv.y + .1) * texture2D(tDiffuse, uv);
    //     float temp1 = uv.x * severity * pi + pos;
    //     float temp2 = uv.y * severity * pi + pos;
    //     vec2 ran = vec2(0.5, 0.45);
    //     uv.y += sin(temp1) * .01 * sin(temp2) ;
    //     uv.x += sin(temp2) * .01 * sin(temp1) ;

    //     vec4 texture = texture2D(tDiffuse, uv);
        
        
    //     gl_FragColor = texture;
        
    // }


    void main()
    {

      float time = pos*1.3;
      vec2 resolution = vec2(uResolutionX, uResolutionY);
      // vec2 p = (gl_FragCoord.xy) / resolution.xy, c1 = p, c2 = p;
      vec2 p = vUv, c1 = p, c2 = p;
      float cc1 = col(c1,time);

      c2.x += resolution.x/delta;
      float dx = emboss*(cc1-col(c2,time))/delta;

      c2.x = p.x;
      c2.y += resolution.y/delta;
      float dy = emboss*(cc1-col(c2,time))/delta;

      c1.x += dx*2.;
      c1.y = c1.y+dy*2.;

      float alpha = 1.+dot(dx,dy)*gain;
        
      float ddx = dx - reflectionCutOff;
      float ddy = dy - reflectionCutOff;
      if (ddx > 0. && ddy > 0.)
        alpha = pow(alpha, ddx*ddy*reflectionIntensity);
        
      vec4 col = texture2D(tDiffuse, c1)*(alpha);
      gl_FragColor = col;
    }`

};

export { Allergies };
