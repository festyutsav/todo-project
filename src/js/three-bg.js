import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const canvas = document.getElementById('three-bg');

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
    premultipliedAlpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 11);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const pointLightA = new THREE.PointLight(0x8b5cf6, 3.4, 30, 2);
pointLightA.position.set(-5, 3, 6);
scene.add(pointLightA);

const pointLightB = new THREE.PointLight(0x38bdf8, 2.8, 30, 2);
pointLightB.position.set(5, -2, 4);
scene.add(pointLightB);

const group = new THREE.Group();
scene.add(group);

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 220;
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i += 1) {
    const index = i * 3;
    particlePositions[index] = (Math.random() - 0.5) * 20;
    particlePositions[index + 1] = (Math.random() - 0.5) * 12;
    particlePositions[index + 2] = (Math.random() - 0.5) * 16;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particleMaterial = new THREE.PointsMaterial({
    color: 0xe2e8f0,
    size: 0.05,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
group.add(particles);

const orbGeometry = new THREE.SphereGeometry(1.55, 48, 48);
const orbMaterialA = new THREE.MeshPhysicalMaterial({
    color: 0x8b5cf6,
    emissive: 0x6d28d9,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.34,
    roughness: 0.4,
    metalness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.2
});

const orbMaterialB = new THREE.MeshPhysicalMaterial({
    color: 0x67e8f9,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.28,
    roughness: 0.35,
    metalness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.2
});

const orbA = new THREE.Mesh(orbGeometry, orbMaterialA);
orbA.position.set(-5, 1.8, -2);

const orbB = new THREE.Mesh(orbGeometry, orbMaterialB);
orbB.position.set(4.6, -2.2, -4);

const orbC = new THREE.Mesh(new THREE.SphereGeometry(1.2, 40, 40), new THREE.MeshStandardMaterial({
    color: 0xfdf2f8,
    emissive: 0xf9a8d4,
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.28
}));
orbC.position.set(0.5, 3.2, -5);

group.add(orbA, orbB, orbC);

const waveGeometry = new THREE.PlaneGeometry(18, 10, 120, 80);
const waveMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4b5fd,
    emissive: 0x312e81,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    wireframe: true,
    metalness: 0.25,
    roughness: 0.7
});

const waveMesh = new THREE.Mesh(waveGeometry, waveMaterial);
waveMesh.rotation.x = -0.9;
waveMesh.position.set(0, -2, -8);
group.add(waveMesh);

const wavePositions = waveGeometry.attributes.position;
const basePositions = wavePositions.array.slice();

const pointer = { x: 0, y: 0 };
window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const clock = new THREE.Clock();

function resizeRenderer() {
    const { innerWidth, innerHeight } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
}

window.addEventListener('resize', resizeRenderer);
resizeRenderer();

function animate() {
    const elapsed = clock.getElapsedTime();

    const targetX = pointer.x * 1.8;
    const targetY = pointer.y * 0.9;

    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z = 11;
    camera.lookAt(0, 0, 0);

    particles.rotation.x = elapsed * 0.05;
    particles.rotation.y = elapsed * 0.08;

    orbA.position.x = -5 + Math.sin(elapsed * 0.8) * 0.8 + pointer.x * 1.3;
    orbA.position.y = 1.8 + Math.cos(elapsed * 0.9) * 0.7 + pointer.y * 0.8;
    orbB.position.x = 4.6 + Math.cos(elapsed * 0.7) * 0.9 - pointer.x * 1.2;
    orbB.position.y = -2.2 + Math.sin(elapsed * 0.9) * 0.8 + pointer.y * 0.5;
    orbC.position.y = 3.2 + Math.sin(elapsed * 1.1) * 0.6 + pointer.y * 0.6;

    const positions = waveGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = basePositions[i];
        const y = basePositions[i + 1];
        const wave = Math.sin(x * 1.9 + elapsed * 1.4) * 0.35 + Math.cos(y * 2.2 - elapsed * 1.2) * 0.28;
        positions[i + 2] = wave + pointer.y * 0.3;
    }

    waveGeometry.attributes.position.needsUpdate = true;
    waveGeometry.computeVertexNormals();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
