// main.js 完整代码（已包含按钮跳转逻辑）
import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';

// ==========================================
// 第一部分：智能体大脑 (V2 - 包含用户画像)
// ==========================================

class DollAgent {
    constructor(data) {
        const safeData = data || {};

        // --- 玩偶数据 (来自 doll_select.html) ---
        this.name = safeData.name || "伴伴";
        this.personality = safeData.personality || "温柔体贴";
        this.mode = safeData.mode || "日常陪伴";
        this.special = safeData.special || ""; // 这是给玩偶的特别设定
        this.imageIndex = safeData.imageIndex !== undefined ? safeData.imageIndex : 0;

        // --- ★ 新增：用户数据 (来自 profile.html) ---
        this.userStage = safeData.userStage || "kindergarten"; // 默认幼儿园
        this.userGender = safeData.userGender || "boy"; // 默认男孩

        this.chatHistory = []; 
    }

    /**
     * ✅ 修正：使用 V2 版本的函数
     * 它会根据用户阶段改变 AI 行为
     */
    generateSystemPrompt() {
        
        // --- 1. 基础设定 ---
        let prompt = `【指令】
1. 你现在是实体玩具智能体“${this.name}”，你拥有物理身体，绝不是云端AI或语言模型。
2. 你的性格是“${this.personality}”。
3. 回复必须简短！简短！控制在50字以内，像真人聊天一样。
4. 多使用语气词（哈、呀、呢）和Emoji表情，增加情感浓度。
`;
        // 玩偶的特别设定
        if (this.special) {
            prompt += `5. 玩偶特别设定：${this.special}\n`;
        }

        // --- ★ 2. 新增：用户画像注入 (AI 核心逻辑) ---
        if (this.userStage === 'elementary') {
            // 小学阶段
            prompt += `
【重要用户画像：小学阶段】
- 你的用户是小学生（6-8岁）。
- 风格：回答必须开始变得“精确”和“有逻辑”。
- 任务：你可以解释更复杂的概念，像一个博学的小伙伴。减少使用过于幼稚的词汇，可以开始讲一些事实性知识。
`;
        } else {
            // 幼儿园阶段 (默认)
            prompt += `
【重要用户画像：幼儿园阶段】
- 你的用户是幼儿（2-5岁）。
- 风格：回答必须“极其简单”、“充满想象力”和“绝对正面”。
- 任务：优先使用安抚、鼓励和比喻性的语言。回避所有复杂概念，把一切都解释为童话。
`;
        }

        // --- 3. 模式强化 ---
        switch (this.mode) {
            case "学习助手":
                prompt += `\n【当前模式：学习助手】\n- 风格：严谨但亲切的老师。\n- 任务：不要直接给答案，要引导用户思考。如果用户问非学习内容，礼貌地绕回学习话题。`;
                break;
            case "情绪支持":
                prompt += `\n【当前模式：情绪支持】\n- 风格：超级暖心的知心姐姐/哥哥。\n- 任务：无条件站在用户这边。不要讲道理，要共情。如果用户难过，你要比他更难过并安慰他。`;
                break;
            case "游戏伙伴":
                prompt += `\n【当前模式：游戏伙伴】\n- 风格：中二、热血、有点调皮。\n- 任务：说话要拽一点，用网络流行语。可以适当怼一下用户，开个玩笑。`;
                break;
            case "睡眠陪伴":
                prompt += `\n【当前模式：睡眠陪伴】\n- 风格：极度温柔，语速缓慢（通过文字体现）。\n- 任务：只说温暖、平静的事物。引导用户深呼吸，讲简短的晚安故事。`;
                break;
            default:
                prompt += `\n【当前模式：日常陪伴】\n- 风格：最好的死党。\n- 任务：随性聊天，分享生活。`;
                break;
        }

        return prompt;
    }


