// ===== Frame Extract Functionality =====
let extractSources = []; // { id, name, img, frames, selectedFrames: [] }
let extractTargets = []; // { id, sourceId, frameIndex, x, y, w, h, imgData }
let extractIdCounter = 0;

function showExtractModal() {
  document.getElementById('extractModal').classList.add('show');
  renderExtractSources();
  renderExtractTargets();
  renderGridOverlay();
}

function loadExtractSource() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = function(e) {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
          const id = 'extract_source_' + (++extractIdCounter);
          extractSources.push({
            id,
            name: file.name,
            img: img,
            frames: [],
            selectedFrames: []
          });
          renderExtractSources();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function clearExtractSources() {
  extractSources = [];
  renderExtractSources();
}

function clearExtractTarget() {
  extractTargets = [];
  renderExtractTargets();
}

function renderExtractSources() {
  const container = document.getElementById('extractSourceArea');
  if (extractSources.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);font-size:14px;">加载图片到待提取区域</div>';
    return;
  }
  
  container.innerHTML = '';
  extractSources.forEach(source => {
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
      <div style="position:relative;display:inline-block;margin:0 auto;">
        <img src="${source.img.src}" style="max-width:100%;max-height:150px;image-rendering:pixelated;cursor:crosshair;">
        <div class="extract-frames" style="position:absolute;top:0;left:0;right:0;bottom:0;"></div>
      </div>
      <div style="display:flex;justify-content:center;gap:4px;">
        <button class="btn btn-sm" onclick="detectExtractFrames('${source.id}')" style="padding:4px 8px;font-size:11px;">🔍 检测帧</button>
        <button class="btn btn-sm" onclick="selectAllExtractFrames('${source.id}')" style="padding:4px 8px;font-size:11px;">全选</button>
        <button class="btn btn-sm" onclick="addSelectedToTarget('${source.id}')" style="padding:4px 8px;font-size:11px;">添加到目标</button>
      </div>
    `;
    
    container.appendChild(sourceElement);
  });
}

function removeExtractSource(id) {
  extractSources = extractSources.filter(source => source.id !== id);
  renderExtractSources();
}

function detectExtractFrames(sourceId) {
  const source = extractSources.find(s => s.id === sourceId);
  if (!source) return;
  
  const img = source.img;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
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
          
          frames.push({ x: frameX, y: frameY, w: frameW, h: frameH, selected: false });
        }
      }
    }
  }
  
  source.frames = frames;
  renderExtractSources();
  toast(`检测到 ${frames.length} 个帧`);
}

function selectAllExtractFrames(sourceId) {
  const source = extractSources.find(s => s.id === sourceId);
  if (!source) return;
  source.frames.forEach(frame => frame.selected = true);
  renderExtractSources();
}

function addSelectedToTarget(sourceId) {
  const source = extractSources.find(s => s.id === sourceId);
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
    ctx.drawImage(source.img, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
    
    extractTargets.push({
      id: 'extract_target_' + (++extractIdCounter),
      sourceId: source.id,
      frameIndex: index,
      x: 0,
      y: 0,
      w: frame.w,
      h: frame.h,
      imgData: canvas.toDataURL()
    });
  });
  
  autoArrangeExtractTarget();
  toast(`已添加 ${selectedFrames.length} 个帧到目标区域`);
}

function renderExtractTargets() {
  const container = document.getElementById('targetFrames');
  container.innerHTML = '';
  
  extractTargets.forEach(target => {
    const targetElement = document.createElement('div');
    targetElement.className = 'extract-target-frame';
    targetElement.draggable = true;
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
    `;
    
    targetElement.innerHTML = `
      <img src="${target.imgData}" style="width:100%;height:100%;image-rendering:pixelated;">
      <button class="btn btn-sm btn-danger" onclick="removeExtractTarget('${target.id}')" style="position:absolute;top:2px;right:2px;padding:2px 4px;font-size:8px;">✕</button>
    `;
    
    targetElement.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', target.id);
    });
    
    container.appendChild(targetElement);
  });
}

function removeExtractTarget(id) {
  extractTargets = extractTargets.filter(target => target.id !== id);
  renderExtractTargets();
}

function autoArrangeExtractTarget() {
  const gridSize = parseInt(document.getElementById('gridSize').value) || 32;
  const padding = parseInt(document.getElementById('gridPadding').value) || 2;
  
  let x = padding;
  let y = padding;
  let maxRowHeight = 0;
  
  extractTargets.forEach((target, index) => {
    const gridWidth = Math.ceil(target.w / gridSize);
    const gridHeight = Math.ceil(target.h / gridSize);
    
    if (x + (gridWidth * gridSize) + padding > 800) { // 800px max width
      x = padding;
      y += maxRowHeight + padding;
      maxRowHeight = 0;
    }
    
    target.x = x;
    target.y = y;
    maxRowHeight = Math.max(maxRowHeight, gridHeight * gridSize);
    
    x += (gridWidth * gridSize) + padding;
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

function createExtractSpriteSheet() {
  if (extractTargets.length === 0) {
    toast('请先添加帧到目标区域');
    return;
  }
  
  const padding = parseInt(document.getElementById('gridPadding').value) || 2;
  
  // Calculate required size
  let maxX = 0;
  let maxY = 0;
  extractTargets.forEach(target => {
    maxX = Math.max(maxX, target.x + target.w + padding);
    maxY = Math.max(maxY, target.y + target.h + padding);
  });
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = maxX;
  canvas.height = maxY;
  const ctx = canvas.getContext('2d');
  
  // Fill with transparent
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw frames
  extractTargets.forEach(target => {
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, target.x, target.y);
      
      // Check if all images are loaded
      const loadedCount = extractTargets.filter(t => t.loaded).length;
      if (loadedCount === extractTargets.length - 1) {
        // All images loaded, export
        exportCanvasAsImage(canvas, 'sprite_sheet');
      }
    };
    img.src = target.imgData;
    target.loaded = true;
  });
}

function exportCanvasAsImage(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('精灵表已导出');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  const gridSizeInput = document.getElementById('gridSize');
  const gridPaddingInput = document.getElementById('gridPadding');
  const targetArea = document.getElementById('targetFrames');
  
  if (gridSizeInput) {
    gridSizeInput.addEventListener('change', renderGridOverlay);
  }
  
  if (targetArea) {
    targetArea.addEventListener('dragover', function(e) {
      e.preventDefault();
    });
    
    targetArea.addEventListener('drop', function(e) {
      e.preventDefault();
      const targetId = e.dataTransfer.getData('text/plain');
      const target = extractTargets.find(t => t.id === targetId);
      if (target) {
        const rect = targetArea.getBoundingClientRect();
        target.x = e.clientX - rect.left;
        target.y = e.clientY - rect.top;
        renderExtractTargets();
      }
    });
  }
});
