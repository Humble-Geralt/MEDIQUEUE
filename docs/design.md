# MediQueue 前端 UI/UX 设计文档

## 1. 文档目标

本文档基于 [prd_v2.md](./prd_v2.md)，定义 MediQueue 在 `医生端 Web`、`候诊大屏端`、`患者端 H5` 三个终端上的统一设计语言、视觉风格、交互原则与关键组件规范，供设计与前端开发直接落地。

## 2. 整体设计方向

### 2.1 设计主题

整体视觉主题定义为：`Clinical Signal System`

这不是传统“医院白底蓝字”的普通后台，而是一套更像“高可读交通信号系统 + 稳定医疗界面”的混合风格：

- 信息优先，装饰克制
- 可信、冷静、明确
- 重点状态要像信号灯一样一眼识别
- 不追求花哨感，追求低认知负担和强可读性

### 2.2 关键词

- Calm
- Precise
- High Contrast
- Reassuring
- Signal-driven
- Bilingual-ready

### 2.3 三端统一的设计原则

1. 数字优先于文字。号码、前方人数、诊室号必须是视觉第一层级。
2. 状态优先于布局。当前叫号、暂停、断网、被叫到等状态必须一眼可见。
3. 公共终端强调远距可读，个人终端强调焦虑缓释，医生终端强调操作效率。
4. 中文与英文要并存，但不挤占主信息层级。
5. 断网不是隐性错误，而是显性状态，必须高亮提示。

## 3. 视觉系统

### 3.1 配色系统

采用“深蓝墨色 + 医疗青绿 + 琥珀提醒 + 急诊红”的语义配色。

| 语义 | 色值 | 用途 |
| --- | --- | --- |
| `ink-950` | `#0E1A2B` | 医生端主背景、大屏深色背景 |
| `ink-800` | `#1C2A3D` | 卡片深底、次级容器 |
| `fog-50` | `#F5F7FA` | 患者端浅色背景、页面底色 |
| `fog-100` | `#E9EEF4` | 分割线、浅卡片底 |
| `teal-500` | `#22B8A7` | 正常状态、主行动按钮 |
| `teal-600` | `#14907F` | 主行动 hover/pressed |
| `amber-500` | `#F4B740` | 当前叫号高亮、提醒态 |
| `amber-600` | `#D99214` | 强提醒边框、闪烁态 |
| `red-500` | `#E25555` | 紧急、拒绝、异常 |
| `blue-500` | `#4A90E2` | 信息态、英文辅助标签 |
| `green-500` | `#2EBD85` | 通过、成功、已就诊 |
| `white` | `#FFFFFF` | 深底文字 |
| `slate-700` | `#465468` | 浅底正文 |

### 3.2 语义状态颜色

| 状态 | 颜色 | 说明 |
| --- | --- | --- |
| 当前叫号 | `amber-500` | 最强视觉焦点 |
| 普通等待 | `teal-500` | 平稳、常规 |
| 已跳过 | `slate-700` | 降权展示 |
| 已完成 | `green-500` | 正向完成 |
| AI 建议优先 | `red-500` | 高风险提醒，不代表已批准 |
| 暂停叫号 | `blue-500` | 控制态，不是异常态 |
| 网络断开 | `red-500` + `amber-500` | 必须强提示 |

### 3.3 设计 Token

```css
:root {
  --mq-ink-950: #0E1A2B;
  --mq-ink-800: #1C2A3D;
  --mq-fog-50: #F5F7FA;
  --mq-fog-100: #E9EEF4;
  --mq-teal-500: #22B8A7;
  --mq-teal-600: #14907F;
  --mq-amber-500: #F4B740;
  --mq-amber-600: #D99214;
  --mq-red-500: #E25555;
  --mq-blue-500: #4A90E2;
  --mq-green-500: #2EBD85;
  --mq-white: #FFFFFF;
  --mq-slate-700: #465468;

  --mq-radius-sm: 10px;
  --mq-radius-md: 16px;
  --mq-radius-lg: 24px;

  --mq-shadow-soft: 0 12px 30px rgba(14, 26, 43, 0.08);
  --mq-shadow-strong: 0 18px 60px rgba(14, 26, 43, 0.18);

  --mq-space-1: 4px;
  --mq-space-2: 8px;
  --mq-space-3: 12px;
  --mq-space-4: 16px;
  --mq-space-5: 24px;
  --mq-space-6: 32px;
  --mq-space-7: 48px;
}
```

