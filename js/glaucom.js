import * as THREE from "./library/three.js/build/three.module.js";
import { GUI } from './library/three.js/examples/jsm/libs/dat.gui.module.js'

import { EffectComposer } from "./library/three.js/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from './library/three.js/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './library/three.js/examples/jsm/postprocessing/ShaderPass.js';
import { HorizontalBlurShader } from './library/three.js/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from './library/three.js/examples/jsm/shaders/VerticalBlurShader.js';
import { Glaucoma } from './library/shader/glaucoma.js';

let camera, scene, renderer, video, mesh, composer;

var wRatioX, wRatioY

// window.onSevere=()=>{
const value = {
    blur : 2.0,
    sepia : 0.5
}

init(value);   
animate();
// }


// init();
// animate();

function init(value) {

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 100;

  scene = new THREE.Scene();

  video = document.getElementById('video');

  const texture = new THREE.VideoTexture(video);

  var geometry = new THREE.PlaneGeometry(1, 1);

  const material = new THREE.MeshBasicMaterial({
    map: texture
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  composer = new EffectComposer( renderer );
  composer.addPass(new RenderPass( scene, camera ) );

  var hblur = new ShaderPass( HorizontalBlurShader );
  hblur.enabled = true;
  hblur.uniforms.h.value = value.blur / window.innerWidth;
  // composer.addPass( hblur );

  var vblur = new ShaderPass( VerticalBlurShader );
  vblur.enabled = true;
  vblur.uniforms.v.value = value.blur / window.innerHeight;
  vblur.renderToScreen = true;
  // composer.addPass( vblur );
  var gblur = new ShaderPass( Glaucoma );
  gblur.enabled = true;

  gblur.renderToScreen = true;
  composer.addPass( gblur );
  
  var gui = new GUI();//add control gui
  gui.add(gblur.uniforms.scale, 'value', 100, 1400)
  .name('scale');

  window.addEventListener('resize', onWindowResize);

  //
  getWebCamVideoInput();
}

async function getWebCamVideoInput() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

    let stream = await navigator.mediaDevices.getUserMedia({video: true});
    let {width, height} = stream.getTracks()[0].getSettings();

    wRatioX = width;
    wRatioY = height;

    console.log(width, height);

    document.getElementById("size_display").innerHTML = `${width} * ${height}`;

    const constraints = {
      video: {
        width: wRatioX,
        height: wRatioY,
        facingMode: 'environment'
      }
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {

      // apply the stream to the video element used in the texture

      video.srcObject = stream;
      video.play();

      onWindowResize();

    }).catch(function (error) {

      console.error('Unable to access the camera/webcam.', error);

    });

  } else {

    console.error('MediaDevices interface not available.');

  }
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  let ang_rad = camera.fov * Math.PI / 180;
  let fov_y = camera.position.z * Math.tan(ang_rad / 2) * 2;

  var height = fov_y * 1.08;
  var width = ang_rad * height;
  
 
//   if (window.innerWidth > window.innerHeight) {
//     const ratioY = height / window.innerHeight;
//     const deltaW = width / ratioY;
//     const ratioX = window.innerWidth / deltaW;
//     width = width * ratioX;
//     height = height * ratioX;
//   } else {
//   }

  mesh.scale.set( width, height, 1 );
}

function animate() {

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  
  composer.render();
}