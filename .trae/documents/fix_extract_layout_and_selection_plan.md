# 修复帧提取页面布局和功能问题计划

## 问题分析

通过代码分析，发现了以下具体问题：

1. **布局问题**：当前帧提取页面是左右布局（`.extract-main` 使用 `grid-template-columns: 1fr 1fr`），需要改为上下布局

2. **手动框选问题**：
   - 代码中已经有添加鼠标事件监听器的逻辑（第123-128行）
   - 但可能存在事件绑定问题或其他阻碍因素

3. **检测帧问题**：
   - `detectExtractFrames` 函数直接覆盖了 `source.frames`，没有保留之前的手动帧
   - 没有提供取消检测操作的方法

## 修复方案

### 1. 修复布局：将左右布局改为上下布局

**修改文件**：`/workspace/sprite-forge-user/css/main.css`

**修改内容**：
- 将 `.extract-main` 的 `grid-template-columns: 1fr 1fr` 改为 `grid-template-rows: 1fr 1fr`
- 移除 `grid-template-columns` 属性
- 调整相关的响应式设计（在媒体查询中）

### 2. 修复手动框选功能

**修改文件**：`/workspace/sprite-forge-user/js/frame-extract.js`

**修改内容**：
- 检查并确保鼠标事件监听器正确绑定
- 验证 `startManualExtract` 函数的实现
- 确保 `renderExtractSources` 函数在每次渲染时重新绑定事件

### 3. 修复检测帧功能

**修改文件**：`/workspace/sprite-forge-user/js/frame-extract.js`

**修改内容**：
- 修改 `detectExtractFrames` 函数，保留手动帧
- 添加清除检测帧的功能
- 在界面上添加相应的按钮

## 具体修改步骤

### 步骤1：修改布局为上下布局

1. **修改 CSS**：
   - 将 `.extract-main` 的布局改为 `grid-template-rows: 1fr 1fr`
   - 调整响应式设计中的相关设置

### 步骤2：修复手动框选功能

1. **检查事件绑定**：
   - 确保 `renderExtractSources` 函数正确为每个图片添加鼠标事件监听器
   - 验证事件监听器是否被正确触发

2. **测试功能**：
   - 加载图片后测试鼠标框选功能
   - 确保框选操作能够正确创建新帧

### 步骤3：修复检测帧功能

1. **修改检测帧函数**：
   - 修改 `detectExtractFrames` 函数，保留手动帧
   - 实现清除检测帧的功能

2. **添加界面元素**：
   - 在界面上添加清除检测帧的按钮
   - 确保按钮功能正常

## 预期结果

修复后：
- 帧提取页面变为上下布局
- 加载图片后可以自由框选帧
- 检测帧后可以取消操作（清除检测的帧）
- 所有功能正常工作
