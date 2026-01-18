# Spec: writenow-business-model

## Purpose

定义 WriteNow 的商业定位、目标用户、付费套餐、功能权限矩阵和后端服务架构，作为产品开发的商业目标指引。

## Requirements

### Requirement: 产品定位 MUST
产品定位 MUST 突出 AI 赋能与内容创作效率提升。

WriteNow 是面向专业内容创作者的 AI 生产力工具，帮助用户更高效地创作和发布内容。

核心价值主张：
- 上手即用，无需技术背景
- AI 提升创作效率和质量
- 多平台一键发布
- 数据驱动的创作管理

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 定位一致
- **WHEN** 对外描述产品价值
- **THEN** 必须强调 AI 赋能、效率提升与多平台发布

### Requirement: 目标用户 MUST
目标用户 MUST 覆盖高付费、中付费与免费三类人群。

- 一级用户（高付费意愿）：自媒体大V、企业内容团队、知识付费从业者、签约作者
- 二级用户（中等付费意愿）：中腰部自媒体、副业写作者、电商文案、小红书博主
- 三级用户（免费/低付费）：新手创作者、学生、兴趣写作者

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 用户分层
- **WHEN** 进行市场分析与功能规划
- **THEN** 必须覆盖高付费、中付费与免费三类用户需求

### Requirement: 付费套餐设计 MUST
付费套餐 MUST 包含 Free、Pro、Team 三档并定义权益差异。

#### Free（免费版）
- 价格：￥0
- AI：免费模型，每月 5 万字限额
- 功能：完整本地编辑器、基础 SKILL、创作统计（仅本地）
- 限制：无云同步、无高端模型

#### Pro（专业版）
- 价格：￥99/月 或 ￥799/年
- AI：高端模型，每月 50 万字额度
- 功能：云同步、多设备、全部 SKILL、导出与发布

#### Team（团队版）
- 价格：￥199/人/月（最少 3 人）
- 功能：团队协作、统一账单、团队统计

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 套餐清单
- **WHEN** 展示订阅套餐
- **THEN** 必须包含 Free / Pro / Team 三档与核心差异

### Requirement: 功能权限矩阵 MUST
权限矩阵 MUST 明确各套餐可用功能与限制。

| 功能 | Free | Pro | Team |
|------|------|-----|------|
| 本地编辑器 | 全功能 | 全功能 | 全功能 |
| 双模式编辑 | 是 | 是 | 是 |
| 专注模式 | 是 | 是 | 是 |
| 基础 SKILL | 3个 | 全部 | 全部 |
| 自定义 SKILL | 否 | 是 | 是 |
| 免费 AI 模型 | 5万字/月 | 不限 | 不限 |
| 高端 AI 模型 | 否 | 50万字/月 | 不限 |
| 云同步 | 否 | 是 | 是 |
| 多设备 | 否 | 是 | 是 |
| 创作统计 | 本地 | 跨设备 | 团队级 |
| 番茄钟 | 是 | 是 | 是 |
| 导出 | 基础格式 | 全格式 | 全格式 |
| 多平台发布 | 否 | 是 | 是 |
| 技术支持 | 社区 | 优先 | 专属 |

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 权限对齐
- **WHEN** 校验功能权限
- **THEN** 必须符合矩阵中的套餐差异

### Requirement: 后端服务架构 MUST
后端架构 MUST 支撑认证、订阅校验与 AI 代理。

必须构建后端服务以支撑订阅制商业模式。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 用户认证
- **WHEN** 用户首次使用应用
- **THEN** 引导注册或登录
- **THEN** 客户端获取 JWT Token 用于后续请求

#### Scenario: 订阅状态验证
- **WHEN** 应用启动
- **THEN** 检查用户订阅状态
- **THEN** 根据套餐激活对应功能权限

#### Scenario: AI API 代理
- **WHEN** 用户触发 AI 功能
- **THEN** 客户端发送请求到后端 API
- **THEN** 后端验证用户额度并流式返回
- **THEN** 后端记录用量

### Requirement: 数据同步架构 MUST
数据同步 MUST 支持 Pro 及以上用户跨设备同步。

Pro 及以上用户需要云同步功能。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 数据同步
- **WHEN** Pro 用户修改文章
- **THEN** 本地立即保存
- **THEN** 后台异步同步到云端

#### Scenario: 冲突处理
- **WHEN** 多设备同时修改
- **THEN** 采用 Last-Write-Wins 策略
- **THEN** 保留完整版本历史供用户回退

### Requirement: 客户端授权机制 MUST
客户端授权 MUST 支持离线与降级策略。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 离线使用
- **WHEN** 用户无网络连接
- **THEN** 允许本地编辑功能
- **THEN** AI 功能不可用
- **WHEN** 恢复网络
- **THEN** 重新验证订阅状态

#### Scenario: 套餐降级
- **WHEN** Pro 用户订阅到期且未续费
- **THEN** 降级为 Free 功能
- **THEN** 云端数据保留 30 天
- **THEN** 本地数据永久保留

### Requirement: 后端技术栈 MUST
后端技术栈 MUST 优先采用 Supabase 等全托管方案。

推荐方案：Supabase 一站式（Auth、数据库、Edge Functions、Storage、Realtime）。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 托管服务选择
- **WHEN** 后端能力落地
- **THEN** 必须采用全托管方案并优先使用 Supabase

### Requirement: 验证计划 MUST
验证计划 MUST 同时覆盖商业与技术验证。

商业验证：内测、付费测试。技术验证：认证、订阅、AI 代理与端到端流程。

- Evidence: `openspec/_ops/task_runs/ISSUE-15.md`

#### Scenario: 商业验证
- **WHEN** MVP 内测开启
- **THEN** 招募目标用户并收集付费意愿

#### Scenario: 技术验证
- **WHEN** 后端服务搭建完成
- **THEN** 注册 → 订阅 → 使用 → 续费流程可跑通

### Requirement: 实施优先级 MUST
实施优先级 MUST 以 Phase 1 本地 MVP 为先。

Phase 1（当前）：本地 MVP
Phase 2：后端基础
Phase 3：云服务
Phase 4：规模化

- Evidence: `openspec/specs/writenow-implementation-strategy/spec.md`

#### Scenario: 阶段对齐
- **WHEN** 查看实施策略
- **THEN** 阶段划分与商业优先级一致
