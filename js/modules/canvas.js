/**
 * 画布模块
 * 处理画布渲染和操作
 */

/**
 * 渲染画布
 */
function renderCanvas() {
  if (!window.srcImg) return;
  const c = document.getElementById('mainCanvas');
  c.width = window.srcImg.width;
  c.height = window.srcImg.height;
  c.getContext('2d').drawImage(window.srcImg, 0, 0);
  applyZoom();
}

/**
 * 应用缩放
 */
function applyZoom() {
  const c = document.getElementById('mainCanvas');
  const f = document.getElementById('canvasFrame');
  c.style.width = (window.srcImg.width * window.zoom) + 'px';
  c.style.height = (window.srcImg.height * window.zoom) + 'px';
  f.style.width = (window.srcImg.width * window.zoom) + 'px';
  f.style.height = (window.srcImg.height * window.zoom) + 'px';
  document.getElementById('zoomVal').textContent = Math.round(window.zoom * 100) + '%';
  renderRects();
}

/**
 * 放大
 */
function zoomIn() {
  window.zoom = Math.min(window.zoom * 1.25, 10);
  applyZoom();
}

/**
 * 缩小
 */
function zoomOut() {
  window.zoom = Math.max(window.zoom / 1.25, 0.05);
  applyZoom();
}

/**
 * 适应窗口
 */
function zoomFit() {
  if (!window.srcImg) return;
  const a = document.getElementById('canvasArea');
  window.zoom = Math.min((a.clientWidth - 60) / window.srcImg.width, (a.clientHeight - 60) / window.srcImg.height, 2);
  applyZoom();
}

/**
 * 渲染帧矩形
 */
function renderRects() {
  const box = document.getElementById('frameRects');
  if (!box) return;
  
  // 使用文档片段批量更新DOM，减少重排
  const fragment = document.createDocumentFragment();
  
  for (const f of window.frames) {
    const d = document.createElement('div');
    d.className = 'frame-rect' + (f.id === window.selId ? ' active' : '') + (!f.selected ? ' excluded' : '');
    d.style.cssText = `left:${f.x*window.zoom}px;top:${f.y*window.zoom}px;width:${f.w*window.zoom}px;height:${f.h*window.zoom}px;`;
    d.innerHTML = `<span class="label">${f.manual?'✏️ ':''}${f.w}×${f.h}</span>`;
    d.oncontextmenu = e => { e.preventDefault(); window.showCtx(e, f.id); };
    d.onmousedown = e => window.onFrameMouseDown(e, f);
    fragment.appendChild(d);

    // Show unified rect outline if frame has been optimized
    if (f.unifiedW && f.unifiedH) {
      const u = document.createElement('div');
      u.className = 'frame-rect unified-outline';
      u.style.cssText = `left:${(f.x + f.offsetX)*window.zoom}px;top:${(f.y + f.offsetY)*window.zoom}px;width:${f.unifiedW*window.zoom}px;height:${f.unifiedH*window.zoom}px;pointer-events:none;`;
      fragment.appendChild(u);
    }

    // Resize handles for active frame
    if (f.id === window.selId) {
      ['nw','n','ne','w','e','sw','s','se'].forEach(dir => {
        const h = document.createElement('div');
        h.className = `rh rh-${dir}`;
        h.onmousedown = e => { e.stopPropagation(); window.startResize(e, f.id, dir); };
        d.appendChild(h);
      });
    }
  }

  // Draw ground reference line in "lock bottom" mode
  if (document.getElementById('lockBottomChk')?.checked && window.lockedBottom > 0 && window.srcImg) {
    const line = document.createElement('div');
    line.style.cssText = `position:absolute;left:0;top:${window.lockedBottom*window.zoom}px;width:${window.srcImg.width*window.zoom}px;height:0;border-top:2px dashed rgba(243,139,168,0.7);pointer-events:none;z-index:5;`;
    line.title = `地面线 Y=${window.lockedBottom}`;
    fragment.appendChild(line);
    const lbl = document.createElement('div');
    lbl.style.cssText = `position:absolute;left:4px;top:${window.lockedBottom*window.zoom + 2}px;font-size:10px;color:rgba(243,139,168,0.9);pointer-events:none;z-index:5;`;
    lbl.textContent = `地面 Y=${window.lockedBottom}`;
    fragment.appendChild(lbl);
  }

  // Draw top reference line in "lock top" mode
  if (document.getElementById('lockTopChk')?.checked && window.lockedTop > 0 && window.srcImg) {
    const line = document.createElement('div');
    line.style.cssText = `position:absolute;left:0;top:${window.lockedTop*window.zoom}px;width:${window.srcImg.width*window.zoom}px;height:0;border-top:2px dashed rgba(100,200,255,0.7);pointer-events:none;z-index:5;`;
    line.title = `顶部线 Y=${window.lockedTop}`;
    fragment.appendChild(line);
    const lbl = document.createElement('div');
    lbl.style.cssText = `position:absolute;left:4px;top:${window.lockedTop*window.zoom - 14}px;font-size:10px;color:rgba(100,200,255,0.9);pointer-events:none;z-index:5;`;
    lbl.textContent = `顶部 Y=${window.lockedTop}`;
    fragment.appendChild(lbl);
  }
  
  // 一次性更新DOM，减少重排
  box.innerHTML = '';
  box.appendChild(fragment);
}

// 导出模块
export {
  renderCanvas,
  applyZoom,
  zoomIn,
  zoomOut,
  zoomFit,
  renderRects
};