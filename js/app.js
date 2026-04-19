// ===== State =====
let srcImg = null, frames = [], selId = null, zoom = 1, nextId = 0;

// ===== Navigation Functions =====
function backToWelcome() {
  // 显示welcomePage，隐藏所有其他页面
  document.getElementById('welcomePage').style.display = 'flex';
  document.getElementById('editPage').style.display = 'none';
  document.getElementById('extractPage').style.display = 'none';
}

function startFrameExtract() {
  // 隐藏welcomePage，显示extractPage
  document.getElementById('welcomePage').style.display = 'none';
  document.getElementById('editPage').style.display = 'none';
  document.getElementById('extractPage').style.display = 'flex';
  // 初始化帧提取界面
  initExtractPage();
}

function startSpriteEdit() {
  // 隐藏welcomePage，显示editPage
  document.getElementById('welcomePage').style.display = 'none';
  document.getElementById('editPage').style.display = 'flex';
  document.getElementById('extractPage').style.display = 'none';
}

function initExtractPage() {
  // 初始化帧提取页面，调用frame-extract.js中的渲染函数
  if (window.renderExtractSources) {
    window.renderExtractSources();
  }
  if (window.renderExtractTargets) {
    window.renderExtractTargets();
  }
  if (window.renderGridOverlay) {
    window.renderGridOverlay();
  }
}

// ===== Toast Function =====
function toast(msg, dur = 2000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show';
  setTimeout(() => t.className = 'toast', dur);
}

// ===== Multi-Image Management =====
let imageStore = {}; // { id: { name, img, frames, selId, nextId, zoom, lockedHeight, lockedBottom, lockedTop } }
let currentImageId = null;
let imageIdCounter = 0;

function saveCurrentImage() {
  if (!currentImageId || !srcImg) return;
  // Don't overwrite if already deleted from store
  if (!imageStore[currentImageId]) return;
  imageStore[currentImageId] = {
    name: imageStore[currentImageId].name || 'Image',
    img: srcImg,
    frames: JSON.parse(JSON.stringify(frames)),
    selId, nextId, zoom,
    lockedHeight, lockedBottom, lockedTop
  };
}

function switchImage(id) {
  if (id === currentImageId) return;
  saveCurrentImage();
  const data = imageStore[id];
  if (!data) return;
  currentImageId = id;
  srcImg = data.img;
  frames = JSON.parse(JSON.stringify(data.frames));
  selId = data.selId;
  nextId = data.nextId;
  zoom = data.zoom;
  lockedHeight = data.lockedHeight;
  lockedBottom = data.lockedBottom;
  lockedTop = data.lockedTop;
  // Restore lock checkbox UI
  document.getElementById('lockBottomChk').checked = false;
  document.getElementById('lockTopChk').checked = false;
  document.getElementById('lockHChk').checked = false;
  document.getElementById('lockFixedChk').checked = false;
  if (lockedBottom > 0) document.getElementById('lockBottomChk').checked = true;
  if (lockedTop > 0) document.getElementById('lockTopChk').checked = true;
  if (lockedHeight > 0) { document.getElementById('lockHChk').checked = true; document.getElementById('lockHInput').value = lockedHeight; }
  onLockCheckChange();
  // Update UI
  document.getElementById('zoomVal').textContent = zoom + 'x';
  document.getElementById('imgInfo').textContent = `${srcImg.width}×${srcImg.height}`;
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('canvasArea').style.display = '';
  renderCanvas(); renderRects(); updateAll();
  renderImageTabs();
}

function closeImage(id) {
  // Save current image before deleting (only if closing a different image)
  if (id !== currentImageId) saveCurrentImage();
  delete imageStore[id];
  const ids = Object.keys(imageStore);
  if (ids.length === 0) {
    currentImageId = null;
    srcImg = null; frames = []; selId = null; zoom = 1;
    lockedHeight = 0; lockedBottom = 0; lockedTop = 0;
    document.getElementById('lockBottomChk').checked = false;
    document.getElementById('lockTopChk').checked = false;
    document.getElementById('lockHChk').checked = false;
    document.getElementById('lockFixedChk').checked = false;
    onLockCheckChange();
    // Reset canvas UI
    document.getElementById('emptyState').style.display = '';
    document.getElementById('canvasFrame').style.display = 'none';
    document.getElementById('canvasArea').style.display = '';
    document.getElementById('zoomBar').style.display = 'none';
    document.getElementById('coord').style.display = 'none';
    document.getElementById('hintBar').style.display = 'none';
    // Reset right panel
    ['btnDetect','btnDetect2','btnOptimize','btnInterp','btnDelete','btnClearManual','btnBgMode'].forEach(id => document.getElementById(id).disabled = true);
    document.getElementById('bgRemoveSection').style.display = 'none';
    document.getElementById('imgInfo').textContent = '';
    document.getElementById('frameRects').innerHTML = '';
    document.getElementById('frameList').innerHTML = '';
    document.getElementById('listHint').textContent = '';
    document.getElementById('sTotal').textContent = '0';
    document.getElementById('sSel').textContent = '0';
    document.getElementById('sManual').textContent = '0';
    document.getElementById('detailArea').innerHTML = '<div class="empty" style="padding:16px;"><p style="font-size:11px;">选中帧查看详情</p></div>';
    const previewArea = document.getElementById('previewArea');
    previewArea.innerHTML = '<div class="empty" style="padding:16px;"><p style="font-size:11px;">点击帧查看</p></div>';
    renderImageTabs();
    return;
  }
  if (id === currentImageId) {
    // Switch to another image without saving (already deleted)
    currentImageId = null;
    const newId = ids[ids.length - 1];
    const data = imageStore[newId];
    currentImageId = newId;
    srcImg = data.img;
    frames = JSON.parse(JSON.stringify(data.frames));
    selId = data.selId;
    nextId = data.nextId;
    zoom = data.zoom;
    lockedHeight = data.lockedHeight;
    lockedBottom = data.lockedBottom;
    lockedTop = data.lockedTop;
    // Restore lock checkbox UI
    document.getElementById('lockBottomChk').checked = false;
    document.getElementById('lockTopChk').checked = false;
    document.getElementById('lockHChk').checked = false;
    document.getElementById('lockFixedChk').checked = false;
    if (lockedBottom > 0) document.getElementById('lockBottomChk').checked = true;
    if (lockedTop > 0) document.getElementById('lockTopChk').checked = true;
    if (lockedHeight > 0) { document.getElementById('lockHChk').checked = true; document.getElementById('lockHInput').value = lockedHeight; }
    onLockCheckChange();
    // Update canvas UI
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('canvasFrame').style.display = 'inline-block';
    document.getElementById('zoomBar').style.display = 'flex';
    document.getElementById('coord').style.display = 'block';
    document.getElementById('hintBar').style.display = 'block';
    document.getElementById('imgInfo').textContent = `${srcImg.width}×${srcImg.height}`;
    document.getElementById('zoomVal').textContent = zoom + 'x';
    renderCanvas(); renderRects(); updateAll();
  }
  renderImageTabs();
}

function renderImageTabs() {
  const tabs = document.getElementById('imageTabs');
  if (!tabs) return;
  
  // 使用文档片段批量更新DOM，减少重排
  const fragment = document.createDocumentFragment();
  
  for (const [id, data] of Object.entries(imageStore)) {
    const tab = document.createElement('div');
    tab.className = 'img-tab' + (id === currentImageId ? ' active' : '');
    const shortName = data.name.length > 12 ? data.name.slice(0, 10) + '..' : data.name;
    tab.innerHTML = `<span onclick="switchImage('${id}')">${shortName}</span><span class="close-tab" onclick="event.stopPropagation();closeImage('${id}')">✕</span>`;
    fragment.appendChild(tab);
  }
  
  // 一次性更新DOM，减少重排
  tabs.innerHTML = '';
  tabs.appendChild(fragment);
}

function addImageToStore(name, img) {
  saveCurrentImage();
  const id = 'img_' + (++imageIdCounter);
  currentImageId = id;
  imageStore[id] = {
    name, img,
    frames: [], selId: null, nextId: 0, zoom: 1,
    lockedHeight: 0, lockedBottom: 0, lockedTop: 0
  };
  renderImageTabs();
}
let animPlaying = false, animIdx = 0, animTimer = null;
let exportMode = '', ctxFrameId = null;

// Interaction state (no mode switching!)
let interaction = null; // null | { type: 'draw'|'move'|'resize', ... }

// Alpha cache
let _aData = null, _aW = 0, _aH = 0;

/**
 * 获取图像的Alpha通道数据（带缓存）
 * @returns {Uint8Array} Alpha通道数据
 */
function getAlpha() {
  if (_aData && _aW === srcImg.width && _aH === srcImg.height) return _aData;
  
  // 使用离屏画布获取图像数据
  const c = document.createElement('canvas');
  c.width = srcImg.width;
  c.height = srcImg.height;
  const x = c.getContext('2d');
  
  // Disable image smoothing
  x.imageSmoothingEnabled = false;
  x.mozImageSmoothingEnabled = false;
  x.webkitImageSmoothingEnabled = false;
  x.msImageSmoothingEnabled = false;
  
  x.drawImage(srcImg, 0, 0);
  
  // 获取图像数据并提取Alpha通道
  const imgData = x.getImageData(0, 0, c.width, c.height);
  const d = imgData.data;
  const length = c.width * c.height;
  
  // 重用缓存数组如果大小相同
  if (_aData && _aData.length === length) {
    for (let i = 0; i < length; i++) {
      _aData[i] = d[i * 4 + 3];
    }
  } else {
    // 创建新的Uint8Array
    _aData = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      _aData[i] = d[i * 4 + 3];
    }
  }
  
  _aW = c.width;
  _aH = c.height;
  return _aData;
}

/**
 * 使Alpha缓存失效
 */
function invalidateAlpha() {
  _aData = null;
  _aW = 0;
  _aH = 0;
}

// ===== File =====
function loadImage() { document.getElementById('fileInput').click(); }
/**
 * 处理文件上传
 * @param {Event} e - 文件输入事件
 */
function handleFile(e) {
  try {
    const f = e.target.files[0]; 
    if (!f) return;
    
    // 文件类型验证
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(f.type)) {
      toast('只支持 JPEG、PNG、GIF 和 WebP 格式的图片');
      return;
    }
    
    // 文件大小限制 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (f.size > maxSize) {
      toast('图片大小不能超过 5MB');
      return;
    }
    
    const r = new FileReader();
    r.onload = ev => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            // 转义文件名，防止XSS攻击
            const safeFileName = f.name.replace(/[<>&"'\/]/g, '');
            // Add to multi-image store FIRST (saves current image state)
            addImageToStore(safeFileName, img);
            // Then reset state for new image
            srcImg = img; frames = []; selId = null; nextId = 0; invalidateAlpha();
            lockedHeight = 0; lockedBottom = 0; lockedTop = 0;
            document.getElementById('lockBottomChk').checked = false;
            document.getElementById('lockTopChk').checked = false;
            document.getElementById('lockHChk').checked = false;
            document.getElementById('lockFixedChk').checked = false;
            onLockCheckChange();
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('canvasFrame').style.display = 'inline-block';
            document.getElementById('zoomBar').style.display = 'flex';
            document.getElementById('coord').style.display = 'block';
            document.getElementById('hintBar').style.display = 'block';
            ['btnDetect','btnDetect2','btnOptimize','btnInterp','btnDelete','btnClearManual','btnBgMode'].forEach(id => {
              const btn = document.getElementById(id);
              if (btn) btn.disabled = false;
            });
            document.getElementById('bgRemoveSection').style.display = '';
            document.getElementById('imgInfo').textContent = `${img.width}×${img.height} · ${safeFileName}`;
            renderCanvas(); zoomFit(); updateAll();
            toast('图片已加载');
          } catch (error) {
            console.error('处理图像时出错:', error);
            toast('处理图像时出错，请重试');
          }
        };
        img.onerror = () => {
          toast('图片加载失败，请重试');
        };
        img.src = ev.target.result;
      } catch (error) {
        console.error('创建图像对象时出错:', error);
        toast('创建图像对象时出错，请重试');
      }
    };
    r.onerror = () => {
      toast('文件读取失败，请重试');
    };
    r.readAsDataURL(f);
  } catch (error) {
    console.error('处理文件时出错:', error);
    toast('处理文件时出错，请重试');
  }
}

// ===== Snap =====
function snap(v) {
  if (!document.getElementById('snapGrid').checked) return v;
  const s = parseInt(document.getElementById('snapSize').value) || 1;
  return Math.round(v / s) * s;
}

// ===== Frame Size Constraint =====
let lockedHeight = 0;
let lockedBottom = 0;
let lockedTop = 0;

function onLockCheckChange() {
  const lockH = document.getElementById('lockHChk').checked;
  const lockFixed = document.getElementById('lockFixedChk').checked;
  const lockBottom = document.getElementById('lockBottomChk').checked;
  const lockTop = document.getElementById('lockTopChk').checked;

  document.getElementById('lockHInput').style.display = lockH ? 'inline-block' : 'none';
  document.getElementById('lockWInput').style.display = lockFixed ? 'inline-block' : 'none';
  document.getElementById('lockHFixedInput').style.display = lockFixed ? 'inline-block' : 'none';

  const hints = [];
  if (lockBottom && lockedBottom > 0) hints.push(`地面 Y=${lockedBottom}`);
  if (lockTop && lockedTop > 0) hints.push(`顶部 Y=${lockedTop}`);
  if (lockH && lockedHeight > 0) hints.push(`高度 ${lockedHeight}px`);
  if (lockFixed) hints.push('固定尺寸');
  if (lockBottom && lockedBottom === 0) hints.push('地面：框选第一帧设定');
  if (lockTop && lockedTop === 0) hints.push('顶部：框选第一帧设定');
  if (lockH && lockedHeight === 0) hints.push('高度：框选第一帧设定');

  const hint = document.getElementById('lockHint');
  const resetBtn = document.getElementById('lockResetBtn');
  if (hints.length) {
    hint.textContent = hints.join(' | ');
    hint.style.display = 'block';
    resetBtn.style.display = 'block';
  } else {
    hint.style.display = 'none';
    resetBtn.style.display = 'none';
  }
  renderRects();
}

function onLockSizeInput() {
  if (document.getElementById('lockHChk').checked) {
    lockedHeight = parseInt(document.getElementById('lockHInput').value) || 0;
  }
}

function resetLock() {
  lockedHeight = 0; lockedBottom = 0; lockedTop = 0;
  document.getElementById('lockBottomChk').checked = false;
  document.getElementById('lockTopChk').checked = false;
  document.getElementById('lockHChk').checked = false;
  document.getElementById('lockFixedChk').checked = false;
  document.getElementById('lockHInput').value = '';
  document.getElementById('lockHInput').style.display = 'none';
  document.getElementById('lockWInput').style.display = 'none';
  document.getElementById('lockHFixedInput').style.display = 'none';
  onLockCheckChange();
  renderRects();
  toast('已重置锁定');
}

// Apply all active constraints
function applySizeConstraint(x, y, w, h) {
  const lockBottom = document.getElementById('lockBottomChk').checked;
  const lockTop = document.getElementById('lockTopChk').checked;
  const lockH = document.getElementById('lockHChk').checked;
  const lockFixed = document.getElementById('lockFixedChk').checked;

  // 1. Fixed size (overrides width/height)
  if (lockFixed) {
    w = parseInt(document.getElementById('lockWInput').value) || w;
    h = parseInt(document.getElementById('lockHFixedInput').value) || h;
  }
  // 2. Lock top (extend/trim to top line)
  if (lockTop && lockedTop > 0) {
    if (y > lockedTop) { h = h + (y - lockedTop); y = lockedTop; }
    else if (y < lockedTop) { h = Math.max(h - (lockedTop - y), 3); y = lockedTop; }
  }
  // 3. Lock bottom (extend/trim to bottom line)
  if (lockBottom && lockedBottom > 0) {
    const bottom = y + h;
    if (bottom < lockedBottom) h = lockedBottom - y;
    else if (bottom > lockedBottom) { h = lockedBottom - y; if (h < 3) h = 3; }
  }
  // 4. Lock height (final height override, after top/bottom adjusted)
  if (lockH && lockedHeight > 0) h = lockedHeight;
  return { x, y, w, h };
}

// Clear all manually drawn frames
function clearManualFrames() {
  const manualCount = frames.filter(f => f.manual).length;
  if (manualCount === 0) { toast('没有手动帧可清除'); return; }
  frames = frames.filter(f => !f.manual);
  selId = null;
  renderRects(); updateAll();
  toast(`已清除 ${manualCount} 个手动帧`);
}

// ===== Background Removal =====
let bgRemoveActive = false;
let bgOriginalData = null;
let bgPickedColor = null;
let bgPreviewData = null;

function onBgModeChange() {
  bgRemoveActive = false;
  bgPickedColor = null;
  document.getElementById('canvasFrame').style.cursor = '';
  document.getElementById('bgPickHint').style.display = 'none';
  const btn = document.getElementById('btnBgMode');
  btn.textContent = '🎯 进入取色模式';
  btn.style.borderColor = '';
  document.getElementById('bgTolField').style.display = '';
}

function toggleBgRemoveMode() {
  bgRemoveActive = !bgRemoveActive;
  const btn = document.getElementById('btnBgMode');
  const hint = document.getElementById('bgPickHint');
  const mode = document.getElementById('bgRemoveMode').value;
  if (mode === 'pick') {
    if (bgRemoveActive) {
      btn.textContent = '🚫 退出取色模式';
      btn.style.borderColor = 'var(--accent)';
      hint.style.display = 'block';
      document.getElementById('canvasFrame').style.cursor = 'crosshair';
    } else {
      btn.textContent = '🎯 进入取色模式';
      btn.style.borderColor = '';
      hint.style.display = 'none';
      document.getElementById('canvasFrame').style.cursor = '';
    }
  } else {
    // Flood mode: just run directly
    bgRemoveActive = false;
    btn.textContent = '🎯 进入取色模式';
    btn.style.borderColor = '';
    hint.style.display = 'none';
    document.getElementById('canvasFrame').style.cursor = '';
    runBgFlood();
  }
}

