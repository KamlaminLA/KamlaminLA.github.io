import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer, material;
let controls;
let pause = true;

function blackBodyColor(value) {
    // Ensure the value is within [0, 1]
    value = Math.min(Math.max(value, 0), 1);

    // Define color stops
    const colors = [
        { pos: 0, color: { r: 0, g: 0, b: 0 } },      // Black
        { pos: 0.2, color: { r: 0.545, g: 0, b: 0 } },  // Dark Red
        { pos: 0.4, color: { r: 1, g: 0.27, b: 0 } }, // OrangeRed
        { pos: 0.6, color: { r: 1, g: 1, b: 0 } },// Yellow
        { pos: 0.8, color: { r: 1, g: 1, b: 1 } }, // White
        { pos: 1.0, color: { r: 0, g: 0, b: 1 } }   // Blue
    ];

    // Find the two nearest color stops
    let start = colors[0], end = colors[colors.length - 1];
    for (let i = 0; i < colors.length - 1; i++) {
        if (value >= colors[i].pos && value <= colors[i + 1].pos) {
            start = colors[i];
            end = colors[i + 1];
            break;
        }
    }
    // Interpolate between the start and end colors
    const mix = (value - start.pos) / (end.pos - start.pos);
    const r = start.color.r + (end.color.r - start.color.r) * mix;
    const g = start.color.g + (end.color.g - start.color.g) * mix;
    const b = start.color.b + (end.color.b - start.color.b) * mix;
    return [r, g, b];
}

