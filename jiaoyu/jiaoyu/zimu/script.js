// 等待整个 HTML 文档加载完毕后再执行
document.addEventListener('DOMContentLoaded', () => {
    // --- 全局变量和 DOM 元素 ---
    const animalSection = document.getElementById('animal-section');
    const letterSection = document.getElementById('letter-section');
    const matchSection = document.getElementById('match-section');
    const btnAnimals = document.getElementById('btn-animals');
    const btnLetters = document.getElementById('btn-letters');
    const btnMatch = document.getElementById('btn-match');
    const animalGrid = document.getElementById('animal-grid');
    const letterGrid = document.getElementById('letter-grid');
    const animalSuccessMsg = document.getElementById('animal-success');
    const btnResetAnimals = document.getElementById('btn-reset-animals');
    const currentLetterDisplay = document.getElementById('current-letter-display');
    const wordPool = document.getElementById('word-pool');
    const imageArea = document.getElementById('image-area');
    const matchSuccessMsg = document.getElementById('match-success');
    const btnResetMatch = document.getElementById('btn-reset-match');
    const connectionLayer = document.getElementById('connection-layer');

    let draggedWordElement = null;
    let currentSpeech = null;
    let correctConnections = new Set();

    // 动物数据 - 请将图片路径替换为你自己的本地路径
    const animals = [
        { name: 'cat', image: 'tupian/cat.jpg' },
        { name: 'dog', image: 'tupian/dog.jpeg' },
        { name: 'bird', image: 'tupian/bird.jpeg' },
        { name: 'fish', image: 'tupian/fish.jpeg' },
        { name: 'rabbit', image: 'tupian/rabbit.jpeg' },
        { name: 'duck', image: 'tupian/duck.jpeg' },
        { name: 'horse', image: 'tupian/ma.jpeg' },
        { name: 'cow', image: 'tupian/niu.jpeg' }
    ];

    // --- 工具函数 ---
    function speak(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('浏览器不支持语音合成。');
            return;
        }
        if (currentSpeech) {
            window.speechSynthesis.cancel(currentSpeech);
        }
        const speech = new SpeechSynthesisUtterance();
        speech.text = text;
        speech.lang = 'en-US';
        speech.rate = 0.9;
        speech.pitch = 1.2;
        currentSpeech = speech;
        speech.onend = () => { currentSpeech = null; };
        speech.onerror = () => { currentSpeech = null; };
        window.speechSynthesis.speak(speech);
    }
    
    function clearAllConnections() {
        while (connectionLayer.firstChild) {
            connectionLayer.removeChild(connectionLayer.firstChild);
        }
    }

    function createConnection(startEl, endEl, isCorrect) {
        const startRect = startEl.getBoundingClientRect();
        const endRect = endEl.getBoundingClientRect();
        const containerRect = connectionLayer.getBoundingClientRect();

        const startX = startRect.left + startRect.width / 2 - containerRect.left;
        const startY = startRect.bottom - containerRect.top;
        const endX = endRect.left + endRect.width / 2 - containerRect.left;
        const endY = endRect.top - containerRect.top;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.classList.add('connection-line');
        line.classList.add(isCorrect ? 'correct-line' : 'incorrect-line');

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute('id', isCorrect ? 'correct-arrowhead' : 'incorrect-arrowhead');
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '5');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto-start-reverse');
        
        const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        arrowPath.setAttribute('fill', isCorrect ? '#28a745' : '#dc3545');
        
        marker.appendChild(arrowPath);
        defs.appendChild(marker);
        connectionLayer.appendChild(defs);

        line.setAttribute('marker-end', `url(#${isCorrect ? 'correct-arrowhead' : 'incorrect-arrowhead'})`);
        connectionLayer.appendChild(line);

        if (!isCorrect) {
            setTimeout(() => {
                if (line && line.parentNode) line.parentNode.removeChild(line);
            }, 1500);
        }
        
        return line;
    }
    
    function showSuccessAnimation() {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);

        const congratsMsg = document.createElement('div');
        congratsMsg.className = 'congrats-message';
        congratsMsg.textContent = '太棒了！全部正确！';
        document.body.appendChild(congratsMsg);

        speak("Congratulations! You've matched all the words correctly! You're amazing!");

        setTimeout(() => {
            if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            if (congratsMsg && congratsMsg.parentNode) congratsMsg.parentNode.removeChild(congratsMsg);
        }, 4000);
    }

    // --- 动物乐园模块 ---
    function initAnimalGame() {
        animalGrid.innerHTML = '';
        animalSuccessMsg.style.display = 'none';
        const shuffledAnimals = [...animals].sort(() => Math.random() - 0.5);
        shuffledAnimals.forEach(animal => {
            const card = document.createElement('div');
            card.className = 'animal-card';
            card.innerHTML = `
                <img src="${animal.image}" alt="${animal.name}">
                <div class="word">${animal.name}</div>
            `;
            const img = card.querySelector('img');
            img.addEventListener('click', () => {
                img.style.transform = 'scale(1.1)';
                setTimeout(() => { img.style.transform = 'scale(1)'; }, 200);
                setTimeout(() => { speak(animal.name); }, 50);
            });
            const word = card.querySelector('.word');
            word.addEventListener('click', () => {
                if (!word.classList.contains('clicked')) {
                    word.classList.add('clicked');
                    checkAllAnimalsClicked();
                }
            });
            animalGrid.appendChild(card);
        });
    }

    function checkAllAnimalsClicked() {
        const allWords = document.querySelectorAll('.animal-card .word');
        const allClicked = Array.from(allWords).every(word => word.classList.contains('clicked'));
        if (allClicked) {
            setTimeout(() => {
                animalSuccessMsg.style.display = 'block';
                speak('Great job! You know all the animals!');
            }, 500);
        }
    }

    // --- 字母认知模块 ---
    function initLetterGame() {
        letterGrid.innerHTML = '';
        currentLetterDisplay.textContent = '点击下面的字母开始学习';
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            const card = document.createElement('div');
            card.className = 'letter-card';
            card.textContent = letter;
            card.addEventListener('click', () => {
                currentLetterDisplay.textContent = letter;
                card.style.backgroundColor = '#ff6b6b';
                setTimeout(() => { speak(letter); }, 50);
                setTimeout(() => { card.style.backgroundColor = '#ffd166'; }, 300);
            });
            letterGrid.appendChild(card);
        }
    }

    // --- 单词匹配模块 ---
    function initMatchGame() {
        wordPool.innerHTML = '';
        imageArea.innerHTML = '';
        clearAllConnections();
        matchSuccessMsg.style.display = 'none';
        correctConnections.clear();

        const shuffledAnimals = [...animals].sort(() => Math.random() - 0.5);
        const selectedAnimals = shuffledAnimals.slice(0, 3);
        const wordPoolAnimals = [...selectedAnimals].sort(() => Math.random() - 0.5);

        selectedAnimals.forEach(animal => {
            const container = document.createElement('div');
            container.className = 'match-image-container';
            container.setAttribute('data-name', animal.name);
            container.innerHTML = `
                <img src="${animal.image}" alt="${animal.name}" class="match-image">
                <div class="match-image-name">${animal.name}</div>
            `;
            imageArea.appendChild(container);
            
            container.addEventListener('dragover', handleDragOver);
            container.addEventListener('dragleave', handleDragLeave);
            container.addEventListener('drop', handleDrop);
        });

        wordPoolAnimals.forEach(animal => {
            const wordDiv = document.createElement('div');
            wordDiv.className = 'word-drag';
            wordDiv.textContent = animal.name;
            wordDiv.setAttribute('draggable', 'true');
            wordDiv.setAttribute('data-word', animal.name);

            wordDiv.addEventListener('dragstart', (e) => {
                draggedWordElement = e.target;
                e.target.style.opacity = '0.5';
            });
            
            wordDiv.addEventListener('dragend', (e) => {
                e.target.style.opacity = '1';
                draggedWordElement = null;
            });

            wordPool.appendChild(wordDiv);
        });
    }

    // --- 拖拽事件处理 ---
    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (!draggedWordElement) return;

        const droppedWord = draggedWordElement.getAttribute('data-word');
        const targetAnimalName = e.currentTarget.getAttribute('data-name');
        const isCorrect = droppedWord === targetAnimalName;

        if (correctConnections.has(targetAnimalName)) return;

        createConnection(draggedWordElement, e.currentTarget, isCorrect);

        if (isCorrect) {
            speak('Correct!');
            correctConnections.add(targetAnimalName);
            e.currentTarget.style.pointerEvents = 'none';
            
            if (correctConnections.size === document.querySelectorAll('.match-image-container').length) {
                setTimeout(showSuccessAnimation, 500);
            }
        } else {
            speak('Try again.');
        }
    }

    // --- 事件监听 ---
    btnAnimals.addEventListener('click', () => {
        animalSection.classList.remove('hidden');
        letterSection.classList.add('hidden');
        matchSection.classList.add('hidden');
        initAnimalGame();
    });

    btnLetters.addEventListener('click', () => {
        animalSection.classList.add('hidden');
        letterSection.classList.remove('hidden');
        matchSection.classList.add('hidden');
        initLetterGame();
    });

    btnMatch.addEventListener('click', () => {
        animalSection.classList.add('hidden');
        letterSection.classList.add('hidden');
        matchSection.classList.remove('hidden');
        initMatchGame();
    });

    btnResetAnimals.addEventListener('click', initAnimalGame);
    btnResetMatch.addEventListener('click', initMatchGame);

    // --- 初始化 ---
    initAnimalGame();
});