// Save original image data for reset
function saveBgOriginal() {
  if (!bgOriginalData && srcImg) {
    const c = document.createElement('canvas');
    c.width = srcImg.width; c.height = srcImg.height;
    const ctx = c.getContext('2d');
    
    // Disable image smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    ctx.drawImage(srcImg, 0, 0);
    bgOriginalData = ctx.getImageData(0, 0, srcImg.width, srcImg.height);
  }
}

// Reset to original
function resetBgRemove() {
  if (!bgOriginalData || !srcImg) return;
  const c = document.getElementById('mainCanvas');
  const ctx = c.getContext('2d');
  ctx.putImageData(bgOriginalData, 0, 0);
  // Update srcImg from canvas
  const dataUrl = c.toDataURL('image/png');
  const img = new Image();
  img.onload = () => {
    srcImg = img;
    bgOriginalData = null;
    bgPreviewData = null;
    bgPickedColor = null;
    invalidateAlpha();
    renderCanvas();
    renderRects();
    toast('已重置为原图');
  };
  img.src = dataUrl;
}

// Apply background removal permanently
function applyBgRemove() {
  if (!srcImg) return;
  // The preview is already on canvas, just update srcImg
  const c = document.getElementById('mainCanvas');
  const dataUrl = c.toDataURL('image/png');
  const img = new Image();
  img.onload = () => {
    srcImg = img;
    bgOriginalData = null;
    bgPreviewData = null;
    bgPickedColor = null;
    invalidateAlpha();
    renderRects();
    toast('背景消除已应用');
  };
  img.src = dataUrl;
}

// Pick color from canvas at click position
function bgPickColor(e) {
  if (!bgRemoveActive || !srcImg) return;
  const mode = document.getElementById('bgRemoveMode').value;
  if (mode !== 'pick') return;

  const c = document.getElementById('mainCanvas');
  const ctx = c.getContext('2d');
  const coords = imgCoords(e);
  const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data;
  bgPickedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

  // Save original if not saved
  saveBgOriginal();

  // Run pick-color removal
  runBgPickRemove();

  // Show picked color
  const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  document.getElementById('bgPickHint').textContent = `👆 已取色 ${hex}，再次点击可重新取色`;
  document.getElementById('btnBgApply').disabled = false;
  document.getElementById('btnBgReset').disabled = false;
}

