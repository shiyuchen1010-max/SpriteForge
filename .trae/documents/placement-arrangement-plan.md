# 放置区域排列控制功能实现计划

## 问题分析

目前的放置区域功能存在以下问题：
1. `autoArrangeExtractTarget()` 函数只是简单地按顺序排列帧，不支持自定义行列
2. 无法设置精灵表的行列数（如九宫格 3x3、4x4 等）
3. 用户希望有更灵活的自动排列功能

## 实现目标

在放置区域增加排列控制功能：
1. 添加行列数设置选项
2. 增强 `autoArrangeExtractTarget()` 函数，支持宫格模式排列
3. 保持默认的手动排列不变
4. 提供更好的用户体验

## 实现方案

### 1. 修改 HTML 界面

在 `index.html` 中的放置区域设置部分添加：
- 列数输入框
- 行数输入框
- 排列模式选择（原始顺序/宫格模式）

### 2. 修改 JavaScript 逻辑

主要修改 `frame-extract.js` 中的：
- `autoArrangeExtractTarget()` 函数 - 重写为支持多种排列模式
- 添加新的辅助函数来处理宫格排列
- 确保向后兼容性，保持默认行为不变

### 3. 具体修改点

#### 文件 1: `index.html`

在第 250-261 行附近的 `extract-target-settings` 部分添加：

```html
<div class="extract-setting-item">
  <label>排列模式:</label>
  <select id="arrangeMode">
    <option value="flow">流式排列</option>
    <option value="grid">宫格模式</option>
  </select>
</div>
<div class="extract-setting-item" id="gridColsRow">
  <label>列数:</label>
  <input type="number" id="gridCols" value="3" min="1" style="width:60px;padding:4px;">
</div>
<div class="extract-setting-item" id="gridRowsRow">
  <label>行数:</label>
  <input type="number" id="gridRows" value="3" min="1" style="width:60px;padding:4px;">
</div>
```

#### 文件 2: `frame-extract.js`

重写 `autoArrangeExtractTarget()` 函数（约第 942 行），添加：
- 宫格模式支持
- 行列数参数处理
- 智能计算帧位置

添加新的辅助函数：
- `autoArrangeExtractTargetGrid()` - 宫格模式专用
- `autoArrangeExtractTargetFlow()` - 流式模式（保持原有行为）

### 4. 排列模式详解

#### 流式模式（默认，保持现有行为）
- 帧按顺序排列，到达边界时自动换行
- 支持自定义间距
- 适合不确定最终布局的场景

#### 宫格模式（新功能）
- 用户指定列数和行数
- 帧按指定的宫格排列
- 自动计算每个帧的位置
- 支持九宫格、4x4、5x5 等任意宫格
- 如果帧数超过宫格容量，自动扩展宫格或提示用户

### 5. 智能功能增强

- 宫格模式下自动计算合适的单元格大小
- 基于帧的最大尺寸确定单元格大小
- 居中对齐每个帧
- 保持间距设置
- 自动适应不同尺寸的帧

## 实现步骤

1. 修改 `index.html`，添加排列控制 UI 元素
2. 修改 `frame-extract.js`：
   - 重写 `autoArrangeExtractTarget()` 函数
   - 添加新的排列模式函数
3. 测试功能：
   - 流式模式（向后兼容性）
   - 宫格模式（新功能）
   - 各种行列组合
4. 验证功能正常

## 预期效果

- 用户可以轻松设置宫格模式的精灵表
- 支持九宫格、4x4、5x5 等任意宫格
- 保持原有的手动排列功能
- 提供更好的用户体验
