# 模块1：图像加载与管理

## 功能概述

图像加载与管理模块负责处理精灵表图片的加载、多图片标签页管理以及状态保存与切换。这是整个编辑器的基础模块，所有其他功能都依赖于正确加载的图片。

## 核心功能

### 1. 文件加载机制

#### 功能说明
支持通过以下方式加载图片：
- 点击"加载图片"按钮打开文件选择对话框
- 拖拽图片到画布区域（后续可扩展）
- 支持多种图片格式：PNG、JPG、GIF等

#### 实现方法

使用HTML5 File API配合FileReader进行文件读取：

```javascript
function loadImage() {
  document.getElementById('fileInput').click();
}

function handleFile(e) {
  const f = e.target.files[0];
  if (!f) return;
  
  const r = new FileReader();
  r.onload = ev => {
    const img = new Image();
    img.onload = () => {
      // 图片加载完成后的处理
      addImageToStore(f.name, img);
      // ... 初始化状态
    };
    img.src = ev.target.result;
  };
  r.readAsDataURL(f);
}
```

#### 关键流程
1. 用户点击按钮触发文件选择
2. FileReader读取文件为DataURL
3. 创建Image对象并等待加载完成
4. 将图片添加到存储中
5. 初始化相关状态并渲染

### 2. 多图片标签页管理

#### 功能说明
支持同时打开多个精灵表，每个图片独立管理自己的：
- 帧数据
- 选中状态
- 缩放级别
- 尺寸约束设置

#### 实现方法

使用一个集中的`imageStore`对象来管理所有打开的图片：

```javascript
let imageStore = {}; 
let currentImageId = null;
let imageIdCounter = 0;

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
```

#### 数据结构
每个图片存储对象包含：
- `name`: 文件名
- `img`: Image对象
- `frames`: 帧列表
- `selId`: 当前选中帧ID
- `nextId`: 下一个帧ID
- `zoom`: 缩放级别
- `lockedHeight`: 锁定高度
- `lockedBottom`: 锁定底部Y坐标
- `lockedTop`: 锁定顶部Y坐标

### 3. 状态保存与切换

#### 功能说明
在切换图片时自动保存当前图片的完整状态，切换回来时恢复：
- 帧数据
- 选中状态
- 缩放级别
- 尺寸约束设置

#### 实现方法

```javascript
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
  
  // 恢复UI状态
  // ...
  
  renderCanvas();
  renderRects();
  updateAll();
  renderImageTabs();
}
```

## 关键函数详解

### `loadImage()`
触发文件选择对话框。

**使用场景**：用户点击"加载图片"按钮时调用。

**注意事项**：
- 不直接处理文件，只是触发input的click事件
- 文件处理在`handleFile()`中完成

### `handleFile(event)`
处理文件加载的核心函数。

**参数**：
- `event` - 文件输入事件，包含选择的文件

**流程**：
1. 检查是否有文件被选择
2. 创建FileReader实例
3. 读取文件为DataURL
4. 创建Image对象
5. 等待Image加载完成
6. 调用`addImageToStore()`添加到存储
7. 初始化全局状态
8. 渲染画布和UI

**错误处理**：
- 如果文件为空，直接返回
- 使用img.onload确保图片完全加载后再处理

### `addImageToStore(name, img)`
将新图片添加到存储中。

**参数**：
- `name` - 文件名，用于标签页显示
- `img` - 已加载的Image对象

**流程**：
1. 先保存当前图片状态（如果有）
2. 生成唯一的图片ID
3. 初始化该图片的状态对象
4. 设置为当前图片
5. 渲染标签页

**注意事项**：
- 每个新图片都有独立的状态
- frames初始化为空数组
- zoom初始化为1

### `saveCurrentImage()`
保存当前图片的完整状态。

**使用场景**：
- 切换图片前
- 添加新图片前
- 关闭图片前

**保存内容**：
- 完整的frames数组（深拷贝）
- 当前选中的帧ID
- 下一个帧ID
- 缩放级别
- 所有尺寸约束设置

**注意事项**：
- 使用`JSON.parse(JSON.stringify())`进行深拷贝
- 确保不修改原始数据
- 检查图片是否存在于存储中

### `switchImage(id)`
切换到指定的图片。

