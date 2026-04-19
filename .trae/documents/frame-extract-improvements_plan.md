# 帧提取功能改进计划

## 问题概述
1. **帧拖动问题**：手动拖动帧时会重合或超出区域导致重叠或裁剪
2. **间距设置问题**：间距设计没有生效
3. **导出预览问题**：导出时没有预览和确认步骤

## 文件修改清单
1. `/workspace/sprite-forge-user/js/frame-extract.js` - 主要修改文件
2. `/workspace/sprite-forge-user/index.html` - 添加新的模态框

## 详细改进计划

### 1. 改进帧拖动功能 - 添加边界限制和碰撞检测

**修改位置**：`handleExtractTargetMove` 和相关拖动函数

**实现方案**：
- 在`handleExtractTargetMove`中添加边界检查，确保帧不会被拖出区域
- 添加碰撞检测，防止帧之间重叠
- 拖动时考虑间距设置，确保帧之间保持最小间距

**具体修改**：
- 新增 `checkFrameCollision` 函数用于碰撞检测
- 新增 `clampFramePosition` 函数用于边界限制
- 修改 `handleExtractTargetMove` 函数，在拖动时应用这些限制

### 2. 确保间距设置在所有场景中正确生效

**修改位置**：`autoArrangeExtractTarget`、`exportAsSpriteSheet` 函数

**实现方案**：
- 修复 `autoArrangeExtractTarget` 函数中的间距计算
- 在 `exportAsSpriteSheet` 函数中正确应用间距
- 在拖动时也考虑间距，保持帧之间的最小间距

**具体修改**：
- 修改 `autoArrangeExtractTarget` 函数，确保间距正确应用到所有帧
- 修改 `exportAsSpriteSheet` 函数，在计算精灵表尺寸时包含间距
- 在拖动逻辑中也应用间距限制

### 3. 添加导出预览模态框和确认功能

**修改位置**：`createExtractSpriteSheet` 和新增预览相关函数

**实现方案**：
- 在 HTML 中添加新的导出预览模态框
- 创建 `showExportPreview` 函数生成预览
- 修改 `createExtractSpriteSheet` 函数，先显示预览再导出
- 添加确认和取消按钮

**具体修改**：
- 在 `index.html` 中添加新的模态框元素
- 新增 `renderExportPreview` 函数渲染预览
- 新增 `confirmExport` 函数处理确认导出
- 修改 `createExtractSpriteSheet` 函数流程

## 实施步骤

1. **第一步**：改进帧拖动功能
   - 添加边界限制
   - 添加碰撞检测
   - 测试拖动功能

2. **第二步**：修复间距设置
   - 在自动排列中正确应用间距
   - 在导出时正确应用间距
   - 测试间距功能

3. **第三步**：添加导出预览
   - 创建预览模态框 UI
   - 实现预览生成逻辑
   - 测试导出流程

## 预期效果

- 拖动帧时不会超出区域边界
- 帧之间不会重叠，保持最小间距
- 间距设置在自动排列和导出时正确生效
- 导出前可以预览最终效果，确认无误后再导出
