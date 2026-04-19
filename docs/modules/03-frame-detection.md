# 模块3：帧检测算法

## 功能概述

帧检测算法模块负责自动从精灵表中检测和识别各个独立的帧。通过分析Alpha通道、检测连通区域、进行行分组和列检测，实现精灵帧的自动识别和裁剪。

## 核心功能

### 1. Alpha通道分析

#### 功能说明
提取图片的Alpha通道信息，构建二值化图像，为后续的连通区域检测做准备。

#### 实现方法

```javascript
let _aData = null, _aW = 0, _aH = 0;

function getAlpha() {
  if (_aData && _aW === srcImg.width && _aH === srcImg.height) return _aData;
  
  const c = document.createElement('canvas');
  c.width = srcImg.width;
  c.height = srcImg.height;
  const x = c.getContext('2d');
  x.drawImage(srcImg, 0, 0);
  
  const d = x.getImageData(0, 0, c.width, c.height).data;
  _aData = new Uint8Array(c.width * c.height);
  
  for (let i = 0; i < _aData.length; i++) {
    _aData[i] = d[i * 4 + 3];
  }
  
  _aW = c.width;
  _aH = c.height;
  return _aData;
}

function invalidateAlpha() {
  _aData = null;
}
```

#### 关键流程
1. 检查缓存是否有效（尺寸匹配）
2. 创建临时画布绘制图片
3. 获取像素数据
4. 提取Alpha通道到Uint8Array
5. 缓存结果供后续使用

#### 优化说明
- 使用缓存避免重复计算
- Uint8Array节省内存（每个像素1字节）
- 图片修改后调用`invalidateAlpha()`清除缓存

### 2. 二值化图像构建

#### 功能说明
基于Alpha阈值将图像转换为二值化图像（0或1），简化后续处理。

#### 实现方法

```javascript
const alpha = getAlpha();
const w = _aW, h = _aH;
const at = parseInt(document.getElementById('alphaTh').value) || 10;

// 构建二值化图
const bin = new Uint8Array(w * h);
for (let i = 0; i < bin.length; i++) {
  bin[i] = alpha[i] > at ? 1 : 0;
}
```

#### 参数说明
- `alphaTh` - Alpha阈值，默认10
- 像素Alpha值 > 阈值 → 1（有内容）
- 像素Alpha值 ≤ 阈值 → 0（透明/背景）

### 3. 行分组检测

#### 功能说明
扫描每一行，找到有内容的行，然后将相邻的内容行分组为行带（bands）。

#### 实现方法

```javascript
// 找到有内容的行
const rowContent = new Uint8Array(h);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (bin[y * w + x]) {
      rowContent[y] = 1;
      break;
    }
  }
}

// 行分组（带间隙容忍）
const GAP = 3; // 允许最多3px的行间隙
const bands = [];
let bandStart = -1, lastContent = -1;

for (let y = 0; y < h; y++) {
  if (rowContent[y]) {
    if (bandStart < 0) bandStart = y;
    lastContent = y;
  } else if (bandStart >= 0 && y - lastContent > GAP) {
    bands.push({ y1: bandStart, y2: lastContent + 1 });
    bandStart = -1;
    lastContent = -1;
  }
}

if (bandStart >= 0) {
  bands.push({ y1: bandStart, y2: lastContent + 1 });
}
```

#### 关键概念
- **行内容标记**：标记哪些行至少有一个不透明像素
- **间隙容忍**：允许小间隙（默认3px），避免过度分割
- **行带**：连续的内容行组成一个行带

#### 尺寸过滤
```javascript
const minH = parseInt(document.getElementById('minH').value) || 8;
const maxH = parseInt(document.getElementById('maxH').value) || 500;

for (let bi = 0; bi < bands.length; bi++) {
  const { y1, y2 } = bands[bi];
  const bh = y2 - y1;
  if (bh < minH || bh > maxH) continue;
  // 处理有效行带...
}
```

### 4. 列检测与帧边界

#### 功能说明
在每个行带内，检测有内容的列，找到帧的左右边界。

#### 实现方法

```javascript
// 找到行带内有内容的列
const colContent = new Uint8Array(w);
for (let x = 0; x < w; x++) {
  for (let y = y1; y < y2; y++) {
    if (bin[y * w + x]) {
      colContent[x] = 1;
      break;
    }
  }
}

// 列分组（带间隙容忍）
const colGAP = 3;
const colBands = [];
let cStart = -1, cLast = -1;

for (let x = 0; x < w; x++) {
  if (colContent[x]) {
    if (cStart < 0) cStart = x;
    cLast = x;
  } else if (cStart >= 0 && x - cLast > colGAP) {
    colBands.push({ x1: cStart, x2: cLast + 1 });
    cStart = -1;
    cLast = -1;
  }
}

if (cStart >= 0) {
  colBands.push({ x1: cStart, x2: cLast + 1 });
}
```

