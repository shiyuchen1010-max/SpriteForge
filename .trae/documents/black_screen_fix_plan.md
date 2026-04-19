# 首页功能点黑屏问题修复计划

## 问题分析

### 症状
- 首页四个功能点（帧提取、帧对齐、精灵编辑、文件管理）点击后都是黑屏
- 无法正常显示目标页面内容

### 根本原因
**CSS过渡效果选择器与JavaScript display设置不匹配**：

1. **CSS实现**：页面过渡效果使用选择器 `[style*="display: block"]` 来触发过渡动画
   - 当元素的style属性中包含"display: block"时，才会应用 `opacity: 1` 和 `transform: translateY(0)`

2. **JavaScript实现**：页面切换函数使用 `style.display = ''` 来显示页面
   - 当使用 `style.display = ''` 时，元素会恢复到默认display值（通常是'block'）
   - 但style属性中实际上没有包含"display: block"字符串，因此CSS选择器不会匹配

3. **结果**：页面切换时，目标页面的opacity仍然为0，transform仍然为translateY(20px)，导致看起来是黑屏

## 修复方案

### 方案1：修改JavaScript代码（推荐）
- 将所有页面切换函数中的 `style.display = ''` 改为 `style.display = 'block'`
- 这样可以确保CSS选择器能够正确匹配，触发过渡动画

### 方案2：修改CSS代码
- 调整CSS选择器逻辑，使其能够匹配 `style.display = ''` 的情况
- 但这种方法会使CSS选择器变得复杂，且不如方案1直观

## 实施步骤

### 步骤1：修改JavaScript导航函数
- 修改 `startFrameExtract()` 函数
- 修改 `startFrameAlign()` 函数
- 修改 `startSpriteEdit()` 函数
- 修改 `openFileManager()` 函数
- 修改 `switchToFrameAlign()` 函数
- 修改 `switchToFrameExtract()` 函数

### 步骤2：测试验证
- 启动本地服务器
- 测试四个功能点的点击效果
- 确保页面能够正常显示，不再出现黑屏
- 测试页面切换的过渡动画效果

### 步骤3：回归测试
- 测试返回首页功能
- 测试页面间的切换功能
- 确保所有功能正常工作

## 风险评估

### 潜在风险
- 修改JavaScript代码可能影响其他功能
- 页面过渡效果可能需要调整

### 风险缓解
- 仅修改display属性的设置，不涉及其他逻辑
- 保持CSS过渡效果的其他部分不变
- 进行充分的测试验证

## 预期效果

- 首页四个功能点点击后能够正常显示目标页面
- 页面切换时保持平滑的过渡动画效果
- 所有功能正常工作，无回归问题