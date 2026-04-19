# 模块6：背景消除

## 功能概述

背景消除模块负责从精灵表中去除背景，提供两种消除方式：边缘泛洪（自动）和取色消除（手动）。通过灵活的容差控制和预览功能，实现精确的背景去除。

## 核心功能

### 1. 边缘泛洪算法（自动）

#### 功能说明
从图片边缘开始进行广度优先搜索（BFS），将与边缘颜色相似的区域标记为背景并设为透明。适合背景颜色统一且与边缘相连的情况。

#### 实现方法

```javascript
function runBgFlood() {
  if (!srcImg) return;
  saveBgOriginal();

  const c = document.getElementById('mainCanvas');
  const ctx = c.getContext('2d');
  const imgData = ctx.getImageData(0, 0, srcImg.width, srcImg.height);
  const d = imgData.data;
  const w = srcImg.width, h = srcImg.height;
  const tol = parseInt(document.getElementById('bgTolerance').value) || 32;

  // 访问标记数组
  const visited = new Uint8Array(w * h);

  // BFS队列：从所有边界像素开始
  const queue = [];
  // 添加所有边界像素
  for (let x = 0; x < w; x++) {
    queue.push(x); // 顶行
    queue.push((h - 1) * w + x); // 底行
  }
  for (let y = 0; y < h; y++) {
    queue.push(y * w); // 左列
    queue.push(y * w + w - 1); // 右列
  }

  // 从左上角获取参考颜色（或第一个非透明边界像素）
  let refR = 0, refG = 0, refB = 0;
  for (let i = 0; i < queue.length; i++) {
    const idx = queue[i] * 4;
    if (d[idx + 3] > 128) {
      refR = d[idx];
      refG = d[idx + 1];
      refB = d[idx + 2];
      break;
    }
  }

  // BFS遍历
  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * 4;
    // 检查此像素是否在容差范围内匹配参考颜色
    if (d[idx + 3] > 128 && colorDist(d[idx], d[idx + 1], d[idx + 2], refR, refG, refB) <= tol) {
      // 标记为背景（透明）
      d[idx + 3] = 0;

      // 添加邻居
      const x = pos % w, y = (pos - x) / w;
      if (x > 0) queue.push(pos - 1);
      if (x < w - 1) queue.push(pos + 1);
      if (y > 0) queue.push(pos - w);
      if (y < h - 1) queue.push(pos + w);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bgPreviewData = true;
  document.getElementById('btnBgApply').disabled = false;
  document.getElementById('btnBgReset').disabled = false;
  toast('泛洪消除完成，预览效果中');
}
```

#### 关键流程
1. 保存原始图片数据
2. 获取画布像素数据
3. 初始化访问标记数组
4. 将所有边界像素加入队列
5. 获取参考颜色（左上角或第一个非透明边界像素）
6. BFS遍历，将匹配的像素设为透明
7. 更新画布，启用应用和重置按钮

#### 算法特点
- **起点**：所有边界像素
- **搜索方式**：广度优先搜索（BFS）
- **终止条件**：颜色不匹配或已访问
- **效果**：从边缘向内消除相似颜色

### 2. 取色消除（手动）

#### 功能说明
用户点击画布上的背景色，系统将所有与该颜色相似的像素设为透明。适合背景颜色不与边缘相连或需要精确控制的情况。

#### 实现方法

```javascript
function bgPickColor(e) {
  if (!bgRemoveActive || !srcImg) return;
  const mode = document.getElementById('bgRemoveMode').value;
  if (mode !== 'pick') return;

  const c = document.getElementById('mainCanvas');
  const ctx = c.getContext('2d');
  const coords = imgCoords(e);
  const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data;
  bgPickedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

  // 保存原图（如果未保存）
  saveBgOriginal();

  // 运行取色消除
  runBgPickRemove();

  // 显示选取的颜色
  const hex = '#' + [pixel[0], pixel[1], pixel[2]]
    .map(v => v.toString(16).padStart(2, '0')).join('');
  document.getElementById('bgPickHint').textContent = 
    `👆 已取色 ${hex}，再次点击可重新取色`;
  document.getElementById('btnBgApply').disabled = false;
  document.getElementById('btnBgReset').disabled = false;
}

function runBgPickRemove() {
  if (!bgPickedColor || !srcImg) return;
  saveBgOriginal();

  const c = document.getElementById('mainCanvas');
  const ctx = c.getContext('2d');
  const imgData = ctx.getImageData(0, 0, srcImg.width, srcImg.height);
  const d = imgData.data;
  const tol = parseInt(document.getElementById('bgTolerance').value) || 32;
  const { r: pr, g: pg, b: pb } = bgPickedColor;

  for (let i = 0; i < d.length; i += 4) {
    if (colorDist(d[i], d[i + 1], d[i + 2], pr, pg, pb) <= tol) {
      d[i + 3] = 0; // 设置Alpha为0
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bgPreviewData = true;
}
```

