// 简化的测试脚本 - 自动运行并输出详细结果
console.log('=== SpriteForge 功能测试开始 ===');

// 检查页面元素
console.log('1. 检查页面元素');
const pages = [
  { id: 'welcomePage', name: '欢迎页面' },
  { id: 'editPage', name: '精灵编辑' },
  { id: 'extractPage', name: '帧提取' }
];

pages.forEach(page => {
  const element = document.getElementById(page.id);
  console.log(`   ${page.name} 存在: ${!!element}`);
  if (element) {
    console.log(`   ${page.name} 显示状态: ${element.style.display}`);
  }
});

// 检查功能函数
console.log('2. 检查功能函数');
const functions = [
  { name: 'backToWelcome', desc: '返回欢迎页' },
  { name: 'startFrameExtract', desc: '帧提取' },
  { name: 'startSpriteEdit', desc: '精灵编辑' }
];

functions.forEach(func => {
  console.log(`   ${func.desc} 函数存在: ${typeof window[func.name] === 'function'}`);
});

// 测试页面切换
console.log('3. 测试页面切换');
function testPageSwitch(funcName, desc) {
  console.log(`\n   测试 ${desc} 页面切换`);
  try {
    if (typeof window[funcName] === 'function') {
      // 先重置到欢迎页
      if (typeof window.backToWelcome === 'function') {
        window.backToWelcome();
        console.log('     重置到欢迎页成功');
      }
      
      // 执行页面切换
      window[funcName]();
      console.log(`     切换到 ${desc} 页面成功`);
      
      // 检查目标页面状态
      let targetId;
      switch (desc) {
        case '帧提取': targetId = 'extractPage'; break;
        case '精灵编辑': targetId = 'editPage'; break;
      }
      
      const targetPage = document.getElementById(targetId);
      if (targetPage) {
        const computedStyle = window.getComputedStyle(targetPage);
        console.log(`     ${desc} 页面显示状态 (style.display): ${targetPage.style.display}`);
        console.log(`     ${desc} 页面显示状态 (computed): ${computedStyle.display}`);
        
        const isVisible = computedStyle.display !== 'none' && targetPage.offsetWidth > 0 && targetPage.offsetHeight > 0;
        if (isVisible) {
          console.log(`     ${desc} 页面显示正确`);
        } else {
          console.error(`     ${desc} 页面显示错误`);
        }
      }
      
      // 返回到欢迎页
      if (typeof window.backToWelcome === 'function') {
        window.backToWelcome();
        console.log('     返回到欢迎页成功');
      }
    } else {
      console.error(`     ${desc} 函数不存在`);
    }
  } catch (error) {
    console.error(`     测试 ${desc} 时出错: ${error.message}`);
  }
}

// 执行测试
testPageSwitch('startFrameExtract', '帧提取');
testPageSwitch('startSpriteEdit', '精灵编辑');

console.log('=== SpriteForge 功能测试完成 ===');

// 手动测试函数（可在控制台调用）
window.testAllFunctions = function() {
  console.log('=== 手动测试所有功能 ===');
  testPageSwitch('startFrameExtract', '帧提取');
  testPageSwitch('startSpriteEdit', '精灵编辑');
  console.log('=== 手动测试完成 ===');
};