class particleSystem {
	// [-0.5, 0.5]^3
	getRandomVec() {
		return [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
	}
	getFixedPosition() {
		return [0,0,0];
	}
	getRandomColor() {
		return [Math.random(), Math.random(), Math.random()];
	}
	getWhiteColor() {
		return [1, 1, 1]; // r, g, b
	}

	constructor(nParticles) {
		this.m_nParticles = nParticles;

		this.gravityAttractInit();
		// depthTest: false,
		const sprite = new THREE.TextureLoader().load('textures/disc.png');
		sprite.colorSpace = THREE.SRGBColorSpace;
		material = new THREE.PointsMaterial({
			size: 0.03,
			sizeAttenuation: true,
			map: sprite,
			alphaTest: 0.5,
			blending: THREE.AdditiveBlending,
			transparent: true,
			vertexColors: true // Use vertex colors
		});
		this.m_allParticles = new THREE.Points(this.m_geometry, material);
		this.m_positions = this.m_allParticles.geometry.attributes.position.array;
		this.m_color = this.m_allParticles.geometry.attributes.color.array;
	}

	// update particles.
	update() {
		this.gravityAttract();
		this.m_allParticles.geometry.attributes.position.needsUpdate = true;
		this.m_allParticles.geometry.attributes.color.needsUpdate = true;
	}


	gravityAttractInit() {
		this.m_geometry = new THREE.BufferGeometry();
		const vertices = [];
		const colors = [];
		for (let i = 0; i < this.m_nParticles; i++) {
			const P = this.getRandomVec();
			vertices.push(P[0] * 2.0, P[1] * 2.0, P[2] * 2.0);
			const C = this.getRandomColor();
			colors.push(C[0], C[1], C[2]); // Add the color for this vertex
		}
		this.m_geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		this.m_geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
		this.m_velocity = new Float32Array(this.m_nParticles * 3);
		for (let i = 0; i < this.m_velocity.length; i += 3) {
			const V = this.getRandomVec()
			this.m_velocity[i] = V[0];
			this.m_velocity[i + 1] = V[1];
			this.m_velocity[i + 2] = V[2];
		}

		// Create a metallic material with a gold tint
		const metalMaterial = new THREE.MeshStandardMaterial({
			color: 0xFFD700, // Gold color
			metalness: 0.9, // Fully metallic
			roughness: 0.1 // A bit of roughness to simulate gold's reflectivity
		});
		const sphereGeometry1 = new THREE.SphereGeometry(0.5, 32, 32); // radius, widthSegments, heightSegments
		const sphere1 = new THREE.Mesh(sphereGeometry1, metalMaterial);
		// [0,0,0]: center of gravity
		sphere1.position.set(0, 0, 0)
		scene.add(sphere1);

		const sphereGeometry2 = new THREE.SphereGeometry(0.5, 32, 32); // radius, widthSegments, heightSegments
        const sphere2 = new THREE.Mesh(sphereGeometry2, metalMaterial);
        sphere2.position.set(0, 0, 1)
        scene.add(sphere2);
	}

	gravityAttract() {
		const G = 0.3;
		const dt = 1.0/60.0;  // timestep
		let minSpeed = 100000.0;
		let maxSpeed = 0;
		for (let i = 0; i < this.m_positions.length; i += 3) {
			// compute A.
			let P = new THREE.Vector3(this.m_positions[i], this.m_positions[i + 1], this.m_positions[i + 2]);
			let r = P.length();
			P.normalize();
			let a = - G/(r * r);

			this.m_velocity[i] += a * P.x * dt;
			this.m_velocity[i + 1] += a * P.y * dt;
			this.m_velocity[i + 2] += a * P.z * dt;

			this.m_positions[i] += this.m_velocity[i] * dt;
			this.m_positions[i + 1] += this.m_velocity[i + 1] * dt;
			this.m_positions[i + 2] += this.m_velocity[i + 2] * dt;

			let speedMag = Math.sqrt(this.m_velocity[i] * this.m_velocity[i] + this.m_velocity[i + 1] * this.m_velocity[i + 1] + this.m_velocity[i + 2] * this.m_velocity[i + 2]);
			minSpeed = Math.min(speedMag, minSpeed);
			maxSpeed = Math.max(speedMag, maxSpeed);

			let color = blackBodyColor(speedMag);
			this.m_color[i] = color[0];
			this.m_color[i + 1] = color[1];
			this.m_color[i + 2] = color[2];

			// reset
			if (r < 0.8 || r > 2.0) {
				this.m_positions[i] = Math.random() * 0.8 + 0.8; // x
				this.m_positions[i + 1] = 0; // y
				this.m_positions[i + 2] = 0; // z
				this.m_velocity[i] = 0;
				this.m_velocity[i + 1] = Math.abs(Math.random()) * 0.5 + 0.3; // v_y
				this.m_velocity[i + 2] = Math.abs(Math.random()) * 0.1; // v_z
			}
		}

		// minSpeed -> 0
		// maxSpeed -> 1
		const speedR = maxSpeed - minSpeed; // range of velociy
		for (let i = 0; i < this.m_positions.length; i += 3) {
			let speedMag = Math.sqrt(this.m_velocity[i] * this.m_velocity[i] + this.m_velocity[i + 1] * this.m_velocity[i + 1] + this.m_velocity[i + 2] * this.m_velocity[i + 2]);
			let color = blackBodyColor((speedMag - minSpeed) / speedR);
			this.m_color[i] = color[0];
			this.m_color[i + 1] = color[1];
			this.m_color[i + 2] = color[2];
		}
	}
}

let particleSys;

function onKeyDown(event) {
    if (event.key == 'p') {
		pause = !pause;
    }
}

function init() {

	camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.z = 5;
	scene = new THREE.Scene();

	// add light.
	const directionLight = new THREE.DirectionalLight(0xffffff, 2)
	directionLight.position.set(0, 0, 10)
	scene.add(directionLight)

	const ambientLight = new THREE.AmbientLight(0xffffff, 1); // white light at 50% intensity
	scene.add(ambientLight)

	// 100K
	particleSys = new particleSystem(100000);

	scene.add(particleSys.m_allParticles);

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);
	document.body.style.touchAction = 'none';

	// Adding OrbitControls
	controls = new OrbitControls(camera, renderer.domElement);
	window.addEventListener('resize', onWindowResize);
	window.addEventListener('keydown', onKeyDown, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
	renderer.render(scene, camera);
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	if (!pause)
		particleSys.update();
	render();
}

init();
animate();