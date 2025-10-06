(function(){
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const changeImgBtn = document.getElementById('changeImgBtn');
  const toggleMusicBtn = document.getElementById('toggleMusic');
  const boardEl = document.getElementById('board');
  const piecesEl = document.getElementById('pieces');
  const message = document.getElementById('message');
  const timerEl = document.getElementById('timer');
  const bgm = document.getElementById('bgm');

  let state = {
    imageUrl: '',
    grid: 3,
    startedAt: null,
    timerInterval: null,
    cells: [],
    correctCount: 0,
    draggedPiece: null,
    currentLevel: 0,
    challengeMode: true
  };
  
  let musicPlaying = false;
  
  // 挑战关卡配置：3关，难度递增
  const challengeLevels = [
    { level: 1, image: '01.jpg', grid: 3 },
    { level: 2, image: '02.jpg', grid: 4 },
    { level: 3, image: '03.jpg', grid: 5 }
  ];
  
  // 初始化游戏界面
  function loadImages(){
    changeImgBtn.style.display = 'none';
  }
  
  // 开始挑战模式
  function startGame(){
    state.currentLevel = 1;
    startLevel(state.currentLevel);
  }
  
  // 开始指定关卡
  function startLevel(levelNum){
    const levelConfig = challengeLevels[levelNum - 1];
    if (!levelConfig) return;
    
    state.imageUrl = `/pic/${levelConfig.image}`;
    state.grid = levelConfig.grid;
    message.textContent = `第 ${levelNum} 关 - ${levelConfig.grid}x${levelConfig.grid} 拼图`;
    
    buildBoard();
    buildPieces();
    startTimer();
    restartBtn.disabled = false;
  }
  
  // 验证拼图完成情况
  function validate(){
    const n = state.grid;
    let correct = 0;
    state.cells.forEach((cell, i) => {
      const piece = cell.querySelector('.piece');
      if(piece && Number(piece.dataset.index) === i){
        correct++;
      }
    });
    state.correctCount = correct;
    
    if(correct === n * n){
      const duration = Date.now() - state.startedAt;
      stopTimer();
      message.textContent = `第 ${state.currentLevel} 关完成！用时 ${formatTime(duration)}`;
      logFinish(duration);
      restartBtn.disabled = true;
      showFireworks();
      
      setTimeout(() => {
        if(state.currentLevel < challengeLevels.length){
          state.currentLevel++;
          startLevel(state.currentLevel);
        } else {
          message.textContent = '恭喜通过全部关卡！';
        }
      }, 3000);
    }
  }
  
  // 烟花庆祝效果
  function showFireworks(){
    const fireworksContainer = document.createElement('div');
    fireworksContainer.style.position = 'fixed';
    fireworksContainer.style.top = '0';
    fireworksContainer.style.left = '0';
    fireworksContainer.style.width = '100%';
    fireworksContainer.style.height = '100%';
    fireworksContainer.style.background = 'rgba(0,0,0,0.3)';
    fireworksContainer.style.zIndex = '1000';
    fireworksContainer.style.pointerEvents = 'none';
    
    for(let i = 0; i < 50; i++){
      const firework = document.createElement('div');
      firework.style.position = 'absolute';
      firework.style.left = `${Math.random() * 100}%`;
      firework.style.top = `${Math.random() * 100}%`;
      firework.style.width = '10px';
      firework.style.height = '10px';
      firework.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
      firework.style.borderRadius = '50%';
      firework.style.animation = 'firework 1s ease-out';
      fireworksContainer.appendChild(firework);
    }
    
    document.body.appendChild(fireworksContainer);
    
    // 添加动画样式
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes firework {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      document.body.removeChild(fireworksContainer);
      document.head.removeChild(style);
    }, 3000);
  }
  
  function formatTime(ms){
    const sec = Math.floor(ms / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateTimer(){
    if(!state.startedAt) return;
    const ms = Date.now() - state.startedAt;
    timerEl.textContent = `用时：${formatTime(ms)}`;
  }

  function startTimer(){
    stopTimer();
    state.startedAt = Date.now();
    state.timerInterval = setInterval(updateTimer, 500);
  }

  function stopTimer(){
    if(state.timerInterval){
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function buildBoard(){
    const n = state.grid;
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    state.cells = [];
    for(let i = 0; i < n * n; i++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      setupDropZone(cell);
      boardEl.appendChild(cell);
      state.cells.push(cell);
    }
  }

  function buildPieces(){
    const n = state.grid;
    piecesEl.innerHTML = '';
    setupDropZone(piecesEl);

    const indices = Array.from({length: n*n}, (_, i) => i);
    shuffle(indices);

    indices.forEach((idx) => {
      const piece = createPiece(idx, n);
      setupDraggable(piece);
      piecesEl.appendChild(piece);
    });
  }

  function createPiece(idx, n){
    const piece = document.createElement('div');
    piece.className = 'piece';
    piece.dataset.index = idx;
    piece.draggable = true;

    const row = Math.floor(idx / n);
    const col = idx % n;
    piece.style.backgroundImage = `url(${state.imageUrl})`;
    piece.style.backgroundPosition = `${col * 100 / (n - 1)}% ${row * 100 / (n - 1)}%`;
    piece.style.backgroundSize = `${n*100}% ${n*100}%`;

    return piece;
  }

  function setupDraggable(piece) {
    piece.addEventListener('dragstart', (e) => {
      state.draggedPiece = piece;
      piece.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    piece.addEventListener('dragend', (e) => {
      piece.classList.remove('dragging');
      state.draggedPiece = null;
    });
  }

  function setupDropZone(element) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', (e) => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      
      if (!state.draggedPiece) return;

      if (element === piecesEl) {
        piecesEl.appendChild(state.draggedPiece);
      } else if (element.classList.contains('cell')) {
        const existing = element.querySelector('.piece');
        if (existing) {
          const draggedParent = state.draggedPiece.parentNode;
          if (draggedParent === piecesEl) {
            piecesEl.appendChild(existing);
          } else {
            draggedParent.appendChild(existing);
          }
        }
        element.appendChild(state.draggedPiece);
        validate();
      }
    });
  }

  function shuffle(arr){
    for(let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function logFinish(duration){
    try{
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginTime: new Date(state.startedAt).toISOString(),
          gameDurationMs: duration,
          image: state.imageUrl,
          difficulty: state.grid,
        })
      });
    }catch(e){
      console.warn('log failed', e);
    }
  }

  function restartGame(){
    message.textContent = '';
    buildBoard();
    buildPieces();
    startTimer();
  }

  // 音乐控制
  toggleMusicBtn.addEventListener('click', () => {
    if(musicPlaying){
      bgm.pause();
      toggleMusicBtn.textContent = '开启音乐';
    } else {
      bgm.play();
      toggleMusicBtn.textContent = '关闭音乐';
    }
    musicPlaying = !musicPlaying;
  });

  // 事件监听器
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', restartGame);

  // 初始化
  loadImages();
})();