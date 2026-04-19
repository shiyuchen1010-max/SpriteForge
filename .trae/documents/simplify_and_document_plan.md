# SpriteForge 功能简化与文档化计划

## 项目研究结论

通过对SpriteForge代码库的深入研究，我发现了以下情况：

### 当前代码结构
- **主要文件**：
  - `index.html` - 主页面，包含所有功能界面
  - `js/app.js` - 主要应用逻辑（导航、精灵编辑核心）
  - `js/state.js` - 状态管理
  - `js/image-manager.js` - 多图片管理
  - `js/file-handler.js` - 文件加载处理
  - `js/frame-extract.js` - 帧提取功能
  - `js/auto-save.js` - 自动保存
  - `css/main.css` - 样式文件

### 当前功能模块
1. **欢迎页面** - 功能选择入口
2. **精灵编辑** - 核心功能，正常工作
3. **帧提取** - 存在问题，需要修复
4. **帧对齐** - 不完整功能
5. **文件管理** - 不完整功能

### 问题分析
- 帧对齐和文件管理功能不完整，只有占位符
- 帧提取页面存在手动抠帧功能问题
- 代码有多个模块，但存在功能重复
- 缺乏统一的架构文档

---

## 简化计划

### 目标
1. 移除帧对齐和文件管理功能
2. 只保留帧提取和精灵编辑
3. 为精灵编辑功能编写详细的开发文档，包含功能说明和实现方法

---

## 文件和模块修改

### 1. HTML修改 ([index.html](file:///workspace/sprite-forge-user/index.html))
- **移除内容**：
  - 欢迎页面中的"帧对齐"和"文件管理"功能卡片
  - `alignPage` 和 `fileManagerPage` 完整DOM结构
  - 帧提取页面中指向帧对齐的按钮（switchToFrameAlign）
- **保留内容**：
  - `welcomePage` - 简化为两个功能卡片
  - `editPage` - 精灵编辑页面
  - `extractPage` - 帧提取页面

### 2. JavaScript修改

#### 2.1 [app.js](file:///workspace/sprite-forge-user/js/app.js)
- 移除 `startFrameAlign()` 函数
- 移除 `openFileManager()` 函数
- 移除 `initAlignPage()` 函数
- 移除 `initFileManager()` 函数
- 移除 `switchToFrameAlign()` 函数
- 移除 `switchToFrameExtract()` 函数
- 移除 `transferFramesToAlign()` 函数
- 移除 `initAlignPageWithFrames()` 函数
- 移除 `autoAlignFrames()` 函数
- 移除 `clearAlignFrames()` 函数
- 移除 `exportAlignedFrames()` 函数
- 移除文件管理相关的所有函数
- 简化 `backToWelcome()` 函数，只保留需要的页面控制
- 移除帧提取页面中指向帧对齐的按钮

#### 2.2 [frame-extract.js](file:///workspace/sprite-forge-user/js/frame-extract.js)
- 保留并修复现有功能
- 确保手动抠帧功能正常工作
- 移除与帧对齐相关的代码

---

## 功能实现步骤

### 阶段1：简化功能（移除）
1. 修改HTML，移除帧对齐和文件管理界面
2. 修改app.js，移除相关函数
3. 更新导航函数
4. 测试基本功能是否正常

### 阶段2：精灵编辑功能文档化
将精灵编辑器的功能分为以下10个核心模块，每个模块详细说明：

#### 1. 图像加载与管理模块
- **功能**：
  - 文件加载机制（FileReader API）
  - 多图片标签页管理
  - 状态保存与切换（imageStore）
- **实现方法**：
  - 使用FileReader读取本地文件
  - 使用imageStore对象存储每个图片的完整状态
  - 使用switchImage()函数在不同图片间切换
