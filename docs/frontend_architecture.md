# MediQueue 前端架构设计文档

## 1. 文档目标

本文档基于以下文档整理前端实现方案：

- [prd_v2.md](./prd_v2.md)
- [design.md](./design.md)
- [backend_api_architecture.md](./backend_api_architecture.md)

目标是定义 MediQueue 三端前端的工程组织方式、状态管理策略、数据流、WebSocket 同步机制、共享组件方案与技术边界，供前端开发直接落地。

## 2. 架构目标

前端架构需要同时满足以下目标：

1. 支撑 `医生端 Web`、`候诊大屏端`、`患者端 H5` 三个终端
2. 保证三端共享一套核心业务模型与设计语言
3. 首屏通过 REST 获取快照，运行期通过 WebSocket 实时同步
4. 支持断线重连、刷新恢复、断网展示
5. 中英文切换能力可复用
6. 在题目限时交付下，保持结构清晰、实现成本可控

## 3. 技术选型建议

在未被题目限制框架的前提下，推荐以下方案：

- 框架：`React`
- 语言：`TypeScript`
- 构建工具：`Vite`
- 路由：`React Router`
- 状态管理：`Zustand`
- 服务端通信：`fetch + WebSocket`
- 样式：`CSS Modules` 或 `Tailwind + design tokens`
- 表单：`React Hook Form`
- 国际化：`i18next`

推荐原因：

- React + TypeScript 足够成熟，且组件和状态拆分成本低
- Zustand 适合当前 MVP，避免 Redux 级别样板代码
- Vite 启动快，适合多端 demo 开发
- i18next 足够支撑中英双语切换

## 4. 总体工程结构

推荐采用一个前端 monorepo，三个 app，共享若干 package：

```text
frontend/
  apps/
    doctor-web/
    display-screen/
    patient-h5/
  packages/
    ui/
    design-tokens/
    shared-types/
    api-client/
    realtime/
    i18n/
    utils/
```

### 4.1 apps 层职责

| 目录 | 职责 |
| --- | --- |
| `apps/doctor-web` | 医生端控制台 |
| `apps/display-screen` | 候诊大屏端 |
| `apps/patient-h5` | 患者端 H5 |

### 4.2 packages 层职责

| 目录 | 职责 |
| --- | --- |
| `packages/ui` | 共享 UI 组件，如 `StatusChip`、`OfflineBanner` |
| `packages/design-tokens` | 全局颜色、字体、间距、动效 token |
| `packages/shared-types` | 与后端契约对齐的前端类型 |
| `packages/api-client` | REST API 封装 |
| `packages/realtime` | WebSocket 客户端与重连逻辑 |
| `packages/i18n` | 中英文文案、语言切换 |
| `packages/utils` | 时间格式化、姓名脱敏、等待时间估算等工具 |

## 5. 三端架构分工

### 5.1 医生端

#### 核心职责

- 查看完整队列
- 控制“呼叫下一位 / 跳过 / 暂停 / 恢复”
- 接收并审核紧急优先申请
- 感知断网与重连状态

#### 页面结构建议

```text
DoctorApp
  DoctorLayout
    TopStatusBar
    CurrentCallPanel
    QueueListPanel
    ActionPanel
    PriorityReviewModal
    OfflineBanner
```

#### 路由建议

MVP 可采用单页面模式：

- `/doctor`

若后续扩展可保留：

- `/doctor`
- `/doctor/room/:roomNo`

### 5.2 候诊大屏端

#### 核心职责

- 广播当前叫号
- 展示等待队列前 5 位
- 显示暂停/断网状态
- 如实现则触发双语语音播报

#### 页面结构建议

```text
DisplayApp
  DisplayLayout
    DisplayHeader
    CurrentCallHero
    QueuePreviewList
    AnnouncementBar
    OfflineBanner
```

#### 路由建议

- `/display`
- `/display/:roomNo`

### 5.3 患者端 H5

#### 核心职责

- 展示我的号码、前方人数、预计等待时间
- 接收被叫号提醒
- 发起紧急优先申请
- 展示断网状态和个人快照

#### 页面结构建议

```text
PatientApp
  PatientLayout
    HeaderBar
    MyTicketCard
    QueueStatusCard
    PriorityRequestForm
    CallAlertOverlay
    OfflineBanner
```

#### 路由建议

- `/patient/:patientId`

可选：

- `/patient/:patientId/apply-priority`