#### 关键流程
1. 获取点击位置的像素颜色
2. 保存原始图片数据
3. 遍历所有像素
4. 将与选取颜色相似的像素设为透明
5. 更新画布

#### 算法特点
- **起点**：用户点击的像素
- **处理方式**：遍历所有像素
- **匹配方式**：颜色距离比较
- **效果**：全局消除相似颜色

### 3. 颜色距离计算

#### 功能说明
计算两个颜色在RGB空间中的欧几里得距离，用于判断颜色是否相似。

#### 实现方法

```javascript
function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}
```

#### 数学原理
欧几里得距离公式：
```
distance = √[(r1-r2)² + (g1-g2)² + (b1-b2)²]
```

#### 距离说明
- **0**：完全相同的颜色
- **< 10**：非常相似
- **10-32**：相似（推荐容差范围）
- **> 32**：差异较大

### 4. 原始数据保存与重置

#### 功能说明
在进行背景消除前保存原始图片数据，用户可以随时重置回原始状态。

#### 实现方法

```javascript
let bgRemoveActive = false;
let bgOriginalData = null;
let bgPickedColor = null;
let bgPreviewData = null;

function saveBgOriginal() {
  if (!bgOriginalData && srcImg) {
    const c = document.createElement('canvas');
    c.width = srcImg.width;
    c.height = srcImg.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(srcImg, 0, 0);
    bgOriginalData = ctx.getImageData(0, 0, srcImg.width, srcImg.height);
  }
}

function resetBgRemove() {
  if (!bgOriginalData || !srcImg) return;
  const c = document.getElementById('mainCanvas');
  const ctx = c.getContext('2d');
  ctx.putImageData(bgOriginalData, 0, 0);
  
  // 从画布更新srcImg
  const dataUrl = c.toDataURL();
  const img = new Image();
  img.onload = () => {
    srcImg = img;
    bgOriginalData = null;
    bgPreviewData = null;
    bgPickedColor = null;
    invalidateAlpha();
    renderCanvas();
    renderRects();
    toast('已重置为原图');
  };
  img.src = dataUrl;
}
```

#### 关键流程
**保存**：
1. 检查是否已保存
2. 创建临时画布
3. 绘制原图
4. 获取像素数据并保存

**重置**：
1. 将原始数据写回画布
2. 从画布创建新的Image对象
3. 更新全局srcImg
4. 清除所有临时状态
5. 重新渲染

### 5. 应用背景消除

#### 功能说明
将预览效果永久应用到图片上，更新原图并清除临时状态。

#### 实现方法

```javascript
function applyBgRemove() {
  if (!srcImg) return;
  // 预览效果已在画布上，只需更新srcImg
  const c = document.getElementById('mainCanvas');
  const dataUrl = c.toDataURL();
  const img = new Image();
  img.onload = () => {
    srcImg = img;
    bgOriginalData = null;
    bgPreviewData = null;
    bgPickedColor = null;
    invalidateAlpha();
    renderRects();
    toast('背景消除已应用');
  };
  img.src = dataUrl;
}
```

#### 关键流程
1. 将画布内容导出为DataURL
2. 创建新的Image对象
3. 更新全局srcImg
4. 清除所有临时状态
5. 清除Alpha缓存
6. 重新渲染帧矩形

### 6. 模式切换与UI控制

#### 功能说明
提供两种消除模式的切换，以及取色模式的进入/退出控制。

#### 实现方法

