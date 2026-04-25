// ===== Frame Extract Functionality =====
window.extractSources = []; // { id, name, img, frames, selectedFrames: [] }
window.extractTargets = []; // { id, sourceId, frameIndex, x, y, w, h, imgData }
let extractIdCounter = 0;
let extractAutoTrim = true; // Auto trim option for manual frame selection

// Alpha cache for extract sources
let extractAlphaCache = {}; // { sourceId: { data, width, height } }
// Zoom levels for extract sources
let extractZoomLevels = {}; // { sourceId: zoomLevel }

function getExtractAlpha(sourceId) {
  const source = extractSources.find(s => s.id === sourceId);
  if (!source) return null;
  
  if (extractAlphaCache[sourceId]) {
    const cached = extractAlphaCache[sourceId];
    if (cached.width === source.img.width && cached.height === source.img.height) {
      return cached;
    }
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = source.img.width;
  canvas.height = source.img.height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.drawImage(source.img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, source.img.width, source.img.height);
  const data = new Uint8Array(source.img.width * source.img.height);
  for (let i = 0; i < data.length; i++) {
    data[i] = imgData.data[i * 4 + 3];
  }
  
  extractAlphaCache[sourceId] = { data, width: source.img.width, height: source.img.height };
  return extractAlphaCache[sourceId];
}

function invalidateExtractAlpha(sourceId) {
  delete extractAlphaCache[sourceId];
}

function showExtractModal() {
  // extractModal element doesn't exist in HTML, so we just render the sources directly
  renderExtractSources();
  renderExtractTargets();
  renderGridOverlay();
}

function loadExtractSource() {
  try {
    const input = document.getElementById('extractFileInput');
    if (input) {
      input.click();
    } else {
      console.error('extractFileInput element not found');
      alert('无法找到文件输入元素，请刷新页面重试');
    }
  } catch (error) {
    console.error('Error in loadExtractSource:', error);
    alert('加载图片时出错，请刷新页面重试');
  }
}

// Expose function to global scope
window.loadExtractSource = loadExtractSource;

// Handle extract file input
function handleExtractFile(e) {
  try {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 文件类型验证
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    // 文件大小限制 (20MB)
    const maxSize = 20 * 1024 * 1024;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 验证文件类型
      if (!allowedTypes.includes(file.type)) {
        toast('只支持 JPEG、PNG、GIF 和 WebP 格式的图片');
        continue;
      }
      
      // 验证文件大小
      if (file.size > maxSize) {
        toast('图片大小不能超过 20MB');
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = function(ev) {
        try {
          const img = new Image();
          img.onload = function() {
            try {
              // 转义文件名，防止XSS攻击
              const safeFileName = file.name.replace(/[<>&"'\/]/g, '');
              const id = 'extract_source_' + (++extractIdCounter);
              window.extractSources.push({
                id,
                name: safeFileName,
                img: img,
                frames: [],
                selectedFrames: []
              });
              // Set initial zoom to 1
              extractZoomLevels[id] = 1;
              renderExtractSources();
            } catch (error) {
              console.error('添加图像到源列表时出错:', error);
              toast('添加图像时出错，请重试');
            }
          };
          img.onerror = function() {
            toast('图片加载失败，请重试');
          };
          img.src = ev.target.result;
        } catch (error) {
          console.error('创建图像对象时出错:', error);
          toast('创建图像对象时出错，请重试');
        }
      };
      reader.onerror = function() {
        toast('文件读取失败，请重试');
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  } catch (error) {
    console.error('处理文件时出错:', error);
    toast('处理文件时出错，请重试');
  }
}

// Expose handleExtractFile to global scope
window.handleExtractFile = handleExtractFile;

function clearExtractSources() {
  window.extractSources = [];
  renderExtractSources();
}

function clearExtractTarget() {
  window.extractTargets = [];
  renderExtractTargets();
}

// Expose clear functions to global scope
window.clearExtractSources = clearExtractSources;
window.clearExtractTarget = clearExtractTarget;

// ===== Manual Frame Extraction =====
let manualExtractState = null; // { sourceId, startX, startY, currentX, currentY }
let extractLockHeight = 0;
let extractLockBottom = 0;
let extractLockTop = 0;

function renderExtractSources() {
  const container = document.getElementById('extractSourceArea');
  if (window.extractSources.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-size:14px;">加载图片到待提取区域</div>';
    return;
  }
  
  container.innerHTML = '';
  window.extractSources.forEach(source => {
    const sourceElement = document.createElement('div');
    sourceElement.className = 'extract-source';
    sourceElement.style.cssText = `
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    
    sourceElement.innerHTML = `
      <div style="display:flex;justify-content-between;align-items:center;">
        <span style="font-size:12px;font-weight:600;">${source.name}</span>
        <button class="btn btn-sm btn-danger" onclick="removeExtractSource('${source.id}')" style="padding:2px 6px;font-size:10px;">✕</button>
      </div>
      <div id="extractImageContainer_${source.id}" style="position:relative;width:100%;min-height:350px;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);border:1px solid var(--border);border-radius:4px;overflow:auto;">
        <div id="extractImageWrapper_${source.id}" style="position:relative;display:inline-block;">
          <img src="${source.img.src}" id="extractImage_${source.id}" style="image-rendering:pixelated;cursor:crosshair;user-drag:none;user-select:none;-webkit-user-drag:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;">
          <div class="extract-frames" id="extractFrames_${source.id}" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;"></div>
          <div class="extract-selection" id="extractSelection_${source.id}" style="position:absolute;top:0;left:0;right:0;bottom:0;display:none;pointer-events:none;"></div>
        </div>
        <div style="position:absolute;bottom:8px;right:8px;display:flex;gap:2px;background:var(--bg-panel);border:1px solid var(--border);border-radius:4px;padding:2px;z-index:10;">
          <button class="btn btn-sm" onclick="extractZoomOut('${source.id}')" style="padding:2px 6px;font-size:10px;">−</button>
          <span id="extractZoomVal_${source.id}" style="font-size:10px;color:var(--text-dim);padding:2px 6px;min-width:40px;text-align:center;">100%</span>
          <button class="btn btn-sm" onclick="extractZoomIn('${source.id}')" style="padding:2px 6px;font-size:10px;">+</button>
          <button class="btn btn-sm" onclick="extractZoomFit('${source.id}')" style="padding:2px 6px;font-size:10px;">适应</button>
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:4px;margin-bottom:8px;">
          <label style="font-size:10px;display:flex;align-items:center;gap:2px;">
            <input type="checkbox" id="extractAutoTrim" ${extractAutoTrim ? 'checked' : ''} onchange="extractAutoTrim = this.checked;"> 智能裁剪
          </label>
        </div>
      <div style="display:flex;justify-content:center;gap:4px;">
          <button class="btn btn-sm" onclick="detectExtractFrames('${source.id}')" style="padding:4px 8px;font-size:11px;">🔍 检测帧</button>
          <button class="btn btn-sm" onclick="clearAutoExtractFrames('${source.id}')" style="padding:4px 8px;font-size:11px;">🗑️ 清除检测帧</button>
          <button class="btn btn-sm" onclick="selectAllExtractFrames('${source.id}')" style="padding:4px 8px;font-size:11px;">全选</button>
          <button class="btn btn-sm" onclick="addSelectedToTarget('${source.id}')" style="padding:4px 8px;font-size:11px;">添加到目标</button>
          <button class="btn btn-sm" onclick="clearManualExtractFrames('${source.id}')" style="padding:4px 8px;font-size:11px;">🗑️ 清除手动帧</button>
        </div>
      <div style="display:flex;justify-content:center;gap:4px;flex-wrap:wrap;">
        <label style="font-size:10px;display:flex;align-items:center;gap:2px;">
          <input type="checkbox" id="extractLockBottom_${source.id}" onchange="onExtractLockChange('${source.id}')"> 锁定底部
        </label>
        <label style="font-size:10px;display:flex;align-items:center;gap:2px;">
          <input type="checkbox" id="extractLockTop_${source.id}" onchange="onExtractLockChange('${source.id}')"> 锁定顶部
        </label>
        <label style="font-size:10px;display:flex;align-items:center;gap:2px;">
          <input type="checkbox" id="extractLockH_${source.id}" onchange="onExtractLockChange('${source.id}')"> 锁定高度
          <input type="number" id="extractLockHInput_${source.id}" style="width:40px;font-size:10px;padding:1px;display:none;" min="1" value="${extractLockHeight || 64}" oninput="onExtractLockSizeInput('${source.id}')">
        </label>
        <button class="btn btn-sm" onclick="resetExtractLock()" style="padding:2px 6px;font-size:10px;">重置锁定</button>
      </div>
    `;
    
    container.appendChild(sourceElement);
    
    // Add event listeners for manual frame selection
    const img = document.getElementById(`extractImage_${source.id}`);
    if (img) {
      img.addEventListener('mousedown', function(e) {
        startManualExtract(e, source.id);
      });
    }
    
    // Ensure zoom level is initialized
    if (typeof extractZoomLevels[source.id] === 'undefined') {
      extractZoomLevels[source.id] = 1;
    }
    
    // Apply initial zoom
    updateExtractZoom(source.id, extractZoomLevels[source.id]);
  });
  
  // Render frames and selection
  window.extractSources.forEach(source => {
    renderExtractFrames(source.id);
    onExtractLockChange(source.id);
  });
}

// Expose render functions to global scope
window.renderExtractFrames = renderExtractFrames;
window.renderExtractTargets = renderExtractTargets;
window.renderGridOverlay = renderGridOverlay;
window.renderExtractSources = renderExtractSources;

function onExtractLockChange(sourceId) {
  const lockH = document.getElementById(`extractLockH_${sourceId}`)?.checked;
  
  if (document.getElementById(`extractLockHInput_${sourceId}`)) {
    document.getElementById(`extractLockHInput_${sourceId}`).style.display = lockH ? 'inline-block' : 'none';
  }
}

function onExtractLockSizeInput(sourceId) {
  const lockH = document.getElementById(`extractLockH_${sourceId}`)?.checked;
  if (lockH) {
    extractLockHeight = parseInt(document.getElementById(`extractLockHInput_${sourceId}`)?.value) || 0;
  }
}

// Expose lock functions to global scope
window.onExtractLockChange = onExtractLockChange;
window.onExtractLockSizeInput = onExtractLockSizeInput;

function resetExtractLock() {
  extractLockHeight = 0;
  extractLockBottom = 0;
  extractLockTop = 0;
  
  // Reset all lock checkboxes
  window.extractSources.forEach(source => {
    if (document.getElementById(`extractLockBottom_${source.id}`)) {
      document.getElementById(`extractLockBottom_${source.id}`).checked = false;
    }
    if (document.getElementById(`extractLockTop_${source.id}`)) {
      document.getElementById(`extractLockTop_${source.id}`).checked = false;
    }
    if (document.getElementById(`extractLockH_${source.id}`)) {
      document.getElementById(`extractLockH_${source.id}`).checked = false;
    }
    if (document.getElementById(`extractLockHInput_${source.id}`)) {
      document.getElementById(`extractLockHInput_${source.id}`).value = '';
      document.getElementById(`extractLockHInput_${source.id}`).style.display = 'none';
    }
  });
  
  toast('已重置锁定');
}

// ===== Extract Zoom Functions =====

function extractZoomIn(sourceId) {
  const currentZoom = extractZoomLevels[sourceId] || 1;
  const newZoom = Math.min(currentZoom * 1.25, 5);
  extractZoomLevels[sourceId] = newZoom;
  updateExtractZoom(sourceId, newZoom);
}

function extractZoomOut(sourceId) {
  const currentZoom = extractZoomLevels[sourceId] || 1;
  const newZoom = Math.max(currentZoom / 1.25, 0.25);
  extractZoomLevels[sourceId] = newZoom;
  updateExtractZoom(sourceId, newZoom);
}

function extractZoomFit(sourceId) {
  const img = document.getElementById(`extractImage_${sourceId}`);
  const container = document.getElementById(`extractImageContainer_${sourceId}`);
  
  if (img && container) {
    // Account for padding
    const padding = 40;
    const containerWidth = container.clientWidth - padding;
    const containerHeight = container.clientHeight - padding;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    const widthRatio = containerWidth / imgWidth;
    const heightRatio = containerHeight / imgHeight;
    // Increase max zoom and make it more user-friendly
    const fitZoom = Math.min(widthRatio, heightRatio, 3);
    // Ensure minimum zoom of 0.1
    const finalZoom = Math.max(fitZoom, 0.1);
    
    extractZoomLevels[sourceId] = finalZoom;
    updateExtractZoom(sourceId, finalZoom);
  }
}

// Expose zoom functions to global scope
window.extractZoomIn = extractZoomIn;
window.extractZoomOut = extractZoomOut;
window.extractZoomFit = extractZoomFit;

function updateExtractZoom(sourceId, zoom) {
  const img = document.getElementById(`extractImage_${sourceId}`);
  const framesContainer = document.getElementById(`extractFrames_${sourceId}`);
  const selectionContainer = document.getElementById(`extractSelection_${sourceId}`);
  const zoomVal = document.getElementById(`extractZoomVal_${sourceId}`);
  const wrapper = document.getElementById(`extractImageWrapper_${sourceId}`);
  
  if (img) {
    img.style.transform = `scale(${zoom})`;
    img.style.transformOrigin = 'top left';
    img.style.width = `${img.naturalWidth}px`;
    img.style.height = `${img.naturalHeight}px`;
  }
  
  if (framesContainer) {
    framesContainer.style.transform = `scale(${zoom})`;
    framesContainer.style.transformOrigin = 'top left';
    framesContainer.style.width = `${img ? img.naturalWidth : 0}px`;
    framesContainer.style.height = `${img ? img.naturalHeight : 0}px`;
  }
  
  if (selectionContainer) {
    selectionContainer.style.transform = `scale(${zoom})`;
    selectionContainer.style.transformOrigin = 'top left';
    selectionContainer.style.width = `${img ? img.naturalWidth : 0}px`;
    selectionContainer.style.height = `${img ? img.naturalHeight : 0}px`;
  }
  
  // Update wrapper size to match scaled image
  if (wrapper && img) {
    wrapper.style.width = `${img.naturalWidth * zoom}px`;
    wrapper.style.height = `${img.naturalHeight * zoom}px`;
  }
  
  if (zoomVal) {
    zoomVal.textContent = `${Math.round(zoom * 100)}%`;
  }
  
  // Re-render frames to update their positions and sizes
  renderExtractFrames(sourceId);
}

function applyExtractSizeConstraint(x, y, w, h, sourceId) {
  const lockBottom = document.getElementById(`extractLockBottom_${sourceId}`)?.checked;
  const lockTop = document.getElementById(`extractLockTop_${sourceId}`)?.checked;
  const lockH = document.getElementById(`extractLockH_${sourceId}`)?.checked;
  
  // 1. Lock top (extend/trim to top line)
  if (lockTop && extractLockTop > 0) {
    if (y > extractLockTop) {
      h = h + (y - extractLockTop);
      y = extractLockTop;
    } else if (y < extractLockTop) {
      h = Math.max(h - (extractLockTop - y), 3);
      y = extractLockTop;
    }
  }
  
  // 2. Lock bottom (extend/trim to bottom line)
  if (lockBottom && extractLockBottom > 0) {
    const bottom = y + h;
    if (bottom < extractLockBottom) {
      h = extractLockBottom - y;
    } else if (bottom > extractLockBottom) {
      h = extractLockBottom - y;
      if (h < 3) h = 3;
    }
  }
  
  // 3. Lock height (final height override, after top/bottom adjusted)
  if (lockH && extractLockHeight > 0) {
    h = extractLockHeight;
  }
  
  return { x, y, w, h };
}

function startManualExtract(e, sourceId) {
  const source = extractSources.find(s => s.id === sourceId);
  if (!source) return;
  
  const img = document.getElementById(`extractImage_${sourceId}`);
  const rect = img.getBoundingClientRect();
  const zoom = extractZoomLevels[sourceId] || 1;
  
  // Calculate actual image position considering zoom
  manualExtractState = {
    sourceId,
    startX: (e.clientX - rect.left) / zoom,
    startY: (e.clientY - rect.top) / zoom,
    currentX: (e.clientX - rect.left) / zoom,
    currentY: (e.clientY - rect.top) / zoom
  };
  
  document.addEventListener('mousemove', updateManualExtract);
  document.addEventListener('mouseup', finishManualExtract);
}

function updateManualExtract(e) {
  if (!manualExtractState) return;
  
  const source = extractSources.find(s => s.id === manualExtractState.sourceId);
  if (!source) return;
  
  const img = document.getElementById(`extractImage_${manualExtractState.sourceId}`);
  const rect = img.getBoundingClientRect();
  const zoom = extractZoomLevels[manualExtractState.sourceId] || 1;
  
  // Calculate actual image position considering zoom
  manualExtractState.currentX = (e.clientX - rect.left) / zoom;
  manualExtractState.currentY = (e.clientY - rect.top) / zoom;
  
  renderManualExtractSelection();
}

function finishManualExtract(e) {
  if (!manualExtractState) return;
  
  const source = extractSources.find(s => s.id === manualExtractState.sourceId);
  if (!source) return;
  
  let x = Math.min(manualExtractState.startX, manualExtractState.currentX);
  let y = Math.min(manualExtractState.startY, manualExtractState.currentY);
  let w = Math.abs(manualExtractState.currentX - manualExtractState.startX);
  let h = Math.abs(manualExtractState.currentY - manualExtractState.startY);
  
  if (w > 5 && h > 5) {
    // Apply size constraint
    const con = applyExtractSizeConstraint(x, y, w, h, manualExtractState.sourceId);
    w = con.w;
    h = con.h;
    y = con.y;
    
    // Auto-lock on first frame
    const lockBottom = document.getElementById(`extractLockBottom_${manualExtractState.sourceId}`)?.checked;
    const lockTop = document.getElementById(`extractLockTop_${manualExtractState.sourceId}`)?.checked;
    const lockH = document.getElementById(`extractLockH_${manualExtractState.sourceId}`)?.checked;
    
    if (lockBottom && extractLockBottom === 0) {
      extractLockBottom = y + h;
    }
    if (lockTop && extractLockTop === 0) {
      extractLockTop = y;
    }
    if (lockH && extractLockHeight === 0) {
      extractLockHeight = h;
      if (document.getElementById(`extractLockHInput_${manualExtractState.sourceId}`)) {
        document.getElementById(`extractLockHInput_${manualExtractState.sourceId}`).value = h;
      }
    }
    
    if (extractLockBottom > 0 || extractLockTop > 0 || extractLockHeight > 0) {
      onExtractLockChange(manualExtractState.sourceId);
    }
    
    // Create temporary frame for auto-crop
    let newFrame = { x, y, w, h, selected: true, manual: true };
    
    if (extractAutoTrim) {
      const at = 10; // Alpha threshold
      
      // Step 1: Expand edges to avoid clipping
      extractExpandEdges(newFrame, manualExtractState.sourceId, at, 2, 8);
      
      // Step 2: Trim transparent edges
      const tr = extractTrimAlpha(newFrame, manualExtractState.sourceId, at);
      if (tr) { newFrame.x = tr.x; newFrame.y = tr.y; newFrame.w = tr.w; newFrame.h = tr.h; }
      
      // Step 3: Add small padding
      const pad = 2;
      newFrame.x = Math.max(0, newFrame.x - pad);
      newFrame.y = Math.max(0, newFrame.y - pad);
      newFrame.w = Math.min(newFrame.w + pad * 2, source.img.width - newFrame.x);
      newFrame.h = Math.min(newFrame.h + pad * 2, source.img.height - newFrame.y);
    }
    
    // Apply size constraints
    const con2 = applyExtractSizeConstraint(newFrame.x, newFrame.y, newFrame.w, newFrame.h, manualExtractState.sourceId);
    newFrame.x = con2.x; newFrame.y = con2.y; newFrame.w = con2.w; newFrame.h = con2.h;
    
    // Add frame
    source.frames.push(newFrame);
    renderExtractFrames(manualExtractState.sourceId);
    toast(`已添加手动帧 ${newFrame.w}×${newFrame.h}`);
  }
  
  // Clean up
  manualExtractState = null;
  document.removeEventListener('mousemove', updateManualExtract);
  document.removeEventListener('mouseup', finishManualExtract);
  
  // Clear selection
  const selection = document.getElementById(`extractSelection_${source.id}`);
  if (selection) {
    selection.style.display = 'none';
    selection.innerHTML = '';
  }
}

function renderManualExtractSelection() {
  if (!manualExtractState) return;
  
  const source = extractSources.find(s => s.id === manualExtractState.sourceId);
  if (!source) return;
  
  const img = document.getElementById(`extractImage_${manualExtractState.sourceId}`);
  const zoom = extractZoomLevels[manualExtractState.sourceId] || 1;
  
  let x = Math.min(manualExtractState.startX, manualExtractState.currentX);
  let y = Math.min(manualExtractState.startY, manualExtractState.currentY);
  let w = Math.abs(manualExtractState.currentX - manualExtractState.startX);
  let h = Math.abs(manualExtractState.currentY - manualExtractState.startY);
  
  // Apply size constraint to preview
  const con = applyExtractSizeConstraint(x, y, w, h, manualExtractState.sourceId);
  w = con.w;
  h = con.h;
  y = con.y;
  
  const selection = document.getElementById(`extractSelection_${manualExtractState.sourceId}`);
  if (selection) {
    selection.style.display = 'block';
    selection.innerHTML = `
      <div style="
        position:absolute;
        left:${x}px;
        top:${y}px;
        width:${w}px;
        height:${h}px;
        border:2px solid var(--accent);
        background:rgba(137,180,250,0.2);
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;
        left:${x}px;
        top:${y - 16}px;
        background:var(--accent);
        color:white;
        padding:2px 4px;
        font-size:10px;
        border-radius:2px;
        pointer-events:none;
      ">${Math.round(w)}×${Math.round(h)}</div>
    `;
  }
}

function renderExtractFrames(sourceId) {
  const source = extractSources.find(s => s.id === sourceId);
  if (!source) return;
  
  const framesContainer = document.getElementById(`extractFrames_${sourceId}`);
  if (!framesContainer) return;
  
  framesContainer.innerHTML = '';
  
  source.frames.forEach((frame, index) => {
    const frameElement = document.createElement('div');
    frameElement.className = 'extract-frame';
    frameElement.style.cssText = `
      position:absolute;
      left:${frame.x}px;
      top:${frame.y}px;
      width:${frame.w}px;
      height:${frame.h}px;
      border:2px solid ${frame.selected ? 'var(--accent)' : 'var(--border)'};
      background:${frame.selected ? 'rgba(137,180,250,0.2)' : 'rgba(255,255,255,0.1)'};
      cursor:pointer;
      pointer-events:auto;
    `;
    
    frameElement.innerHTML = `
      <div style="
        position:absolute;
        top:2px;
        left:2px;
        font-size:8px;
        color:white;
        background:${frame.selected ? 'var(--accent)' : 'var(--border)'};
        padding:1px 3px;
        border-radius:2px;
      ">${frame.manual ? '✏️' : ''}${index + 1}</div>
    `;
    
    frameElement.addEventListener('click', function(e) {
      e.stopPropagation();
      frame.selected = !frame.selected;
      renderExtractFrames(sourceId);
    });
    
    // Add resize handles for manual frames
    if (frame.manual) {
      ['nw','n','ne','w','e','sw','s','se'].forEach(dir => {
        const h = document.createElement('div');
        h.className = `rh rh-${dir}`;
        h.style.cssText = `
          position:absolute;
          width:8px;
          height:8px;
          background:var(--accent);
          border:1px solid white;
          border-radius:2px;
          pointer-events:auto;
        `;
        
        // Position handles
        if (dir.includes('n')) h.style.top = '-4px';
        if (dir.includes('s')) h.style.bottom = '-4px';
        if (dir.includes('w')) h.style.left = '-4px';
        if (dir.includes('e')) h.style.right = '-4px';
        
        h.addEventListener('mousedown', function(e) {
          e.stopPropagation();
          startExtractFrameResize(e, sourceId, frame, dir);
        });
        
        frameElement.appendChild(h);
      });
      
      // Add move functionality
      frameElement.addEventListener('mousedown', function(e) {
        if (e.target.className.includes('rh')) return;
        e.stopPropagation();
        startExtractFrameMove(e, sourceId, frame);
      });
    }
    
    framesContainer.appendChild(frameElement);
  });
  
  // Draw reference lines
  const img = document.getElementById(`extractImage_${sourceId}`);
  const scaleX = img.clientWidth / img.naturalWidth;
  const scaleY = img.clientHeight / img.naturalHeight;
  
  // Draw ground reference line in "lock bottom" mode
  if (document.getElementById(`extractLockBottom_${sourceId}`)?.checked && extractLockBottom > 0) {
    const line = document.createElement('div');
    line.style.cssText = `
      position:absolute;
      left:0;
      top:${extractLockBottom}px;
      width:100%;
      height:0;
      border-top:2px dashed rgba(243,139,168,0.7);
      pointer-events:none;
      z-index:5;
    `;
    line.title = `地面线 Y=${extractLockBottom}`;
    framesContainer.appendChild(line);
    
    const lbl = document.createElement('div');
    lbl.style.cssText = `
      position:absolute;
      left:4px;
      top:${extractLockBottom + 2}px;
      font-size:10px;
      color:rgba(243,139,168,0.9);
      pointer-events:none;
      z-index:5;
    `;
    lbl.textContent = `地面 Y=${extractLockBottom}`;
    framesContainer.appendChild(lbl);
  }
  
  // Draw top reference line in "lock top" mode
  if (document.getElementById(`extractLockTop_${sourceId}`)?.checked && extractLockTop > 0) {
    const line = document.createElement('div');
    line.style.cssText = `
      position:absolute;
      left:0;
      top:${extractLockTop}px;
      width:100%;
      height:0;
      border-top:2px dashed rgba(100,200,255,0.7);
      pointer-events:none;
      z-index:5;
    `;
    line.title = `顶部线 Y=${extractLockTop}`;
    framesContainer.appendChild(line);
    
    const lbl = document.createElement('div');
    lbl.style.cssText = `
      position:absolute;
      left:4px;
      top:${extractLockTop - 14}px;
      font-size:10px;
      color:rgba(100,200,255,0.9);
      pointer-events:none;
      z-index:5;
    `;
    lbl.textContent = `顶部 Y=${extractLockTop}`;
    framesContainer.appendChild(lbl);
  }
}

function clearManualExtractFrames(sourceId) {
  const source = extractSources.find(s => s.id === sourceId);
  if (!source) return;
  
  const manualFrames = source.frames.filter(frame => frame.manual);
  if (manualFrames.length === 0) {
    toast('没有手动帧可清除');
    return;
  }
  
  source.frames = source.frames.filter(frame => !frame.manual);
  renderExtractFrames(sourceId);
  toast(`已清除 ${manualFrames.length} 个手动帧`);
}

function removeExtractSource(id) {
  window.extractSources = window.extractSources.filter(source => source.id !== id);
  renderExtractSources();
}

function detectExtractFrames(sourceId) {
  const source = window.extractSources.find(s => s.id === sourceId);
  if (!source) return;
  
  const img = source.img;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;
  
  // Simple frame detection based on transparency
  const frames = [];
  const threshold = 10;
  
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const index = (y * img.width + x) * 4;
      const alpha = data[index + 3];
      
      if (alpha > threshold) {
        // Found a non-transparent pixel, check if it's a new frame
        let found = false;
        for (const frame of frames) {
          if (x >= frame.x && x < frame.x + frame.w && y >= frame.y && y < frame.y + frame.h) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          // Grow the frame until we hit transparent pixels
          let frameX = x;
          let frameY = y;
          let frameW = 1;
          let frameH = 1;
          
          // Grow right
          while (frameX + frameW < img.width) {
            let hasContent = false;
            for (let fy = frameY; fy < frameY + frameH; fy++) {
              const i = (fy * img.width + frameX + frameW) * 4;
              if (data[i + 3] > threshold) {
                hasContent = true;
                break;
              }
            }
            if (!hasContent) break;
            frameW++;
          }
          
          // Grow down
          while (frameY + frameH < img.height) {
            let hasContent = false;
            for (let fx = frameX; fx < frameX + frameW; fx++) {
              const i = ((frameY + frameH) * img.width + fx) * 4;
              if (data[i + 3] > threshold) {
                hasContent = true;
                break;
              }
            }
            if (!hasContent) break;
            frameH++;
          }
          
          frames.push({ x: frameX, y: frameY, w: frameW, h: frameH, selected: false, manual: false });
        }
      }
    }
  }
  
  // Keep manual frames
  const manualFrames = source.frames.filter(frame => frame.manual);
  source.frames = [...manualFrames, ...frames];
  renderExtractSources();
  toast(`检测到 ${frames.length} 个帧` + (manualFrames.length ? `（+ ${manualFrames.length} 手动帧）` : ''));
}

function clearAutoExtractFrames(sourceId) {
  const source = window.extractSources.find(s => s.id === sourceId);
  if (!source) return;
  
  const manualFrames = source.frames.filter(frame => frame.manual);
  source.frames = manualFrames;
  renderExtractSources();
  toast(`已清除自动检测的帧` + (manualFrames.length ? `（保留 ${manualFrames.length} 手动帧）` : ''));
}

function selectAllExtractFrames(sourceId) {
  const source = window.extractSources.find(s => s.id === sourceId);
  if (!source) return;
  source.frames.forEach(frame => frame.selected = true);
  renderExtractSources();
}

function addSelectedToTarget(sourceId) {
  const source = window.extractSources.find(s => s.id === sourceId);
  if (!source) return;
  
  const selectedFrames = source.frames.filter(frame => frame.selected);
  if (selectedFrames.length === 0) {
    toast('请先选择要提取的帧');
    return;
  }
  
  selectedFrames.forEach((frame, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = frame.w;
    canvas.height = frame.h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.drawImage(source.img, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
    
    window.extractTargets.push({
      id: 'extract_target_' + (++extractIdCounter),
      sourceId: source.id,
      frameIndex: index,
      x: 0,
      y: 0,
      w: frame.w,
      h: frame.h,
      imgData: canvas.toDataURL('image/png')
    });
  });
  
  autoArrangeExtractTarget();
  toast(`已添加 ${selectedFrames.length} 个帧到目标区域`);
}

function renderExtractTargets() {
  const container = document.getElementById('targetFrames');
  container.innerHTML = '';
  
  window.extractTargets.forEach(target => {
    const targetElement = document.createElement('div');
    targetElement.className = 'extract-target-frame';
    targetElement.style.cssText = `
      position:absolute;
      left:${target.x}px;
      top:${target.y}px;
      width:${target.w}px;
      height:${target.h}px;
      border:2px solid var(--accent);
      border-radius:4px;
      cursor:move;
      background:var(--bg-panel);
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
      z-index:10;
      user-select:none;
    `;
    
    targetElement.innerHTML = `
      <img src="${target.imgData}" style="width:100%;height:100%;image-rendering:pixelated;pointer-events:none;">
      <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); removeExtractTarget('${target.id}')" style="position:absolute;top:2px;right:2px;padding:2px 4px;font-size:8px;z-index:11;cursor:pointer;">✕</button>
    `;
    
    targetElement.addEventListener('mousedown', function(e) {
      startExtractTargetMove(e, target.id);
    });
    
    container.appendChild(targetElement);
  });
}

function removeExtractTarget(id) {
  window.extractTargets = window.extractTargets.filter(target => target.id !== id);
  renderExtractTargets();
}

// 切换排列模式选项的显示/隐藏
function toggleArrangeModeOptions() {
  const mode = document.getElementById('arrangeMode').value;
  const colsRow = document.getElementById('gridColsRow');
  const rowsRow = document.getElementById('gridRowsRow');
  
  if (mode === 'grid') {
    colsRow.style.display = 'flex';
    rowsRow.style.display = 'flex';
  } else {
    colsRow.style.display = 'none';
    rowsRow.style.display = 'none';
  }
}

// 主自动排列函数
function autoArrangeExtractTarget() {
  const mode = document.getElementById('arrangeMode').value;
  
  if (mode === 'grid') {
    autoArrangeExtractTargetGrid();
  } else {
    autoArrangeExtractTargetFlow();
  }
}

// 流式排列（保持原有行为）
function autoArrangeExtractTargetFlow() {
  const padding = parseInt(document.getElementById('gridPadding').value) || 2;
  
  let x = padding;
  let y = padding;
  let maxRowHeight = 0;
  
  window.extractTargets.forEach((target) => {
    if (x + target.w + padding > 800) { // 800px max width
      x = padding;
      y += maxRowHeight + padding;
      maxRowHeight = 0;
    }
    
    target.x = x;
    target.y = y;
    maxRowHeight = Math.max(maxRowHeight, target.h);
    
    x += target.w + padding;
  });
  
  renderExtractTargets();
}

// 宫格模式排列
function autoArrangeExtractTargetGrid() {
  const padding = parseInt(document.getElementById('gridPadding').value) || 2;
  let cols = parseInt(document.getElementById('gridCols').value) || 3;
  let rows = parseInt(document.getElementById('gridRows').value) || 3;
  
  // 确保有足够的空间容纳所有帧
  const totalCells = cols * rows;
  if (window.extractTargets.length > totalCells) {
    // 自动调整行列数以容纳所有帧
    while (cols * rows < window.extractTargets.length) {
      cols++;
      if (cols * rows < window.extractTargets.length) {
        rows++;
      }
    }
    toast(`帧数量较多，已自动调整为 ${cols}×${rows} 宫格`);
  }
  
  // 计算单元格大小（基于帧的最大尺寸）
  let maxW = 0, maxH = 0;
  window.extractTargets.forEach(target => {
    maxW = Math.max(maxW, target.w);
    maxH = Math.max(maxH, target.h);
  });
  
  const cellW = maxW + padding;
  const cellH = maxH + padding;
  
  // 排列帧
  window.extractTargets.forEach((target, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // 居中对齐每个帧
    const x = col * cellW + padding + (maxW - target.w) / 2;
    const y = row * cellH + padding + (maxH - target.h) / 2;
    
    target.x = Math.round(x);
    target.y = Math.round(y);
  });
  
  renderExtractTargets();
}

function renderGridOverlay() {
  const overlay = document.getElementById('gridOverlay');
  const gridSize = parseInt(document.getElementById('gridSize').value) || 32;
  
  let gridHTML = '';
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 30; x++) {
      gridHTML += `
        <div style="
          position:absolute;
          left:${x * gridSize}px;
          top:${y * gridSize}px;
          width:${gridSize}px;
          height:${gridSize}px;
          border:1px solid rgba(255,255,255,0.1);
          box-sizing:border-box;
        "></div>
      `;
    }
  }
  
  overlay.innerHTML = gridHTML;
}

// Export option variable
let selectedExportOption = 'spriteSheet';

function createExtractSpriteSheet() {
  if (window.extractTargets.length === 0) {
    toast('请先添加帧到目标区域');
    return;
  }
  
  // Show export options modal
  document.getElementById('extractExportModal').classList.add('show');
}

function selectExportOption(option) {
  console.log('selectExportOption called with option:', option);
  selectedExportOption = option;
  console.log('selectedExportOption set to:', selectedExportOption);
  
  // Update UI to show selected option
  document.querySelectorAll('.export-option').forEach(el => {
    el.style.borderColor = 'var(--border)';
    el.style.background = 'var(--bg-surface)';
  });
  
  const selectedEl = document.querySelector(`.export-option[onclick="selectExportOption('${option}')"]`);
  if (selectedEl) {
    selectedEl.style.borderColor = 'var(--accent)';
    selectedEl.style.background = 'rgba(137, 180, 250, 0.05)';
  }
}

let previewCanvas = null;

function renderExtractPreview(callback) {
  const padding = parseInt(document.getElementById('gridPadding').value) || 2;
  
  let maxX = 0;
  let maxY = 0;
  window.extractTargets.forEach(target => {
    maxX = Math.max(maxX, target.x + target.w + padding);
    maxY = Math.max(maxY, target.y + target.h + padding);
  });
  
  const canvas = document.createElement('canvas');
  canvas.width = maxX;
  canvas.height = maxY;
  const ctx = canvas.getContext('2d');
  
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let loadedCount = 0;
  
  window.extractTargets.forEach(target => {
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, target.x, target.y);
      loadedCount++;
      
      if (loadedCount === window.extractTargets.length) {
        previewCanvas = canvas;
        if (callback) callback(canvas, maxX, maxY);
      }
    };
    img.onerror = function() {
      loadedCount++;
      if (loadedCount === window.extractTargets.length) {
        previewCanvas = canvas;
        if (callback) callback(canvas, maxX, maxY);
      }
    };
    img.src = target.imgData;
  });
}

function showExtractPreviewModal() {
  const modal = document.getElementById('extractPreviewModal');
  const container = document.getElementById('extractPreviewContainer');
  const info = document.getElementById('extractPreviewInfo');
  
  container.innerHTML = '<p style="color:var(--text-dim);font-size:12px;">正在生成预览...</p>';
  modal.classList.add('show');
  
  renderExtractPreview(function(canvas, width, height) {
    container.innerHTML = '';
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.maxWidth = '100%';
    img.style.maxHeight = '350px';
    img.style.imageRendering = 'pixelated';
    container.appendChild(img);
    
    info.innerHTML = `
      <strong>精灵表尺寸:</strong> ${width} × ${height} px<br>
      <strong>帧数:</strong> ${window.extractTargets.length}
    `;
  });
}

function confirmExtractExport() {
  if (previewCanvas) {
    exportCanvasAsImage(previewCanvas, 'sprite_sheet');
  }
  closeModal('extractPreviewModal');
}

function executeExportOption() {
  console.log('executeExportOption called');
  console.log('selectedExportOption:', selectedExportOption);
  closeModal('extractExportModal');
  
  if (selectedExportOption === 'spriteSheet') {
    console.log('Showing export preview');
    showExtractPreviewModal();
  } else if (selectedExportOption === 'frameEdit') {
    console.log('Calling sendToFrameEdit');
    sendToFrameEdit();
  } else {
    console.log('Unknown export option:', selectedExportOption);
  }
}

function exportAsSpriteSheet() {
  const padding = parseInt(document.getElementById('gridPadding').value) || 2;
  
  // Calculate required size
  let maxX = 0;
  let maxY = 0;
  window.extractTargets.forEach(target => {
    maxX = Math.max(maxX, target.x + target.w + padding);
    maxY = Math.max(maxY, target.y + target.h + padding);
  });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = maxX;
  canvas.height = maxY;
  const ctx = canvas.getContext('2d');
  
  // Disable image smoothing
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  
  // Fill with transparent
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 重置所有target的loaded状态
  window.extractTargets.forEach(target => {
    target.loaded = false;
  });
  
  // Draw frames
  window.extractTargets.forEach(target => {
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, target.x, target.y);
      
      // Mark this target as loaded
      target.loaded = true;
      
      // Check if all images are loaded
      const loadedCount = window.extractTargets.filter(t => t.loaded).length;
      console.log('Export - Loaded count:', loadedCount, 'of', window.extractTargets.length);
      
      if (loadedCount === window.extractTargets.length) {
        // All images loaded, export
        console.log('All targets loaded, exporting sprite sheet');
        exportCanvasAsImage(canvas, 'sprite_sheet');
      }
    };
    
    // 添加错误处理
    img.onerror = function() {
      console.error('Error loading target for export');
      // 即使出错也标记为已加载，避免阻塞流程
      target.loaded = true;
      
      // 检查是否所有目标都已处理
      const loadedCount = window.extractTargets.filter(t => t.loaded).length;
      if (loadedCount === window.extractTargets.length) {
        console.log('All targets processed (with errors), exporting sprite sheet');
        exportCanvasAsImage(canvas, 'sprite_sheet');
      }
    };
    
    img.src = target.imgData;
  });
}

function sendToFrameEdit() {
  console.log('sendToFrameEdit called');
  console.log('extractTargets length:', window.extractTargets.length);
  
  // 重置所有target的loaded状态
  window.extractTargets.forEach(target => {
    target.loaded = false;
  });
  
  // Convert extract targets to frames format for edit page
  const frames = window.extractTargets.map((target, index) => {
    return {
      id: index,
      x: 0,
      y: 0,
      w: target.w,
      h: target.h,
      selected: true,
      manual: true
    };
  });
  
  // Create a canvas with all frames for the edit page
  const canvas = document.createElement('canvas');
  
  // Calculate canvas size
  let maxWidth = 0;
  let totalHeight = 0;
  const padding = 10;
  
  window.extractTargets.forEach(target => {
    maxWidth = Math.max(maxWidth, target.w);
    totalHeight += target.h + padding;
  });
  
  console.log('Canvas size:', maxWidth, 'x', totalHeight);
  
  canvas.width = maxWidth;
  canvas.height = totalHeight;
  
  const ctx = canvas.getContext('2d');
  
  // Disable image smoothing
  ctx.imageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add a flag to ensure only one redirect happens
  let redirectTriggered = false;
  
  // Draw all frames onto the canvas
  let currentY = 0;
  console.log('Processing', window.extractTargets.length, 'targets');
  
  // 如果没有目标，直接重定向
  if (window.extractTargets.length === 0) {
    console.log('No targets to process, redirecting immediately');
    startSpriteEdit();
    return;
  }
  
  window.extractTargets.forEach((target, index) => {
    console.log('Processing target', index, 'with imgData length:', target.imgData.length);
    const img = new Image();
    
    // 添加错误处理
    img.onerror = function() {
      console.error('Error loading target', index);
      // 即使出错也标记为已加载，避免阻塞流程
      target.loaded = true;
      
      // 检查是否所有目标都已处理
      const loadedCount = window.extractTargets.filter(t => t.loaded).length;
      console.log('Error - Loaded count:', loadedCount, 'of', window.extractTargets.length);
      
      if (loadedCount === window.extractTargets.length && !redirectTriggered) {
        console.log('All targets processed (with errors), triggering redirect');
        triggerRedirect();
      }
    };
    
    img.onload = function() {
      console.log('Target', index, 'loaded successfully');
      const x = (maxWidth - target.w) / 2;
      ctx.drawImage(img, x, currentY);
      currentY += target.h + padding;
      
      // Mark this target as loaded
      target.loaded = true;
      
      // Check if all images are loaded
      const loadedCount = window.extractTargets.filter(t => t.loaded).length;
      console.log('Loaded count:', loadedCount, 'of', window.extractTargets.length);
      
      if (loadedCount === window.extractTargets.length && !redirectTriggered) {
        console.log('All targets loaded, triggering redirect');
        triggerRedirect();
      }
    };
    
    // 立即设置src开始加载
    img.src = target.imgData;
  });
  
  // 提取重定向逻辑为单独函数
  function triggerRedirect() {
    if (redirectTriggered) return;
    redirectTriggered = true;
    
    const dataUrl = canvas.toDataURL('image/png');
    console.log('Created data URL, length:', dataUrl.length);
    
    const img = new Image();
    img.onload = function() {
      console.log('Data URL image loaded, width:', img.width, 'height:', img.height);
      
      // 检查全局变量是否可用
      console.log('Global variables check:');
      console.log('srcImg exists:', typeof srcImg !== 'undefined');
      console.log('window.frames exists:', typeof window.frames !== 'undefined');
      console.log('selId exists:', typeof selId !== 'undefined');
      console.log('nextId exists:', typeof nextId !== 'undefined');
      console.log('startSpriteEdit exists:', typeof startSpriteEdit === 'function');
      
      // Set global variables for edit page
      srcImg = img;
      window.frames = frames;
      selId = 0;
      nextId = frames.length;
      
      console.log('Calling startSpriteEdit');
      // Switch to edit page
      startSpriteEdit();
      
      // Update UI
      console.log('Updating UI elements');
      try {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('canvasFrame').style.display = 'inline-block';
        document.getElementById('zoomBar').style.display = 'flex';
        document.getElementById('coord').style.display = 'block';
        document.getElementById('hintBar').style.display = 'block';
        document.getElementById('imgInfo').textContent = `${img.width}×${img.height} · 提取的帧`;
        
        // Render canvas and frames
        console.log('Rendering canvas and frames');
        if (typeof renderCanvas === 'function') renderCanvas();
        if (typeof zoomFit === 'function') zoomFit();
        if (typeof renderRects === 'function') renderRects();
        if (typeof updateAll === 'function') updateAll();
        
        // 启用编辑页面的按钮，就像加载图片时一样
        ['btnDetect','btnDetect2','btnOptimize','btnInterp','btnDelete','btnClearManual','btnBgMode'].forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.disabled = false;
        });
        
        // 显示背景消除部分
        const bgRemoveSection = document.getElementById('bgRemoveSection');
        if (bgRemoveSection) bgRemoveSection.style.display = '';
        
        toast(`已发送 ${frames.length} 个帧到精灵编辑页面`);
        console.log('Redirect completed successfully');
      } catch (error) {
        console.error('Error in UI update:', error);
        toast('跳转成功，但UI更新失败');
      }
    };
    
    img.onerror = function() {
      console.error('Error loading data URL image');
      // 即使出错也尝试跳转
      startSpriteEdit();
      toast('跳转成功，但图片加载失败');
    };
    
    img.src = dataUrl;
  }
}

// Expose all functions to global scope
window.removeExtractSource = removeExtractSource;
window.detectExtractFrames = detectExtractFrames;
window.clearAutoExtractFrames = clearAutoExtractFrames;
window.selectAllExtractFrames = selectAllExtractFrames;
window.addSelectedToTarget = addSelectedToTarget;
window.clearManualExtractFrames = clearManualExtractFrames;
window.resetExtractLock = resetExtractLock;
window.removeExtractTarget = removeExtractTarget;
window.clearExtractTarget = clearExtractTarget;
window.autoArrangeExtractTarget = autoArrangeExtractTarget;
window.createExtractSpriteSheet = createExtractSpriteSheet;
window.selectExportOption = selectExportOption;
window.executeExportOption = executeExportOption;
window.exportAsSpriteSheet = exportAsSpriteSheet;
window.sendToFrameEdit = sendToFrameEdit;
window.toggleArrangeModeOptions = toggleArrangeModeOptions;
window.autoArrangeExtractTargetGrid = autoArrangeExtractTargetGrid;
window.autoArrangeExtractTargetFlow = autoArrangeExtractTargetFlow;

function exportCanvasAsImage(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('精灵表已导出');
}

// ===== Frame Move & Resize =====
let extractFrameInteraction = null;

function startExtractFrameMove(e, sourceId, frame) {
  const img = document.getElementById(`extractImage_${sourceId}`);
  const rect = img.getBoundingClientRect();
  const zoom = extractZoomLevels[sourceId] || 1;
  
  // Calculate actual image position considering zoom
  const scaleX = img.naturalWidth / (img.clientWidth / zoom);
  const scaleY = img.naturalHeight / (img.clientHeight / zoom);
  
  extractFrameInteraction = {
    type: 'move',
    sourceId,
    frame,
    startX: (e.clientX - rect.left) * scaleX / zoom,
    startY: (e.clientY - rect.top) * scaleY / zoom,
    frameX: frame.x,
    frameY: frame.y
  };
  
  document.addEventListener('mousemove', handleExtractFrameMove);
  document.addEventListener('mouseup', finishExtractFrameInteraction);
}

function startExtractFrameResize(e, sourceId, frame, dir) {
  const img = document.getElementById(`extractImage_${sourceId}`);
  const rect = img.getBoundingClientRect();
  const zoom = extractZoomLevels[sourceId] || 1;
  
  // Calculate actual image position considering zoom
  const scaleX = img.naturalWidth / (img.clientWidth / zoom);
  const scaleY = img.naturalHeight / (img.clientHeight / zoom);
  
  extractFrameInteraction = {
    type: 'resize',
    sourceId,
    frame,
    dir,
    startX: (e.clientX - rect.left) * scaleX / zoom,
    startY: (e.clientY - rect.top) * scaleY / zoom,
    frameX: frame.x,
    frameY: frame.y,
    frameW: frame.w,
    frameH: frame.h
  };
  
  document.addEventListener('mousemove', handleExtractFrameResize);
  document.addEventListener('mouseup', finishExtractFrameInteraction);
}

function handleExtractFrameMove(e) {
  if (!extractFrameInteraction || extractFrameInteraction.type !== 'move') return;
  
  const { sourceId, frame, startX, startY, frameX, frameY } = extractFrameInteraction;
  const img = document.getElementById(`extractImage_${sourceId}`);
  const rect = img.getBoundingClientRect();
  const zoom = extractZoomLevels[sourceId] || 1;
  
  // Calculate actual image position considering zoom
  const scaleX = img.naturalWidth / (img.clientWidth / zoom);
  const scaleY = img.naturalHeight / (img.clientHeight / zoom);
  
  const currentX = (e.clientX - rect.left) * scaleX / zoom;
  const currentY = (e.clientY - rect.top) * scaleY / zoom;
  
  const dx = currentX - startX;
  const dy = currentY - startY;
  
  frame.x = Math.max(0, Math.min(frameX + dx, img.naturalWidth - frame.w));
  frame.y = Math.max(0, Math.min(frameY + dy, img.naturalHeight - frame.h));
  
  renderExtractFrames(sourceId);
}

function handleExtractFrameResize(e) {
  if (!extractFrameInteraction || extractFrameInteraction.type !== 'resize') return;
  
  const { sourceId, frame, dir, startX, startY, frameX, frameY, frameW, frameH } = extractFrameInteraction;
  const img = document.getElementById(`extractImage_${sourceId}`);
  const rect = img.getBoundingClientRect();
  const zoom = extractZoomLevels[sourceId] || 1;
  
  // Calculate actual image position considering zoom
  const scaleX = img.naturalWidth / (img.clientWidth / zoom);
  const scaleY = img.naturalHeight / (img.clientHeight / zoom);
  
  const currentX = (e.clientX - rect.left) * scaleX / zoom;
  const currentY = (e.clientY - rect.top) * scaleY / zoom;
  
  const dx = currentX - startX;
  const dy = currentY - startY;
  
  let newX = frameX;
  let newY = frameY;
  let newW = frameW;
  let newH = frameH;
  
  if (dir.includes('w')) {
    newX += dx;
    newW -= dx;
  }
  if (dir.includes('e')) {
    newW += dx;
  }
  if (dir.includes('n')) {
    newY += dy;
    newH -= dy;
  }
  if (dir.includes('s')) {
    newH += dy;
  }
  
  // Ensure minimum size
  if (newW < 5) {
    newW = 5;
    if (dir.includes('w')) newX = frameX + frameW - 5;
  }
  if (newH < 5) {
    newH = 5;
    if (dir.includes('n')) newY = frameY + frameH - 5;
  }
  
  // Ensure frame stays within image bounds
  newX = Math.max(0, newX);
  newY = Math.max(0, newY);
  newW = Math.min(newW, img.naturalWidth - newX);
  newH = Math.min(newH, img.naturalHeight - newY);
  
  frame.x = newX;
  frame.y = newY;
  frame.w = newW;
  frame.h = newH;
  
  renderExtractFrames(sourceId);
}

function finishExtractFrameInteraction() {
  if (extractFrameInteraction) {
    const { sourceId } = extractFrameInteraction;
    renderExtractFrames(sourceId);
  }
  
  extractFrameInteraction = null;
  document.removeEventListener('mousemove', handleExtractFrameMove);
  document.removeEventListener('mousemove', handleExtractFrameResize);
  document.removeEventListener('mouseup', finishExtractFrameInteraction);
}

// ===== Move Target Frame =====
let extractTargetInteraction = null;

function extractTargetCoords(e) {
  const targetArea = document.getElementById('targetFrames');
  const rect = targetArea.getBoundingClientRect();
  return {
    x: e.clientX - rect.left + targetArea.scrollLeft,
    y: e.clientY - rect.top + targetArea.scrollTop
  };
}

function startExtractTargetMove(e, targetId) {
  if (e.button !== 0) return;
  e.stopPropagation();
  e.preventDefault();
  
  const target = window.extractTargets.find(t => t.id === targetId);
  if (!target) return;
  
  const coords = extractTargetCoords(e);
  extractTargetInteraction = {
    type: 'move',
    targetId,
    startX: coords.x,
    startY: coords.y,
    frameX: target.x,
    frameY: target.y
  };
}

function checkFrameCollision(target, excludeId) {
  const padding = parseInt(document.getElementById('gridPadding').value) || 2;
  
  for (const other of window.extractTargets) {
    if (other.id === excludeId) continue;
    
    if (target.x < other.x + other.w + padding &&
        target.x + target.w + padding > other.x &&
        target.y < other.y + other.h + padding &&
        target.y + target.h + padding > other.y) {
      return true;
    }
  }
  return false;
}

function clampFramePosition(target, targetArea) {
  const padding = parseInt(document.getElementById('gridPadding').value) || 2;
  
  target.x = Math.max(padding, target.x);
  target.y = Math.max(padding, target.y);
  
  if (targetArea) {
    target.x = Math.min(targetArea.scrollWidth - target.w - padding, target.x);
    target.y = Math.min(targetArea.scrollHeight - target.h - padding, target.y);
  }
  
  return target;
}

function handleExtractTargetMove(e) {
  if (!extractTargetInteraction || extractTargetInteraction.type !== 'move') return;
  
  const target = window.extractTargets.find(t => t.id === extractTargetInteraction.targetId);
  if (!target) return;
  
  const coords = extractTargetCoords(e);
  const dx = coords.x - extractTargetInteraction.startX;
  const dy = coords.y - extractTargetInteraction.startY;
  
  const newX = extractTargetInteraction.frameX + dx;
  const newY = extractTargetInteraction.frameY + dy;
  
  const tempTarget = { ...target, x: newX, y: newY };
  const targetArea = document.getElementById('targetFrames');
  
  clampFramePosition(tempTarget, targetArea);
  
  if (!checkFrameCollision(tempTarget, target.id)) {
    target.x = tempTarget.x;
    target.y = tempTarget.y;
  }
  
  renderExtractTargets();
}

function finishExtractTargetMove() {
  extractTargetInteraction = null;
}

// ===== Expand & Trim Functions for Auto-Crop
function extractExpandEdges(frame, sourceId, at, margin, maxExp) {
  const alphaData = getExtractAlpha(sourceId);
  if (!alphaData) return false;
  
  const { data: alpha, width: w, height: h } = alphaData;
  let cx = Math.max(0, Math.round(frame.x));
  let cy = Math.max(0, Math.round(frame.y));
  let cw = Math.min(Math.round(frame.w), w - cx);
  let ch = Math.min(Math.round(frame.h), h - cy);
  let expanded = false;
  
  for (let i = 0; i < maxExp; i++) {
    let need = false;
    let lc = false, rc = false, tc = false, bc = false;
    
    for (let dy = 0; dy < ch; dy++) if (alpha[(cy + dy) * w + cx] > at) { lc = true; break; }
    for (let dy = 0; dy < ch; dy++) if (alpha[(cy + dy) * w + (cx + cw - 1)] > at) { rc = true; break; }
    for (let dx = 0; dx < cw; dx++) if (alpha[cy * w + (cx + dx)] > at) { tc = true; break; }
    for (let dx = 0; dx < cw; dx++) if (alpha[(cy + ch - 1) * w + (cx + dx)] > at) { bc = true; break; }
    
    if (lc && cx > 0) { cx--; cw++; need = true; }
    if (rc && cx + cw < w) { cw++; need = true; }
    if (tc && cy > 0) { cy--; ch++; need = true; }
    if (bc && cy + ch < h) { ch++; need = true; }
    
    if (!need) break;
    expanded = true;
  }
  
  if (expanded) { frame.x = cx; frame.y = cy; frame.w = cw; frame.h = ch; }
  return expanded;
}

function extractTrimAlpha(frame, sourceId, at) {
  const alphaData = getExtractAlpha(sourceId);
  if (!alphaData) return null;
  
  const { data: alpha, width: w, height: h } = alphaData;
  const ix = Math.max(0, Math.round(frame.x));
  const iy = Math.max(0, Math.round(frame.y));
  const iw = Math.min(Math.round(frame.w), w - ix);
  const ih = Math.min(Math.round(frame.h), h - iy);
  
  if (iw <= 0 || ih <= 0) return null;
  
  let x0 = 0, x1 = iw - 1, y0 = 0, y1 = ih - 1;
  
  outer_l: for (let x = 0; x < iw; x++) { for (let y = 0; y < ih; y++) { if (alpha[(iy + y) * w + (ix + x)] > at) { x0 = x; break outer_l; } } }
  outer_r: for (let x = iw - 1; x >= 0; x--) { for (let y = 0; y < ih; y++) { if (alpha[(iy + y) * w + (ix + x)] > at) { x1 = x; break outer_r; } } }
  outer_t: for (let y = 0; y < ih; y++) { for (let x = x0; x <= x1; x++) { if (alpha[(iy + y) * w + (ix + x)] > at) { y0 = y; break outer_t; } } }
  outer_b: for (let y = ih - 1; y >= 0; y--) { for (let x = x0; x <= x1; x++) { if (alpha[(iy + y) * w + (ix + x)] > at) { y1 = y; break outer_b; } } }
  
  if (x1 < x0 || y1 < y0) return null;
  return { x: ix + x0, y: iy + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  const gridSizeInput = document.getElementById('gridSize');
  const gridPaddingInput = document.getElementById('gridPadding');
  const arrangeModeSelect = document.getElementById('arrangeMode');
  const gridColsInput = document.getElementById('gridCols');
  const gridRowsInput = document.getElementById('gridRows');
  
  // 初始化排列模式选项
  toggleArrangeModeOptions();
  
  if (gridSizeInput) {
    gridSizeInput.addEventListener('change', renderGridOverlay);
  }
  
  if (gridPaddingInput) {
    gridPaddingInput.addEventListener('change', function() {
      if (window.extractTargets.length > 0) {
        autoArrangeExtractTarget();
      }
    });
  }
  
  // 添加行列数变化监听器
  if (gridColsInput) {
    gridColsInput.addEventListener('change', function() {
      if (window.extractTargets.length > 0 && document.getElementById('arrangeMode').value === 'grid') {
        autoArrangeExtractTarget();
      }
    });
  }
  
  if (gridRowsInput) {
    gridRowsInput.addEventListener('change', function() {
      if (window.extractTargets.length > 0 && document.getElementById('arrangeMode').value === 'grid') {
        autoArrangeExtractTarget();
      }
    });
  }
  
  document.addEventListener('mousemove', function(e) {
    handleExtractTargetMove(e);
  });
  
  document.addEventListener('mouseup', function(e) {
    finishExtractTargetMove();
  });
});
