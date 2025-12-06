const orchardContainer = document.getElementById('orchardContainer');
const appleCountSpan = document.getElementById('apple-count');
const celebrationDiv = document.getElementById('celebration');
const basket = document.getElementById('basket');
const collectedApplesContainer = document.getElementById('collectedApples');

// 游戏配置
const MIN_TREES = 3;
const MAX_TREES = 3;
const MIN_APPLES = 2;
const MAX_APPLES = 6;

// 游戏状态
let collectedApples = 0;
let totalApplesToCollect = 0;

// 语音合成函数
function speakText(text) {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.lang = 'zh-CN';
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    
    setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        const chineseVoice = voices.find(voice => 
            voice.lang.includes('zh') || voice.name.includes('Chinese')
        );
        if (chineseVoice) speech.voice = chineseVoice;
        window.speechSynthesis.speak(speech);
    }, 100);
}

// 初始化游戏
function initGame() {
    collectedApples = 0;
    totalApplesToCollect = 0;
    appleCountSpan.textContent = '0';
    orchardContainer.innerHTML = '';
    celebrationDiv.style.display = 'none'; // 隐藏庆祝动画
    collectedApplesContainer.innerHTML = '';
    
    const numOfTrees = 3;
    
    for (let i = 0; i < numOfTrees; i++) {
        const randomAppleCount = Math.floor(Math.random() * (MAX_APPLES - MIN_APPLES + 1)) + MIN_APPLES;
        totalApplesToCollect += randomAppleCount;
        
        const tree = document.createElement('div');
        tree.classList.add('apple-tree');
        
        const treeImage = document.createElement('div');
        treeImage.classList.add('tree-image');
        tree.appendChild(treeImage);
        
        for (let j = 0; j < randomAppleCount; j++) {
            const apple = document.createElement('div');
            apple.classList.add('apple');
            
            const randomX = 70 + Math.random() * 120;
            const randomY = 80 + Math.random() * 220;
            
            apple.style.left = `${randomX}px`;
            apple.style.top = `${randomY}px`;
            
            tree.appendChild(apple);
        }
        
        orchardContainer.appendChild(tree);
    }
}

// 获取元素在页面中的绝对位置
function getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY
    };
}

// 设置事件监听
function setupEventListeners() {
    orchardContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('apple') && !event.target.classList.contains('falling')) {
            event.target.classList.add('falling');
            
            const applePos = getElementPosition(event.target);
            const basketPos = getElementPosition(basket);
            
            const dx = basketPos.x - applePos.x + 70;
            const dy = basketPos.y - applePos.y + 70;
            
            event.target.style.transform = `translate(${dx}px, ${dy}px)`;
            
            collectedApples++;
            speakText(collectedApples.toString());
            appleCountSpan.textContent = collectedApples;
            
            setTimeout(() => {
                const basketApple = document.createElement('div');
                basketApple.classList.add('apple');
                collectedApplesContainer.appendChild(basketApple);
            }, 800);
            
            // 检查是否收集完所有苹果
            if (collectedApples === totalApplesToCollect) {
                setTimeout(showCelebration, 1000); // 延迟显示庆祝动画
            }
        }
    });
}

// 显示庆祝界面
function showCelebration() {
    speakText("恭喜你，收集了所有的苹果！");
    celebrationDiv.style.display = 'flex'; // 显示庆祝动画容器
    
    // 创建多个气球
    for (let i = 0; i < 15; i++) {
        const balloon = document.createElement('div');
        balloon.classList.add('balloon');
        
        // 随机位置和大小
        const randomX = Math.random() * 100;
        balloon.style.left = `${randomX}%`;
        const randomSize = 0.5 + Math.random() * 1;
        balloon.style.transform = `scale(${randomSize})`;
        
        celebrationDiv.appendChild(balloon);
    }
    
    // 5秒后重置游戏
    setTimeout(() => {
        celebrationDiv.style.display = 'none';
        celebrationDiv.innerHTML = ''; // 清空气球
        initGame();
    }, 5000);
}

window.speechSynthesis.onvoiceschanged = () => {};

// 开始游戏
window.addEventListener('load', () => {
    initGame();
    setupEventListeners();
});