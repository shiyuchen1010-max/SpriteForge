/**
 * 状态管理模块
 * 封装所有全局状态，提供统一的访问和修改接口
 */
const StateManager = (function() {
  // 私有状态
  const state = {
    srcImg: null,
    frames: [],
    selId: null,
    zoom: 1,
    nextId: 0,
    imageStore: {},
    currentImageId: null,
    imageIdCounter: 0,
    animPlaying: false,
    animIdx: 0,
    animTimer: null,
    exportMode: '',
    ctxFrameId: null,
    interaction: null,
    _aData: null,
    _aW: 0,
    _aH: 0,
    lockedHeight: 0,
    lockedBottom: 0,
    lockedTop: 0,
    bgRemoveActive: false,
    bgOriginalData: null,
    bgPickedColor: null,
    bgPreviewData: null,
    optBackup: null,
    optPreviewData: null,
    optTrimmedData: null,
    optAnimTimer: null,
    optAnimIdx: 0,
    optAnimPlaying: false,
    manualAnchor: null,
    anchorColorIdx: 0,
    anchorPreviewIdx: 0,
    optInterpBackup: null
  };

  // 公共方法
  return {
    // 获取状态
    get: function(key) {
      return state[key];
    },
    
    // 设置状态
    set: function(key, value) {
      state[key] = value;
    },
    
    // 获取所有状态
    getAll: function() {
      return { ...state };
    },
    
    // 重置状态
    reset: function() {
      Object.keys(state).forEach(key => {
        if (Array.isArray(state[key])) {
          state[key] = [];
        } else if (typeof state[key] === 'object' && state[key] !== null) {
          state[key] = {};
        } else {
          state[key] = null;
        }
      });
      state.zoom = 1;
      state.nextId = 0;
      state.imageIdCounter = 0;
      state.lockedHeight = 0;
      state.lockedBottom = 0;
      state.lockedTop = 0;
      state.anchorColorIdx = 0;
      state.anchorPreviewIdx = 0;
    },
    
    // 保存当前图像状态
    saveCurrentImage: function() {
      if (!state.currentImageId || !state.srcImg) return;
      if (!state.imageStore[state.currentImageId]) return;
      state.imageStore[state.currentImageId] = {
        name: state.imageStore[state.currentImageId].name || 'Image',
        img: state.srcImg,
        frames: JSON.parse(JSON.stringify(state.frames)),
        selId: state.selId,
        nextId: state.nextId,
        zoom: state.zoom,
        lockedHeight: state.lockedHeight,
        lockedBottom: state.lockedBottom,
        lockedTop: state.lockedTop
      };
    },
    
    // 添加图像到存储
    addImageToStore: function(name, img) {
      this.saveCurrentImage();
      const id = 'img_' + (++state.imageIdCounter);
      state.currentImageId = id;
      state.imageStore[id] = {
        name,
        img,
        frames: [],
        selId: null,
        nextId: 0,
        zoom: 1,
        lockedHeight: 0,
        lockedBottom: 0,
        lockedTop: 0
      };
      state.srcImg = img;
      state.frames = [];
      state.selId = null;
      state.nextId = 0;
      state.lockedHeight = 0;
      state.lockedBottom = 0;
      state.lockedTop = 0;
      return id;
    },
    
    // 切换图像
    switchImage: function(id) {
      if (id === state.currentImageId) return;
      this.saveCurrentImage();
      const data = state.imageStore[id];
      if (!data) return;
      state.currentImageId = id;
      state.srcImg = data.img;
      state.frames = JSON.parse(JSON.stringify(data.frames));
      state.selId = data.selId;
      state.nextId = data.nextId;
      state.zoom = data.zoom;
      state.lockedHeight = data.lockedHeight;
      state.lockedBottom = data.lockedBottom;
      state.lockedTop = data.lockedTop;
    },
    
    // 关闭图像
    closeImage: function(id) {
      if (id !== state.currentImageId) this.saveCurrentImage();
      delete state.imageStore[id];
      const ids = Object.keys(state.imageStore);
      if (ids.length === 0) {
        this.reset();
        return true;
      }
      if (id === state.currentImageId) {
        const newId = ids[ids.length - 1];
        const data = state.imageStore[newId];
        state.currentImageId = newId;
        state.srcImg = data.img;
        state.frames = JSON.parse(JSON.stringify(data.frames));
        state.selId = data.selId;
        state.nextId = data.nextId;
        state.zoom = data.zoom;
        state.lockedHeight = data.lockedHeight;
        state.lockedBottom = data.lockedBottom;
        state.lockedTop = data.lockedTop;
      }
      return false;
    }
  };
})();

// 向后兼容 - 保留原有全局变量名称
let srcImg = StateManager.get('srcImg');
let frames = StateManager.get('frames');
let selId = StateManager.get('selId');
let zoom = StateManager.get('zoom');
let nextId = StateManager.get('nextId');
let imageStore = StateManager.get('imageStore');
let currentImageId = StateManager.get('currentImageId');
let imageIdCounter = StateManager.get('imageIdCounter');
let animPlaying = StateManager.get('animPlaying');
let animIdx = StateManager.get('animIdx');
let animTimer = StateManager.get('animTimer');
let exportMode = StateManager.get('exportMode');
let ctxFrameId = StateManager.get('ctxFrameId');
let interaction = StateManager.get('interaction');
let _aData = StateManager.get('_aData');
let _aW = StateManager.get('_aW');
let _aH = StateManager.get('_aH');
let lockedHeight = StateManager.get('lockedHeight');
let lockedBottom = StateManager.get('lockedBottom');
let lockedTop = StateManager.get('lockedTop');
let bgRemoveActive = StateManager.get('bgRemoveActive');
let bgOriginalData = StateManager.get('bgOriginalData');
let bgPickedColor = StateManager.get('bgPickedColor');
let bgPreviewData = StateManager.get('bgPreviewData');
let optBackup = StateManager.get('optBackup');
let optPreviewData = StateManager.get('optPreviewData');
let optTrimmedData = StateManager.get('optTrimmedData');
let optAnimTimer = StateManager.get('optAnimTimer');
let optAnimIdx = StateManager.get('optAnimIdx');
let optAnimPlaying = StateManager.get('optAnimPlaying');
let manualAnchor = StateManager.get('manualAnchor');
let anchorColorIdx = StateManager.get('anchorColorIdx');
let anchorPreviewIdx = StateManager.get('anchorPreviewIdx');
let optInterpBackup = StateManager.get('optInterpBackup');
