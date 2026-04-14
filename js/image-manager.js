
function saveCurrentImage() {
  if (!currentImageId || !srcImg) return;
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
  document.getElementById('lockBottomChk').checked = false;
  document.getElementById('lockTopChk').checked = false;
  document.getElementById('lockHChk').checked = false;
  document.getElementById('lockFixedChk').checked = false;
  if (lockedBottom > 0) document.getElementById('lockBottomChk').checked = true;
  if (lockedTop > 0) document.getElementById('lockTopChk').checked = true;
  if (lockedHeight > 0) { document.getElementById('lockHChk').checked = true; document.getElementById('lockHInput').value = lockedHeight; }
  onLockCheckChange();
  document.getElementById('zoomVal').textContent = zoom + 'x';
  document.getElementById('imgInfo').textContent = `${srcImg.width}×${srcImg.height}`;
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('canvasArea').style.display = '';
  renderCanvas(); renderRects(); updateAll();
  renderImageTabs();
}

function closeImage(id) {
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
    document.getElementById('emptyState').style.display = '';
    document.getElementById('canvasFrame').style.display = 'none';
    document.getElementById('canvasArea').style.display = '';
    document.getElementById('zoomBar').style.display = 'none';
    document.getElementById('coord').style.display = 'none';
    document.getElementById('hintBar').style.display = 'none';
    ['btnDetect','btnDetect2','btnOptimize','btnInterp','btnDelete','btnClearManual','btnBgMode'].forEach(id =&gt; document.getElementById(id).disabled = true);
    document.getElementById('bgRemoveSection').style.display = 'none';
    document.getElementById('imgInfo').textContent = '';
    document.getElementById('frameRects').innerHTML = '';
    document.getElementById('frameList').innerHTML = '';
    document.getElementById('listHint').textContent = '';
    document.getElementById('sTotal').textContent = '0';
    document.getElementById('sSel').textContent = '0';
    document.getElementById('sManual').textContent = '0';
    document.getElementById('detailArea').innerHTML = '&lt;div class="empty" style="padding:16px;"&gt;&lt;p style="font-size:11px;"&gt;选中帧查看详情&lt;/p&gt;&lt;/div&gt;';
    const previewArea = document.getElementById('previewArea');
    previewArea.innerHTML = '&lt;div class="empty" style="padding:16px;"&gt;&lt;p style="font-size:11px;"&gt;点击帧查看&lt;/p&gt;&lt;/div&gt;';
    renderImageTabs();
    return;
  }
  if (id === currentImageId) {
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
    document.getElementById('lockBottomChk').checked = false;
    document.getElementById('lockTopChk').checked = false;
    document.getElementById('lockHChk').checked = false;
    document.getElementById('lockFixedChk').checked = false;
    if (lockedBottom &gt; 0) document.getElementById('lockBottomChk').checked = true;
    if (lockedTop &gt; 0) document.getElementById('lockTopChk').checked = true;
    if (lockedHeight &gt; 0) { document.getElementById('lockHChk').checked = true; document.getElementById('lockHInput').value = lockedHeight; }
    onLockCheckChange();
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
  tabs.innerHTML = '';
  for (const [id, data] of Object.entries(imageStore)) {
    const tab = document.createElement('div');
    tab.className = 'img-tab' + (id === currentImageId ? ' active' : '');
    const shortName = data.name.length &gt; 12 ? data.name.slice(0, 10) + '..' : data.name;
    tab.innerHTML = `&lt;span onclick="switchImage('${id}')"&gt;${shortName}&lt;/span&gt;&lt;span class="close-tab" onclick="event.stopPropagation();closeImage('${id}')"&gt;✕&lt;/span&gt;`;
    tabs.appendChild(tab);
  }
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