#### 尺寸过滤
```javascript
const minW = parseInt(document.getElementById('minW').value) || 4;
const maxW = parseInt(document.getElementById('maxW').value) || 500;

for (let fi = 0; fi < colBands.length; fi++) {
  const { x1, x2 } = colBands[fi];
  const fw = x2 - x1;
  if (fw < minW || fw > maxW) continue;
  // 处理有效帧...
}
```

### 5. 自动裁剪透明边缘

#### 功能说明
在检测到的帧边界基础上，向内扫描，裁剪掉四周的透明边缘，得到更精确的帧边界。

#### 实现方法

```javascript
// 裁剪透明边缘
let tl = 0, tr = 0, tt = 0, tb = 0;

// 左边界
ol: for (let tx = x1; tx < x2; tx++) {
  for (let ty = y1; ty < y2; ty++) {
    if (bin[ty * w + tx]) break ol;
  }
  tl++;
}

// 右边界
or2: for (let tx = x2 - 1; tx >= x1; tx--) {
  for (let ty = y1; ty < y2; ty++) {
    if (bin[ty * w + tx]) break or2;
  }
  tr++;
}

// 上边界
ot: for (let ty = y1; ty < y2; ty++) {
  for (let tx = x1; tx < x2; tx++) {
    if (bin[ty * w + tx]) break ot;
  }
  tt++;
}

// 下边界
ob: for (let ty = y2 - 1; ty >= y1; ty--) {
  for (let tx = x1; tx < x2; tx++) {
    if (bin[ty * w + tx]) break ob;
  }
  tb++;
}

const cx = x1 + tl, cy = y1 + tt;
const cw = Math.max(1, fw - tl - tr), ch = Math.max(1, bh - tt - tb);
```

#### 算法优化
- 从四个方向分别向内扫描
- 找到第一个有内容的像素即停止
- 使用带标签的break语句提前退出循环

### 6. 保留手动帧

#### 功能说明
重新检测时保留用户手动添加的帧，只替换自动检测的帧。

#### 实现方法

```javascript
// 保留手动帧
const manual = frames.filter(f => f.manual);
frames = [...manual];
nextId = frames.length > 0 ? Math.max(...frames.map(f => f.id)) + 1 : 0;
```

## 关键函数详解

### `detectFrames()`
自动检测精灵表中的帧的主函数。

**配置参数**（从DOM读取）：
- `minH` - 最小高度（默认8）
- `maxH` - 最大高度（默认500）
- `minW` - 最小宽度（默认4）
- `maxW` - 最大宽度（默认500）
- `alphaTh` - Alpha阈值（默认10）
- `framePad` - 帧间距（默认2）

**流程**：
1. 获取Alpha通道数据
2. 构建二值化图像
3. 检测有内容的行
4. 行分组（带间隙容忍）
5. 过滤尺寸不符合的行带
6. 对每个行带：
   - 检测有内容的列
   - 列分组
   - 过滤尺寸不符合的帧
   - 裁剪透明边缘
   - 创建帧对象
7. 保留手动帧
8. 渲染并更新UI

**返回**：无，直接修改全局`frames`数组

### `getAlpha()`
获取Alpha通道缓存。

**返回**：
- `Uint8Array` - Alpha通道数据，每个元素0-255

**缓存机制**：
- 检查图片尺寸是否匹配
- 如果匹配且缓存存在，直接返回缓存
- 否则重新计算并缓存

**注意事项**：
- 图片修改后需要调用`invalidateAlpha()`
- 缓存对性能影响很大，处理大图时特别明显

### `invalidateAlpha()`
清除Alpha通道缓存。

**使用场景**：
- 加载新图片后
- 背景消除应用后
- 任何修改图片内容的操作后

### `trimAlpha(frame, alphaThreshold)`
裁剪帧的透明边缘。

**参数**：
- `frame` - 帧对象，包含x, y, w, h
- `alphaThreshold` - Alpha阈值

**返回**：
- `{x, y, w, h}` - 裁剪后的边界
- 如果帧完全透明，返回null

**算法**：
- 从左到右扫描，找第一个有内容的列
- 从右到左扫描，找最后一个有内容的列
- 从上到下扫描，找第一个有内容的行
- 从下到上扫描，找最后一个有内容的行

**优化**：
- 使用带标签的break语句
- 找到目标后立即停止扫描