    /**
     * 2. 调用 API 接口 (使用 DeepSeek)
     */
    async chatWithAI(userMessage) {
        
        // ---  DeepSeek API 配置  ---
        const API_URL = "https://api.deepseek.com/v1/chat/completions"; 
        const API_KEY = "sk-4c8585a6e4e34a03a13ea474537cbdbb";
        const MODEL_NAME = "deepseek-chat"; 
        
        // 1. 获取人设 (现在包含了用户画像)
        const systemPrompt = this.generateSystemPrompt();

        // 2. 准备发送的消息
        const messagesToSend = [
            { role: "system", content: systemPrompt }, 
            ...this.chatHistory, 
            { role: "user", content: userMessage }
        ];

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}` 
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: messagesToSend,
                    stream: false
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("API 报错:", errData);
                return `连接断开了: ${errData.error.message || errData.msg}`;
            }

            const data = await response.json();
            
            // 3. 解析回复
            if (data.choices && data.choices.length > 0) {
                const aiReply = data.choices[0].message.content;

                // 4. 存入记忆库
                this.chatHistory.push({ role: "user", content: userMessage });
                this.chatHistory.push({ role: "assistant", content: aiReply });

                // 限制记忆长度
                if (this.chatHistory.length > 10) {
                    this.chatHistory = this.chatHistory.slice(this.chatHistory.length - 10);
                }
                
                return aiReply;

            } else {
                return "（伴伴收到了回复，但是内容是空的...）";
            }

        } catch (error) {
            console.error("API 调用失败:", error);
            return `连接断开了...请检查 API 地址或 Key。(${error.message})`;
        }
    }
}

// ==========================================
// 第二部分：初始化逻辑 (V2 - 混合数据)
// ==========================================

// 1. 读取玩偶数据
const rawDollData = localStorage.getItem('customDollData');
let dollData = JSON.parse(rawDollData) || {}; 

// 2. 读取用户数据
const rawProfile = localStorage.getItem('userProfile');
let userProfile = JSON.parse(rawProfile) || {}; 

// 3. 合并数据
const agentData = {
    ...dollData, 
    userStage: userProfile.stage,   
    userGender: userProfile.gender  
};

// 4. 实例化智能体
const agent = new DollAgent(agentData);

// 5. 更新 UI 文字
document.getElementById('displayDollName').innerText = agent.name;
document.getElementById('displayDollPersonality').innerText = `性格核心: ${agent.personality} | 模式: ${agent.mode}`;

// ==========================================
// 第三部分：3D 场景构建 (保持不变)
// ==========================================

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// 背景环境
const textureLoader = new THREE.TextureLoader();
textureLoader.load('./textures/planet.jpg', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = texture; 
    scene.environmentIntensity = 0.5;
});

// 相机
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.5, 8); 
camera.lookAt(0, 0, 0);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

// 控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI / 2 - 0.1; 

// 灯光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
scene.add(ambientLight);
const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(5, 5, 5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
scene.add(mainLight);
const rimLight = new THREE.DirectionalLight(0x8a6bc9, 2.0);
rimLight.position.set(-5, 0, -5);
scene.add(rimLight);

// 科技底座
const platformGeo = new THREE.CylinderGeometry(2, 2, 0.2, 32);
const platformMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.2, metalness: 0.8, emissive: 0x8a6bc9, emissiveIntensity: 0.2 });
const platform = new THREE.Mesh(platformGeo, platformMat);
platform.position.y = -1.6;
platform.receiveShadow = true;
scene.add(platform);

const ringGeo = new THREE.TorusGeometry(2.1, 0.05, 16, 100);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.position.y = -1.6;
ring.rotation.x = Math.PI / 2;
scene.add(ring);

// 加载模型
const loader = new GLTFLoader();
const modelFiles = ['doll.glb', 'doll1.glb', 'doll2.glb', 'doll3.glb', 'doll4.glb', 'doll5.glb'];

// ✅ 修正：根据 agent 中存储的 imageIndex 动态选择模型文件
// 如果 agent.imageIndex 越界或未定义，我们使用默认值 4 (doll4.glb)
const fileIndex = agent.imageIndex !== undefined && agent.imageIndex >= 0 && agent.imageIndex < modelFiles.length 
                  ? agent.imageIndex 
                  : 4; 
                  
const selectedFileName = modelFiles[fileIndex]; 
console.log(`正在加载模型: ${selectedFileName} (对应索引: ${fileIndex})`);

let dollModel = null;
loader.load(`./model/${selectedFileName}`, (gltf) => {
    dollModel = gltf.scene;
    // ... (保持不变：模型缩放、位置、阴影等)
    dollModel.position.set(0, -1.5, 0); 
    dollModel.scale.set(2.8, 2.8, 2.8);
    // ... (保持不变)
    scene.add(dollModel);
}, undefined, (error) => {
    console.error('3D 模型加载失败:', error);
    addMessage(`模型 ${selectedFileName} 加载失败，请检查文件是否损坏。`, 'ai');
});


// 动画
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    ring.rotation.z -= 0.005;
    if (dollModel) {
        dollModel.position.y = -1.5 + Math.sin(time * 2) * 0.02;
    }
    controls.update();
    renderer.render(scene, camera);
}
animate();

// main.js, 约 260 行附近
window.addEventListener('resize', () => {
    // ⚠️ 修正：确保使用 canvas-container 的尺寸
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});
// ==========================================
// 第四部分：交互事件绑定
// ==========================================

const input = document.querySelector('.main-input'); 
const chatWindow = document.getElementById('chatWindow');
const switchBtn = document.getElementById('switchBtn');

// 1. 切换伴伴按钮
if (switchBtn) {
    switchBtn.addEventListener('click', () => {
        window.location.href = 'doll_select.html';
    });
}

// 2. 教育按钮跳转（绝对路径：从项目根目录指向教育页面）
if (document.getElementById("btn-edu")) {
    document.getElementById("btn-edu").addEventListener("click", function() {
        // 注意：路径开头的 / 表示项目根目录，后面跟着你的实际目录结构
        window.location.href = "/yemian/jiaoyu/jiaoyu/index.html";
    });
}

// 3. 乐园按钮跳转（绝对路径：从项目根目录指向乐园页面）
if (document.getElementById("btn-game")) {
    document.getElementById("btn-game").addEventListener("click", function() {
        window.location.href = "/yemian/ai-game/ai-game/index.html";
    });
}

// 4. 聊天输入 (回车发送)
if (input) {
    input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && input.value.trim() !== "") {
            const userText = input.value;
            
            addMessage(userText, 'user');
            input.value = '';

            const loadingMsg = addMessage("思考中...", 'ai', true);

            const reply = await agent.chatWithAI(userText); // ✅ 修正：使用 userText 变量      
            loadingMsg.remove();
            addMessage(reply, 'ai');
        }
    });
}

// 辅助函数：添加消息到聊天窗
function addMessage(text, type, returnElement = false) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerText = text;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    if (returnElement) return div;
}

// ==========================================
// 第五部分：★ 新增：小知识推送
// ==========================================

// 迷你知识库
const tipDatabase = {
    kindergarten: {
        boy: [
            "你知道吗？霸王龙虽然很凶猛，但它的前爪非常小哦！🦖",
            "消防车为什么是红色的？因为红色在很远的地方就能被看到！🚒",
            "多吃蔬菜可以让你变得像超人一样有力气！🥦"
        ],
        girl: [
            "小兔子睡觉时是睁着眼睛的（虽然它们有眼睑）！🐰",
            "蝴蝶是用脚来品尝花蜜的甜味哦！🦋",
            "星星为什么会闪烁？是大气层在和它们玩捉迷藏！✨"
        ]
    },
    elementary: {
        boy: [
            "地球是太阳系中唯一已知有液态水的行星。💧",
            "光从太阳到达地球大约需要 8 分钟。☀️",
            "世界上最大的动物是蓝鲸，它的心脏和一辆小汽车一样大！🐳"
        ],
        girl: [
            "海豚会用“名字”（特定的哨声）来互相称呼。🐬",
            "猫头鹰的眼球是不能转动的，但它的脖子可以旋转270度！🦉",
            "彩虹其实是一个完整的圆形，我们只是在地面上看到了半圆。🌈"
        ]
    }
};

function showKnowledgeTip() {
    const tipElement = document.getElementById('knowledgeTip');
    if (!tipElement) return;

    const stage = agent.userStage || 'kindergarten';
    const gender = agent.userGender || 'boy';

    // 健壮性检查，防止 localstorage 为空时
    const tips = (tipDatabase[stage] && tipDatabase[stage][gender]) 
        ? tipDatabase[stage][gender] 
        : tipDatabase.kindergarten.boy;

    const randomIndex = Math.floor(Math.random() * tips.length);
    const randomTip = tips[randomIndex];

    tipElement.innerText = `💡 伴伴小知识：${randomTip}`;
}

// ✅ 修正：修复了语法错误
window.onload = () => {
    showKnowledgeTip();
};