// Color distance for tolerance matching
function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// Pick-color removal: make similar colors transparent
function runBgPickRemove() {
  if (!bgPickedColor || !srcImg) return;
  saveBgOriginal();

  const c = document.getElementById('mainCanvas');
  const ctx = c.getContext('2d');
  const imgData = ctx.getImageData(0, 0, srcImg.width, srcImg.height);
  const d = imgData.data;
  const tol = parseInt(document.getElementById('bgTolerance').value) || 32;
  const { r: pr, g: pg, b: pb } = bgPickedColor;

  for (let i = 0; i < d.length; i += 4) {
    if (colorDist(d[i], d[i + 1], d[i + 2], pr, pg, pb) <= tol) {
      d[i + 3] = 0; // Set alpha to 0
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bgPreviewData = true;
}

// Flood fill from edges: BFS from all border pixels
function runBgFlood() {
  if (!srcImg) return;
  saveBgOriginal();

  const c = document.getElementById('mainCanvas');
  const ctx = c.getContext('2d');
  const imgData = ctx.getImageData(0, 0, srcImg.width, srcImg.height);
  const d = imgData.data;
  const w = srcImg.width, h = srcImg.height;
  const tol = parseInt(document.getElementById('bgTolerance').value) || 32;

  // Visited array
  const visited = new Uint8Array(w * h);

  // BFS queue: start from all border pixels
  const queue = [];
  // Add all border pixels that are not fully transparent
  for (let x = 0; x < w; x++) {
    queue.push(x); // top row
    queue.push((h - 1) * w + x); // bottom row
  }
  for (let y = 0; y < h; y++) {
    queue.push(y * w); // left col
    queue.push(y * w + w - 1); // right col
  }

  // Get reference color from top-left corner (or first non-transparent border pixel)
  let refR = 0, refG = 0, refB = 0;
  for (let i = 0; i < queue.length; i++) {
    const idx = queue[i] * 4;
    if (d[idx + 3] > 128) { refR = d[idx]; refG = d[idx + 1]; refB = d[idx + 2]; break; }
  }

  // BFS
  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * 4;
    // Check if this pixel matches reference color within tolerance
    if (d[idx + 3] > 128 && colorDist(d[idx], d[idx + 1], d[idx + 2], refR, refG, refB) <= tol) {
      // Mark as background (transparent)
      d[idx + 3] = 0;

      // Add neighbors
      const x = pos % w, y = (pos - x) / w;
      if (x > 0) queue.push(pos - 1);
      if (x < w - 1) queue.push(pos + 1);
      if (y > 0) queue.push(pos - w);
      if (y < h - 1) queue.push(pos + w);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bgPreviewData = true;
  document.getElementById('btnBgApply').disabled = false;
  document.getElementById('btnBgReset').disabled = false;
  toast('泛洪消除完成，预览效果中');
}

// ===== Canvas Rendering =====
function renderCanvas() {
  if (!srcImg) return;
  const c = document.getElementById('mainCanvas');
  c.width = srcImg.width; c.height = srcImg.height;
  const ctx = c.getContext('2d');
  
  // Disable image smoothing
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  
  ctx.drawImage(srcImg, 0, 0);
  applyZoom();
}
function applyZoom() {
  const c = document.getElementById('mainCanvas');
  const f = document.getElementById('canvasFrame');
  c.style.width = (srcImg.width * zoom) + 'px';
  c.style.height = (srcImg.height * zoom) + 'px';
  f.style.width = (srcImg.width * zoom) + 'px';
  f.style.height = (srcImg.height * zoom) + 'px';
  document.getElementById('zoomVal').textContent = Math.round(zoom * 100) + '%';
  renderRects();
}
function zoomIn() { zoom = Math.min(zoom * 1.25, 10); applyZoom(); }
function zoomOut() { zoom = Math.max(zoom / 1.25, 0.05); applyZoom(); }
function zoomFit() {
  if (!srcImg) return;
  const a = document.getElementById('canvasArea');
  zoom = Math.min((a.clientWidth - 60) / srcImg.width, (a.clientHeight - 60) / srcImg.height, 2);
  applyZoom();
}

// ===== Frame Rects =====
function renderRects() {
  const box = document.getElementById('frameRects');
  if (!box) return;
  
  // 使用文档片段批量更新DOM，减少重排
  const fragment = document.createDocumentFragment();
  
  for (const f of frames) {
    const d = document.createElement('div');
    d.className = 'frame-rect' + (f.id === selId ? ' active' : '') + (!f.selected ? ' excluded' : '');
    d.style.cssText = `left:${f.x*zoom}px;top:${f.y*zoom}px;width:${f.w*zoom}px;height:${f.h*zoom}px;`;
    d.innerHTML = `<span class="label">${f.manual?'✏️ ':''}${f.w}×${f.h}</span>`;
    d.oncontextmenu = e => { e.preventDefault(); showCtx(e, f.id); };
    d.onmousedown = e => onFrameMouseDown(e, f);
    fragment.appendChild(d);

    // Show unified rect outline if frame has been optimized
    if (f.unifiedW && f.unifiedH) {
      const u = document.createElement('div');
      u.className = 'frame-rect unified-outline';
      u.style.cssText = `left:${(f.x + f.offsetX)*zoom}px;top:${(f.y + f.offsetY)*zoom}px;width:${f.unifiedW*zoom}px;height:${f.unifiedH*zoom}px;pointer-events:none;`;
      fragment.appendChild(u);
    }

    // Resize handles for active frame
    if (f.id === selId) {
      ['nw','n','ne','w','e','sw','s','se'].forEach(dir => {
        const h = document.createElement('div');
        h.className = `rh rh-${dir}`;
        h.onmousedown = e => { e.stopPropagation(); startResize(e, f.id, dir); };
        d.appendChild(h);
      });
    }
  }

  // Draw ground reference line in "lock bottom" mode
  if (document.getElementById('lockBottomChk')?.checked && lockedBottom > 0 && srcImg) {
    const line = document.createElement('div');
    line.style.cssText = `position:absolute;left:0;top:${lockedBottom*zoom}px;width:${srcImg.width*zoom}px;height:0;border-top:2px dashed rgba(243,139,168,0.7);pointer-events:none;z-index:5;`;
    line.title = `地面线 Y=${lockedBottom}`;
    fragment.appendChild(line);
    const lbl = document.createElement('div');
    lbl.style.cssText = `position:absolute;left:4px;top:${lockedBottom*zoom + 2}px;font-size:10px;color:rgba(243,139,168,0.9);pointer-events:none;z-index:5;`;
    lbl.textContent = `地面 Y=${lockedBottom}`;
    fragment.appendChild(lbl);
  }

  // Draw top reference line in "lock top" mode
  if (document.getElementById('lockTopChk')?.checked && lockedTop > 0 && srcImg) {
    const line = document.createElement('div');
    line.style.cssText = `position:absolute;left:0;top:${lockedTop*zoom}px;width:${srcImg.width*zoom}px;height:0;border-top:2px dashed rgba(100,200,255,0.7);pointer-events:none;z-index:5;`;
    line.title = `顶部线 Y=${lockedTop}`;
    fragment.appendChild(line);
    const lbl = document.createElement('div');
    lbl.style.cssText = `position:absolute;left:4px;top:${lockedTop*zoom - 14}px;font-size:10px;color:rgba(100,200,255,0.9);pointer-events:none;z-index:5;`;
    lbl.textContent = `顶部 Y=${lockedTop}`;
    fragment.appendChild(lbl);
  }
  
  // 一次性更新DOM，减少重排
  box.innerHTML = '';
  box.appendChild(fragment);
}

// ===== Mouse Interaction (unified - no mode switching) =====
function imgCoords(e) {
  const r = document.getElementById('canvasFrame').getBoundingClientRect();
  return { x: Math.round((e.clientX - r.left) / zoom), y: Math.round((e.clientY - r.top) / zoom) };
}

function onFrameMouseDown(e, f) {
  if (e.button !== 0) return;
  e.stopPropagation();
  if (f.id === selId) {
    // Start moving the selected frame
    startMove(e, f.id);
  } else {
    selectFrame(f.id);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const frame = document.getElementById('canvasFrame');

  frame.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    // Pick-color mode for background removal
    if (bgRemoveActive) { bgPickColor(e); return; }
    // Clicking on empty canvas area → start drawing
    if (e.target === frame || e.target.id === 'mainCanvas') {
      const c = imgCoords(e);
      interaction = { type: 'draw', sx: snap(c.x), sy: snap(c.y), ex: c.x, ey: c.y };
      const ov = document.createElement('div');
      ov.className = 'draw-rect'; ov.id = 'drawOv';
      frame.appendChild(ov);
    }
  });

  document.addEventListener('mousemove', e => {
    // Update coord
    if (srcImg) {
      const r = document.getElementById('canvasFrame').getBoundingClientRect();
      const ix = Math.round((e.clientX - r.left) / zoom);
      const iy = Math.round((e.clientY - r.top) / zoom);
      if (ix >= 0 && ix < srcImg.width && iy >= 0 && iy < srcImg.height) {
        document.getElementById('coord').textContent = `${ix}, ${iy}`;
      }
    }
    if (!interaction) return;
    if (interaction.type === 'draw') {
    const c = imgCoords(e);
    interaction.ex = snap(c.x); interaction.ey = snap(c.y);
    const ov = document.getElementById('drawOv');
    if (ov) {
      let x = Math.min(interaction.sx, interaction.ex), y = Math.min(interaction.sy, interaction.ey);
      let w = Math.abs(interaction.ex - interaction.sx), h = Math.abs(interaction.ey - interaction.sy);
      // Apply size constraint to preview
      const con = applySizeConstraint(x, y, w, h);
      w = con.w; h = con.h;
      ov.style.cssText = `left:${x*zoom}px;top:${y*zoom}px;width:${w*zoom}px;height:${h*zoom}px;`;
      ov.innerHTML = `<span class="size-label">${w}×${h}</span>`;
    }
    } else if (interaction.type === 'move') {
      handleMove(e);
    } else if (interaction.type === 'resize') {
      handleResize(e);
    }
  });

  document.addEventListener('mouseup', e => {
    if (!interaction) return;
    if (interaction.type === 'draw') finishDraw();
    else if (interaction.type === 'move') finishMove();
    else if (interaction.type === 'resize') finishResize();
    interaction = null;
  });
});

function finishDraw() {
  const ov = document.getElementById('drawOv');
  if (ov) ov.remove();
  if (!interaction) return;
  let x = Math.min(interaction.sx, interaction.ex), y = Math.min(interaction.sy, interaction.ey);
  let w = Math.abs(interaction.ex - interaction.sx), h = Math.abs(interaction.ey - interaction.sy);
  if (w < 3 || h < 3) return;

  // Apply size constraint
  const con = applySizeConstraint(x, y, w, h);
  w = con.w; h = con.h; y = con.y;

  // Auto-lock on first frame
  if (document.getElementById('lockBottomChk').checked && lockedBottom === 0) {
    lockedBottom = y + h;
  }
  if (document.getElementById('lockTopChk').checked && lockedTop === 0) {
    lockedTop = y;
  }
  if (document.getElementById('lockHChk').checked && lockedHeight === 0) {
    lockedHeight = h;
    document.getElementById('lockHInput').value = h;
  }
  if (lockedBottom > 0 || lockedTop > 0 || lockedHeight > 0) {
    onLockCheckChange();
  }

  const cx = Math.max(0, Math.min(x, srcImg.width - 1));
  const cy = Math.max(0, Math.min(y, srcImg.height - 1));
  const cw = Math.min(w, srcImg.width - cx), ch = Math.min(h, srcImg.height - cy);
  const maxRow = frames.length > 0 ? Math.max(...frames.map(f => f.row)) : -1;

  const nf = { id: nextId++, row: maxRow + 1, col: 0, x: cx, y: cy, w: cw, h: ch, selected: true, manual: true };

  // Auto-trim on draw (with edge expansion to avoid clipping)
  if (document.getElementById('autoTrim').checked) {
    invalidateAlpha();
    const at = parseInt(document.getElementById('alphaTh').value) || 10;
    // Step 1: Check if content touches edges, expand outward if so
    expandEdges(nf, at, 2, 8);
    // Step 2: Trim transparent edges
    const tr = trimAlpha(nf, at);
    if (tr) { nf.x = tr.x; nf.y = tr.y; nf.w = tr.w; nf.h = tr.h; }
    // Step 3: Add small padding
    const pad = 2;
    nf.x = Math.max(0, nf.x - pad); nf.y = Math.max(0, nf.y - pad);
    nf.w = Math.min(nf.w + pad * 2, srcImg.width - nf.x);
    nf.h = Math.min(nf.h + pad * 2, srcImg.height - nf.y);
  }

  // In "lock bottom" mode, ensure frame extends to ground line after trim
  if (document.getElementById('lockBottomChk').checked && lockedBottom > 0) {
    const frameBottom = nf.y + nf.h;
    if (frameBottom < lockedBottom) {
      nf.h = lockedBottom - nf.y;
    } else if (frameBottom > lockedBottom) {
      nf.h = lockedBottom - nf.y;
      if (nf.h < 3) nf.h = 3;
    }
  }

  // In "lock top" mode, ensure frame starts at top line after trim
  if (document.getElementById('lockTopChk').checked && lockedTop > 0) {
    if (nf.y > lockedTop) {
      const newH = nf.h + (nf.y - lockedTop);
      nf.y = lockedTop;
      nf.h = newH;
    } else if (nf.y < lockedTop) {
      const trim = lockedTop - nf.y;
      nf.y = lockedTop;
      nf.h = Math.max(nf.h - trim, 3);
    }
  }

  // In "lock height" mode, restore height after trim
  if (document.getElementById('lockHChk').checked && lockedHeight > 0) {
    nf.h = lockedHeight;
  }
  // In "fixed size" mode, restore size after trim
  if (document.getElementById('lockFixedChk').checked) {
    const fw = parseInt(document.getElementById('lockWInput').value) || nf.w;
    const fh = parseInt(document.getElementById('lockHFixedInput').value) || nf.h;
    nf.w = Math.min(fw, srcImg.width - nf.x);
    nf.h = Math.min(fh, srcImg.height - nf.y);
  }

  frames.push(nf); selId = nf.id;
  renderRects(); updateAll();
  toast(`已添加帧 ${nf.w}×${nf.h}`);
}

// ===== Move & Resize =====
function startMove(e, id) {
  const f = frames.find(fr => fr.id === id); if (!f) return;
  interaction = { type: 'move', id, ox: imgCoords(e).x, oy: imgCoords(e).y, fx: f.x, fy: f.y };
}
function handleMove(e) {
  const f = frames.find(fr => fr.id === interaction.id); if (!f) return;
  const c = imgCoords(e);
  const dx = snap(c.x) - snap(interaction.ox), dy = snap(c.y) - snap(interaction.oy);
  f.x = Math.max(0, Math.min(interaction.fx + dx, srcImg.width - f.w));
  f.y = Math.max(0, Math.min(interaction.fy + dy, srcImg.height - f.h));
  renderRects(); updateDetail();
}
function finishMove() { updateList(); }

function startResize(e, id, dir) {
  const f = frames.find(fr => fr.id === id); if (!f) return;
  interaction = { type: 'resize', id, dir, ox: imgCoords(e).x, oy: imgCoords(e).y, fx: f.x, fy: f.y, fw: f.w, fh: f.h };
}
function handleResize(e) {
  const f = frames.find(fr => fr.id === interaction.id); if (!f) return;
  const c = imgCoords(e);
  const dx = snap(c.x) - snap(interaction.ox), dy = snap(c.y) - snap(interaction.oy);
  const d = interaction.dir;
  let nx = interaction.fx, ny = interaction.fy, nw = interaction.fw, nh = interaction.fh;
  if (d.includes('w')) { nx += dx; nw -= dx; }
  if (d.includes('e')) { nw += dx; }
  if (d.includes('n')) { ny += dy; nh -= dy; }
  if (d.includes('s')) { nh += dy; }
  if (nw < 2) { nw = 2; if (d.includes('w')) nx = interaction.fx + interaction.fw - 2; }
  if (nh < 2) { nh = 2; if (d.includes('n')) ny = interaction.fy + interaction.fh - 2; }
  nx = Math.max(0, nx); ny = Math.max(0, ny);
  if (nx + nw > srcImg.width) nw = srcImg.width - nx;
  if (ny + nh > srcImg.height) nh = srcImg.height - ny;
  f.x = nx; f.y = ny; f.w = nw; f.h = nh;
  renderRects(); updateDetail();
}
function finishResize() { updateList(); }

// ===== Selection =====
function selectFrame(id) { selId = id; renderRects(); updatePreview(); updateDetail(); updateList(); }
function toggleFrame(id) { const f = frames.find(fr => fr.id === id); if (f) f.selected = !f.selected; renderRects(); updateStats(); updateList(); }
function selectAll() { frames.forEach(f => f.selected = true); refresh(); }
function deselectAll() { frames.forEach(f => f.selected = false); refresh(); }
function invertSelection() { frames.forEach(f => f.selected = !f.selected); refresh(); }
function deleteSelected() {
  const before = frames.length;
  frames = frames.filter(f => f.id !== selId);
  if (frames.length < before) { selId = null; refresh(); updatePreview(); updateDetail(); toast('已删除帧'); }
}
function refresh() { renderRects(); updateStats(); updateList(); }
function updateAll() { updateStats(); updateList(); updatePreview(); updateDetail(); }

// ===== Auto Detect (improved: connected region analysis) =====
function detectFrames() {
  if (!srcImg) return;
  invalidateAlpha();
  const at = parseInt(document.getElementById('alphaTh').value) || 10;
  const minH = parseInt(document.getElementById('minH').value) || 8;
  const maxH = parseInt(document.getElementById('maxH').value) || 500;
  const minW = parseInt(document.getElementById('minW').value) || 4;
  const maxW = parseInt(document.getElementById('maxW').value) || 500;

  const alpha = getAlpha();
  const w = _aW, h = _aH;

  // Build binary map
  const bin = new Uint8Array(w * h);
  for (let i = 0; i < bin.length; i++) bin[i] = alpha[i] > at ? 1 : 0;

  // Find rows with content
  const rowContent = new Uint8Array(h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (bin[y * w + x]) { rowContent[y] = 1; break; }

  // Group rows into bands (with gap tolerance)
  const GAP = 3; // allow up to 3px gap between rows
  const bands = [];
  let bandStart = -1, lastContent = -1;
  for (let y = 0; y < h; y++) {
    if (rowContent[y]) {
      if (bandStart < 0) bandStart = y;
      lastContent = y;
    } else if (bandStart >= 0 && y - lastContent > GAP) {
      bands.push({ y1: bandStart, y2: lastContent + 1 });
      bandStart = -1; lastContent = -1;
    }
  }
  if (bandStart >= 0) bands.push({ y1: bandStart, y2: lastContent + 1 });

  // Keep manual frames
  const manual = frames.filter(f => f.manual);
  frames = [...manual];
  nextId = frames.length > 0 ? Math.max(...frames.map(f => f.id)) + 1 : 0;

  let autoCount = 0;
  for (let bi = 0; bi < bands.length; bi++) {
    const { y1, y2 } = bands[bi];
    const bh = y2 - y1;
    if (bh < minH || bh > maxH) continue;

    // Find columns with content in this band
    const colContent = new Uint8Array(w);
    for (let x = 0; x < w; x++) {
      for (let y = y1; y < y2; y++) {
        if (bin[y * w + x]) { colContent[x] = 1; break; }
      }
    }

    // Find frame boundaries (with gap tolerance)
    const colGAP = 3;
    const colBands = [];
    let cStart = -1, cLast = -1;
    for (let x = 0; x < w; x++) {
      if (colContent[x]) {
        if (cStart < 0) cStart = x;
        cLast = x;
      } else if (cStart >= 0 && x - cLast > colGAP) {
        colBands.push({ x1: cStart, x2: cLast + 1 });
        cStart = -1; cLast = -1;
      }
    }
    if (cStart >= 0) colBands.push({ x1: cStart, x2: cLast + 1 });

    for (let fi = 0; fi < colBands.length; fi++) {
      const { x1, x2 } = colBands[fi];
      const fw = x2 - x1;
      if (fw < minW || fw > maxW) continue;

      // Trim transparent edges
      let tl = 0, tr = 0, tt = 0, tb = 0;
      ol: for (let tx = x1; tx < x2; tx++) { for (let ty = y1; ty < y2; ty++) { if (bin[ty * w + tx]) break ol; } tl++; }
      or2: for (let tx = x2 - 1; tx >= x1; tx--) { for (let ty = y1; ty < y2; ty++) { if (bin[ty * w + tx]) break or2; } tr++; }
      ot: for (let ty = y1; ty < y2; ty++) { for (let tx = x1; tx < x2; tx++) { if (bin[ty * w + tx]) break ot; } tt++; }
      ob: for (let ty = y2 - 1; ty >= y1; ty--) { for (let tx = x1; tx < x2; tx++) { if (bin[ty * w + tx]) break ob; } tb++; }

      const cx = x1 + tl, cy = y1 + tt;
      const cw = Math.max(1, fw - tl - tr), ch = Math.max(1, bh - tt - tb);

      frames.push({
        id: nextId++, row: bi, col: fi,
        x: cx, y: cy, w: cw, h: ch,
        selected: true, manual: false
      });
      autoCount++;
    }
  }

  renderRects(); updateAll();
  toast(`检测到 ${autoCount} 帧` + (manual.length ? `（+ ${manual.length} 手动帧）` : ''));
}

// ===== Expand & Trim =====
function expandEdges(f, at, margin, maxExp) {
  const alpha = getAlpha(); const w = _aW, h = _aH;
  let cx = Math.max(0, Math.round(f.x)), cy = Math.max(0, Math.round(f.y));
  let cw = Math.min(Math.round(f.w), w - cx), ch = Math.min(Math.round(f.h), h - cy);
  let expanded = false;
  for (let i = 0; i < maxExp; i++) {
    let need = false;
    let lc = false, rc = false, tc = false, bc = false;
    for (let dy = 0; dy < ch; dy++) if (alpha[(cy+dy)*w+cx] > at) { lc = true; break; }
    for (let dy = 0; dy < ch; dy++) if (alpha[(cy+dy)*w+(cx+cw-1)] > at) { rc = true; break; }
    for (let dx = 0; dx < cw; dx++) if (alpha[cy*w+(cx+dx)] > at) { tc = true; break; }
    for (let dx = 0; dx < cw; dx++) if (alpha[(cy+ch-1)*w+(cx+dx)] > at) { bc = true; break; }
    if (lc && cx > 0) { cx--; cw++; need = true; }
    if (rc && cx+cw < w) { cw++; need = true; }
    if (tc && cy > 0) { cy--; ch++; need = true; }
    if (bc && cy+ch < h) { ch++; need = true; }
    if (!need) break;
    expanded = true;
  }
  if (expanded) { f.x = cx; f.y = cy; f.w = cw; f.h = ch; }
  return expanded;
}

/**
 * 裁剪透明边缘
 * @param {Object} f - 帧对象
 * @param {number} at - Alpha阈值
 * @returns {Object|null} 裁剪后的边界 {x, y, w, h} 或 null
 */
function trimAlpha(f, at) {
  const alpha = getAlpha();
  const w = _aW;
  const ix = Math.max(0, Math.round(f.x));
  const iy = Math.max(0, Math.round(f.y));
  const iw = Math.min(Math.round(f.w), w - ix);
  const ih = Math.min(Math.round(f.h), _aH - iy);
  
  if (iw <= 0 || ih <= 0) return null;

  // 快速扫描边缘，找到内容边界
  let x0 = 0, x1 = iw - 1, y0 = 0, y1 = ih - 1;
  let foundContent = false;

  // 查找左边界
  for (let x = 0; x < iw; x++) {
    for (let y = 0; y < ih; y++) {
      if (alpha[(iy + y) * w + (ix + x)] > at) {
        x0 = x;
        foundContent = true;
        break;
      }
    }
    if (foundContent) break;
  }
  
  if (!foundContent) return null;
  foundContent = false;

  // 查找右边界
  for (let x = iw - 1; x >= x0; x--) {
    for (let y = 0; y < ih; y++) {
      if (alpha[(iy + y) * w + (ix + x)] > at) {
        x1 = x;
        foundContent = true;
        break;
      }
    }
    if (foundContent) break;
  }
  
  foundContent = false;

  // 查找上边界
  for (let y = 0; y < ih; y++) {
    for (let x = x0; x <= x1; x++) {
      if (alpha[(iy + y) * w + (ix + x)] > at) {
        y0 = y;
        foundContent = true;
        break;
      }
    }
    if (foundContent) break;
  }
  
  foundContent = false;

  // 查找下边界
  for (let y = ih - 1; y >= y0; y--) {
    for (let x = x0; x <= x1; x++) {
      if (alpha[(iy + y) * w + (ix + x)] > at) {
        y1 = y;
        foundContent = true;
        break;
      }
    }
    if (foundContent) break;
  }

  if (x1 < x0 || y1 < y0) return null;
  return { x: ix + x0, y: iy + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * 获取内容质心（基于Alpha加权，带采样以提高性能）
 * @param {Object} f - 帧对象
 * @param {number} at - Alpha阈值
 * @returns {Object} 质心坐标 {cx, cy}
 */
function getContentCenter(f, at) {
  if (!at) at = parseInt(document.getElementById('alphaTh')?.value) || 10;
  const alpha = getAlpha();
  const w = _aW;
  const ix = Math.max(0, Math.round(f.x));
  const iy = Math.max(0, Math.round(f.y));
  const iw = Math.min(Math.round(f.w), w - ix);
  const ih = Math.min(Math.round(f.h), _aH - iy);
  
  if (iw <= 0 || ih <= 0) return { cx: f.w / 2, cy: f.h / 2 };

  const totalPixels = iw * ih;
  // 根据像素数量动态调整采样步长
  const step = totalPixels > 10000 ? Math.ceil(Math.sqrt(totalPixels / 10000)) : 1;

  let sx = 0, sy = 0, total = 0;
  
  // 优化循环，减少计算开销
  const startY = iy;
  const startX = ix;
  
  for (let dy = 0; dy < ih; dy += step) {
    const y = startY + dy;
    const rowOffset = y * w;
    
    for (let dx = 0; dx < iw; dx += step) {
      const x = startX + dx;
      const a = alpha[rowOffset + x];
      
      if (a > at) {
        sx += dx * a;
        sy += dy * a;
        total += a;
      }
    }
  }
  
  if (total === 0) return { cx: iw / 2, cy: ih / 2 };
  
  return { cx: sx / total, cy: sy / total };
}

// Get core region center — only uses the middle 60% of content bounding box
// This ignores extremities like arms/weapons that pull the centroid off-center
function getCoreCenter(f, at) {
  if (!at) at = parseInt(document.getElementById('alphaTh')?.value) || 10;
  const alpha = getAlpha(); const w = _aW;
  const ix = Math.max(0, Math.round(f.x)), iy = Math.max(0, Math.round(f.y));
  const iw = Math.min(Math.round(f.w), w - ix), ih = Math.min(Math.round(f.h), _aH - iy);
  if (iw <= 0 || ih <= 0) return { cx: f.w / 2, cy: f.h / 2 };

  // Find content bounding box first
  let x0 = iw, x1 = 0, y0 = ih, y1 = 0;
  const step0 = iw * ih > 10000 ? Math.ceil(Math.sqrt(iw * ih / 10000)) : 1;
  for (let dy = 0; dy < ih; dy += step0) {
    for (let dx = 0; dx < iw; dx += step0) {
      if (alpha[(iy + dy) * w + (ix + dx)] > at) {
        if (dx < x0) x0 = dx; if (dx > x1) x1 = dx;
        if (dy < y0) y0 = dy; if (dy > y1) y1 = dy;
      }
    }
  }
  if (x1 < x0 || y1 < y0) return { cx: iw / 2, cy: ih / 2 };

  // Take middle 60% of content bounding box (ignore extremities)
  const margin = 0.2; // 20% margin on each side = middle 60%
  const coreX0 = Math.round(x0 + (x1 - x0) * margin);
  const coreX1 = Math.round(x1 - (x1 - x0) * margin);
  const coreY0 = Math.round(y0 + (y1 - y0) * margin);
  const coreY1 = Math.round(y1 - (y1 - y0) * margin);

  // Compute weighted centroid within core region only
  const step = (coreX1 - coreX0) * (coreY1 - coreY0) > 5000 ? 2 : 1;
  let sx = 0, sy = 0, total = 0;
  for (let dy = coreY0; dy <= coreY1; dy += step) {
    for (let dx = coreX0; dx <= coreX1; dx += step) {
      const a = alpha[(iy + dy) * w + (ix + dx)];
      if (a > at) { sx += dx * a; sy += dy * a; total += a; }
    }
  }
  if (total === 0) return { cx: iw / 2, cy: ih / 2 };
  return { cx: sx / total, cy: sy / total };
}

// Manual anchor point - per-frame: frame.anchor = { cx, cy }
let manualAnchor = null;

// Anchor color theme presets
const anchorColorThemes = [
  { name: '粉红', cross: '#f38ba8', ref: 'rgba(243,139,168,0.5)', center: 'rgba(137,180,250,0.25)', dot: '#f38ba8', label: 'rgba(243,139,168,0.95)' },
  { name: '青绿', cross: '#94e2d5', ref: 'rgba(148,226,213,0.5)', center: 'rgba(137,180,250,0.25)', dot: '#94e2d5', label: 'rgba(148,226,213,0.95)' },
  { name: '黄色', cross: '#f9e2af', ref: 'rgba(249,226,175,0.5)', center: 'rgba(137,180,250,0.25)', dot: '#f9e2af', label: 'rgba(249,226,175,0.95)' },
  { name: '蓝色', cross: '#89b4fa', ref: 'rgba(137,180,250,0.5)', center: 'rgba(243,139,168,0.2)', dot: '#89b4fa', label: 'rgba(137,180,250,0.95)' },
  { name: '白色', cross: '#cdd6f4', ref: 'rgba(205,214,244,0.45)', center: 'rgba(137,180,250,0.2)', dot: '#cdd6f4', label: 'rgba(205,214,244,0.95)' },
];
let anchorColorIdx = 0;
function getAnchorTheme() { return anchorColorThemes[anchorColorIdx]; }
function cycleAnchorColor() {
  anchorColorIdx = (anchorColorIdx + 1) % anchorColorThemes.length;
  const t = getAnchorTheme();
  // Update all color buttons
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.style.background = t.cross;
    btn.title = `切换参考线颜色 (${t.name})`;
  });
  // Re-render current preview
  if (document.getElementById('optStep2').style.display !== 'none') {
    renderOptAnchorPreview2();
  } else if (document.getElementById('manualAnchorSection')?.style.display !== 'none') {
    renderOptAnchorPreview();
  }
}

// Get alignment offset for a frame within a unified rect (per-axis)
function getAlignOffset(f, uw, uh, anchorX, anchorY, at) {
  let ox = 0, oy = 0;

  // Horizontal alignment
  if (anchorX === 'core') {
    const cc = getCoreCenter(f, at);
    ox = Math.round(uw / 2 - cc.cx);
  } else if (anchorX === 'centroid') {
    const cc = getContentCenter(f, at);
    ox = Math.round(uw / 2 - cc.cx);
  } else if (anchorX === 'manual') {
    const anc = f.anchor || manualAnchor;
    if (anc) ox = Math.round(uw / 2 - anc.cx);
  } else if (anchorX === 'center') {
    ox = Math.round((uw - f.w) / 2);
  }

  // Vertical alignment
  if (anchorY === 'bottom') {
    oy = uh - f.h;
  } else if (anchorY === 'core') {
    const cc = getCoreCenter(f, at);
    oy = Math.round(uh / 2 - cc.cy);
  } else if (anchorY === 'centroid') {
    const cc = getContentCenter(f, at);
    oy = Math.round(uh / 2 - cc.cy);
  } else if (anchorY === 'manual') {
    const anc = f.anchor || manualAnchor;
    if (anc) oy = Math.round(uh / 2 - anc.cy);
  } else if (anchorY === 'center') {
    oy = Math.round((uh - f.h) / 2);
  } else if (anchorY === 'top') {
    oy = 0;
  }

  return { ox, oy };
}

// Compute center for a given anchor mode (per-axis, returns {cx, cy})
function computeCenter(f, anchorX, anchorY, at) {
  let cx, cy;

  // Horizontal
  if (anchorX === 'manual') {
    const anc = f.anchor || manualAnchor;
    cx = anc ? anc.cx : getContentCenter(f, at).cx;
  } else if (anchorX === 'core') {
    cx = getCoreCenter(f, at).cx;
  } else {
    cx = getContentCenter(f, at).cx;
  }

  // Vertical
  if (anchorY === 'bottom') {
    cy = f.h; // bottom alignment: content bottom = unified bottom
  } else if (anchorY === 'manual') {
    const anc = f.anchor || manualAnchor;
    cy = anc ? anc.cy : getContentCenter(f, at).cy;
  } else if (anchorY === 'core') {
    cy = getCoreCenter(f, at).cy;
  } else {
    cy = getContentCenter(f, at).cy;
  }

  return { cx, cy };
}

// ===== Optimize (non-destructive preview) =====
let optBackup = null; // backup of original frames before optimize
let optPreviewData = null; // optimized frame data for preview
let optTrimmedData = null; // cached trimmed data for recalculation
let optAnimTimer = null;
let optAnimIdx = 0;
let optAnimPlaying = false;

function showOptimizeModal() {
  if (!frames.length) { toast('没有帧'); return; }
  document.getElementById('optStep1').style.display = 'block';
  document.getElementById('optStep2').style.display = 'none';
  anchorPreviewIdx = 0;
  updateAnchorHint();
  document.getElementById('optModal').classList.add('show');
}

function updateAnchorHint() {
  const anchorX = document.getElementById('optAnchorX').value;
  const anchorY = document.getElementById('optAnchorY').value;
  const hint = document.getElementById('anchorHint');
  const section = document.getElementById('manualAnchorSection');
  const needManual = anchorX === 'manual' || anchorY === 'manual';

  let hintText = '';
  if (anchorX === 'core') hintText += '水平: 中间60%区域重心\n';
  else if (anchorX === 'centroid') hintText += '水平: 全体素重心\n';
  else if (anchorX === 'manual') hintText += '水平: 手动锚点\n';
  else if (anchorX === 'center') hintText += '水平: 几何居中\n';

  if (anchorY === 'bottom') hintText += '垂直: 底部对齐（脚固定）';
  else if (anchorY === 'core') hintText += '垂直: 中间60%区域重心';
  else if (anchorY === 'centroid') hintText += '垂直: 全体素重心';
  else if (anchorY === 'manual') hintText += '垂直: 手动锚点';
  else if (anchorY === 'center') hintText += '垂直: 几何居中';

  hint.innerHTML = hintText.replace(/\n/g, '<br>');
  hint.style.whiteSpace = 'pre-line';
  section.style.display = needManual ? 'block' : 'none';
  if (needManual) renderOptAnchorPreview();
}

// Listen for anchor mode changes
document.addEventListener('DOMContentLoaded', () => {
  const selX = document.getElementById('optAnchorX');
  const selY = document.getElementById('optAnchorY');
  if (selX) selX.addEventListener('change', updateAnchorHint);
  if (selY) selY.addEventListener('change', updateAnchorHint);
});

// Index of the frame currently being shown in the anchor preview
let anchorPreviewIdx = 0;

// Get the list of frames that will be optimized (for anchor navigation)
function getOptTargets() {
  const scope = document.getElementById('optScope')?.value || 'selected';
  if (scope === 'all') return [...frames];
  if (scope === 'manual') return frames.filter(f => f.manual);
  return frames.filter(f => f.selected);
}

// Navigate between frames in anchor preview
function anchorNavFrame(dir) {
  const targets = getOptTargets();
  if (!targets.length) return;
  anchorPreviewIdx = (anchorPreviewIdx + dir + targets.length) % targets.length;
  // Render to whichever step is currently visible
  if (document.getElementById('optStep2').style.display !== 'none') {
    renderOptAnchorPreview2();
  } else {
    renderOptAnchorPreview();
  }
}

// Draw anchor crosshair + reference lines on a canvas context
function drawAnchorOverlay(ctx, cw, ch, anc, s, isSet) {
  const ax = anc.cx * s, ay = anc.cy * s;
  const t = getAnchorTheme();

  // Reference lines (full-width/height) - solid, clear
  ctx.strokeStyle = t.ref;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 3]);
  ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(cw, ay); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, ch); ctx.stroke();
  ctx.setLineDash([]);

  // Center lines (frame center, subtle)
  ctx.strokeStyle = t.center;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath(); ctx.moveTo(0, ch / 2); ctx.lineTo(cw, ch / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cw / 2, 0); ctx.lineTo(cw / 2, ch); ctx.stroke();
  ctx.setLineDash([]);

  // Anchor crosshair (solid, prominent)
  ctx.strokeStyle = t.cross; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(ax - 14, ay); ctx.lineTo(ax + 14, ay); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax, ay - 14); ctx.lineTo(ax, ay + 14); ctx.stroke();
  // Circle
  ctx.strokeStyle = t.cross; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ax, ay, 10, 0, Math.PI * 2); ctx.stroke();
  // Center dot
  ctx.fillStyle = t.dot;
  ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI * 2); ctx.fill();

  // Coordinate label near anchor
  ctx.fillStyle = t.label;
  ctx.font = 'bold 10px monospace';
  const lx = ax + 16, ly = ay - 12;
  ctx.fillText(`${anc.cx},${anc.cy}`, Math.min(lx, cw - 46), Math.max(ly, 14));

  // "Set" indicator
  if (isSet) {
    ctx.fillStyle = 'rgba(166,227,161,0.12)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#a6e3a1';
    ctx.font = '9px sans-serif';
    ctx.fillText('✓', 2, 10);
  }
}