- **关键函数**：
  - `loadImage()` - 触发文件选择
  - `handleFile()` - 处理文件加载
  - `addImageToStore()` - 添加图片到存储
  - `saveCurrentImage()` - 保存当前图片状态
  - `switchImage()` - 切换图片
  - `closeImage()` - 关闭图片
  - `renderImageTabs()` - 渲染标签页

#### 2. Canvas渲染系统
- **功能**：
  - 主画布绘制
  - 缩放控制（放大、缩小、适应）
  - 坐标系转换
  - 透明背景显示（checkerboard图案）
- **实现方法**：
  - 使用原生Canvas API
  - 通过CSS transform或width/height控制缩放
  - 鼠标坐标到图像坐标的转换
- **关键函数**：
  - `renderCanvas()` - 渲染主画布
  - `applyZoom()` - 应用缩放
  - `zoomIn()` - 放大
  - `zoomOut()` - 缩小
  - `zoomFit()` - 自适应
  - `imgCoords()` - 鼠标坐标转图像坐标

#### 3. 帧检测算法
- **功能**：
  - Alpha通道分析
  - 连通区域检测
  - 行分组与列检测
  - 自动裁剪透明边缘
  - 保留手动帧
- **实现方法**：
  - 使用getImageData获取像素数据
  - 构建二值化图像（基于Alpha阈值）
  - 行扫描找到内容行分组
  - 列扫描找到帧边界
  - 向内扫描裁剪透明边缘
- **关键函数**：
  - `detectFrames()` - 主检测函数
  - `getAlpha()` - 获取Alpha通道缓存
  - `trimAlpha()` - 裁剪透明边缘
  - `expandEdges()` - 边缘扩展

#### 4. 手动帧编辑
- **功能**：
  - 鼠标交互（框选、移动、调整大小）
  - 帧尺寸约束（锁定高度、锁定顶部/底部）
  - 吸附网格
  - 选择管理（全选、反选、取消全选）
- **实现方法**：
  - 统一的interaction状态管理
  - mousedown/mousemove/mouseup事件监听
  - 8个方向的调整手柄
  - 自动裁剪透明边缘
- **关键函数**：
  - `finishDraw()` - 完成框选
  - `startMove()` / `handleMove()` / `finishMove()` - 移动帧
  - `startResize()` / `handleResize()` / `finishResize()` - 调整大小
  - `selectFrame()` / `toggleFrame()` - 选择管理
  - `selectAll()` / `deselectAll()` / `invertSelection()` - 批量选择

#### 5. 帧尺寸约束系统
- **功能**：
  - 锁定底部（地面）
  - 锁定顶部
  - 锁定高度
  - 固定尺寸
- **实现方法**：
  - 约束条件应用在框选、移动、调整大小时
  - 第一帧自动设定锁定值
  - 参考线可视化
- **关键函数**：
  - `applySizeConstraint()` - 应用尺寸约束
  - `onLockCheckChange()` - 锁定选项变化
  - `onLockSizeInput()` - 锁定尺寸输入
  - `resetLock()` - 重置锁定

#### 6. 背景消除模块
- **功能**：
  - 边缘泛洪算法（自动）
  - 取色消除（手动）
  - 容差控制
  - 预览与应用
- **实现方法**：
  - BFS（广度优先搜索）泛洪填充
  - 颜色距离计算（欧几里得距离）
  - 保存原始数据用于重置
- **关键函数**：
  - `runBgFlood()` - 边缘泛洪
  - `runBgPickRemove()` - 取色消除
  - `bgPickColor()` - 取色
  - `colorDist()` - 颜色距离计算
  - `applyBgRemove()` - 应用
  - `resetBgRemove()` - 重置

#### 7. 帧操作功能
- **功能**：
  - 移动帧
  - 调整帧大小（8个方向手柄）
  - 删除帧
  - 复制帧
  - 智能裁剪
- **实现方法**：
  - 统一的interaction状态机
  - 右键菜单（context menu）
  - 帧数据结构操作
