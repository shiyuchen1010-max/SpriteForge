/**
 * 工具模块
 * 提供通用的工具函数
 */

/**
 * 显示提示信息
 * @param {string} msg - 提示信息内容
 * @param {number} dur - 显示持续时间（毫秒）
 */
function toast(msg, dur = 2000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show';
  setTimeout(() => t.className = 'toast', dur);
}

/**
 * 计算颜色距离
 * @param {number} r1 - 第一个颜色的红色通道值
 * @param {number} g1 - 第一个颜色的绿色通道值
 * @param {number} b1 - 第一个颜色的蓝色通道值
 * @param {number} r2 - 第二个颜色的红色通道值
 * @param {number} g2 - 第二个颜色的绿色通道值
 * @param {number} b2 - 第二个颜色的蓝色通道值
 * @returns {number} 颜色距离
 */
function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * 下载画布内容
 * @param {HTMLCanvasElement} canvas - 要下载的画布元素
 * @param {string} filename - 下载的文件名
 */
function dlCanvas(canvas, filename) {
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * 图像坐标转换
 * @param {MouseEvent} e - 鼠标事件对象
 * @returns {Object} 转换后的图像坐标 {x, y}
 */
function imgCoords(e) {
  const r = document.getElementById('canvasFrame').getBoundingClientRect();
  return { x: Math.round((e.clientX - r.left) / window.zoom), y: Math.round((e.clientY - r.top) / window.zoom) };
}

/**
 * 网格对齐
 * @param {number} v - 要对齐的值
 * @returns {number} 对齐后的值
 */
function snap(v) {
  if (!document.getElementById('snapGrid').checked) return v;
  const s = parseInt(document.getElementById('snapSize').value) || 1;
  return Math.round(v / s) * s;
}

/**
 * 加载图像
 */
function loadImage() {
  document.getElementById('fileInput').click();
}

// 导出模块
export {
  toast,
  colorDist,
  dlCanvas,
  imgCoords,
  snap,
  loadImage
};