// Render clickable preview inside the optimize modal for manual anchor (per-frame)
function renderOptAnchorPreview() {
  const box = document.getElementById('optAnchorPreview');
  if (!box) return;

  const targets = getOptTargets();
  if (!targets.length || !srcImg) {
    box.innerHTML = '<span style="font-size:12px;color:var(--text-dim);">没有可优化的帧</span>';
    return;
  }

  // Clamp index
  anchorPreviewIdx = Math.max(0, Math.min(anchorPreviewIdx, targets.length - 1));
  const f = targets[anchorPreviewIdx];

  // Update navigation label
  const label = document.getElementById('anchorFrameLabel');
  if (label) label.textContent = `帧 ${anchorPreviewIdx + 1}/${targets.length}`;

  // Update set count
  const setCount = targets.filter(t => t.anchor).length;
  const countEl = document.getElementById('anchorSetCount');
  if (countEl) countEl.textContent = setCount > 0 ? `${setCount}/${targets.length} 已设` : '';

  // Get this frame's anchor (or default to center)
  const anc = f.anchor || { cx: Math.round(f.w / 2), cy: Math.round(f.h / 2) };
  document.getElementById('anchorX').value = anc.cx;
  document.getElementById('anchorY').value = anc.cy;

  const maxS = 220;
  const s = Math.min(maxS / f.w, maxS / f.h, 4);
  const cw = Math.ceil(f.w * s), ch = Math.ceil(f.h * s);
  box.innerHTML = `<canvas id="optAnchorCvs" width="${cw}" height="${ch}" style="image-rendering:pixelated;cursor:crosshair;"></canvas>`;
  const c = box.querySelector('canvas');
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, 0, 0, cw, ch);

  // Draw anchor overlay with reference lines
  drawAnchorOverlay(ctx, cw, ch, anc, s, !!f.anchor);

  // Click handler - set anchor for THIS frame
  c.onclick = (e) => {
    const rect = c.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const cx = Math.round(mx / s), cy = Math.round(my / s);
    f.anchor = { cx, cy };
    document.getElementById('anchorX').value = cx;
    document.getElementById('anchorY').value = cy;
    // Also sync global for backward compat
    manualAnchor = { cx, cy };
    renderOptAnchorPreview(); // Redraw with new crosshair
    toast(`帧 ${anchorPreviewIdx + 1} 锚点: (${cx}, ${cy})`);
  };
}

// Handle anchor input change in Step 1
function onAnchorInput1() {
  const targets = getOptTargets();
  if (!targets.length) return;
  const f = targets[anchorPreviewIdx];
  if (!f) return;
  const cx = parseInt(document.getElementById('anchorX').value) || 0;
  const cy = parseInt(document.getElementById('anchorY').value) || 0;
  f.anchor = { cx, cy };
  manualAnchor = { cx, cy };
  renderOptAnchorPreview(); // Redraw with new crosshair
}

// Long-press nudge for Step 1 anchor coordinates
let _nudgeTimer = null;
let _nudgeActive = false;
function startNudge(inputId, dir, e) {
  e.preventDefault();
  if (_nudgeActive) return; // Already nudging, let the timer chain handle it
  _nudgeActive = true;
  const el = document.getElementById(inputId);
  if (!el) { _nudgeActive = false; return; }
  // Immediate first step
  el.value = Math.max(0, (parseInt(el.value) || 0) + dir);
  onAnchorInput1();
  // Start repeat after 300ms delay, then every 80ms
  _nudgeTimer = setTimeout(function repeat() {
    el.value = Math.max(0, (parseInt(el.value) || 0) + dir);
    onAnchorInput1();
    _nudgeTimer = setTimeout(repeat, 80);
  }, 300);
}
function stopNudge() { clearTimeout(_nudgeTimer); _nudgeTimer = null; _nudgeActive = false; }

// Long-press nudge for Step 2 anchor coordinates
function startNudge2(inputId, dir, e) {
  e.preventDefault();
  if (_nudgeActive) return;
  _nudgeActive = true;
  const el = document.getElementById(inputId);
  if (!el) { _nudgeActive = false; return; }
  el.value = Math.max(0, (parseInt(el.value) || 0) + dir);
  onAnchorInput2();
  _nudgeTimer = setTimeout(function repeat() {
    el.value = Math.max(0, (parseInt(el.value) || 0) + dir);
    onAnchorInput2();
    _nudgeTimer = setTimeout(repeat, 80);
  }, 300);
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); stopOptAnim(); }

// Check frame integrity: is content touching edges? (possibly clipped)
// Check frame contamination: is there content far from center? (possibly includes neighbor)
function checkFrameIntegrity(f, at) {
  const alpha = getAlpha(); const w = _aW;
  const ix = Math.max(0, Math.round(f.x)), iy = Math.max(0, Math.round(f.y));
  const iw = Math.min(Math.round(f.w), w - ix), ih = Math.min(Math.round(f.h), _aH - iy);
  if (iw <= 0 || ih <= 0) return { clipped: false, contaminated: false };

  let leftEdge = false, rightEdge = false, topEdge = false, bottomEdge = false;
  for (let dy = 0; dy < ih; dy++) if (alpha[(iy+dy)*w+ix] > at) { leftEdge = true; break; }
  for (let dy = 0; dy < ih; dy++) if (alpha[(iy+dy)*w+(ix+iw-1)] > at) { rightEdge = true; break; }
  for (let dx = 0; dx < iw; dx++) if (alpha[iy*w+(ix+dx)] > at) { topEdge = true; break; }
  for (let dx = 0; dx < iw; dx++) if (alpha[(iy+ih-1)*w+(ix+dx)] > at) { bottomEdge = true; break; }

  const clipped = leftEdge || rightEdge || topEdge || bottomEdge;

  // Check contamination: content in outer 15% border on 3+ sides = likely includes neighbor
  const border = Math.max(2, Math.floor(Math.min(iw, ih) * 0.15));
  let sidesWithContent = 0;
  for (let dy = 0; dy < ih; dy++) if (alpha[(iy+dy)*w+(ix+border)] > at) { sidesWithContent++; break; }
  for (let dy = 0; dy < ih; dy++) if (alpha[(iy+dy)*w+(ix+iw-1-border)] > at) { sidesWithContent++; break; }
  for (let dx = 0; dx < iw; dx++) if (alpha[(iy+border)*w+(ix+dx)] > at) { sidesWithContent++; break; }
  for (let dx = 0; dx < iw; dx++) if (alpha[(iy+ih-1-border)*w+(ix+dx)] > at) { sidesWithContent++; break; }
  const contaminated = sidesWithContent >= 3;

  return { clipped, contaminated, sidesWithContent };
}

function runOptimize() {
  try {
    // 检查必要的DOM元素
    const requiredElements = ['optScope', 'optAlpha', 'optAnchorX', 'optAnchorY', 'optStep1', 'optStep2', 'optIssues', 'optStats', 'optStep2Anchor'];
    for (const id of requiredElements) {
      if (!document.getElementById(id)) {
        throw new Error('缺少必要的DOM元素: ' + id);
      }
    }
    
    if (!srcImg) {
      toast('请先加载图片');
      return;
    }
    
    if (frames.length === 0) {
      toast('没有帧可优化');
      return;
    }
    
    invalidateAlpha();
    
    // 获取和验证参数
    const scope = document.getElementById('optScope').value || 'selected';
    const at = parseInt(document.getElementById('optAlpha').value) || 10;
    const anchorX = document.getElementById('optAnchorX').value || 'center';
    const anchorY = document.getElementById('optAnchorY').value || 'center';

    // 验证锚点模式
    const validAnchorModes = ['core', 'centroid', 'manual', 'center', 'bottom', 'top'];
    if (!validAnchorModes.includes(anchorX)) {
      toast('无效的水平锚点模式');
      return;
    }
    if (!validAnchorModes.includes(anchorY)) {
      toast('无效的垂直锚点模式');
      return;
    }

    let targets = [];
    try {
      targets = scope === 'all' ? [...frames] : 
                scope === 'manual' ? frames.filter(f => f.manual) : 
                frames.filter(f => f.selected);
    } catch (error) {
      console.error('过滤帧时出错:', error);
      toast('过滤帧时出错，请重试');
      return;
    }
    
    if (!targets.length) {
      toast('没有符合条件的帧');
      return;
    }

    // 备份原始帧
    try {
      optBackup = targets.map(f => ({
        id: f.id, 
        x: f.x, 
        y: f.y, 
        w: f.w, 
        h: f.h 
      }));
    } catch (error) {
      console.error('备份帧数据时出错:', error);
      toast('备份帧数据时出错，请重试');
      return;
    }

    // 步骤1: 检查完整性
    let clippedCount = 0, contaminatedCount = 0;
    const issues = [];
    try {
      for (const f of targets) {
        const check = checkFrameIntegrity(f, at);
        if (check.clipped) { clippedCount++; }
        if (check.contaminated) { contaminatedCount++; }
      }
      if (clippedCount > 0) {
        issues.push(`<span style="color:var(--yellow);">⚠️ ${clippedCount} 帧内容贴边（可能被截断）</span>`);
      }
      if (contaminatedCount > 0) {
        issues.push(`<span style="color:var(--red);">⚠️ ${contaminatedCount} 帧可能混入相邻帧内容</span>`);
      }
    } catch (error) {
      console.error('检查帧完整性时出错:', error);
      issues.push(`<span style="color:var(--yellow);">⚠️ 帧完整性检查出错</span>`);
    }

    // 步骤2: 裁剪透明边缘
    const trimmedData = [];
    let trimmed = 0;
    try {
      for (const f of targets) {
        const origW = f.w, origH = f.h;
        const tr = trimAlpha(f, at);
        if (tr) {
          trimmedData.push({ f, tr, origW, origH });
          trimmed++;
        } else {
          trimmedData.push({ f, tr: { x: f.x, y: f.y, w: f.w, h: f.h }, origW: f.w, origH: f.h });
        }
      }
    } catch (error) {
      console.error('裁剪透明边缘时出错:', error);
      toast('裁剪透明边缘时出错，请重试');
      return;
    }

    // 步骤4: 统一尺寸
    const PAD = 4;
    let uw, uh;
    try {
      uw = Math.max(...trimmedData.map(t => Math.max(t.tr.w, t.origW))) + PAD * 2;
      uh = Math.max(...trimmedData.map(t => Math.max(t.tr.h, t.origH))) + PAD * 2;
      
      // 检查尺寸合理性
      if (uw === PAD * 2 || uh === PAD * 2) {
        throw new Error('计算的统一尺寸无效');
      }
    } catch (error) {
      console.error('计算统一尺寸时出错:', error);
      toast('计算统一尺寸时出错，请重试');
      return;
    }

    // 步骤5: 计算所有帧的内容中心
    let centroids;
    try {
      centroids = trimmedData.map(t => computeCenter(t.tr, anchorX, anchorY, at));
    } catch (error) {
      console.error('计算内容中心时出错:', error);
      toast('计算内容中心时出错，请重试');
      return;
    }

    // 步骤6: 计算所有帧的偏移量
    const offsets = [];
    try {
      for (let i = 0; i < trimmedData.length; i++) {
        const t = trimmedData[i];
        const cc = centroids[i];
        let ox, oy;

        if (anchorX === 'core' || anchorX === 'centroid') {
          ox = Math.round(uw / 2 - cc.cx);
        } else if (anchorX === 'manual') {
          const anc = t.f.anchor || manualAnchor;
          ox = anc ? Math.round(uw / 2 - anc.cx) : Math.round(uw / 2 - cc.cx);
        } else if (anchorX === 'center') {
          ox = Math.round((uw - t.tr.w) / 2);
        } else { ox = 0; }

        if (anchorY === 'bottom') {
          oy = uh - t.tr.h;
        } else if (anchorY === 'core' || anchorY === 'centroid') {
          oy = Math.round(uh / 2 - cc.cy);
        } else if (anchorY === 'manual') {
          const anc = t.f.anchor || manualAnchor;
          oy = anc ? Math.round(uh / 2 - anc.cy) : Math.round(uh / 2 - cc.cy);
        } else if (anchorY === 'center') {
          oy = Math.round((uh - t.tr.h) / 2);
        } else { oy = 0; }

        offsets.push({ ox, oy });
      }
    } catch (error) {
      console.error('计算偏移量时出错:', error);
      toast('计算偏移量时出错，请重试');
      return;
    }

    // 步骤6b: 检查是否需要扩展画布
    let needUW = uw, needUH = uh;
    try {
      for (let i = 0; i < trimmedData.length; i++) {
        const t = trimmedData[i];
        const { ox, oy } = offsets[i];
        if (ox < 0) needUW = Math.max(needUW, uw - ox);
        if (oy < 0) needUH = Math.max(needUH, uh - oy);
        if (ox + t.tr.w > uw) needUW = Math.max(needUW, ox + t.tr.w);
        if (oy + t.tr.h > uh) needUH = Math.max(needUH, oy + t.tr.h);
      }
    } catch (error) {
      console.error('检查画布边界时出错:', error);
      // 继续使用原始尺寸
    }

    // 计算最终尺寸和偏移量
    const finalUW = needUW, finalUH = needUH;
    const expandDX = Math.round((finalUW - uw) / 2);
    const expandDY = Math.round((finalUH - uh) / 2);

    // 生成预览数据
    optPreviewData = [];
    try {
      for (let i = 0; i < trimmedData.length; i++) {
        const t = trimmedData[i];
        const { ox, oy } = offsets[i];
        const offsetX = ox + expandDX;
        const offsetY = oy + expandDY;

        optPreviewData.push({
          id: t.f.id,
          origX: t.f.x, origY: t.f.y, origW: t.f.w, origH: t.f.h,
          srcX: t.tr.x, srcY: t.tr.y, srcW: t.tr.w, srcH: t.tr.h,
          unifiedW: finalUW, unifiedH: finalUH,
          offsetX, offsetY
        });
      }
    } catch (error) {
      console.error('生成预览数据时出错:', error);
      toast('生成预览数据时出错，请重试');
      return;
    }

    // 显示结果
    try {
      document.getElementById('optStep1').style.display = 'none';
      document.getElementById('optStep2').style.display = 'block';
      document.getElementById('optIssues').innerHTML = issues.length ? issues.join('<br>') : '<span style="color:var(--green);">✅ 所有帧完整性检查通过</span>';
      document.getElementById('optStats').innerHTML = `统一尺寸: ${uw}×${uh} · 水平: ${anchorX} · 垂直: ${anchorY} · 裁剪: ${trimmed}`;

      // 缓存裁剪数据
      optTrimmedData = trimmedData;

      // 显示手动锚点调整面板
      const needManual = anchorX === 'manual' || anchorY === 'manual';
      document.getElementById('optStep2Anchor').style.display = needManual ? 'block' : 'none';
      if (needManual) {
        anchorPreviewIdx = 0;
        renderOptAnchorPreview2();
      }

      // 开始预览动画
      optAnimIdx = 0;
      startOptAnim();
    } catch (error) {
      console.error('更新UI时出错:', error);
      toast('更新界面时出错，请重试');
    }

  } catch (error) {
    console.error('优化过程中出错:', error);
    toast('优化出错: ' + error.message);
  }
}

