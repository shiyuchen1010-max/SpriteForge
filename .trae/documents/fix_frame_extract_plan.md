# 修复帧提取功能问题计划

## 问题分析

通过代码分析，发现了以下问题：

1. **函数冲突问题**：`app.js`和`frame-extract.js`中存在重复且冲突的函数，特别是：
   - `loadExtractSource()`
   - `handleExtractFile()`
   - `clearExtractSources()`
   - `clearExtractTarget()`
   - `autoArrangeExtractTarget()`
   - `createExtractSpriteSheet()`

2. `app.js`中的这些函数是简化版本，没有正确使用`frame-extract.js`中完整的帧提取功能。

3. 这些冲突导致：
   - 加载图片后不能正常进行手动抠帧
   - 提取帧功能点击无效
   - 放置区域不显示从提取区域取出来的帧

## 修复方案

### 1. 修复文件：`/workspace/sprite-forge-user/js/app.js`

**修改内容**：
- 删除`app.js`中与`frame-extract.js`冲突的函数（第46-118行）
- 保留`initExtractPage()`函数，但简化它，让它调用`frame-extract.js`中的渲染函数

### 2. 验证文件：`/workspace/sprite-forge-user/js/frame-extract.js`

**确保**：
- 所有必要的功能都已完整实现
- 手动抠帧、帧检测、添加到目标区域等功能正常工作
- 放置区域的渲染功能正常

## 修复步骤

1. 从`app.js`中删除冲突的函数（第46-118行）
2. 简化`initExtractPage()`函数
3. 测试帧提取功能是否正常工作

## 预期结果

修复后：
- 加载图片后可以正常进行手动抠帧
- 检测帧功能可以正常工作
- 选择帧后可以添加到放置区域
- 放置区域会正确显示提取的帧
- 所有按钮功能正常
