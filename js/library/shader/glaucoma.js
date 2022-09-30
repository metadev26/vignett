
 const Glaucoma = {
  
  uniforms: {
    'scale': { value: 10.0 },

  },
  vertexShader: /* glsl */`

    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

  fragmentShader: /* glsl */`
    uniform float scale;

    varying vec2 vUv;

    float roundedBoxSDF(vec2 CenterPosition, vec2 Size, vec4 Radius) {
      Radius.xy = (CenterPosition.x>0.0)?Radius.xy : Radius.zw;
      Radius.x  = (CenterPosition.y>0.0)?Radius.x  : Radius.y;
      
      vec2 q = abs(CenterPosition)-Size+Radius.x;
      return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - Radius.x;
    }

    void main() {
      float size_x;
      float size_y;
      float rad;
      float rcolor = 0.0;
      float gcolor = 0.0;
      float bcolor = 0.0;

      vec2 iResolution = vec2(gl_FragCoord.x / vUv.x, gl_FragCoord.y / vUv.y);

      float step_x = iResolution.x / 5.0;
      float step_y = iResolution.y / 5.0;
      if(step_y < step_x){
        float tang = step_x / step_y;
        if(scale < step_y) {
          rad = scale / 2.0;
          size_x = scale;
          size_y = scale;
        } else {

          size_y = scale;
          size_x = step_y + (scale - step_y) * tang;

          if(scale < 2. * step_y) {
            rad = size_x / 2.0;
          } else if(scale < 3. * step_y){
            rad = (step_y + step_x) / 2.0 - (step_x - 2. * step_y) * (scale - 2.0 * step_y) / step_y;
          } else if(scale < 4. * step_y) {
            rad = scale / 2.0;
          } else if(scale < iResolution.y){
            rad = 2.0 * step_y * (1.0 - (scale - 4.0 * step_y) / step_y);
          } else if(scale > iResolution.y){
            size_x = iResolution.x;
            size_y = iResolution.y;
            rad = 0.0;
          }
        }
      } else {
        float tang = step_y / step_x;
        if(scale < step_x) {
          rad = scale / 2.0;
          size_x = scale;
          size_y = scale;
        } else {

          size_x = scale;
          size_y = step_x + (scale - step_x) * tang;

          if(scale < 2. * step_x) {
            rad = size_y / 2.0;
          } else if(scale < 3. * step_x){
            rad = (step_x + step_y) / 2.0 - (step_y - 2. * step_x) * (scale - 2.0 * step_x) / step_x;
          } else if(scale < 4. * step_x) {
            rad = scale / 2.0;
          } else if(scale < iResolution.x){
            rad = 2.0 * step_x * (1.0 - (scale - 4.0 * step_x) / step_x);
          } else if(scale > iResolution.x){
            size_y = iResolution.y;
            size_x = iResolution.x;
            rad = 0.0;
          }
        }
      }
      vec2 size = vec2(size_x, size_y);

      // The pixel space location of the rectangle.
      vec2 location = vec2(iResolution.x / 2.0, iResolution.y / 2.0);

      // The pixel space scale of the rectangle.

      // How soft the edges should be (in pixels). Higher values could be used to simulate a drop shadow.
      float edgeSoftness  = 2.0f;
      
      // The radius of the corners (in pixels) clockwise starting in the top left.
      vec4 radius = vec4( 1.0f) * vec4(rad, rad, rad, rad);
      
      // Calculate distance to edge.   
      float distance = roundedBoxSDF(gl_FragCoord.xy - location, size / 2.0f, radius);
         
      // Smooth the result (free antialiasing).
      float smoothedAlpha =  1.0f-smoothstep(0.0f, edgeSoftness,distance);
      
      // Border.  
      float borderThickness = 5.0f;
      float borderSoftness  = 2.0f;
      float borderAlpha   = 1.0f-smoothstep(borderThickness - borderSoftness, borderThickness, abs(distance));

      // Colors
      vec4 rectColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);
      vec4 borderColor = vec4(1.0f, 0.6f, 0.1f, 1.0f);
      vec4 bgColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);
        
      gl_FragColor = mix(bgColor, mix(rectColor, borderColor, borderAlpha), smoothedAlpha);

    }`

};

export { Glaucoma };