// Preview animation with optimized data
function startOptAnim() {
  stopOptAnim();
  if (!optPreviewData || !optPreviewData.length || !srcImg) return;
  optAnimPlaying = true;
  document.getElementById('btnOptAnim').textContent = '⏸';

  const c = document.getElementById('optPreviewCanvas');
  const ctx = c.getContext('2d');
  // All frames have the same unified size
  const uw = optPreviewData[0].unifiedW;
  const uh = optPreviewData[0].unifiedH;
  const s = Math.min(400 / uw, 180 / uh, 4);
  c.width = Math.ceil(uw * s);
  c.height = Math.ceil(uh * s);

  // Pre-create offscreen canvas for compositing each frame
  const offCvs = document.createElement('canvas');
  offCvs.width = uw;
  offCvs.height = uh;
  const offCtx = offCvs.getContext('2d');
  // Disable image smoothing for offscreen canvas
  offCtx.imageSmoothingEnabled = false;
  offCtx.mozImageSmoothingEnabled = false;
  offCtx.webkitImageSmoothingEnabled = false;
  offCtx.msImageSmoothingEnabled = false;

  // Disable image smoothing for main preview canvas
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  const fps = parseInt(document.getElementById('optFpsRange').value) || 8;
  const total = optPreviewData.length;
  const indicator = document.getElementById('optFrameIndicator');
  optAnimTimer = setInterval(() => {
    const idx = optAnimIdx % total;
    const d = optPreviewData[idx];
    // Check if this is an interpolated frame
    if (d._isInterp && d._interpImgData) {
      offCtx.clearRect(0, 0, uw, uh);
      offCtx.putImageData(d._interpImgData, 0, 0);
    } else {
      offCtx.clearRect(0, 0, uw, uh);
      offCtx.drawImage(srcImg, d.srcX, d.srcY, d.srcW, d.srcH, d.offsetX, d.offsetY, d.srcW, d.srcH);
    }
    // Step 2: Draw the composited frame onto the preview canvas
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(offCvs, 0, 0, uw, uh, 0, 0, c.width, c.height);
    // Update frame indicator
    if (indicator) indicator.textContent = `${idx + 1}/${total}`;
    optAnimIdx++;
  }, 1000 / fps);
}

function stopOptAnim() {
  if (typeof optAnimTimer !== 'undefined' && optAnimTimer) { 
    clearInterval(optAnimTimer); 
    optAnimTimer = null; 
  }
  if (typeof optAnimPlaying !== 'undefined') {
    optAnimPlaying = false;
  }
  const btn = document.getElementById('btnOptAnim');
  if (btn) btn.textContent = '▶';
}

function toggleOptAnim() {
  if (optAnimPlaying) stopOptAnim(); else startOptAnim();
}

// Step one frame forward/backward (pause animation first)
function optStepFrame(dir) {
  if (!optPreviewData || !optPreviewData.length) return;
  stopOptAnim();
  const total = optPreviewData.length;
  optAnimIdx = ((optAnimIdx + dir) % total + total) % total;
  // Render single frame
  const d = optPreviewData[optAnimIdx];
  const c = document.getElementById('optPreviewCanvas');
  const ctx = c.getContext('2d');
  const uw = d.unifiedW, uh = d.unifiedH;
  const s = Math.min(400 / uw, 180 / uh, 4);
  c.width = Math.ceil(uw * s);
  c.height = Math.ceil(uh * s);
  const offCvs = document.createElement('canvas');
  offCvs.width = uw; offCvs.height = uh;
  const offCtx = offCvs.getContext('2d');
  // Disable image smoothing for offscreen canvas
  offCtx.imageSmoothingEnabled = false;
  offCtx.mozImageSmoothingEnabled = false;
  offCtx.webkitImageSmoothingEnabled = false;
  offCtx.msImageSmoothingEnabled = false;
  offCtx.clearRect(0, 0, uw, uh);
  if (d._isInterp && d._interpImgData) {
    offCtx.putImageData(d._interpImgData, 0, 0);
  } else {
    offCtx.drawImage(srcImg, d.srcX, d.srcY, d.srcW, d.srcH, d.offsetX, d.offsetY, d.srcW, d.srcH);
  }
  // Disable image smoothing for main preview canvas
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(offCvs, 0, 0, uw, uh, 0, 0, c.width, c.height);
  const indicator = document.getElementById('optFrameIndicator');
  if (indicator) indicator.textContent = `${optAnimIdx + 1}/${total}`;
}

function updateOptFps() {
  document.getElementById('optFpsVal').textContent = document.getElementById('optFpsRange').value + 'fps';
  if (optAnimPlaying) startOptAnim();
}

// Recalculate offsets only (no re-trim) when anchors change in Step 2
function recalcOptimize() {
  if (!optTrimmedData || !optTrimmedData.length) return;
  const anchorX = document.getElementById('optAnchorX').value;
  const anchorY = document.getElementById('optAnchorY').value;
  const at = parseInt(document.getElementById('optAlpha').value) || 10;

  const PAD = 4;
  const uw = Math.max(...optTrimmedData.map(t => Math.max(t.tr.w, t.origW))) + PAD * 2;
  const uh = Math.max(...optTrimmedData.map(t => Math.max(t.tr.h, t.origH))) + PAD * 2;

  // Recompute centroids with updated anchors
  const centroids = optTrimmedData.map(t => computeCenter(t.tr, anchorX, anchorY, at));

  // Compute offsets
  const offsets = [];
  for (let i = 0; i < optTrimmedData.length; i++) {
    const t = optTrimmedData[i];
    const cc = centroids[i];
    let ox, oy;

    if (anchorX === 'core' || anchorX === 'centroid') {
      ox = Math.round(uw / 2 - cc.cx);
    } else if (anchorX === 'manual') {
      const anc = t.f.anchor || manualAnchor;
      ox = anc ? Math.round(uw / 2 - anc.cx) : Math.round(uw / 2 - cc.cx);
    } else if (anchorX === 'center') {
      ox = Math.round((uw - t.tr.w) / 2);
    } else { ox = 0; }

    if (anchorY === 'bottom') {
      oy = uh - t.tr.h;
    } else if (anchorY === 'core' || anchorY === 'centroid') {
      oy = Math.round(uh / 2 - cc.cy);
    } else if (anchorY === 'manual') {
      const anc = t.f.anchor || manualAnchor;
      oy = anc ? Math.round(uh / 2 - anc.cy) : Math.round(uh / 2 - cc.cy);
    } else if (anchorY === 'center') {
      oy = Math.round((uh - t.tr.h) / 2);
    } else { oy = 0; }

    offsets.push({ ox, oy });
  }

  // Check bounds and expand if needed
  let needUW = uw, needUH = uh;
  for (let i = 0; i < optTrimmedData.length; i++) {
    const t = optTrimmedData[i];
    const { ox, oy } = offsets[i];
    if (ox < 0) needUW = Math.max(needUW, uw - ox);
    if (oy < 0) needUH = Math.max(needUH, uh - oy);
    if (ox + t.tr.w > uw) needUW = Math.max(needUW, ox + t.tr.w);
    if (oy + t.tr.h > uh) needUH = Math.max(needUH, oy + t.tr.h);
  }

  const finalUW = needUW, finalUH = needUH;
  const expandDX = Math.round((finalUW - uw) / 2);
  const expandDY = Math.round((finalUH - uh) / 2);

  optPreviewData = [];
  for (let i = 0; i < optTrimmedData.length; i++) {
    const t = optTrimmedData[i];
    const { ox, oy } = offsets[i];
    const offsetX = ox + expandDX;
    const offsetY = oy + expandDY;
    optPreviewData.push({
      id: t.f.id,
      origX: t.f.x, origY: t.f.y, origW: t.f.w, origH: t.f.h,
      srcX: t.tr.x, srcY: t.tr.y, srcW: t.tr.w, srcH: t.tr.h,
      unifiedW: finalUW, unifiedH: finalUH,
      offsetX, offsetY
    });
  }

  // Refresh animation preview
  if (optAnimPlaying) {
    optAnimIdx = 0;
    startOptAnim();
  }
}

// Render anchor preview in Step 2 (for tuning after initial optimize)
function renderOptAnchorPreview2() {
  const box = document.getElementById('optAnchorPreview2');
  if (!box) return;
  const targets = getOptTargets();
  if (!targets.length || !srcImg) return;

  anchorPreviewIdx = Math.max(0, Math.min(anchorPreviewIdx, targets.length - 1));
  const f = targets[anchorPreviewIdx];

  // Update labels
  const label = document.getElementById('anchorFrameLabel2');
  if (label) label.textContent = `帧 ${anchorPreviewIdx + 1}/${targets.length}`;
  const setCount = targets.filter(t => t.anchor).length;
  const countEl = document.getElementById('anchorSetCount2');
  if (countEl) countEl.textContent = setCount > 0 ? `${setCount}/${targets.length}` : '';

  const anc = f.anchor || { cx: Math.round(f.w / 2), cy: Math.round(f.h / 2) };
  const x2El = document.getElementById('anchorX2Input');
  const y2El = document.getElementById('anchorY2Input');
  if (x2El) x2El.value = anc.cx;
  if (y2El) y2El.value = anc.cy;

  const maxS = 260;
  const s = Math.min(maxS / f.w, maxS / f.h, 4);
  const cw = Math.ceil(f.w * s), ch = Math.ceil(f.h * s);
  box.innerHTML = `<canvas id="optAnchorCvs2" width="${cw}" height="${ch}" style="image-rendering:pixelated;cursor:crosshair;"></canvas>`;
  const c = box.querySelector('canvas');
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, 0, 0, cw, ch);

  // Draw anchor overlay with reference lines
  drawAnchorOverlay(ctx, cw, ch, anc, s, !!f.anchor);

  // Click to set anchor → recalculate + refresh animation
  c.onclick = (e) => {
    const rect = c.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const cx = Math.round(mx / s), cy = Math.round(my / s);
    f.anchor = { cx, cy };
    manualAnchor = { cx, cy };
    renderOptAnchorPreview2(); // Redraw crosshair
    recalcOptimize(); // Recalculate offsets & refresh animation
    toast(`帧 ${anchorPreviewIdx + 1} 锚点: (${cx}, ${cy})`);
  };
}

// Handle anchor input change in Step 2
function onAnchorInput2() {
  const targets = getOptTargets();
  if (!targets.length) return;
  const f = targets[anchorPreviewIdx];
  if (!f) return;
  const cx = parseInt(document.getElementById('anchorX2Input').value) || 0;
  const cy = parseInt(document.getElementById('anchorY2Input').value) || 0;
  f.anchor = { cx, cy };
  manualAnchor = { cx, cy };
  renderOptAnchorPreview2(); // Redraw with new crosshair
  recalcOptimize(); // Recalculate offsets & refresh animation
}

// Go back to Step 1 from Step 2
function backToOptStep1() {
  stopOptAnim();
  optPreviewData = null;
  optTrimmedData = null;
  document.getElementById('optStep2').style.display = 'none';
  document.getElementById('optStep1').style.display = 'block';
}

// Apply optimization (commit changes)
function applyOptimize() {
  if (!optPreviewData || !optBackup) { toast('没有可应用的优化'); return; }
  const newFrames = [];
  for (const d of optPreviewData) {
    if (d._isInterp) {
      // Interpolated frame: create a new frame entry
      // We need to composite it onto the source image first
      const uw = d.unifiedW, uh = d.unifiedH;
      const tmpCvs = document.createElement('canvas');
      tmpCvs.width = uw; tmpCvs.height = uh;
      const tmpCtx = tmpCvs.getContext('2d');
      tmpCtx.putImageData(d._interpImgData, 0, 0);
      // For now, interpolated frames are stored as canvas data
      newFrames.push({
        id: nextId++, x: 0, y: 0, w: uw, h: uh,
        manual: true, _interpCanvas: tmpCvs,
        unifiedW: uw, unifiedH: uh, offsetX: 0, offsetY: 0
      });
    } else {
      const f = frames.find(fr => fr.id === d.id);
      if (f) {
        f.x = d.srcX; f.y = d.srcY; f.w = d.srcW; f.h = d.srcH;
        f.unifiedW = d.unifiedW;
        f.unifiedH = d.unifiedH;
        f.offsetX = d.offsetX;
        f.offsetY = d.offsetY;
      }
    }
  }
  if (newFrames.length) frames.push(...newFrames);
  optBackup = null; optPreviewData = null; optTrimmedData = null; optInterpBackup = null;
  stopOptAnim();
  renderRects(); updateAll();
  toast('✅ 优化已应用');
}

// Apply optimization and go to Step 3 (export)
function applyAndExport() {
  if (!optPreviewData || !optBackup) { toast('没有可应用的优化'); return; }
  const newFrames = [];
  for (const d of optPreviewData) {
    if (d._isInterp) {
      const uw = d.unifiedW, uh = d.unifiedH;
      const tmpCvs = document.createElement('canvas');
      tmpCvs.width = uw; tmpCvs.height = uh;
      tmpCvs.getContext('2d').putImageData(d._interpImgData, 0, 0);
      newFrames.push({
        id: nextId++, x: 0, y: 0, w: uw, h: uh,
        manual: true, _interpCanvas: tmpCvs,
        unifiedW: uw, unifiedH: uh, offsetX: 0, offsetY: 0
      });
    } else {
      const f = frames.find(fr => fr.id === d.id);
      if (f) {
        f.x = d.srcX; f.y = d.srcY; f.w = d.srcW; f.h = d.srcH;
        f.unifiedW = d.unifiedW;
        f.unifiedH = d.unifiedH;
        f.offsetX = d.offsetX;
        f.offsetY = d.offsetY;
      }
    }
  }
  if (newFrames.length) frames.push(...newFrames);
  optBackup = null; optPreviewData = null; optTrimmedData = null; optInterpBackup = null;
  stopOptAnim();
  renderRects(); updateAll();

  // Go to Step 3
  document.getElementById('optStep2').style.display = 'none';
  document.getElementById('optStep3').style.display = 'block';
  // Auto-generate name based on frame count
  const optimizedFrames = frames.filter(f => f.unifiedW);
  document.getElementById('exportName').value = `sprite_${optimizedFrames.length}f`;
}

// Go back to Step 2 from Step 3
function backToOptStep2() {
  document.getElementById('optStep3').style.display = 'none';
  document.getElementById('optStep2').style.display = 'block';
  // Re-run optimize to restore preview (frames already have unified metadata)
  // We need to rebuild optPreviewData from current frame state
  rebuildOptPreview();
}

// Rebuild optPreviewData from current frame unified metadata (for returning to Step 2)
function rebuildOptPreview() {
  const optimizedFrames = frames.filter(f => f.unifiedW && f.unifiedH);
  if (!optimizedFrames.length) return;
  optTrimmedData = optimizedFrames.map(f => ({
    f, tr: { x: f.x, y: f.y, w: f.w, h: f.h }, origW: f.w, origH: f.h
  }));
  optPreviewData = optimizedFrames.map(f => ({
    id: f.id,
    origX: f.x, origY: f.y, origW: f.w, origH: f.h,
    srcX: f.x, srcY: f.y, srcW: f.w, srcH: f.h,
    unifiedW: f.unifiedW, unifiedH: f.unifiedH,
    offsetX: f.offsetX, offsetY: f.offsetY
  }));
  optBackup = null; // Already applied, no need for backup
  optAnimIdx = 0;
  startOptAnim();
}

// Get the optimized frames for export
function getOptimizedFrames() {
  return frames.filter(f => f.unifiedW && f.unifiedH);
}

// Export sprite sheet (from Step 3)
function doExportOptimized() {
  const sf = getOptimizedFrames();
  if (!sf.length) { toast('没有已优化的帧'); return; }
  const name = document.getElementById('exportName').value.trim() || 'sprite';
  const pad = parseInt(document.getElementById('exPadOpt').value) || 0;
  const mode = document.getElementById('exModeOpt').value;

  // All frames have unified size
  const uw = Math.max(...sf.map(f => f.unifiedW));
  const uh = Math.max(...sf.map(f => f.unifiedH));

  if (mode === 'single') {
    const cols = Math.ceil(Math.sqrt(sf.length));
    const rows = Math.ceil(sf.length / cols);
    const c = document.createElement('canvas');
    c.width = cols * (uw + pad) - pad;
    c.height = rows * (uh + pad) - pad;
    const ctx = c.getContext('2d');
    
    // Disable image smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    sf.forEach((f, i) => {
      const dx = (i % cols) * (uw + pad);
      const dy = Math.floor(i / cols) * (uh + pad);
      // Draw frame content at pre-computed offset within unified cell
      ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx + f.offsetX, dy + f.offsetY, f.w, f.h);
    });
    dlCanvas(c, `${name}.png`);
    exportMeta(sf, name, uw, uh, pad, cols, rows);
  } else {
    const rm = {};
    sf.forEach(f => {
      const key = f.row !== undefined ? f.row : 0;
      if (!rm[key]) rm[key] = [];
      rm[key].push(f);
    });
    for (const [r, rfs] of Object.entries(rm)) {
      const c = document.createElement('canvas');
      c.width = rfs.length * (uw + pad) - pad;
      c.height = uh;
      const ctx = c.getContext('2d');
      
      // Disable image smoothing
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      rfs.forEach((f, i) => {
        const dx = i * (uw + pad);
        ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx + f.offsetX, f.offsetY, f.w, f.h);
      });
      dlCanvas(c, `${name}_row${+r + 1}.png`);
    }
    exportMeta(sf, name, uw, uh, pad, 0, 0);
  }
  toast(`✅ ${name}.png 已导出`);
}

