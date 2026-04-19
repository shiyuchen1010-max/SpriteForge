/**
 * 导航模块
 * 处理页面之间的导航和切换
 */

/**
 * 返回欢迎页面
 */
function backToWelcome() {
  // 显示welcomePage，隐藏所有其他页面
  document.getElementById('welcomePage').style.display = 'flex';
  document.getElementById('editPage').style.display = 'none';
  document.getElementById('extractPage').style.display = 'none';
}

/**
 * 开始帧提取
 */
function startFrameExtract() {
  // 隐藏welcomePage，显示extractPage
  document.getElementById('welcomePage').style.display = 'none';
  document.getElementById('editPage').style.display = 'none';
  document.getElementById('extractPage').style.display = 'flex';
  // 初始化帧提取界面
  initExtractPage();
}

/**
 * 开始精灵编辑
 */
function startSpriteEdit() {
  // 隐藏welcomePage，显示editPage
  document.getElementById('welcomePage').style.display = 'none';
  document.getElementById('editPage').style.display = 'flex';
  document.getElementById('extractPage').style.display = 'none';
}

/**
 * 初始化提取页面
 */
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

// 导出模块
export {
  backToWelcome,
  startFrameExtract,
  startSpriteEdit,
  initExtractPage
};