## 6. 共享业务模型

前端必须与后端 API 契约保持一致，建议直接复用一套共享类型。

### 6.1 共享类型

前端至少需要以下类型：

- `Patient`
- `QueueTicket`
- `PriorityRequest`
- `PriorityAiResult`
- `QueueSnapshot`
- `CallEventPayload`

示例：

```ts
export type QueueTicketStatus =
  | "WAITING"
  | "CALLED"
  | "SKIPPED"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "MISSED";

export type QueuePriorityLevel =
  | "NORMAL"
  | "PRIORITY_REVIEWING"
  | "PRIORITY_APPROVED"
  | "RETURNING";
```

### 6.2 前端只做展示层派生

前端可以做以下派生字段，但不能改写服务端原始状态：

- `displayName`
- `peopleAhead`
- `estimatedWaitMinutes`
- `isOfflineSnapshot`
- `isMyTurn`

## 7. 状态管理架构

推荐采用“共享 domain store + 各端局部 UI store”的结构。

### 7.1 Store 划分

| Store | 作用 |
| --- | --- |
| `queueStore` | 保存队列快照、当前叫号、版本号 |
| `connectionStore` | 保存 WebSocket 状态、离线状态、最后同步时间 |
| `priorityStore` | 保存优先申请列表、审核弹窗状态 |
| `i18nStore` | 当前语言 |
| `uiStore` | 当前页面局部交互状态 |

### 7.2 Zustand 示例

```ts
type QueueStore = {
  snapshot: QueueSnapshot | null;
  setSnapshot: (snapshot: QueueSnapshot) => void;
  clearSnapshot: () => void;
};
```

### 7.3 状态边界原则

1. 服务端返回的 `QueueSnapshot` 是唯一事实源
2. UI Store 只能保存展示层状态，不保存业务主状态
3. WebSocket 事件更新后仍要回写为标准化快照数据

## 8. 数据流设计

### 8.1 首屏加载

统一采用：

1. 首次进入页面
2. 调用 REST API 获取最新快照
3. 渲染页面
4. 建立 WebSocket 连接
5. 进入实时同步

### 8.2 运行时同步

运行时采用：

- REST 负责“获取完整状态”
- WebSocket 负责“增量广播”

前端策略：

1. 首屏用 REST 拉快照
2. WebSocket 收到事件后更新本地 store
3. 重连成功后再次用 REST 拉快照做对齐

### 8.3 为什么不能只依赖 WebSocket

因为题目要求：

- 刷新后恢复正确状态
- 断线自动重连
- 状态一致性可靠

如果只依赖 WebSocket，丢事件时会造成三端状态漂移，因此必须保留快照式 REST 拉取。

## 9. WebSocket 客户端架构

### 9.1 共享实时层

建议在 `packages/realtime` 中封装统一客户端：

```text
packages/realtime/
  ws-client.ts
  ws-events.ts
  reconnect-manager.ts
```

### 9.2 功能要求

- 自动连接
- 自动重连
- 重连退避策略
- 连接状态广播到 `connectionStore`
- 支持按 `roomNo` / `patientId` 订阅

### 9.3 订阅策略

| 端 | 订阅维度 |
| --- | --- |
| 医生端 | `roomNo` |
| 大屏端 | `roomNo` |
| 患者端 | `roomNo + patientId` |

### 9.4 重连策略

建议采用指数退避：

- 第 1 次：1 秒
- 第 2 次：2 秒
- 第 3 次：4 秒
- 第 4 次及以后：最多 10 秒

重连成功后立即执行：

1. 标记 `online`
2. 拉取最新快照
3. 覆盖本地旧状态

## 10. API Client 层设计

### 10.1 目录建议

```text
packages/api-client/
  queue.ts
  calls.ts
  priority.ts
  health.ts
  http.ts
```

### 10.2 封装原则

1. 一个业务域一个 API 文件
2. 不在页面组件里直接写 `fetch`
3. 所有接口统一处理错误码和 JSON 结构

### 10.3 最小前端 API 调用集合

| 模块 | 调用 |
| --- | --- |
| 队列 | `getQueue(roomNo)` |
| 患者 | `getPatientQueueView(patientId)` |
| 叫号 | `callNext(roomNo)` |
| 跳过 | `skipCurrent(roomNo, ticketNo)` |
| 暂停 | `pauseCalls(roomNo)` |
| 恢复 | `resumeCalls(roomNo)` |
| 优先申请 | `createPriorityRequest(payload)` |
| 医生审核 | `reviewPriorityRequest(requestId, decision)` |
| 健康检查 | `getHealth()` |