```javascript
function onBgModeChange() {
  bgRemoveActive = false;
  bgPickedColor = null;
  document.getElementById('canvasFrame').style.cursor = '';
  document.getElementById('bgPickHint').style.display = 'none';
  const btn = document.getElementById('btnBgMode');
  btn.textContent = '🎯 进入取色模式';
  btn.style.borderColor = '';
  document.getElementById('bgTolField').style.display = '';
}

function toggleBgRemoveMode() {
  bgRemoveActive = !bgRemoveActive;
  const btn = document.getElementById('btnBgMode');
  const hint = document.getElementById('bgPickHint');
  const mode = document.getElementById('bgRemoveMode').value;
  
  if (mode === 'pick') {
    if (bgRemoveActive) {
      btn.textContent = '🚫 退出取色模式';
      btn.style.borderColor = 'var(--accent)';
      hint.style.display = 'block';
      document.getElementById('canvasFrame').style.cursor = 'crosshair';
    } else {
      btn.textContent = '🎯 进入取色模式';
      btn.style.borderColor = '';
      hint.style.display = 'none';
      document.getElementById('canvasFrame').style.cursor = '';
    }
  } else {
    // 泛洪模式：直接运行
    bgRemoveActive = false;
    btn.textContent = '🎯 进入取色模式';
    btn.style.borderColor = '';
    hint.style.display = 'none';
    document.getElementById('canvasFrame').style.cursor = '';
    runBgFlood();
  }
}
```

## 关键函数详解

### `runBgFlood()`
运行边缘泛洪算法消除背景。

**配置参数**：
- `bgTolerance` - 容差值，默认32

**流程**：
1. 保存原始数据
2. 获取像素数据
3. 初始化访问标记
4. 将边界像素加入队列
5. 获取参考颜色
6. BFS遍历消除背景
7. 更新画布和UI

**注意事项**：
- 参考颜色从左上角获取
- 只处理非透明像素
- 容差越大，消除范围越大

### `runBgPickRemove()`
运行取色消除。

**依赖**：
- `bgPickedColor` - 必须先调用`bgPickColor()`设置

**流程**：
1. 检查是否有选取的颜色
2. 保存原始数据
3. 遍历所有像素
4. 比较颜色距离
5. 设为透明
6. 更新画布

### `bgPickColor(event)`
从画布取色。

**参数**：
- `event` - 鼠标点击事件

**流程**：
1. 检查是否在取色模式
2. 获取点击位置的图像坐标
3. 读取该位置的像素颜色
4. 保存原始数据
5. 运行取色消除
6. 显示颜色信息

**注意事项**：
- 只在取色模式下工作
- 取色后可以再次点击重新取色

### `colorDist(r1, g1, b1, r2, g2, b2)`
计算两个颜色的欧几里得距离。

**参数**：
- `r1, g1, b1` - 颜色1的RGB分量
- `r2, g2, b2` - 颜色2的RGB分量

**返回**：
- `number` - 颜色距离

**数学公式**：
```
distance = √[(r1-r2)² + (g1-g2)² + (b1-b2)²]
```

### `saveBgOriginal()`
保存原始图片数据。

**注意事项**：
- 只在第一次调用时保存
- 后续调用不覆盖
- 图片修改后需要重置

### `resetBgRemove()`
重置为原始图片。

**流程**：
1. 将原始数据写回画布
2. 从画布创建新Image
3. 更新全局状态
4. 清除Alpha缓存
5. 重新渲染

**注意事项**：
- 必须先调用`saveBgOriginal()`
- 重置后所有预览效果丢失

### `applyBgRemove()`
应用背景消除。

**流程**：
1. 导出画布为DataURL
2. 创建新Image对象
3. 更新全局srcImg
4. 清除临时状态
5. 清除Alpha缓存
6. 重新渲染帧

**注意事项**：
- 应用后无法通过reset撤销
- 但可以通过重新加载图片恢复

### `toggleBgRemoveMode()`
切换取色模式。

**功能**：
- 取色模式：进入/退出
- 泛洪模式：直接运行

**UI更新**：
- 按钮文字变化
- 边框颜色变化
- 光标样式变化
- 提示显示/隐藏

## 数据结构

### 选取颜色 (PickedColor)
```javascript
{
  r: number,  // 红色分量 (0-255)
  g: number,  // 绿色分量 (0-255)
  b: number   // 蓝色分量 (0-255)
}
```

### 状态变量
```javascript
let bgRemoveActive = false;    // 是否在取色模式
let bgOriginalData = null;     // 原始图片数据 (ImageData)
let bgPickedColor = null;      // 选取的颜色
let bgPreviewData = null;       // 是否有预览数据
```