// Export ZIP with frames + sheets + metadata (from Step 3)
function doExportZip() {
  if (typeof JSZip === 'undefined') { toast('需要网络加载 JSZip'); return; }
  const sf = getOptimizedFrames();
  if (!sf.length) { toast('没有已优化的帧'); return; }
  const name = document.getElementById('exportName').value.trim() || 'sprite';
  const pad = parseInt(document.getElementById('exPadOpt').value) || 0;
  const uw = Math.max(...sf.map(f => f.unifiedW));
  const uh = Math.max(...sf.map(f => f.unifiedH));
  const zip = new JSZip();

  // Individual frames
  const ff = zip.folder('frames');
  sf.forEach((f, i) => {
    const c = document.createElement('canvas');
    c.width = f.unifiedW; c.height = f.unifiedH;
    const ctx = c.getContext('2d');
    
    // Disable image smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, f.offsetX, f.offsetY, f.w, f.h);
    ff.file(`${name}_f${i + 1}.png`, c.toDataURL('image/png').split(',')[1], { base64: true });
  });

  // Sprite sheet (single)
  const cols = Math.ceil(Math.sqrt(sf.length));
  const rows = Math.ceil(sf.length / cols);
  const sc = document.createElement('canvas');
  sc.width = cols * (uw + pad) - pad;
  sc.height = rows * (uh + pad) - pad;
  const sctx = sc.getContext('2d');
  
  // Disable image smoothing
  sctx.imageSmoothingEnabled = false;
  sctx.mozImageSmoothingEnabled = false;
  sctx.webkitImageSmoothingEnabled = false;
  sctx.msImageSmoothingEnabled = false;
  
  sf.forEach((f, i) => {
    const dx = (i % cols) * (uw + pad);
    const dy = Math.floor(i / cols) * (uh + pad);
    sctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx + f.offsetX, dy + f.offsetY, f.w, f.h);
  });
  zip.file(`${name}_sheet.png`, sc.toDataURL('image/png').split(',')[1], { base64: true });

  // Metadata in selected format
  const fmt = document.getElementById('exMetaFormat')?.value || 'json';
  const metaFrames = sf.map((f, i) => ({
    x: (i % cols) * (uw + pad), y: Math.floor(i / cols) * (uh + pad),
    w: uw, h: uh, offX: f.offsetX, offY: f.offsetY, srcW: f.w, srcH: f.h
  }));

  if (fmt === 'json' || fmt === 'none') {
    const meta = {
      name, frameWidth: uw, frameHeight: uh,
      frameCount: sf.length, cols, rows, pad,
      frames: metaFrames.map((fr, i) => ({
        index: i, region: { x: fr.x, y: fr.y, w: fr.w, h: fr.h },
        contentOffset: { x: fr.offX, y: fr.offY }, contentSize: { w: fr.srcW, h: fr.srcH }
      }))
    };
    zip.file(`${name}.json`, JSON.stringify(meta, null, 2));
  } else if (fmt === 'tpxml') {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<TextureAtlas imagePath="${name}.png" width="${cols * (uw + pad) - pad}" height="${rows * (uh + pad) - pad}">\n`;
    metaFrames.forEach((fr, i) => {
      xml += `  <SubTexture name="${name}_${i}" x="${fr.x}" y="${fr.y}" width="${fr.w}" height="${fr.h}" frameX="${fr.offX}" frameY="${fr.offY}" frameWidth="${fr.srcW}" frameHeight="${fr.srcH}"/>\n`;
    });
    xml += `</TextureAtlas>`;
    zip.file(`${name}.xml`, xml);
  } else if (fmt === 'css') {
    let css = `/* ${name} */\n.sprite { display:inline-block; background-image:url('${name}.png'); background-repeat:no-repeat; }\n\n`;
    metaFrames.forEach((fr, i) => { css += `.sprite-${i} { width:${fr.w}px; height:${fr.h}px; background-position:-${fr.x}px -${fr.y}px; }\n\n`; });
    zip.file(`${name}.css`, css);
  } else if (fmt === 'txt') {
    let txt = `# ${name}\n# frameWidth=${uw} frameHeight=${uh} cols=${cols} rows=${rows}\n`;
    metaFrames.forEach((fr, i) => { txt += `${name}_${i} = ${fr.x} ${fr.y} ${fr.w} ${fr.h}\n`; });
    zip.file(`${name}.txt`, txt);
  }

  zip.generateAsync({ type: 'blob' }).then(b => {
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = `${name}.zip`; a.click();
    URL.revokeObjectURL(u);
    toast(`✅ ${name}.zip 已导出`);
  });
}

// Export metadata in selected format
function exportMeta(sf, name, uw, uh, pad, cols, rows) {
  const fmt = document.getElementById('exMetaFormat')?.value || 'json';
  if (fmt === 'none') return;

  const frames = sf.map((f, i) => ({
    x: cols > 0 ? (i % cols) * (uw + pad) : 0,
    y: cols > 0 ? Math.floor(i / cols) * (uh + pad) : 0,
    w: uw, h: uh,
    offX: f.offsetX, offY: f.offsetY,
    srcW: f.w, srcH: f.h
  }));

  let content, ext;

  if (fmt === 'json') {
    // JSON Array format (universal)
    const meta = {
      name, frameWidth: uw, frameHeight: uh,
      frameCount: sf.length, cols, rows, pad,
      verticalAlign: document.getElementById('optAnchorY')?.value || 'bottom',
      frames: frames.map((fr, i) => ({
        index: i,
        region: { x: fr.x, y: fr.y, w: fr.w, h: fr.h },
        contentOffset: { x: fr.offX, y: fr.offY },
        contentSize: { w: fr.srcW, h: fr.srcH }
      }))
    };
    content = JSON.stringify(meta, null, 2);
    ext = '.json';
  } else if (fmt === 'tpxml') {
    // TexturePacker XML format
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<TextureAtlas imagePath="${name}.png" width="${cols * (uw + pad) - pad}" height="${rows * (uh + pad) - pad}">\n`;
    frames.forEach((fr, i) => {
      xml += `  <SubTexture name="${name}_${i}" x="${fr.x}" y="${fr.y}" width="${fr.w}" height="${fr.h}" frameX="${fr.offX}" frameY="${fr.offY}" frameWidth="${fr.srcW}" frameHeight="${fr.srcH}"/>\n`;
    });
    xml += `</TextureAtlas>`;
    content = xml;
    ext = '.xml';
  } else if (fmt === 'css') {
    // CSS Spritesheet format
    let css = `/* ${name} - Sprite Sheet CSS */\n.sprite {\n  display: inline-block;\n  background-image: url('${name}.png');\n  background-repeat: no-repeat;\n}\n\n`;
    frames.forEach((fr, i) => {
      css += `.sprite-${i} {\n  width: ${fr.w}px;\n  height: ${fr.h}px;\n  background-position: -${fr.x}px -${fr.y}px;\n}\n\n`;
    });
    content = css;
    ext = '.css';
  } else if (fmt === 'txt') {
    // Packer TXT format (name = x y w h)
    let txt = `# ${name} - Sprite Sheet\n# frameWidth=${uw} frameHeight=${uh} cols=${cols} rows=${rows} pad=${pad}\n`;
    frames.forEach((fr, i) => {
      txt += `${name}_${i} = ${fr.x} ${fr.y} ${fr.w} ${fr.h}\n`;
    });
    content = txt;
    ext = '.txt';
  }

  if (content) {
    const mime = fmt === 'json' ? 'application/json' : fmt === 'css' ? 'text/css' : fmt === 'tpxml' ? 'application/xml' : 'text/plain';
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

// Discard optimization (restore original)
function discardOptimize() {
  if (optBackup) {
    for (const b of optBackup) {
      const f = frames.find(fr => fr.id === b.id);
      if (f) { f.x = b.x; f.y = b.y; f.w = b.w; f.h = b.h; delete f.unifiedW; delete f.unifiedH; delete f.offsetX; delete f.offsetY; }
    }
  }
  optBackup = null;
  optPreviewData = null;
  stopOptAnim();
  closeModal('optModal');
  renderRects(); updateAll();
  toast('已放弃优化');
}

// ===== Context Menu =====
function showCtx(e, id) {
  ctxFrameId = id;
  const m = document.getElementById('ctxMenu');
  m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px';
  m.classList.add('show');
}
document.addEventListener('click', () => document.getElementById('ctxMenu').classList.remove('show'));
function ctxToggle() { toggleFrame(ctxFrameId); }
function ctxDuplicate() {
  const f = frames.find(fr => fr.id === ctxFrameId); if (!f) return;
  const nf = { ...f, id: nextId++, col: f.col + 1, x: f.x + f.w + 2, selected: true };
  frames.push(nf); selId = nf.id; refresh(); updatePreview(); updateDetail(); toast('已复制');
}
function ctxOptimizeOne() {
  const f = frames.find(fr => fr.id === ctxFrameId); if (!f || !srcImg) return;
  invalidateAlpha();
  const at = parseInt(document.getElementById('alphaTh').value) || 10;
  expandEdges(f, at, 2, 8);
  const tr = trimAlpha(f, at);
  if (tr) { f.x = tr.x; f.y = tr.y; f.w = tr.w; f.h = tr.h; }
  refresh(); updatePreview(); updateDetail(); toast(`裁剪为 ${f.w}×${f.h}`);
}
function ctxSelectRow() {
  const f = frames.find(fr => fr.id === ctxFrameId);
  if (f) frames.filter(fr => fr.row === f.row).forEach(fr => fr.selected = true);
  refresh();
}
function ctxDeselectRow() {
  const f = frames.find(fr => fr.id === ctxFrameId);
  if (f) frames.filter(fr => fr.row === f.row).forEach(fr => fr.selected = false);
  refresh();
}
function ctxDelete() {
  frames = frames.filter(f => f.id !== ctxFrameId);
  if (selId === ctxFrameId) selId = null;
  refresh(); updatePreview(); updateDetail(); toast('已删除');
}

// Move frame up/down in the list (changes animation order)
function moveFrame(id, dir) {
  const idx = frames.findIndex(f => f.id === id);
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= frames.length) return;
  // Swap
  [frames[idx], frames[newIdx]] = [frames[newIdx], frames[idx]];
  refresh(); updatePreview();
}

function ctxMoveUp() { moveFrame(ctxFrameId, -1); toast('已上移'); }
function ctxMoveDown() { moveFrame(ctxFrameId, 1); toast('已下移'); }

// ===== Frame List =====
function updateList() {
  const box = document.getElementById('frameList');
  if (!frames.length) { box.innerHTML = '<div class="empty" style="padding:24px;"><p style="font-size:12px;">暂无帧</p></div>'; return; }
  const sel = frames.filter(f => f.selected).length;
  document.getElementById('listHint').textContent = `(${sel}/${frames.length})`;

  const groups = {};
  frames.forEach(f => {
    const k = f.manual ? `m${f.row}` : `a${f.row}`;
    if (!groups[k]) groups[k] = [];
    groups[k].push(f);
  });

  let html = '';
  for (const [k, gfs] of Object.entries(groups)) {
    const isM = k.startsWith('m');
    const allSel = gfs.every(f => f.selected);
    html += `<div class="frame-group-title" onclick="toggleGroup('${k}')"><input type="checkbox" ${allSel?'checked':''} onclick="event.stopPropagation();toggleGroup('${k}')"> ${isM?'✏️ 手动':'📊'} 行${gfs[0].row+1} (${gfs.length})</div>`;
    for (const f of gfs) {
      const idx = frames.indexOf(f);
      html += `<div class="frame-item ${f.id===selId?'active':''} ${!f.selected?'excluded':''}" onclick="selectFrame(${f.id})" oncontextmenu="event.preventDefault();showCtx(event,${f.id})">
        <input type="checkbox" ${f.selected?'checked':''} onclick="event.stopPropagation();toggleFrame(${f.id})">
        <canvas width="28" height="28" data-fid="${f.id}"></canvas>
        <div class="info"><div class="name">${f.w}×${f.h}${f.manual?'<span class=tag>手动</span>':''}</div><div class="meta">(${f.x},${f.y})</div></div>
        <div class="sort-btns" onclick="event.stopPropagation()">
          <button class="sort-btn" onclick="moveFrame(${f.id},-1)" title="上移" ${idx<=0?'disabled':''}>▲</button>
          <button class="sort-btn" onclick="moveFrame(${f.id},1)" title="下移" ${idx>=frames.length-1?'disabled':''}>▼</button>
        </div>
      </div>`;
    }
  }
  box.innerHTML = html;

  // Thumbnails
  if (srcImg) {
    const tc = document.createElement('canvas'); tc.width = srcImg.width; tc.height = srcImg.height;
    const tctx = tc.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    tctx.mozImageSmoothingEnabled = false;
    tctx.webkitImageSmoothingEnabled = false;
    tctx.msImageSmoothingEnabled = false;
    tctx.drawImage(srcImg, 0, 0);
    box.querySelectorAll('canvas[data-fid]').forEach(c => {
      const f = frames.find(fr => fr.id === +c.dataset.fid); if (!f) return;
      const s = Math.min(28/f.w, 28/f.h, 2);
      c.width = Math.ceil(f.w*s); c.height = Math.ceil(f.h*s);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.drawImage(tc, f.x, f.y, f.w, f.h, 0, 0, c.width, c.height);
    });
  }
}
function toggleGroup(k) {
  const gfs = frames.filter(f => (f.manual?'m':'a')+f.row === k);
  const all = gfs.every(f => f.selected);
  gfs.forEach(f => f.selected = !all);
  refresh();
}

// ===== Preview & Detail =====
function updatePreview() {
  const box = document.getElementById('previewArea');
  if (!srcImg || selId === null) { box.innerHTML = '<div class="empty" style="padding:16px;"><p style="font-size:11px;">点击帧查看</p></div>'; return; }
  const f = frames.find(fr => fr.id === selId); if (!f) return;
  const s = Math.min(200/f.w, 180/f.h, 4);
  const cw = Math.ceil(f.w*s), ch = Math.ceil(f.h*s);
  const isManualMode = (document.getElementById('optAnchorX')?.value === 'manual' || document.getElementById('optAnchorY')?.value === 'manual');
  box.innerHTML = `<canvas id="previewCvs" width="${cw}" height="${ch}" style="image-rendering:pixelated;${isManualMode?'cursor:crosshair;':''}"></canvas>`;
  const c = box.querySelector('canvas').getContext('2d');
  c.imageSmoothingEnabled = false;
  c.mozImageSmoothingEnabled = false;
  c.webkitImageSmoothingEnabled = false;
  c.msImageSmoothingEnabled = false;
  c.drawImage(srcImg, f.x, f.y, f.w, f.h, 0, 0, cw, ch);

  // Draw anchor crosshair if in manual mode
  if (isManualMode) {
    const anc = f.anchor || manualAnchor;
    if (anc) {
      const ax = anc.cx * s, ay = anc.cy * s;
      c.strokeStyle = '#f38ba8'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(ax - 8, ay); c.lineTo(ax + 8, ay); c.stroke();
      c.beginPath(); c.moveTo(ax, ay - 8); c.lineTo(ax, ay + 8); c.stroke();
      c.strokeStyle = 'rgba(243,139,168,0.4)'; c.lineWidth = 1;
      c.beginPath(); c.arc(ax, ay, 6, 0, Math.PI * 2); c.stroke();
    }
  }

  // Click to set manual anchor for THIS frame
  if (isManualMode) {
    box.querySelector('canvas').onclick = (e) => {
      const rect = e.target.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const cx = Math.round(mx / s), cy = Math.round(my / s);
      f.anchor = { cx, cy };
      manualAnchor = { cx, cy };
      document.getElementById('anchorX').value = cx;
      document.getElementById('anchorY').value = cy;
      updatePreview(); // Redraw with crosshair
      toast(`锚点已设定: (${cx}, ${cy})`);
    };
  }
}
function updateDetail() {
  const box = document.getElementById('detailArea');
  if (selId === null) { box.innerHTML = '<div class="detail-content" style="color:var(--text-dim);font-size:11px;">点击帧查看详情</div>'; return; }
  const f = frames.find(fr => fr.id === selId); if (!f) return;
  box.innerHTML = `<div class="detail-content">
    <div><b>尺寸:</b> ${f.w} × ${f.h}${f.unifiedW ? ` <span style="color:var(--green);">→ ${f.unifiedW} × ${f.unifiedH}</span>` : ''}</div>
    <div><b>位置:</b> (${f.x}, ${f.y})</div>
    <div><b>面积:</b> ${f.w*f.h}px²</div>
    <div><b>类型:</b> ${f.manual?'✏️ 手动':'🔍 自动'}</div>
    <div><b>状态:</b> ${f.selected?'✅ 选中':'❌ 排除'}${f.unifiedW ? ' <span style="color:var(--green);">📐 已优化</span>' : ''}</div>
  </div>`;
}

// ===== Stats =====
function updateStats() {
  document.getElementById('sTotal').textContent = frames.length;
  document.getElementById('sSel').textContent = frames.filter(f => f.selected).length;
  document.getElementById('sManual').textContent = frames.filter(f => f.manual).length;
}

// ===== Animation =====
function toggleAnim() {
  animPlaying = !animPlaying;
  document.getElementById('btnAnim').textContent = animPlaying ? '⏸' : '▶';
  if (animPlaying) playAnim(); else stopAnim();
}
function playAnim() {
  stopAnim();
  let sf = frames.filter(f => f.selected); if (!sf.length) sf = [...frames]; if (!sf.length) return;
  const fps = parseInt(document.getElementById('fpsRange').value) || 8;
  const c = document.getElementById('animCanvas'), ctx = c.getContext('2d');

  // Check if frames have unified metadata (from optimization)
  const hasUnified = sf.every(f => f.unifiedW && f.unifiedH);
  let uw, uh;
  if (hasUnified) {
    // Use unified size from optimization metadata
    uw = Math.max(...sf.map(f => f.unifiedW));
    uh = Math.max(...sf.map(f => f.unifiedH));
  } else {
    // Fallback: use max frame size
    uw = Math.max(...sf.map(f => f.w));
    uh = Math.max(...sf.map(f => f.h));
  }
  const s = Math.min(200 / uw, 80 / uh, 4);
  c.width = Math.ceil(uw * s);
  c.height = Math.ceil(uh * s);

  // Pre-create offscreen canvas for compositing
  const offCvs = document.createElement('canvas');
  offCvs.width = uw;
  offCvs.height = uh;
  const offCtx = offCvs.getContext('2d');
  // Disable image smoothing for offscreen canvas
  offCtx.imageSmoothingEnabled = false;
  offCtx.mozImageSmoothingEnabled = false;
  offCtx.webkitImageSmoothingEnabled = false;
  offCtx.msImageSmoothingEnabled = false;

  // Disable image smoothing for main animation canvas
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  animTimer = setInterval(() => {
    const idx = animIdx % sf.length;
    const f = sf[idx];
    ctx.clearRect(0, 0, c.width, c.height);

    if (hasUnified && f.unifiedW && f.unifiedH) {
      // Use pre-computed offset from optimization
      offCtx.clearRect(0, 0, uw, uh);
      offCtx.drawImage(srcImg, f.x, f.y, f.w, f.h, f.offsetX, f.offsetY, f.w, f.h);
      ctx.drawImage(offCvs, 0, 0, uw, uh, 0, 0, c.width, c.height);
    } else {
      // Fallback: core centroid alignment (original behavior)
      const at = parseInt(document.getElementById('alphaTh')?.value) || 10;
      const cc = getCoreCenter(f, at);
      const dw = Math.ceil(f.w * s), dh = Math.ceil(f.h * s);
      const ox = Math.round((c.width / 2) - cc.cx * s);
      const oy = Math.round((c.height / 2) - cc.cy * s);
      ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, ox, oy, dw, dh);
    }
    animIdx++;
  }, 1000 / fps);
}
function stopAnim() { if (animTimer) { clearInterval(animTimer); animTimer = null; } }
function updateFps() { document.getElementById('fpsVal').textContent = document.getElementById('fpsRange').value + 'fps'; if (animPlaying) playAnim(); }