### `expandEdges(frame, alphaThreshold, margin, maxExp)`
扩展帧边界以避免内容被裁剪。

**参数**：
- `frame` - 帧对象
- `alphaThreshold` - Alpha阈值
- `margin` - 检查边距
- `maxExp` - 最大扩展像素数

**返回**：
- `boolean` - 是否进行了扩展

**功能说明**：
- 检查帧的四边是否有内容接触边界
- 如果有，向外扩展
- 最多扩展maxExp像素
- 避免过度裁剪

**使用场景**：
- 手动框选帧时，自动扩展确保完整包含内容

## 数据结构

### 行带 (Band)
```javascript
{
  y1: number,  // 起始Y（包含）
  y2: number   // 结束Y（不包含）
}
```

### 列带 (ColBand)
```javascript
{
  x1: number,  // 起始X（包含）
  x2: number   // 结束X（不包含）
}
```

### 二值化图像 (BinaryImage)
```javascript
Uint8Array(w * h)  // 0 = 透明, 1 = 有内容
```

## 使用示例

### 示例1：基本自动检测

```javascript
// 设置参数
document.getElementById('minH').value = 16;
document.getElementById('maxH').value = 128;
document.getElementById('minW').value = 16;
document.getElementById('maxW').value = 128;
document.getElementById('alphaTh').value = 10;

// 运行检测
detectFrames();

// 结果在frames数组中
console.log('检测到', frames.length, '个帧');
```

### 示例2：手动检测特定区域

```javascript
// 假设你有一个特定区域
const region = { x: 0, y: 0, w: 256, h: 256 };

// 你可以：
// 1. 使用自动检测
detectFrames();

// 2. 或者手动框选
// 在界面上拖拽框选该区域
```

### 示例3：清理缓存

```javascript
// 修改了图片内容后
invalidateAlpha();

// 重新检测
detectFrames();
```

## 配置参数调优

### Alpha阈值 (alphaTh)
- **低阈值（1-10）**：敏感，可能包含半透明区域
- **推荐值（10-30）**：平衡，适合大多数情况
- **高阈值（30+）**：保守，只保留完全不透明区域

### 最小/最大尺寸
- **最小尺寸**：避免检测到噪点
  - 小精灵：8-16
  - 大精灵：16-32
- **最大尺寸**：避免误检测大区域
  - 根据实际精灵大小设置

### 间隙容忍 (GAP)
- **小间隙（1-2）**：严格分割
- **推荐值（3-5）**：允许小间隙
- **大间隙（5+）**：宽松，可能合并帧

## 注意事项

1. **性能优化**
   - Alpha通道缓存很重要，处理大图时特别明显
   - 避免频繁调用`invalidateAlpha()`
   - 二值化图像构建后重复使用

2. **间隙容忍的重要性**
   - 精灵表中帧之间可能有小间隙
   - 太小会过度分割
   - 太大会合并帧
   - 根据实际精灵表调整

3. **尺寸过滤**
   - 最小尺寸过滤噪点
   - 最大尺寸避免误检测
   - 根据实际精灵大小调整

4. **保留手动帧**
   - `manual`标记区分手动和自动帧
   - 重新检测时保留手动帧
   - 用户工作不会丢失

5. **裁剪与扩展的平衡**
   - 裁剪去除透明边缘
   - 扩展确保内容完整
   - 两者结合使用效果最好

## 复用指南

此模块的方法可以在以下场景中复用：

1. **任何需要图像分割的应用**
   - Alpha通道分析方法通用
   - 连通区域检测算法通用
   - 行/列分组逻辑通用

2. **图像处理工具**
   - 二值化图像构建可复用
   - 透明边缘裁剪可复用
   - 边界检测算法可复用

3. **精灵表工具**
   - 帧检测是核心功能
   - 可以直接移植到其他精灵表编辑器
   - 参数调整逻辑通用

4. **计算机视觉基础**
   - 这些是基础的CV算法
   - 可以作为学习材料
   - 可以扩展到更复杂的场景

## 算法原理

### 行扫描算法
行扫描是一种高效的图像分析方法：
1. 逐行检查是否有内容
2. 将连续的内容行分组
3. 时间复杂度O(w*h)

### 间隙容忍
间隙容忍允许小间隙存在：
1. 记录最后一个内容行的位置
2. 如果间隙超过阈值，结束当前分组
3. 避免因小间隙导致过度分割

### 边缘裁剪
边缘裁剪通过向内扫描实现：
1. 从四个方向分别扫描
2. 找到第一个有内容的像素
3. 提前退出优化性能
4. 时间复杂度O(w+h)（最佳情况）