- **关键函数**：
  - `ctxToggle()` - 切换选中
  - `ctxDuplicate()` - 复制帧
  - `ctxOptimizeOne()` - 智能裁剪
  - `ctxDelete()` - 删除帧
  - `deleteSelected()` - 删除选中

#### 8. 帧对齐与优化（保留在精灵编辑中）
- **功能**：
  - 完整性检测
  - 统一尺寸
  - 重心对齐（核心重心、全体素重心、几何居中、手动锚点）
  - 非破坏性预览
- **实现方法**：
  - 重心计算算法
  - 统一尺寸计算
  - 预览canvas
- **关键函数**：
  - `showOptimizeModal()` - 显示优化模态框
  - `runOptimize()` - 运行优化
  - `applyAndExport()` - 应用并导出

#### 9. 导出功能
- **功能**：
  - 精灵表导出（单张、按行拆分）
  - 单帧导出
  - ZIP打包（使用JSZip）
  - 元数据导出（JSON、TexturePacker XML、CSS Spritesheet、TXT）
- **实现方法**：
  - Canvas toDataURL
  - JSZip库打包
  - 多种格式生成
- **关键函数**：
  - `showExportModal()` - 显示导出模态框
  - `doExport()` - 执行导出
  - `doExportOptimized()` - 导出优化后的
  - `doExportZip()` - 导出ZIP

#### 10. 动画预览
- **功能**：
  - 帧序列播放
  - FPS控制
  - 暂停/播放
  - 进度控制
- **实现方法**：
  - setInterval定时器
  - 独立的预览canvas
  - FPS滑块控制
- **关键函数**：
  - `toggleAnim()` - 切换播放
  - `updateFps()` - 更新FPS
  - `updatePreview()` - 更新预览

---

## 文档输出内容

### 精灵编辑开发文档结构
```
docs/
├── sprite-editor-development.md  # 主文档
├── modules/
│   ├── 01-image-management.md    # 图像加载与管理
│   ├── 02-canvas-rendering.md    # Canvas渲染
│   ├── 03-frame-detection.md     # 帧检测算法
│   ├── 04-manual-editing.md      # 手动帧编辑
│   ├── 05-size-constraint.md     # 帧尺寸约束
│   ├── 06-background-removal.md  # 背景消除
│   ├── 07-frame-operations.md    # 帧操作
│   ├── 08-frame-alignment.md     # 帧对齐
│   ├── 09-export.md              # 导出功能
│   └── 10-animation-preview.md   # 动画预览
└── api-reference.md               # API参考
```

每个模块文档包含：
1. 功能概述
2. 数据结构
3. 核心函数详解
4. 实现原理
5. 使用示例
6. 注意事项

---

## 依赖和考虑

### 现有依赖
- JSZip - ZIP打包
- 原生Canvas API
- 原生File API
- 原生DOM API

### 架构考虑
- 保持轻量级，无额外框架依赖
- 支持渐进式增强
- 良好的错误处理
- 性能优化（大图处理）

---

## 风险处理

### 风险1：移除功能影响现有用户
- **缓解**：通过Git版本控制保留历史
- **确保**：只移除未完成的功能

### 风险2：重构引入新bug
- **缓解**：分阶段重构，每个阶段充分测试
- **确保**：核心功能在每个阶段都保持可用

### 风险3：文档与代码不一致
- **缓解**：文档与代码同步更新
- **确保**：每个功能修改都更新对应文档

---

## 预期结果

1. ✅ 简化的功能界面（只有2个核心功能）
2. ✅ 完整的精灵编辑功能文档（10个模块）
3. ✅ 清晰的代码结构和注释
4. ✅ 帧提取功能修复并正常工作

---

## 执行顺序

1. **阶段1**：简化功能（移除帧对齐和文件管理）
2. **阶段2**：编写精灵编辑功能详细文档
3. **阶段3**：修复和完善帧提取功能