## 使用示例

### 示例1：边缘泛洪消除

```javascript
// 设置容差
document.getElementById('bgTolerance').value = 32;

// 选择泛洪模式
document.getElementById('bgRemoveMode').value = 'flood';

// 点击按钮运行（或调用函数）
toggleBgRemoveMode(); // 泛洪模式下直接运行

// 预览效果满意后应用
applyBgRemove();
```

### 示例2：取色消除

```javascript
// 设置容差
document.getElementById('bgTolerance').value = 32;

// 选择取色模式
document.getElementById('bgRemoveMode').value = 'pick';

// 进入取色模式
toggleBgRemoveMode();

// 用户在画布上点击背景色
// bgPickColor()自动调用

// 可以再次点击重新取色

// 满意后应用
applyBgRemove();
```

### 示例3：重置

```javascript
// 如果不满意，重置回原图
resetBgRemove();

// 重置后可以重新尝试
```

### 示例4：调整容差

```javascript
// 小容差 - 只消除非常相似的颜色
document.getElementById('bgTolerance').value = 10;

// 大容差 - 消除更多颜色
document.getElementById('bgTolerance').value = 64;

// 推荐范围 - 平衡效果
document.getElementById('bgTolerance').value = 32;
```

## 配置参数调优

### 容差值 (Tolerance)
- **小容差（0-16）**
  - 精确，只消除非常相似的颜色
  - 适合颜色差异明显的背景
  - 可能留下边缘杂色

- **推荐值（16-48）**
  - 平衡，适合大多数情况
  - 消除相似颜色，保留主体
  - 32是经验推荐值

- **大容差（48+）**
  - 宽松，消除更多颜色
  - 可能侵蚀主体边缘
  - 适合背景非常统一的情况

### 模式选择
- **边缘泛洪**
  - 优点：自动，无需手动取色
  - 缺点：需要背景与边缘相连
  - 适用：大多数标准精灵表

- **取色消除**
  - 优点：精确控制，可处理复杂背景
  - 缺点：需要手动取色
  - 适用：背景不与边缘相连或需要精确控制

## 注意事项

1. **先保存再操作**
   - 系统会自动保存原始数据
   - 但最好在操作前确认
   - 重置依赖原始数据

2. **容差的重要性**
   - 太小：消除不彻底
   - 太大：侵蚀主体
   - 建议从小到大逐步调整

3. **两种模式的选择**
   - 先尝试泛洪模式
   - 泛洪不行再用取色
   - 取色可以多次尝试

4. **预览与应用**
   - 效果先在画布上预览
   - 满意后再点击应用
   - 应用后无法通过reset撤销

5. **Alpha缓存**
   - 应用后需要调用`invalidateAlpha()`
   - 否则帧检测会使用旧数据
   - 系统已自动处理

6. **颜色空间**
   - 使用RGB欧几里得距离
   - 对人眼感知不一定完美
   - 但简单高效，适合大多数情况

## 复用指南

此模块的方法可以在以下场景中复用：

1. **任何需要背景去除的应用**
   - 泛洪算法通用
   - 取色方法通用
   - 颜色距离计算通用

2. **图像处理工具**
   - BFS算法可用于区域填充
   - 颜色距离可用于颜色匹配
   - 像素遍历方法通用

3. **照片编辑工具**
   - 魔棒工具原理相同
   - 容差控制方式相同
   - 预览机制相同

4. **计算机视觉基础**
   - 区域生长算法
   - 颜色相似性判断
   - 像素级操作

## 算法原理

### 广度优先搜索（BFS）
BFS是一种图遍历算法：
1. 从起点开始
2. 访问所有邻居
3. 再访问邻居的邻居
4. 按层次向外扩展

**在泛洪消除中的应用**：
- 起点：所有边界像素
- 邻居：上下左右四个方向
- 终止条件：颜色不匹配或已访问

### 颜色距离
颜色距离衡量两个颜色的相似程度：
- RGB空间中的欧几里得距离
- 忽略Alpha通道
- 距离越小越相似

**数学基础**：
- 将RGB视为三维空间中的点
- 计算两点之间的直线距离
- 平方根保证距离非负

### 像素级操作
所有操作都在像素级别进行：
- 使用getImageData获取像素
- 直接操作像素数组
- 使用putImageData写回
- 高效且精确

