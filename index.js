// 1. 改回本地导入
import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const clock = new THREE.Clock(); // 用于动画计时

// --- 2. 环境与背景设置 ---
const textureLoader = new THREE.TextureLoader();
textureLoader.load('./textures/planet.jpg', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = texture; 
    scene.environmentIntensity = 0.8;
});

// 相机
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 19); 
camera.lookAt(0, 0.5, 0);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; 
container.appendChild(renderer.domElement);

// 控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 30;
controls.minAzimuthAngle = -Math.PI / 3; 
controls.maxAzimuthAngle = Math.PI / 3;
controls.maxPolarAngle = Math.PI / 2; 

// --- 3. 灯光系统 ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
mainLight.position.set(5, 10, 8);
mainLight.castShadow = true;
mainLight.shadow.bias = -0.0001; 
mainLight.shadow.normalBias = 0.05; 
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

const frontLight = new THREE.DirectionalLight(0xffeedd, 0.5);
frontLight.position.set(0, 0, 10);
scene.add(frontLight);

// --- 4. 关键新增：隐形地板 (Shadow Catcher) ---
// 这个平面是透明的，但能接收阴影，用来制造脚底的落地感
const shadowPlaneGeometry = new THREE.PlaneGeometry(50, 50);
const shadowPlaneMaterial = new THREE.ShadowMaterial({ 
    opacity: 0.4, // 阴影浓度，越小越淡
    color: 0x000000 
});
const shadowPlane = new THREE.Mesh(shadowPlaneGeometry, shadowPlaneMaterial);
shadowPlane.rotation.x = -Math.PI / 2; // 躺平
shadowPlane.position.y = -1.0; // 放在脚底高度
shadowPlane.receiveShadow = true; // 接收阴影
scene.add(shadowPlane);

// --- 5. 粒子系统 ---
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 800;
const posArray = new Float32Array(particlesCount * 3);
for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 40; 
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.06,
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- 6. 模型加载与悬浮动画准备 ---
const loader = new GLTFLoader();
const modelFiles = ['doll.glb', 'doll1.glb', 'doll2.glb', 'doll3.glb', 'doll4.glb', 'doll5.glb'];
const spacing = 2.0; 

// 用一个数组存贮所有加载好的模型，方便在 animate 里操作它们
const dolls = [];

modelFiles.forEach((fileName, index) => {
    loader.load(`./model/${fileName}`, (gltf) => {
        const model = gltf.scene;

        let xPos = (index - (modelFiles.length - 1) / 2) * spacing;
        const yPos = -1.0; // 基础脚底高度

        let scale = 1.6; 
        let zPos = 0;    
        
        if (index === 2 || index === 3) { 
            scale = 2.4; zPos = 1.5; 
            if (index === 2) xPos -= 0.15; 
            if (index === 3) xPos += 0.15; 
        } else if (index === 1 || index === 4) { 
            scale = 2.0; zPos = 0.5;
        } else { 
            scale = 1.7; zPos = -0.5;
        }

        model.position.set(xPos, yPos, zPos);
        model.scale.set(scale, scale, scale);
        model.rotation.y = 0; 

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if(child.material) child.material.envMapIntensity = 1.0;
            }
        });

        scene.add(model);

        // 存入数组，包含基础Y坐标和随机偏移量，用于动画
        dolls.push({
            mesh: model,
            baseY: yPos,
            // 随机一个起始角度，让每个玩偶起伏的节奏不一样
            offset: Math.random() * Math.PI * 2, 
            // 随机一点速度差异
            speed: 1.5 + Math.random() * 0.5
        });
    });
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();

    // --- 7. 悬浮动画逻辑 ---
    dolls.forEach(doll => {
        // 公式：新Y = 基础Y + sin(时间 * 速度 + 偏移) * 幅度
        // 幅度 0.08 控制上下移动的距离，想更剧烈就改大
        doll.mesh.position.y = doll.baseY + Math.sin(time * doll.speed + doll.offset) * 0.08;
    });

    // 粒子旋转
    particlesMesh.rotation.y += 0.0015;
    particlesMesh.rotation.x += 0.0005;

    controls.update();
    renderer.render(scene, camera);
}

animate();