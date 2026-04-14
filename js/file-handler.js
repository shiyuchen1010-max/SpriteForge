
function loadImage() { document.getElementById('fileInput').click(); }

function handleFile(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev =&gt; {
    const img = new Image();
    img.onload = () =&gt; {
      addImageToStore(f.name, img);
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
      ['btnDetect','btnDetect2','btnOptimize','btnInterp','btnDelete','btnClearManual','btnBgMode'].forEach(id =&gt; document.getElementById(id).disabled = false);
      document.getElementById('bgRemoveSection').style.display = '';
      document.getElementById('imgInfo').textContent = `${img.width}×${img.height} · ${f.name}`;
      renderCanvas(); zoomFit(); updateAll();
      toast('图片已加载');
    };
    img.src = ev.target.result;
  };
  r.readAsDataURL(f);
}
