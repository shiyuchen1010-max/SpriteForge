/**
 * 图像模块
 * 处理图像的管理和操作
 */

/**
 * 保存当前图像状态
 */
function saveCurrentImage() {
  if (!window.currentImageId || !window.srcImg) return;
  // Don't overwrite if already deleted from store
  if (!window.imageStore[window.currentImageId]) return;
  window.imageStore[window.currentImageId] = {
    name: window.imageStore[window.currentImageId].name || 'Image',
    img: window.srcImg,
    frames: JSON.parse(JSON.stringify(window.frames)),
    selId: window.selId, 
    nextId: window.nextId, 
    zoom: window.zoom,
    lockedHeight: window.lockedHeight, 
    lockedBottom: window.lockedBottom, 
    lockedTop: window.lockedTop
  };
}

/**
 * 切换图像
 * @param {string} id - 图像ID
 */
function switchImage(id) {
  if (id === window.currentImageId) return;
  saveCurrentImage();
  const data = window.imageStore[id];
  if (!data) return;
  window.currentImageId = id;
  window.srcImg = data.img;
  window.frames = JSON.parse(JSON.stringify(data.frames));
  window.selId = data.selId;
  window.nextId = data.nextId;
  window.zoom = data.zoom;
  window.lockedHeight = data.lockedHeight;
  window.lockedBottom = data.lockedBottom;
  window.lockedTop = data.lockedTop;
  // Restore lock checkbox UI
  document.getElementById('lockBottomChk').checked = false;
  document.getElementById('lockTopChk').checked = false;
  document.getElementById('lockHChk').checked = false;
  document.getElementById('lockFixedChk').checked = false;
  if (window.lockedBottom > 0) document.getElementById('lockBottomChk').checked = true;
  if (window.lockedTop > 0) document.getElementById('lockTopChk').checked = true;
  if (window.lockedHeight > 0) { 
    document.getElementById('lockHChk').checked = true; 
    document.getElementById('lockHInput').value = window.lockedHeight; 
  }
  window.onLockCheckChange();
  // Update UI
  document.getElementById('zoomVal').textContent = window.zoom + 'x';
  document.getElementById('imgInfo').textContent = `${window.srcImg.width}×${window.srcImg.height}`;
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('canvasArea').style.display = '';
  window.renderCanvas(); 
  window.renderRects(); 
  window.updateAll();
  renderImageTabs();
}

/**
 * 关闭图像
 * @param {string} id - 图像ID
 */