// ===== Export =====
function showExportModal(mode) {
  exportMode = mode;
  let sf = frames.filter(f => f.selected);
  // If no frames selected, use all frames
  if (!sf.length) sf = [...frames];
  if (!sf.length) { toast('没有帧可导出'); return; }
  const t = document.getElementById('exportTitle');
  const b = document.getElementById('exportBody');
  if (mode === 'sheets') {
    t.textContent = '📦 导出精灵表';
    b.innerHTML = `<p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">${sf.length} 帧导出为标准精灵表</p>
      <div class="form-row"><div class="form-field"><label>模式</label><select id="exMode"><option value="perRow">每行一张</option><option value="single">合并一张</option></select></div>
      <div class="form-field"><label>间距</label><input type="number" id="exPad" value="${document.getElementById('framePad').value}" min="0"></div></div>
      <div class="form-row" id="sheetLayoutOptions" style="margin-top:8px;">
        <div class="form-field"><label>排列方式</label><select id="exLayout"><option value="auto">自动计算</option><option value="custom">自定义行列</option></select></div>
        <div class="form-field" id="customColsField"><label>列数</label><input type="number" id="exCols" value="${Math.ceil(Math.sqrt(sf.length))}" min="1"></div>
        <div class="form-field" id="customRowsField"><label>行数</label><input type="number" id="exRows" value="${Math.ceil(sf.length / Math.ceil(Math.sqrt(sf.length)))}" min="1"></div>
      </div>`;
    // Add event listener for layout change
    setTimeout(() => {
      const layoutSelect = document.getElementById('exLayout');
      const customColsField = document.getElementById('customColsField');
      const customRowsField = document.getElementById('customRowsField');
      
      if (layoutSelect) {
        layoutSelect.addEventListener('change', function() {
          const isCustom = this.value === 'custom';
          if (customColsField) customColsField.style.display = isCustom ? 'block' : 'none';
          if (customRowsField) customRowsField.style.display = isCustom ? 'block' : 'none';
        });
        // Trigger initial state
        layoutSelect.dispatchEvent(new Event('change'));
      }
    }, 100);
  } else if (mode === 'frames') {
    t.textContent = '🖼️ 导出单帧'; b.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">导出 ${sf.length} 个 PNG</p>`;
  } else if (mode === 'zip') {
    t.textContent = '📁 ZIP 打包'; b.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">精灵表+单帧打包下载</p>`;
  } else {
    t.textContent = '📋 导出数据'; b.innerHTML = `<div class="form-field"><label>范围</label><select id="jsonScope"><option value="selected">选中帧</option><option value="all">所有帧</option></select></div>`;
  }
  document.getElementById('exportModal').classList.add('show');
}
function doExport() {
  let sf = frames.filter(f => f.selected);
  if (!sf.length) sf = [...frames];
  if (!sf.length) return;
  if (exportMode === 'sheets') exportSheets(sf);
  else if (exportMode === 'frames') exportFrames(sf);
  else if (exportMode === 'zip') exportZip(sf);
  else exportJSON();
  closeModal('exportModal');
}
function exportSheets(sf) {
  const mode = document.getElementById('exMode').value;
  const pad = parseInt(document.getElementById('exPad').value) || 0;
  const at = parseInt(document.getElementById('alphaTh')?.value) || 10;

  // Check if frames have unified metadata from optimization
  const hasUnified = sf.every(f => f.unifiedW && f.unifiedH);

  if (mode === 'single') {
    let mw, mh;
    if (hasUnified) {
      mw = Math.max(...sf.map(f => f.unifiedW));
      mh = Math.max(...sf.map(f => f.unifiedH));
    } else {
      mw = Math.max(...sf.map(f=>f.w));
      mh = Math.max(...sf.map(f=>f.h));
    }
    
    // Get layout settings
    let cols, rows;
    const layout = document.getElementById('exLayout')?.value || 'auto';
    
    if (layout === 'custom') {
      cols = parseInt(document.getElementById('exCols')?.value) || 1;
      rows = parseInt(document.getElementById('exRows')?.value) || 1;
      // Ensure enough space for all frames
      while (cols * rows < sf.length) {
        rows++;
      }
    } else {
      // Auto layout: square root
      cols = Math.ceil(Math.sqrt(sf.length));
      rows = Math.ceil(sf.length/cols);
    }
    
    const c = document.createElement('canvas'); c.width = cols*(mw+pad)-pad; c.height = rows*(mh+pad)-pad;
    const ctx = c.getContext('2d');
    
    // Disable image smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    sf.forEach((f,i) => {
      const dx = (i%cols)*(mw+pad), dy = Math.floor(i/cols)*(mh+pad);
      if (hasUnified && f.unifiedW && f.unifiedH) {
        // Draw frame content at pre-computed offset within unified cell
        ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx + f.offsetX, dy + f.offsetY, f.w, f.h);
      } else {
        const { ox, oy } = getAlignOffset(f, mw, mh, 'centroid', 'centroid', at);
        ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx + ox, dy + oy, f.w, f.h);
      }
    });
    dlCanvas(c, 'sprite_sheet.png');
  } else {
    const rm = {}; sf.forEach(f => { if (!rm[f.row]) rm[f.row]=[]; rm[f.row].push(f); });
    for (const [r, rfs] of Object.entries(rm)) {
      let mw, rh;
      if (hasUnified) {
        mw = Math.max(...rfs.map(f => f.unifiedW));
        rh = Math.max(...rfs.map(f => f.unifiedH));
      } else {
        mw = Math.max(...rfs.map(f=>f.w));
        rh = Math.max(...rfs.map(f=>f.h));
      }
      const c = document.createElement('canvas'); c.width = rfs.length*(mw+pad)-pad; c.height = rh;
      const ctx = c.getContext('2d');
      
      // Disable image smoothing
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      rfs.forEach((f,i) => {
        const dx = i*(mw+pad);
        if (hasUnified && f.unifiedW && f.unifiedH) {
          ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx + f.offsetX, f.offsetY, f.w, f.h);
        } else {
          const { ox, oy } = getAlignOffset(f, mw, rh, 'centroid', 'centroid', at);
          ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx + ox, oy, f.w, f.h);
        }
      });
      dlCanvas(c, `sheet_row${+r+1}.png`);
    }
  }
  toast(hasUnified ? '精灵表已导出（统一尺寸+重心对齐）' : '精灵表已导出（重心对齐）');
}
function exportFrames(sf) {
  const hasUnified = sf.every(f => f.unifiedW && f.unifiedH);
  sf.forEach(f => {
    const c = document.createElement('canvas');
    if (hasUnified && f.unifiedW && f.unifiedH) {
      // Export as unified-size frame with content at correct offset
      c.width = f.unifiedW; c.height = f.unifiedH;
      const ctx = c.getContext('2d');
      
      // Disable image smoothing
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, f.offsetX, f.offsetY, f.w, f.h);
    } else {
      c.width = f.w; c.height = f.h;
      const ctx = c.getContext('2d');
      
      // Disable image smoothing
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    }
    dlCanvas(c, `frame_${f.row+1}_${f.col+1}.png`);
  });
  toast(`${sf.length} 帧已导出`);
}
function exportZip(sf) {
  if (typeof JSZip === 'undefined') { toast('需要网络加载 JSZip'); return; }
  const zip = new JSZip(); const pad = parseInt(document.getElementById('framePad').value)||2;
  const hasUnified = sf.every(f => f.unifiedW && f.unifiedH);
  const ff = zip.folder('frames');
  sf.forEach(f => {
    const c = document.createElement('canvas');
    if (hasUnified && f.unifiedW && f.unifiedH) {
      c.width = f.unifiedW; c.height = f.unifiedH;
      const ctx = c.getContext('2d');
      
      // Disable image smoothing
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, f.offsetX, f.offsetY, f.w, f.h);
    } else {
      c.width = f.w; c.height = f.h;
      const ctx = c.getContext('2d');
      
      // Disable image smoothing
      ctx.imageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    }
    ff.file(`frame_${f.row+1}_${f.col+1}.png`, c.toDataURL('image/png').split(',')[1], {base64:true});
  });
  const rm={}; sf.forEach(f=>{if(!rm[f.row])rm[f.row]=[];rm[f.row].push(f);});
  const sf2=zip.folder('sheets');
  for(const[r,rfs]of Object.entries(rm)){
    let mw, rh;
    if (hasUnified) {
      mw = Math.max(...rfs.map(f => f.unifiedW));
      rh = Math.max(...rfs.map(f => f.unifiedH));
    } else {
      mw = Math.max(...rfs.map(f=>f.w));
      rh = Math.max(...rfs.map(f=>f.h));
    }
    const c=document.createElement('canvas');c.width=rfs.length*(mw+pad)-pad;c.height=rh;const ctx=c.getContext('2d');
    
    // Disable image smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    rfs.forEach((f,i)=>{
      const dx=i*(mw+pad);
      if (hasUnified && f.unifiedW && f.unifiedH) {
        ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx + f.offsetX, f.offsetY, f.w, f.h);
      } else {
        ctx.drawImage(srcImg, f.x, f.y, f.w, f.h, dx, 0, f.w, f.h);
      }
    });
    sf2.file(`sheet_row${+r+1}.png`,c.toDataURL('image/png').split(',')[1],{base64:true});
  }
  zip.generateAsync({type:'blob'}).then(b=>{const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='sprites.zip';a.click();URL.revokeObjectURL(u);toast('ZIP已下载');});
}
function exportJSON() {
  const scope = document.getElementById('jsonScope').value;
  const data = (scope==='all'?frames:frames.filter(f=>f.selected)).map(f=>({row:f.row+1,col:f.col+1,x:f.x,y:f.y,w:f.w,h:f.h,selected:f.selected,manual:f.manual||false,unifiedW:f.unifiedW||null,unifiedH:f.unifiedH||null,offsetX:f.offsetX||null,offsetY:f.offsetY||null}));
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='frames.json';a.click();toast('JSON已导出');
}
function dlCanvas(c, name) { const a=document.createElement('a');a.download=name;a.href=c.toDataURL('image/png');a.click(); }

// ===== Toast =====
function toggleSection(titleEl) {
  const body = titleEl.nextElementSibling;
  if (!body) return;
  const collapsed = body.style.display === 'none';
  body.style.display = collapsed ? '' : 'none';
  titleEl.querySelector('span').textContent = collapsed ? '▼' : '▶';
}

function toast(msg) { const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000); }

// ===== Keyboard =====
// Anchor nudge state (keyboard-driven)
let _keyNudgeTimer = null;
let _keyNudgeKey = null; // track which key is held down

function keyNudgeStart(inputId, dir) {
  // Immediate first step
  const el = document.getElementById(inputId);
  if (!el) return;
  el.value = Math.max(0, (parseInt(el.value) || 0) + dir);
  if (inputId === 'anchorX2Input' || inputId === 'anchorY2Input') onAnchorInput2();
  else onAnchorInput1();
  // After 2s hold, start continuous movement (every 80ms)
  clearTimeout(_keyNudgeTimer);
  _keyNudgeTimer = setTimeout(function repeat() {
    el.value = Math.max(0, (parseInt(el.value) || 0) + dir);
    if (inputId === 'anchorX2Input' || inputId === 'anchorY2Input') onAnchorInput2();
    else onAnchorInput1();
    _keyNudgeTimer = setTimeout(repeat, 80);
  }, 2000);
}

function keyNudgeStop() {
  clearTimeout(_keyNudgeTimer);
  _keyNudgeTimer = null;
  _keyNudgeKey = null;
}

document.addEventListener('keydown', e => {
  // --- Anchor adjustment shortcuts (work even when input is focused) ---
  const optModal = document.getElementById('optModal');
  const optModalOpen = optModal && optModal.classList.contains('show');
  const inStep2 = document.getElementById('optStep2')?.style.display !== 'none';
  const inStep1 = document.getElementById('optStep1')?.style.display !== 'none';
  const manualVisible = document.getElementById('manualAnchorSection')?.style.display !== 'none';
  const anchor2Visible = document.getElementById('optStep2Anchor')?.style.display !== 'none';

  if (optModalOpen && (inStep1 && manualVisible || inStep2 && anchor2Visible)) {
    // Ctrl+Left/Right: switch frames (check first, before arrow nudge)
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.ctrlKey) {
      e.preventDefault();
      anchorNavFrame(e.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    // Arrow keys: nudge anchor (ignore OS key repeat)
    const isArrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown';
    if (isArrow && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      if (_keyNudgeKey === e.key) return; // Ignore OS key repeat
      _keyNudgeKey = e.key;
      const dirX = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      const dirY = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
      if (dirX !== 0) {
        keyNudgeStart(inStep2 ? 'anchorX2Input' : 'anchorX', dirX);
      } else {
        keyNudgeStart(inStep2 ? 'anchorY2Input' : 'anchorY', dirY);
      }
      return;
    }
  }

  // --- Global shortcuts (only when not in input) ---
  if (e.target.tagName==='INPUT'||e.target.tagName==='SELECT') return;
  if (e.key==='Delete'||e.key==='Backspace') { if (selId!==null) { frames=frames.filter(f=>f.id!==selId); selId=null; refresh(); updatePreview(); updateDetail(); toast('已删除'); } }
  if (e.key===' ') { e.preventDefault(); toggleAnim(); }
  if (e.key==='a'&&e.ctrlKey) { e.preventDefault(); selectAll(); }
  if (e.key==='Escape') {
    if (interaction?.type==='draw') { const ov=document.getElementById('drawOv'); if(ov)ov.remove(); interaction=null; }
    closeModal('optModal'); closeModal('exportModal');
  }
});

document.addEventListener('keyup', e => {
  const isArrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown';
  if (isArrow && _keyNudgeKey) {
    keyNudgeStop();
  }
});

// ===== Drag & Drop =====
document.body.addEventListener('dragover', e => e.preventDefault());
document.body.addEventListener('drop', e => {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) { const dt=new DataTransfer();dt.items.add(f);document.getElementById('fileInput').files=dt.files;handleFile({target:{files:[f]}}); }
});

// ============================================================================
//  Frame Interpolation (帧插值)
// ============================================================================

