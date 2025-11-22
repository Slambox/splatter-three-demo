import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Splatter } from 'splatter-three';

// create WebGL2 context -- required for Splatter
const options = {
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
}
const canvas = document.createElement('canvas');
const context = canvas.getContext('webgl2', options);
if (!context) {
    alert('WebGL2 not supported in this browser');
    throw new Error('WebGL2 not supported');
}
document.body.appendChild(canvas);

// set up Three.js renderer
const renderer = new THREE.WebGLRenderer({ canvas, context });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000);

// set up Splatter
const splatter = new Splatter(context, {splatId: 'cfg-x6d'});
splatter.setTransform(new THREE.Matrix4().makeRotationX(130 / 180 * Math.PI));

// set up scene
const scene = new THREE.Scene();

const grid = new THREE.GridHelper(10, 10);
grid.position.set(0, -1, 0);
scene.add(grid);

const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
const cube = new THREE.Mesh(new THREE.BoxGeometry(), cubeMaterial);
scene.add(cube);

const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8), ballMaterial);
scene.add(ball);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff));

// set up camera and controls
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set(3, 3, 3);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.rotateSpeed = 0.5;

// movement state
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();

// movement speed
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const moveSpeed = 10.0;

// set up a simple splat shader effect
// splatter.addUniform('vec3', 'uWeights');
// splatter.setShaderEffect(`
//     // make the splats grayscale
//     float gray = dot(color, uWeights);
//     color = vec3(gray);
// `);

// // clipping demo: remove splats on the fly with GLSL code
// splatter.setClipTest(`
//     // discard splats beyond a certain distance from origin
//     if (length(position) + radius > 10.0) { return false; }
// `);

const transform = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
splatter.setTransform(transform);

// render scene (continuous loop)
function render() {
    frameRequested = false;

    // update movement
    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // gravity

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    // get camera forward and right directions
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // keep movement horizontal
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    // apply movement
    if (moveForward || moveBackward) {
        const move = forward.clone().multiplyScalar(direction.z * moveSpeed * delta);
        camera.position.add(move);
        controls.target.add(move); // move target with camera
    }
    if (moveLeft || moveRight) {
        const move = right.clone().multiplyScalar(direction.x * moveSpeed * delta);
        camera.position.add(move);
        controls.target.add(move); // move target with camera
    }

    // apply velocity in camera-relative space
    const velForward = forward.clone().multiplyScalar(-velocity.z * delta);
    const velRight = right.clone().multiplyScalar(-velocity.x * delta);
    const velUp = new THREE.Vector3(0, velocity.y * delta, 0);
    camera.position.add(velForward);
    camera.position.add(velRight);
    camera.position.add(velUp);
    controls.target.add(velForward);
    controls.target.add(velRight);
    controls.target.add(velUp);

    if (camera.position.y < 1) {
        velocity.y = 0;
        camera.position.y = 1;
        controls.target.y = Math.max(1, controls.target.y);
        canJump = true;
    }

    // update orbit controls
    controls.update(delta);

    renderer.render(scene, camera);
    // splatter.setUniform('uWeights', [0.299, 0.587, 0.114]);
    splatter.render(camera, controls.target);

    // update();
}

// request redraw
let frameRequested = false;
function update() {
    // if (!frameRequested) {
    //     requestAnimationFrame(render);
    //     frameRequested = true;
    // }
}

function init_render_loop() {
    let animation_frame = null;
    const update = (ts) => {
        render();
    }

    function animate(ts) {
        update(ts)
        requestAnimationFrame(animate)
    }

    animation_frame = requestAnimationFrame(animate)
	}

// handle window resize
function resize() {
    let [width, height] = [window.innerWidth, window.innerHeight];
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    update();
}


// movement key handlers
const onKeyDown = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;
    }
};

const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
};

// double-click to place ball and recenter
let lastTime = -1e3;
function onclick(event) {
    if (performance.now() - lastTime < 300) {
        let pt = splatter.hitTest(camera, [event.clientX, event.clientY]);
        if (pt) {
            controls.target.copy(pt);
            ball.position.copy(pt);
            update();
        }
    }
    lastTime = performance.now();
}

// watch number of loaded/displayed Gaussians, hide spinner when enough displayed
function onloaded(totalLoaded, numDisplayed) {
    if (totalLoaded > splatter.totalSize/2 || numDisplayed > 1e6) {
        document.getElementById('spinner').style.display = 'none';
    }
}

resize();
// update();
init_render_loop();
window.addEventListener('resize', resize);
controls.addEventListener('change', update);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
splatter.addEventListener('update', update); // important: redraw on streaming updates!
splatter.addEventListener('loaded', onloaded);
canvas.addEventListener('dblclick', onclick);