## 4. 字体与排版

### 4.1 字体策略

考虑中英文混排与远距识别，建议采用“双字体策略”：

- 中文主字体：`Noto Sans SC`, `Source Han Sans SC`, `Microsoft YaHei`, `sans-serif`
- 英文与数字强调字体：`DIN Condensed`, `Bahnschrift Condensed`, `Roboto Condensed`, `sans-serif`

使用原则：

- `号码`、`前方人数`、`诊室号` 使用英文数字强调字体
- `中文正文` 使用中性无衬线字体，保证可读
- `英文辅助标签` 使用较窄的 condensed 字体，提高空间利用率

### 4.2 字号层级

| 层级 | 用途 | 建议字号 |
| --- | --- | --- |
| Display XXL | 大屏当前号码 | `96px - 160px` |
| Display XL | 患者端我的号码 | `56px - 72px` |
| Heading L | 医生端当前患者 | `32px - 40px` |
| Heading M | 区块标题 | `24px - 28px` |
| Body L | 主要正文 | `18px - 20px` |
| Body M | 辅助说明 | `14px - 16px` |
| Caption | 英文副标签/状态 | `12px - 13px` |

### 4.3 命名与脱敏规则

- 公共场景姓名使用 `李X伟 先生 / 刘X菲 女士`
- 患者 H5 内显示本人全名
- 医生端显示全名，便于判断

## 5. 布局与空间系统

### 5.1 栅格

- 医生端：`12-column desktop grid`
- 大屏端：`3-block broadcast layout`
- 患者端：`4px baseline + 单列卡片流`

### 5.2 间距原则

- 重要信息块间距必须大于普通列表间距
- 操作按钮之间最少 `12px`
- 大屏端的“当前号码”与“候诊列表”之间保留明显视觉切分

### 5.3 圆角与边框

- 医生端：`16px` 圆角，专业、稳定
- 患者端：`20px - 24px` 圆角，更柔和，降低焦虑
- 大屏端：主容器可用 `24px` 或无圆角，偏广播屏风格

## 6. 动效与反馈

### 6.1 动效原则

- 动效只服务于“状态被注意到”
- 不做炫技型过度 motion
- 当前叫号和断网提示允许更强节奏感

### 6.2 建议动效

- 当前叫号号码：`1.2s` 呼吸高亮
- 被叫号提醒：遮罩淡入 + 卡片上浮
- 断网 Banner：轻微脉冲或跑马灯，不要频闪
- 列表顺序更新：`180ms - 240ms` 平滑过渡

## 7. 共享组件规范

### 7.1 StatusChip

用途：显示 `WAITING / CALLED / SKIPPED / OFFLINE / PAUSED`

样式规则：

- 高度 `28px - 32px`
- 圆角胶囊
- 纯色底 + 高对比文字

示例：

```tsx
type StatusChipProps = {
  tone: "waiting" | "called" | "paused" | "offline" | "skipped";
  children: React.ReactNode;
};

export function StatusChip({ tone, children }: StatusChipProps) {
  return <span className={`mq-chip mq-chip--${tone}`}>{children}</span>;
}
```

```css
.mq-chip {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.mq-chip--waiting { background: rgba(34, 184, 167, 0.14); color: var(--mq-teal-600); }
.mq-chip--called { background: rgba(244, 183, 64, 0.18); color: var(--mq-amber-600); }
.mq-chip--paused { background: rgba(74, 144, 226, 0.16); color: var(--mq-blue-500); }
.mq-chip--offline { background: rgba(226, 85, 85, 0.16); color: var(--mq-red-500); }
.mq-chip--skipped { background: rgba(70, 84, 104, 0.14); color: var(--mq-slate-700); }
```

### 7.2 CurrentCallHero

用途：大屏端和医生端共同使用的“当前叫号主卡片”

设计要求：

- 号码绝对主视觉
- 诊室号作为次主信息
- 姓名脱敏逻辑可配置
- 当前状态高亮描边

### 7.3 OfflineBanner

用途：三端统一的断网展示

示例：

```html
<section class="mq-offline-banner" role="alert">
  <strong>网络连接异常</strong>
  <span>当前显示的是断网前最新队列状态，请听从现场工作人员或护士指引。</span>
</section>
```

