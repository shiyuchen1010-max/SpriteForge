// ===== Auto Save Functionality =====
const AUTO_SAVE_KEY = 'spriteforge_autosave';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
let autoSaveTimer = null;

function saveProjectState() {
  try {
    if (!srcImg || !currentImageId) return;
    
    const state = {
      imageStore: {},
      currentImageId: currentImageId,
      timestamp: Date.now()
    };
    
    for (const [id, data] of Object.entries(imageStore)) {
      const canvas = document.createElement('canvas');
      canvas.width = data.img.width;
      canvas.height = data.img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(data.img, 0, 0);
      
      state.imageStore[id] = {
        name: data.name,
        imgData: canvas.toDataURL(),
        frames: data.frames,
        selId: data.selId,
        nextId: data.nextId,
        zoom: data.zoom,
        lockedHeight: data.lockedHeight,
        lockedBottom: data.lockedBottom,
        lockedTop: data.lockedTop
      };
    }
    
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Auto save failed:', e);
  }
}

function loadProjectState() {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (!saved) return false;
    
    const state = JSON.parse(saved);
    if (!state.imageStore || Object.keys(state.imageStore).length === 0) return false;
    
    const loadPromises = [];
    
    for (const [id, data] of Object.entries(state.imageStore)) {
      const promise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          imageStore[id] = {
            name: data.name,
            img: img,
            frames: data.frames,
            selId: data.selId,
            nextId: data.nextId,
            zoom: data.zoom,
            lockedHeight: data.lockedHeight,
            lockedBottom: data.lockedBottom,
            lockedTop: data.lockedTop
          };
          resolve();
        };
        img.src = data.imgData;
      });
      loadPromises.push(promise);
    }
    
    Promise.all(loadPromises).then(() => {
      if (state.currentImageId && imageStore[state.currentImageId]) {
        switchImage(state.currentImageId);
      } else if (Object.keys(imageStore).length > 0) {
        const firstId = Object.keys(imageStore)[0];
        switchImage(firstId);
      }
      
      const timeAgo = Date.now() - state.timestamp;
      const minutes = Math.floor(timeAgo / 60000);
      const hours = Math.floor(minutes / 60);
      
      let timeText = '';
      if (hours > 0) {
        timeText = `${hours}小时前`;
      } else if (minutes > 0) {
        timeText = `${minutes}分钟前`;
      } else {
        timeText = '刚刚';
      }
      
      toast(`已恢复自动保存的项目 (${timeText})`);
    });
    
    return true;
  } catch (e) {
    console.error('Auto save load failed:', e);
    return false;
  }
}

function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(saveProjectState, AUTO_SAVE_INTERVAL);
}

function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}

function clearAutoSave() {
  localStorage.removeItem(AUTO_SAVE_KEY);
  toast('已清除自动保存数据');
}

function hasAutoSaveData() {
  try {
    return localStorage.getItem(AUTO_SAVE_KEY) !== null;
  } catch (e) {
    return false;
  }
}