## 11. 国际化架构

### 11.1 文案组织

建议：

```text
packages/i18n/
  locales/
    zh-CN.ts
    en-US.ts
  index.ts
```

### 11.2 文案分层

- 全局系统文案
- 三端特有文案
- 状态文案
- 断网公告文案

### 11.3 语言策略

| 端 | 策略 |
| --- | --- |
| 医生端 | 默认中文，可切英文 |
| 大屏端 | 中文为主，英文辅助 |
| 患者端 | 可按浏览器语言或患者语言偏好切换 |

## 12. UI 组件架构

完整视觉规范见 [design.md](./design.md)，前端组件建议分为三层：

### 12.1 基础层

- Button
- Card
- Modal
- StatusChip
- Banner

### 12.2 业务层

- CurrentCallHero
- QueueListItem
- QueuePreviewList
- MyTicketCard
- PriorityReviewModal
- OfflineBanner

### 12.3 页面层

- DoctorDashboard
- DisplayBoard
- PatientQueueView

### 12.4 组件原则

1. 基础组件不绑定业务语义
2. 业务组件接受标准化业务模型
3. 页面层只负责组合，不负责实现底层状态逻辑

## 13. 各端差异化实现重点

### 13.1 医生端

- 更强的信息密度
- 更多控制按钮
- 需要优先申请弹窗
- 需要更稳定的键鼠交互体验

### 13.2 大屏端

- 极简路由
- 自动全屏展示
- 当前号码是绝对主焦点
- 断网公告优先于普通列表

### 13.3 患者端

- 单列卡片式布局
- 触摸友好
- 强调“我的状态”
- 被叫号时需要全屏提示和震动

## 14. 断网与降级前端策略

### 14.1 前端断网判断

满足以下任一条件进入断网 UI：

- WebSocket 断开
- 多次重连失败
- 健康检查接口失败

### 14.2 断网时页面行为

| 端 | 行为 |
| --- | --- |
| 医生端 | 显示断网 Banner，保留最后快照 |
| 大屏端 | 显示断网标识与双语公告 |
| 患者端 | 显示断网提示，保留最后个人状态 |

### 14.3 恢复后策略

- 自动重连
- 自动拉最新快照
- 用新快照覆盖旧状态

本轮不做复杂离线写入和本地补偿提交。

## 15. 表单与交互策略

### 15.1 紧急优先申请

患者端表单要求：

- 一个多行输入框
- 字数建议限制在 `100-150` 字以内
- 提供占位示例文案
- 提交后给出明确状态反馈

### 15.2 医生审批弹窗

审批弹窗要求：

- 保留患者原始输入
- 明确展示 AI 结论
- 批准与拒绝按钮层级清楚
- 审批完成后关闭弹窗并刷新队列状态

## 16. 目录落地建议

推荐每个 app 采用 feature-based 组织：

```text
apps/doctor-web/src/
  app/
  pages/
  features/
    queue/
    calls/
    priority-review/
  components/
  stores/
  hooks/
```

```text
apps/display-screen/src/
  app/
  pages/
  features/
    broadcast/
    offline-announcement/
  components/
  stores/
```

```text
apps/patient-h5/src/
  app/
  pages/
  features/
    my-queue/
    priority-request/
    call-alert/
  components/
  stores/
```

## 17. 开发顺序建议

### 阶段 1

- 搭建共享设计 token
- 搭建 shared types
- 打通 API client

### 阶段 2

- 完成医生端基础控制台
- 完成大屏端广播界面
- 完成患者端个人状态页

### 阶段 3

- 接入 WebSocket 实时同步
- 接入断网状态管理
- 接入优先申请与医生审核弹窗

### 阶段 4

- 完成中英文切换
- 完成被叫号提醒
- 如时间允许，再接入双语语音播报

## 18. 验收检查点

### 18.1 架构层

- 三端能共享设计 token、类型定义和通信层
- 页面不直接散落 `fetch` 与 WebSocket 逻辑

### 18.2 状态层

- 刷新后可以恢复状态
- 重连后可以重新同步快照
- 断网时不会误显示为正常状态

### 18.3 页面层

- 医生端控制区逻辑清晰
- 大屏端主焦点始终是当前号码
- 患者端始终围绕“我的状态”展开