**参数**：
- `id` - 要切换到的图片ID

**流程**：
1. 检查是否已是当前图片
2. 保存当前图片状态
3. 从存储中获取目标图片数据
4. 恢复所有全局状态变量
5. 恢复UI元素的状态（复选框、输入框等）
6. 重新渲染画布和帧矩形
7. 更新所有UI组件
8. 重新渲染标签页

**注意事项**：
- 必须先保存当前状态
- 状态恢复要完整，包括UI状态
- 深拷贝frames数组避免引用问题

### `closeImage(id)`
关闭指定的图片。

**参数**：
- `id` - 要关闭的图片ID

**流程**：
1. 如果关闭的不是当前图片，先保存当前图片
2. 从存储中删除该图片
3. 如果关闭的是当前图片：
   - 如果还有其他图片，切换到最后一张
   - 如果没有其他图片，重置所有状态
4. 重新渲染标签页

**注意事项**：
- 关闭当前图片时要正确处理切换
- 重置状态要完整，包括UI

### `renderImageTabs()`
渲染图片标签页。

**流程**：
1. 清空标签页容器
2. 遍历存储中的所有图片
3. 为每个图片创建标签元素
4. 添加点击切换和关闭功能
5. 标记当前图片为active状态

**UI细节**：
- 显示文件名（过长时截断）
- 当前标签有active样式
- 每个标签有关闭按钮

## 数据结构

### 图片存储对象 (ImageStoreEntry)

```javascript
{
  name: string,              // 文件名
  img: HTMLImageElement,     // 图片对象
  frames: Frame[],           // 帧列表
  selId: number|null,        // 当前选中帧ID
  nextId: number,            // 下一个帧ID
  zoom: number,              // 缩放级别
  lockedHeight: number,      // 锁定高度（0表示未锁定）
  lockedBottom: number,      // 锁定底部Y坐标（0表示未锁定）
  lockedTop: number          // 锁定顶部Y坐标（0表示未锁定）
}
```

## 使用示例

### 示例1：加载单张图片

```javascript
// 用户点击加载按钮
loadImage();

// 用户选择文件后，handleFile自动执行
// 图片加载完成后会自动：
// - 添加到imageStore
// - 设置为当前图片
// - 渲染到画布
```

### 示例2：切换图片

```javascript
// 假设有两张图片，ID分别为 'img_1' 和 'img_2'

// 切换到第二张图片
switchImage('img_2');

// 此时：
// - 第一张图片的状态已保存
// - 第二张图片的状态已恢复
// - 画布显示第二张图片
// - 标签页显示第二张为active
```

### 示例3：关闭当前图片

```javascript
// 关闭当前图片
closeImage(currentImageId);

// 如果还有其他图片：
// - 自动切换到最后一张
// 如果没有其他图片：
// - 重置所有状态
// - 显示空状态
```

## 注意事项

1. **深拷贝的重要性**
   - frames数组必须使用深拷贝
   - 避免多个图片共享同一个帧数组引用
   - 使用`JSON.parse(JSON.stringify())`是简单有效的方法

2. **状态完整性**
   - 保存和恢复时要包含所有状态
   - 不要遗漏UI相关的状态（如复选框状态）
   - 测试各种切换场景确保状态正确

3. **图片加载异步性**
   - Image.onload是异步的
   - 必须等待加载完成后再进行后续操作
   - 避免在图片未加载时访问其width/height

4. **内存管理**
   - 关闭图片时要从存储中删除
   - 避免内存泄漏
   - 大量图片时考虑限制同时打开的数量

5. **文件名处理**
   - 显示文件名时注意长度限制
   - 过长的文件名应该截断并加省略号
   - 保持原始文件名用于存储

## 复用指南

此模块的方法可以在以下场景中复用：

1. **任何需要多文件管理的应用**
   - `imageStore`模式可以通用
   - 状态保存和切换逻辑可直接复用

2. **文件上传功能**
   - FileReader + Image的组合可复用
   - 异步加载处理模式通用

3. **标签页UI组件**
   - `renderImageTabs()`的渲染逻辑可复用
   - 切换和关闭的交互模式通用

4. **状态管理模式**
   - 集中式存储 + 切换时保存/恢复
   - 适用于任何需要多上下文切换的场景