function closeImage(id) {
  // Save current image before deleting (only if closing a different image)
  if (id !== window.currentImageId) saveCurrentImage();
  delete window.imageStore[id];
  const ids = Object.keys(window.imageStore);
  if (ids.length === 0) {
    window.currentImageId = null;
    window.srcImg = null; 
    window.frames = []; 
    window.selId = null; 
    window.zoom = 1;
    window.lockedHeight = 0; 
    window.lockedBottom = 0; 
    window.lockedTop = 0;
    document.getElementById('lockBottomChk').checked = false;
    document.getElementById('lockTopChk').checked = false;
    document.getElementById('lockHChk').checked = false;
    document.getElementById('lockFixedChk').checked = false;
    window.onLockCheckChange();
    // Reset canvas UI
    document.getElementById('emptyState').style.display = '';
    document.getElementById('canvasFrame').style.display = 'none';
    document.getElementById('canvasArea').style.display = '';
    document.getElementById('zoomBar').style.display = 'none';
    document.getElementById('coord').style.display = 'none';
    document.getElementById('hintBar').style.display = 'none';
    // Reset right panel
    ['btnDetect','btnDetect2','btnOptimize','btnInterp','btnDelete','btnClearManual','btnBgMode'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });
    const bgRemoveSection = document.getElementById('bgRemoveSection');
    if (bgRemoveSection) bgRemoveSection.style.display = 'none';
    const imgInfo = document.getElementById('imgInfo');
    if (imgInfo) imgInfo.textContent = '';
    const frameRects = document.getElementById('frameRects');
    if (frameRects) frameRects.innerHTML = '';
    const frameList = document.getElementById('frameList');
    if (frameList) frameList.innerHTML = '';
    const listHint = document.getElementById('listHint');
    if (listHint) listHint.textContent = '';
    const sTotal = document.getElementById('sTotal');
    if (sTotal) sTotal.textContent = '0';
    const sSel = document.getElementById('sSel');
    if (sSel) sSel.textContent = '0';
    const sManual = document.getElementById('sManual');
    if (sManual) sManual.textContent = '0';
    const detailArea = document.getElementById('detailArea');
    if (detailArea) detailArea.innerHTML = '<div class="empty" style="padding:16px;"><p style="font-size:11px;">选中帧查看详情</p></div>';
    const previewArea = document.getElementById('previewArea');
    if (previewArea) previewArea.innerHTML = '<div class="empty" style="padding:16px;"><p style="font-size:11px;">点击帧查看</p></div>';
    renderImageTabs();
    return;
  }
  if (id === window.currentImageId) {
    // Switch to another image without saving (already deleted)
    window.currentImageId = null;
    const newId = ids[ids.length - 1];
    const data = window.imageStore[newId];
    window.currentImageId = newId;
    window.srcImg = data.img;
    window.frames = JSON.parse(JSON.stringify(data.frames));
    window.selId = data.selId;
    window.nextId = data.nextId;
    window.zoom = data.zoom;
    window.lockedHeight = data.lockedHeight;
    window.lockedBottom = data.lockedBottom;
    window.lockedTop = data.lockedTop;
    // Restore lock checkbox UI
    document.getElementById('lockBottomChk').checked = false;
    document.getElementById('lockTopChk').checked = false;
    document.getElementById('lockHChk').checked = false;
    document.getElementById('lockFixedChk').checked = false;
    if (window.lockedBottom > 0) document.getElementById('lockBottomChk').checked = true;
    if (window.lockedTop > 0) document.getElementById('lockTopChk').checked = true;
    if (window.lockedHeight > 0) { 
      document.getElementById('lockHChk').checked = true; 
      document.getElementById('lockHInput').value = window.lockedHeight; 
    }
    window.onLockCheckChange();
    // Update canvas UI
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('canvasFrame').style.display = 'inline-block';
    document.getElementById('zoomBar').style.display = 'flex';
    document.getElementById('coord').style.display = 'block';
    document.getElementById('hintBar').style.display = 'block';
    document.getElementById('imgInfo').textContent = `${window.srcImg.width}×${window.srcImg.height}`;
    document.getElementById('zoomVal').textContent = window.zoom + 'x';
    window.renderCanvas(); 
    window.renderRects(); 
    window.updateAll();
  }
  renderImageTabs();
}

/**
 * 渲染图像标签
 */
function renderImageTabs() {
  const tabs = document.getElementById('imageTabs');
  if (!tabs) return;
  
  // 使用文档片段批量更新DOM，减少重排
  const fragment = document.createDocumentFragment();
  
  for (const [id, data] of Object.entries(window.imageStore)) {
    const tab = document.createElement('div');
    tab.className = 'img-tab' + (id === window.currentImageId ? ' active' : '');
    const shortName = data.name.length > 12 ? data.name.slice(0, 10) + '..' : data.name;
    tab.innerHTML = `<span onclick="switchImage('${id}')">${shortName}</span><span class="close-tab" onclick="event.stopPropagation();closeImage('${id}')">✕</span>`;
    fragment.appendChild(tab);
  }
  
  // 一次性更新DOM，减少重排
  tabs.innerHTML = '';
  tabs.appendChild(fragment);
}

/**
 * 添加图像到存储
 * @param {string} name - 图像名称
 * @param {HTMLImageElement} img - 图像对象
 * @returns {string} 图像ID
 */
function addImageToStore(name, img) {
  saveCurrentImage();
  const id = 'img_' + (++window.imageIdCounter);
  window.currentImageId = id;
  window.imageStore[id] = {
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
  renderImageTabs();
  return id;
}

// 导出模块
export {
  saveCurrentImage,
  switchImage,
  closeImage,
  renderImageTabs,
  addImageToStore
};