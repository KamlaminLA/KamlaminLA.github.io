import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const directionLight = new THREE.DirectionalLight(0xffffff, 1);
directionLight.position.set(5, 3, 5);
scene.add(directionLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Texture loading
const textureLoader = new THREE.TextureLoader();
const normalMap = textureLoader.load('textures/earth_normalmap_8192x4096.jpg');
const bumpMap = textureLoader.load('textures/earth_bumpmap.jpg');

const materialEarth = new THREE.MeshPhongMaterial({
  map: normalMap,
  bumpMap: bumpMap,
  bumpScale: 0.05,
  specular: new THREE.Color('grey')
});

const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);
const sphere = new THREE.Mesh(sphereGeometry, materialEarth);
scene.add(sphere);

var controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 2;
controls.maxDistance = 10;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);
animate();