// ---- Utility functions ----
function _fiCreateImageData(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }
function _fiGetPixel(img, x, y) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return [0,0,0,0];
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i+1], img.data[i+2], img.data[i+3]];
}
function _fiSetPixel(img, x, y, r, g, b, a) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  img.data[i]=r; img.data[i+1]=g; img.data[i+2]=b; img.data[i+3]=a;
}
function _fiBilinear(img, fx, fy) {
  const x0=Math.floor(fx), y0=Math.floor(fy), dx=fx-x0, dy=fy-y0;
  const p00=_fiGetPixel(img,x0,y0), p10=_fiGetPixel(img,x0+1,y0);
  const p01=_fiGetPixel(img,x0,y0+1), p11=_fiGetPixel(img,x0+1,y0+1);
  const w00=(1-dx)*(1-dy), w10=dx*(1-dy), w01=(1-dx)*dy, w11=dx*dy;
  return [p00[0]*w00+p10[0]*w10+p01[0]*w01+p11[0]*w11,
          p00[1]*w00+p10[1]*w10+p01[1]*w01+p11[1]*w11,
          p00[2]*w00+p10[2]*w10+p01[2]*w01+p11[2]*w11,
          p00[3]*w00+p10[3]*w10+p01[3]*w01+p11[3]*w11];
}
function _fiComputeSAD(img, bx, by, ref, rx, ry, bs) {
  let sad=0;
  for (let dy=0;dy<bs;dy++) for (let dx=0;dx<bs;dx++) {
    const p=_fiGetPixel(img,bx+dx,by+dy), q=_fiGetPixel(ref,rx+dx,ry+dy);
    sad+=Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]);
  }
  return sad;
}
function _fiBuildMotionField(fA, fB, bs, sr) {
  const w=fA.width, h=fA.height, bX=Math.ceil(w/bs), bY=Math.ceil(h/bs);
  const mv=new Float32Array(bX*bY*2);
  for (let by=0;by<bY;by++) for (let bx=0;bx<bX;bx++) {
    const ox=bx*bs, oy=by*bs;
    let bestDx=0, bestDy=0, bestSAD=Infinity;
    for (let dy=-sr;dy<=sr;dy++) for (let dx=-sr;dx<=sr;dx++) {
      const sad=_fiComputeSAD(fA,ox,oy,fB,ox+dx,oy+dy,bs);
      if (sad<bestSAD) { bestSAD=sad; bestDx=dx; bestDy=dy; }
    }
    const idx=(by*bX+bx)*2; mv[idx]=bestDx; mv[idx+1]=bestDy;
  }
  return mv;
}
function _fiWarp(src, mv, bs, t, forward) {
  const w=src.width, h=src.height, bX=Math.ceil(w/bs);
  const out=_fiCreateImageData(w,h), wr=new Uint8Array(w*h);
  for (let by=0;by<Math.ceil(h/bs);by++) for (let bx=0;bx<bX;bx++) {
    const mi=(by*bX+bx)*2, scale=forward?t:-(1-t);
    for (let dy=0;dy<bs;dy++) for (let dx=0;dx<bs;dx++) {
      const sx=bx*bs+dx, sy=by*bs+dy;
      if (sx>=w||sy>=h) continue;
      const tx=sx+mv[mi]*scale, ty=sy+mv[mi+1]*scale;
      const rx=Math.round(tx), ry=Math.round(ty);
      if (rx<0||rx>=w||ry<0||ry>=h) continue;
      const c=_fiBilinear(src,tx,ty), di=(ry*w+rx)*4;
      out.data[di]=c[0]; out.data[di+1]=c[1]; out.data[di+2]=c[2]; out.data[di+3]=c[3];
      wr[ry*w+rx]=1;
    }
  }
  return {image:out, written:wr};
}
function _fiFillHoles(img, wr) {
  const w=img.width, h=img.height, r=_fiCreateImageData(w,h);
  r.data.set(img.data); const nw=new Uint8Array(wr);
  for (let iter=0;iter<3;iter++) {
    let filled=0;
    for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
      if (nw[y*w+x]) continue;
      let sR=0,sG=0,sB=0,sA=0,cnt=0;
      for (const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if (nx>=0&&nx<w&&ny>=0&&ny<h&&nw[ny*w+nx]) {
          const p=_fiGetPixel(r,nx,ny); sR+=p[0];sG+=p[1];sB+=p[2];sA+=p[3];cnt++;
        }
      }
      if (cnt>0) { _fiSetPixel(r,x,y,sR/cnt,sG/cnt,sB/cnt,sA/cnt); nw[y*w+x]=1; filled++; }
    }
    if (!filled) break;
  }
  return r;
}
function _fiInterpolatePair(fA, fB, t, bs) {
  const sr = Math.max(Math.ceil(bs * 2), Math.ceil(Math.max(fA.width, fA.height) * 0.25));
  const mvF=_fiBuildMotionField(fA,fB,bs,sr);
  const mvB=_fiBuildMotionField(fB,fA,bs,sr);
  const fwd=_fiWarp(fA,mvF,bs,t,true), bwd=_fiWarp(fB,mvB,bs,t,false);
  const w=fA.width, h=fA.height, bX=Math.ceil(w/bs), out=_fiCreateImageData(w,h), ow=new Uint8Array(w*h);
  const OCCL=60;
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const pi=y*w+x, fc=_fiGetPixel(fwd.image,x,y), bc=_fiGetPixel(bwd.image,x,y);
    const diff=Math.abs(fc[0]-bc[0])+Math.abs(fc[1]-bc[1])+Math.abs(fc[2]-bc[2]);
    if (fwd.written[pi]&&bwd.written[pi]&&diff<OCCL) {
      _fiSetPixel(out,x,y,(fc[0]+bc[0])/2,(fc[1]+bc[1])/2,(fc[2]+bc[2])/2,(fc[3]+bc[3])/2); ow[pi]=1;
    } else if (fwd.written[pi]&&bwd.written[pi]) {
      const bxi=Math.floor(x/bs), byi=Math.floor(y/bs), mi=(byi*bX+bxi)*2;
      const fM=Math.sqrt(mvF[mi]**2+mvF[mi+1]**2), bM=Math.sqrt(mvB[mi]**2+mvB[mi+1]**2);
      const c=fM<=bM?fc:bc; _fiSetPixel(out,x,y,c[0],c[1],c[2],c[3]); ow[pi]=1;
    } else if (fwd.written[pi]) { _fiSetPixel(out,x,y,fc[0],fc[1],fc[2],fc[3]); ow[pi]=1; }
    else if (bwd.written[pi]) { _fiSetPixel(out,x,y,bc[0],bc[1],bc[2],bc[3]); ow[pi]=1; }
  }
  return _fiFillHoles(out, ow);
}

// ============================================================================
//  Optimize Panel Interpolation (优化面板内的插帧)
// ============================================================================

let optInterpBackup = null; // backup of optPreviewData before interpolation

function toggleOptInterpPanel() {
  const panel = document.getElementById('optInterpPanel');
  const visible = panel.style.display !== 'none';
  panel.style.display = visible ? 'none' : '';
  if (!visible && optPreviewData) {
    document.getElementById('optInterpInfo').textContent = `${optPreviewData.length} 帧`;
  }
}

async function runOptInterpolation() {
  if (!optPreviewData || !srcImg) { toast('没有可用的帧数据'); return;
  }
  // Filter out any invalid frames
  const validFrames = optPreviewData.filter(d => !d._isInterp && d.srcW > 0 && d.srcH > 0);
  if (validFrames.length < 2) { toast('至少需要 2 个有效帧才能插帧'); return; }

  const factor = parseInt(document.getElementById('optInterpFactor').value);
  const blockSize = parseInt(document.getElementById('optInterpBS').value);

  // Backup current optPreviewData
  if (!optInterpBackup) optInterpBackup = optPreviewData.map(d => ({...d}));

  document.getElementById('btnOptInterpRun').disabled = true;
  document.getElementById('optInterpProgress').style.display = '';
  const bar = document.getElementById('optInterpBar');
  const label = document.getElementById('optInterpLabel');
  const startTime = Date.now();

  // Build frame images: use the actual trimmed frame content, not the full unified canvas
  // This makes block matching much faster and more accurate
  const frameImgs = validFrames.map(d => {
    const tmpCvs = document.createElement('canvas');
    tmpCvs.width = d.srcW;
    tmpCvs.height = d.srcH;
    const tmpCtx = tmpCvs.getContext('2d');
    tmpCtx.imageSmoothingEnabled = false;
    tmpCtx.drawImage(srcImg, d.srcX, d.srcY, d.srcW, d.srcH, 0, 0, d.srcW, d.srcH);
    return { imgData: tmpCtx.getImageData(0, 0, d.srcW, d.srcH), w: d.srcW, h: d.srcH, origData: d };
  });

  const totalPairs = frameImgs.length - 1;
  const perPair = factor - 1;
  const total = totalPairs * perPair;
  let done = 0;
  const newFrames = [];

  for (let i = 0; i < totalPairs; i++) {
    for (let j = 1; j <= perPair; j++) {
      const t = j / factor;
      const elapsed = ((Date.now()-startTime)/1000).toFixed(1);
      label.textContent = `处理帧对 ${i+1}/${totalPairs}，子帧 ${j}/${perPair} · ${elapsed}s`;
      bar.style.width = Math.round(done/total*100) + '%';

      // Yield to UI before heavy computation
      await new Promise(r => setTimeout(r, 20));

      const interpImg = _fiInterpolatePair(frameImgs[i].imgData, frameImgs[i+1].imgData, t, blockSize);
      newFrames.push({ insertAfter: i, imgData: interpImg, t, w: frameImgs[i].w, h: frameImgs[i].h });
      done++;
      bar.style.width = Math.round(done/total*100) + '%';
    }
  }

  // Build new optPreviewData with interpolated frames inserted
  // Map validFrames indices back to optPreviewData indices
  const validToOriginal = [];
  for (const vf of validFrames) {
    const idx = optPreviewData.indexOf(vf);
    validToOriginal.push(idx);
  }

  const newData = [];
  let validIdx = 0;
  for (let i = 0; i < optPreviewData.length; i++) {
    newData.push({...optPreviewData[i]});
    // Check if this original index corresponds to a valid frame
    if (validIdx < validFrames.length && validToOriginal[validIdx] === i) {
      const interpForPair = newFrames.filter(n => n.insertAfter === validIdx);
      for (const nf of interpForPair) {
        newData.push({
          id: -1 - nf.insertAfter * 10 - Math.round(nf.t * 10),
          origX: 0, origY: 0, origW: nf.w, origH: nf.h,
          srcX: 0, srcY: 0, srcW: nf.w, srcH: nf.h,
          unifiedW: nf.w, unifiedH: nf.h,
          offsetX: 0, offsetY: 0,
          _interpImgData: nf.imgData,
          _isInterp: true
        });
      }
      validIdx++;
    }
  }

  optPreviewData = newData;
  stopOptAnim();

  const elapsed = ((Date.now()-startTime)/1000).toFixed(1);
  label.textContent = `✅ 完成！${optInterpBackup.length} → ${optPreviewData.length} 帧 · ${elapsed}s`;
  document.getElementById('optInterpInfo').textContent = `${optPreviewData.length} 帧`;
  document.getElementById('btnOptInterpReset').style.display = '';
  document.getElementById('btnOptInterpRun').disabled = false;

  // Update frame indicator and restart animation
  updateOptFrameIndicator();
  playOptAnim();
  toast(`插帧完成：${optInterpBackup.length} → ${optPreviewData.length} 帧`);
}

function resetOptInterpolation() {
  if (!optInterpBackup) return;
  optPreviewData = optInterpBackup.map(d => ({...d}));
  optInterpBackup = null;
  stopOptAnim();
  document.getElementById('optInterpReset').style.display = 'none';
  document.getElementById('optInterpProgress').style.display = 'none';
  document.getElementById('optInterpInfo').textContent = `${optPreviewData.length} 帧`;
  updateOptFrameIndicator();
  playOptAnim();
  toast('已撤销插帧');
}

// Patch renderOptFrame to support interpolated frames
const _origRenderOptFrame = typeof renderOptFrame === 'function' ? renderOptFrame : null;

function renderOptFrame(idx) {
  if (!optPreviewData || !optPreviewData.length || !srcImg) return;
  const d = optPreviewData[idx];
  const c = document.getElementById('optPreviewCanvas');
  const ctx = c.getContext('2d');
  const uw = d.unifiedW, uh = d.unifiedH;
  const s = Math.min(200/uw, 100/uh, 4);
  c.width = Math.ceil(uw*s); c.height = Math.ceil(uh*s);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, c.width, c.height);

  if (d._isInterp && d._interpImgData) {
    // Draw interpolated ImageData directly
    const tmpCvs = document.createElement('canvas');
    tmpCvs.width = uw; tmpCvs.height = uh;
    const tmpCtx = tmpCvs.getContext('2d');
    tmpCtx.putImageData(d._interpImgData, 0, 0);
    ctx.drawImage(tmpCvs, 0, 0, uw, uh, 0, 0, c.width, c.height);
  } else {
    // Normal optimized frame
    const offCvs = document.createElement('canvas');
    offCvs.width = uw; offCvs.height = uh;
    const offCtx = offCvs.getContext('2d');
    offCtx.imageSmoothingEnabled = false;
    offCtx.drawImage(srcImg, d.srcX, d.srcY, d.srcW, d.srcH, d.offsetX, d.offsetY, d.srcW, d.srcH);
    ctx.drawImage(offCvs, 0, 0, uw, uh, 0, 0, c.width, c.height);
  }
}

function updateOptFrameIndicator() {
  if (!optPreviewData) return;
  document.getElementById('optFrameIndicator').textContent = `${optAnimIdx+1}/${optPreviewData.length}`;
}

// ---- UI Functions ----
function showInterpModal() {
  if (!frames.length) { toast('请先加载图片并检测帧'); return; }
  const sf = frames.filter(f => f.selected); if (!sf.length) return;
  document.getElementById('interpFrameCount').textContent = sf.length;
  const factor = parseInt(document.getElementById('interpFactor').value);
  document.getElementById('interpResultCount').textContent = sf.length + (sf.length - 1) * (factor - 1);
  document.getElementById('interpProgress').style.display = 'none';
  document.getElementById('btnInterpStart').disabled = false;
  document.getElementById('interpModal').classList.add('show');
  // Update result count when factor changes
  document.getElementById('interpFactor').onchange = () => {
    const f = parseInt(document.getElementById('interpFactor').value);
    document.getElementById('interpResultCount').textContent = sf.length + (sf.length - 1) * (f - 1);
  };
}

async function runInterpolation() {
  let sf = frames.filter(f => f.selected);
  if (!sf.length) sf = [...frames];
  if (sf.length < 2) { toast('至少需要 2 帧才能插帧'); return; }

  const factor = parseInt(document.getElementById('interpFactor').value);
  const blockSize = parseInt(document.getElementById('interpBlockSize').value);
  const searchRadius = parseInt(document.getElementById('interpSearch').value);

  // Disable button, show progress
  document.getElementById('btnInterpStart').disabled = true;
  document.getElementById('interpProgress').style.display = '';
  const progBar = document.getElementById('interpProgressBar');
  const progLabel = document.getElementById('interpProgressLabel');

  // Extract frame ImageData from source image
  const canvas = document.getElementById('mainCanvas');
  const ctx = canvas.getContext('2d');
  const frameImages = sf.map(f => {
    const id = ctx.getImageData(f.x, f.y, f.w, f.h);
    return { imgData: id, frame: f };
  });

  const totalPairs = frameImages.length - 1;
  const framesPerPair = factor - 1;
  const total = totalPairs * framesPerPair;
  let done = 0;

  // Collect new frames to insert
  const newFrames = [];
  const startTime = Date.now();

  for (let i = 0; i < totalPairs; i++) {
    const fA = frameImages[i], fB = frameImages[i + 1];

    for (let j = 1; j <= framesPerPair; j++) {
      const t = j / factor;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      progLabel.textContent = `处理中 ${i+1}/${totalPairs} · ${elapsed}s`;

      // Yield to UI
      await new Promise(r => setTimeout(r, 10));

      const interpImg = _fiInterpolatePair(fA.imgData, fB.imgData, t, blockSize);

      // Draw interpolated frame back to canvas to get position
      // We'll create a temporary canvas to composite
      const tmpCvs = document.createElement('canvas');
      tmpCvs.width = fA.imgData.width;
      tmpCvs.height = fA.imgData.height;
      const tmpCtx = tmpCvs.getContext('2d');
      tmpCtx.putImageData(interpImg, 0, 0);

      // Calculate interpolated frame position (linear interpolation of x,y)
      const ix = Math.round(fA.frame.x + (fB.frame.x - fA.frame.x) * t);
      const iy = Math.round(fA.frame.y + (fB.frame.y - fA.frame.y) * t);
      const iw = fA.imgData.width;
      const ih = fA.imgData.height;

      newFrames.push({ insertAfter: i, imgData: interpImg, x: ix, y: iy, w: iw, h: ih });

      done++;
      progBar.style.width = Math.round(done / total * 100) + '%';
    }
  }

  // Now we need to insert new frames into the source image
  // Strategy: extend the sprite sheet canvas and draw interpolated frames
  if (newFrames.length > 0) {
    // Rebuild frames array with interpolated frames inserted
    const oldFrames = [...frames];
    const selectedSet = new Set(sf.map(f => f.id));
    const newFrameList = [];

    for (let i = 0; i < oldFrames.length; i++) {
      newFrameList.push(oldFrames[i]);
      // Check if this frame was selected and has a next selected frame
      if (selectedSet.has(oldFrames[i].id)) {
        // Find index in selected frames
        const selIdx = sf.findIndex(f => f.id === oldFrames[i].id);
        if (selIdx < sf.length - 1) {
          // Insert interpolated frames after this one
          const interpForThisPair = newFrames.filter(nf => nf.insertAfter === selIdx);
          for (const nf of interpForThisPair) {
            newFrameList.push({
              id: nextId++,
              x: nf.x, y: nf.y, w: nf.w, h: nf.h,
              manual: true,
              selected: true
            });
          }
        }
      }
    }

    frames = newFrameList;
    renderRects();
    updateAll();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    progLabel.textContent = `✅ 完成！插入 ${newFrames.length} 帧，耗时 ${elapsed}s`;
    toast(`插帧完成：${sf.length} 帧 → ${frames.length} 帧，耗时 ${elapsed}s`);
  }

  document.getElementById('btnInterpStart').disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  if (hasAutoSaveData()) {
    const hasLoaded = loadProjectState();
    if (hasLoaded) {
      startAutoSave();
    }
  }
});

function triggerAutoSave() {
  if (srcImg && currentImageId) {
    saveProjectState();
  }
}

const originalFinishDraw = finishDraw;
finishDraw = function() {
  originalFinishDraw.apply(this, arguments);
  triggerAutoSave();
};

const originalFinishMove = finishMove;
finishMove = function() {
  originalFinishMove.apply(this, arguments);
  triggerAutoSave();
};

const originalFinishResize = finishResize;
finishResize = function() {
  originalFinishResize.apply(this, arguments);
  triggerAutoSave();
};

const originalDetectFrames = detectFrames;
detectFrames = function() {
  originalDetectFrames.apply(this, arguments);
  triggerAutoSave();
};

const originalClearManualFrames = clearManualFrames;
clearManualFrames = function() {
  originalClearManualFrames.apply(this, arguments);
  triggerAutoSave();
};

const originalDeleteSelected = deleteSelected;
deleteSelected = function() {
  originalDeleteSelected.apply(this, arguments);
  triggerAutoSave();
};

const originalAddImageToStore = addImageToStore;
addImageToStore = function(name, img) {
  originalAddImageToStore.apply(this, arguments);
  setTimeout(() => {
    startAutoSave();
    triggerAutoSave();
  }, 100);
};
