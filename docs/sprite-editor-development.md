# SpriteForge 精灵编辑器开发文档

## 目录

1. [架构概述](#架构概述)
2. [模块说明](#模块说明)
3. [数据结构](#数据结构)
4. [API参考](#api参考)

---

## 架构概述

SpriteForge精灵编辑器采用模块化设计，核心功能由10个主要模块组成。整个应用使用原生JavaScript和Canvas API实现，无需任何外部框架依赖，保持轻量级和高性能。

### 技术栈
- **前端框架**：原生JavaScript
- **图形处理**：HTML5 Canvas API
- **文件处理**：File API + JSZip
- **样式**：CSS3 + CSS变量

### 核心设计原则
1. **单一职责**：每个模块负责一个特定功能领域
2. **状态集中管理**：核心状态统一管理，避免分散
3. **无外部依赖**：使用原生API，保持轻量
4. **性能优先**：针对大图处理进行优化

---

## 模块说明

精灵编辑器由以下10个核心模块组成：

| 模块 | 功能 | 文件位置 |
|------|------|----------|
| 1. 图像加载与管理 | 文件加载、多图片标签页、状态切换 | `js/app.js` |
| 2. Canvas渲染系统 | 画布绘制、缩放控制、坐标转换 | `js/app.js` |
| 3. 帧检测算法 | Alpha通道分析、连通区域检测、自动裁剪 | `js/app.js` |
| 4. 手动帧编辑 | 鼠标交互、框选、移动、调整大小 | `js/app.js` |
| 5. 帧尺寸约束系统 | 锁定高度、锁定顶部/底部、固定尺寸 | `js/app.js` |
| 6. 背景消除模块 | 边缘泛洪、取色消除、容差控制 | `js/app.js` |
| 7. 帧操作功能 | 删除、复制、智能裁剪 | `js/app.js` |
| 8. 帧对齐与优化 | 完整性检测、统一尺寸、重心对齐 | `js/app.js` |
| 9. 导出功能 | 精灵表导出、单帧导出、ZIP打包 | `js/app.js` |
| 10. 动画预览 | 帧序列播放、FPS控制 | `js/app.js` |

---

## 数据结构

### 帧数据结构 (Frame)

```javascript
{
  id: number,           // 唯一标识符
  row: number,          // 行号（自动检测时）
  col: number,          // 列号（自动检测时）
  x: number,            // 左上角X坐标
  y: number,            // 左上角Y坐标
  w: number,            // 宽度
  h: number,            // 高度
  selected: boolean,    // 是否选中
  manual: boolean,      // 是否手动添加
  unifiedW?: number,    // 统一宽度（优化后）
  unifiedH?: number,    // 统一高度（优化后）
  offsetX?: number,     // X偏移（优化后）
  offsetY?: number      // Y偏移（优化后）
}
```

### 图片存储结构 (ImageStore)

```javascript
{
  [imageId]: {
    name: string,        // 文件名
    img: Image,          // 图片对象
    frames: Frame[],     // 帧列表
    selId: number|null,  // 当前选中帧ID
    nextId: number,      // 下一个帧ID
    zoom: number,        // 缩放级别
    lockedHeight: number, // 锁定高度
    lockedBottom: number, // 锁定底部Y坐标
    lockedTop: number     // 锁定顶部Y坐标
  }
}
```

### 交互状态 (Interaction)

```javascript
{
  type: 'draw'|'move'|'resize', // 交互类型
  id?: number,                    // 帧ID（move/resize时）
  dir?: string,                   // 调整方向（resize时：nw/n/ne/w/e/sw/s/se）
  ox: number,                     // 起始X坐标
  oy: number,                     // 起始Y坐标
  fx: number,                     // 帧起始X
  fy: number,                     // 帧起始Y
  fw?: number,                    // 帧起始宽度
  fh?: number                     // 帧起始高度
}
```

---

## API参考

### 导航函数

#### `backToWelcome()`
返回欢迎页面，隐藏所有功能页面。

#### `startFrameExtract()`
启动帧提取功能。

#### `startSpriteEdit()`
启动精灵编辑功能。

### 图像加载与管理

#### `loadImage()`
触发文件选择对话框。

#### `handleFile(event)`
处理文件加载，读取并显示图片。

**参数**:
- `event` - 文件输入事件

#### `addImageToStore(name, img)`
添加图片到存储。

**参数**:
- `name` - 文件名
- `img` - Image对象

#### `saveCurrentImage()`
保存当前图片的状态。

#### `switchImage(id)`
切换到指定图片。

**参数**:
- `id` - 图片ID

#### `closeImage(id)`
关闭指定图片。

**参数**:
- `id` - 图片ID

#### `renderImageTabs()`
渲染图片标签页。

### Canvas渲染

#### `renderCanvas()`
渲染主画布。

#### `applyZoom()`
应用当前缩放级别。

#### `zoomIn()`
放大画布（1.25倍）。

#### `zoomOut()`
缩小画布（0.8倍）。

#### `zoomFit()`
自适应画布大小。

#### `imgCoords(event)`
将鼠标坐标转换为图像坐标。

**参数**:
- `event` - 鼠标事件

**返回**:
```javascript
{ x: number, y: number }
```

### 帧检测

#### `detectFrames()`
自动检测精灵表中的帧。

**配置参数**:
- `minH` - 最小高度
- `maxH` - 最大高度
- `minW` - 最小宽度
- `maxW` - 最大宽度
- `alphaTh` - Alpha阈值
- `framePad` - 帧间距

#### `getAlpha()`
获取Alpha通道缓存。

**返回**:
- `Uint8Array` - Alpha通道数据

#### `trimAlpha(frame, alphaThreshold)`
裁剪帧的透明边缘。

**参数**:
- `frame` - 帧对象
- `alphaThreshold` - Alpha阈值

**返回**:
- `{x, y, w, h}` - 裁剪后的边界

#### `expandEdges(frame, alphaThreshold, margin, maxExp)`
扩展帧边界以避免内容被裁剪。

**参数**:
- `frame` - 帧对象
- `alphaThreshold` - Alpha阈值
- `margin` - 边距
- `maxExp` - 最大扩展

**返回**:
- `boolean` - 是否进行了扩展

### 手动帧编辑

#### `finishDraw()`
完成框选，创建新帧。

#### `startMove(event, frameId)`
开始移动帧。

**参数**:
- `event` - 鼠标事件
- `frameId` - 帧ID

#### `handleMove(event)`
处理移动中的帧。

**参数**:
- `event` - 鼠标事件

#### `finishMove()`
完成帧移动。

#### `startResize(event, frameId, direction)`
开始调整帧大小。

**参数**:
- `event` - 鼠标事件
- `frameId` - 帧ID
- `direction` - 调整方向（nw/n/ne/w/e/sw/s/se）

#### `handleResize(event)`
处理调整大小中的帧。

**参数**:
- `event` - 鼠标事件

#### `finishResize()`
完成帧大小调整。

#### `selectFrame(frameId)`
选中指定帧。

**参数**:
- `frameId` - 帧ID

#### `toggleFrame(frameId)`
切换帧的选中状态。

**参数**:
- `frameId` - 帧ID

#### `selectAll()`
选中所有帧。

#### `deselectAll()`
取消选中所有帧。

#### `invertSelection()`
反选帧。

### 帧尺寸约束

#### `applySizeConstraint(x, y, w, h)`
应用尺寸约束。

**参数**:
- `x, y, w, h` - 原始坐标和尺寸

**返回**:
- `{x, y, w, h}` - 约束后的坐标和尺寸

#### `onLockCheckChange()`
锁定选项变化时调用。

#### `onLockSizeInput()`
锁定尺寸输入时调用。

#### `resetLock()`
重置所有锁定。

### 背景消除

#### `runBgFlood()`
运行边缘泛洪算法消除背景。

#### `runBgPickRemove()`
运行取色消除。

#### `bgPickColor(event)`
从画布取色。

**参数**:
- `event` - 鼠标事件

#### `colorDist(r1, g1, b1, r2, g2, b2)`
计算两个颜色的欧几里得距离。

**参数**:
- `r1, g1, b1` - 颜色1
- `r2, g2, b2` - 颜色2

**返回**:
- `number` - 颜色距离

#### `applyBgRemove()`
应用背景消除。

#### `resetBgRemove()`
重置为原始图片。

### 帧操作

#### `deleteSelected()`
删除选中的帧。

#### `ctxToggle()`
右键菜单：切换选中。

#### `ctxDuplicate()`
右键菜单：复制帧。

#### `ctxOptimizeOne()`
右键菜单：智能裁剪。

#### `ctxDelete()`
右键菜单：删除帧。

### 帧对齐与优化

#### `showOptimizeModal()`
显示优化模态框。

#### `runOptimize()`
运行帧对齐优化。

#### `applyAndExport()`
应用优化并导出。

### 导出功能

#### `showExportModal(mode)`
显示导出模态框。

**参数**:
- `mode` - 导出模式（'sheets'|'frames'|'zip'|'json'）

#### `doExport()`
执行导出。

#### `doExportOptimized()`
导出优化后的精灵表。

#### `doExportZip()`
导出ZIP包。

### 动画预览

#### `toggleAnim()`
切换动画播放/暂停。

#### `updateFps()`
更新FPS设置。

#### `updatePreview()`
更新帧预览。

---

## 注意事项

1. **性能优化**：处理大图时，Alpha通道会被缓存以避免重复计算
2. **状态管理**：多图片状态保存在`imageStore`中，切换图片时自动保存和恢复
3. **交互状态**：所有鼠标交互通过统一的`interaction`状态机管理
4. **坐标系**：鼠标坐标需要通过`imgCoords()`转换为图像坐标
5. **缩放处理**：所有绘制和交互都需要考虑当前的`zoom`值