```css
.mq-offline-banner {
  display: grid;
  gap: 6px;
  padding: 14px 18px;
  border-left: 5px solid var(--mq-red-500);
  background: linear-gradient(90deg, rgba(226,85,85,.16), rgba(244,183,64,.12));
  color: var(--mq-white);
}
```

### 7.4 PriorityReviewModal

用途：医生端审核紧急优先申请

必含信息：

- 患者号码
- 患者姓名
- 原始输入
- AI 结论
- AI 解释
- 批准 / 不批准按钮

交互重点：

- 风险信息区使用 `red-500`
- 原始描述区要像病情摘要卡，而不是输入框
- 批准按钮与拒绝按钮要有明确层级差异

## 8. 各端设计要求

### 8.1 医生端 Web

#### 8.1.1 风格方向

`Control Desk / Clinical Console`

医生端应更像一个可靠的控制台，而不是营销式仪表板：

- 深色底更利于长时间观看
- 重点操作按钮稳定、明确
- 列表信息密度高于其他端，但仍要克制

#### 8.1.2 推荐布局

- 左侧：当前叫号卡 + 主操作按钮
- 右侧：待叫列表 + 紧急申请提示区
- 顶部：诊室信息、在线状态、语言切换、断网提示

#### 8.1.3 医生端特有要求

- “呼叫下一位”按钮必须是全局第一操作
- “跳过当前”是次级按钮，避免误触
- “暂停叫号”使用蓝色控制态，不和危险态混淆
- 当有待审核优先申请时，顶部或右侧出现红色提醒入口

### 8.2 候诊大屏端

#### 8.2.1 风格方向

`Broadcast Signal Board`

大屏端要像机场/车站广播看板，但语气更温和、颜色更医疗化。

#### 8.2.2 推荐布局

- 顶部：医院/诊室信息、当前系统状态
- 中部左：当前叫号超大号码
- 中部右：当前患者姓名 + 诊室
- 底部：等候队列前 5 位

#### 8.2.3 大屏端特有要求

- 视觉上只允许一个主焦点：当前号码
- 当前号码和诊室必须支持远距辨认
- 等候队列不要超过 5 人
- 断网时自动切换为“状态公告优先”

### 8.3 患者端 H5

#### 8.3.1 风格方向

`Calm Companion`

患者端应该像一个低压力、随身陪伴式的候诊卡片界面：

- 柔和底色
- 更大的留白
- 强调“我的状态”，而不是整个系统状态

#### 8.3.2 推荐布局

- 顶部：语言切换、连接状态
- 中部：我的号码大卡片
- 下部：前方人数、预计等待时间、诊室号
- 底部：紧急优先申请入口

#### 8.3.3 患者端特有要求

- “我的号码”必须是页面视觉中心
- 被叫号时启用全屏提醒层
- 紧急优先申请输入框要有示例占位文案
- 驳回反馈要简洁、低刺激，不做红色大面积恐吓

## 9. 中英文展示规范

### 9.1 文案层级

- 中文为主、英文为辅
- 公共场景英文放在中文下方或右侧小一级展示
- 患者端可根据语言偏好切到英文主界面

### 9.2 示例

| 中文 | 英文 |
| --- | --- |
| 当前叫号 | Current Call |
| 前方人数 | People Ahead |
| 预计等待时间 | Estimated Wait |
| 暂停叫号 | Call Paused |
| 网络连接异常 | Network Offline |

## 10. 组件实现建议

### 10.1 推荐技术方式

- 统一使用设计 token 驱动样式
- 优先 CSS Variables + 语义 class
- React 项目中组件层只接受语义 props，不直接传原始颜色值

### 10.2 目录建议

```text
src/
  design/
    tokens.css
    typography.css
  components/
    StatusChip.tsx
    CurrentCallHero.tsx
    OfflineBanner.tsx
    PriorityReviewModal.tsx
  features/
    doctor/
    display/
    patient/
```

## 11. 验收标准

### 11.1 视觉验收

- 大屏端当前号码在远距离依然可识别
- 医生端主操作层级清楚，不会误认按钮优先级
- 患者端“我的号码”和“前方人数”一眼可见

### 11.2 交互验收

- 当前叫号状态变更时，三端都能感知到明显反馈
- 断网状态出现时，三端都能第一时间看到异常提示
- 医生审核优先申请流程在视觉上清晰、闭环完整

### 11.3 无障碍验收

- 深浅背景文字对比度充足
- 关键状态不只靠颜色传达
- 重要按钮可在触摸和桌面环境下稳定点击
