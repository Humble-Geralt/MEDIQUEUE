# MediQueue Frontend

`web/` 当前保留了这版 AI Studio 生成的单体 React + Vite 界面设计，但数据链路已经改成浏览器直接连接 FastAPI，不再依赖本地 Node mock 或兼容层。

## 1. 当前原则

- 保留现有视觉和组件结构，优先修正真实数据接入。
- 浏览器直接请求 FastAPI `REST /api/v1/*`。
- 浏览器直接连接 FastAPI `WS /ws/rooms/{roomNo}`。
- 前端通过 `src/lib/api-client.ts` 和 `src/hooks/useMediQueueBridge.ts` 把后端数据映射到当前 UI 所需的展示结构。

## 2. 启动方式

先启动后端：

```powershell
uv --directory api run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

再启动前端：

```powershell
cd web
npm install
```

四个入口可独立启动：

```powershell
npm run dev:doctor
npm run dev:tv
npm run dev:mobile
npm run dev:center
```

说明：
- `dev:doctor`、`dev:tv`、`dev:mobile` 会直接进入各自的全屏独立入口，不显示联动中心顶部 `MediQueue` 头栏、模式切换栏和底部页脚
- `dev` / `dev:center` 仍然保留三端联动中心壳层，便于统一联调和演示

也可以直接启动联动中心默认页：

```powershell
npm run dev
```

默认端口：

- `doctor`: `http://127.0.0.1:5173`
- `tv`: `http://127.0.0.1:5174`
- `mobile`: `http://127.0.0.1:5175`
- `center / sandbox`: `http://127.0.0.1:5176`

## 3. 视图模式

当前保留四种视图模式：

- `sandbox`
- `doctor`
- `tv`
- `mobile`

除了用不同脚本启动，也可以直接用查询参数切换：

```text
http://127.0.0.1:5176/?view=sandbox
http://127.0.0.1:5173/?view=doctor
http://127.0.0.1:5174/?view=tv
http://127.0.0.1:5175/?view=mobile
```

## 4. 环境变量

参考 [./.env.example](./.env.example)：

```env
VITE_API_BASE_URL="http://127.0.0.1:8000"
VITE_WS_BASE_URL="ws://127.0.0.1:8000"
VITE_ROOM_NO="101"
```

## 5. 当前数据流

- 首屏通过 `GET /api/v1/queue?roomNo=101` 获取队列快照。
- 实时事件通过 `WS /ws/rooms/101?role=display` 接收。
- 医生端操作直接调用：
  - `POST /api/v1/calls/next`
  - `POST /api/v1/calls/recall`
  - `POST /api/v1/calls/skip`
  - `POST /api/v1/calls/pause`
  - `POST /api/v1/calls/resume`
- 患者端优先申请调用 `POST /api/v1/priority-requests`。
- 医生审核调用 `POST /api/v1/priority-requests/{requestId}/review`。
- 联调重置调用 `POST /api/v1/dev/reset`。
- 前端收到 `call.started`、`call.recalled`、`priority.reviewed` 这类业务事件后，会主动请求 `POST /api/v1/tts` 生成语音并播放，不再使用浏览器本地 `speechSynthesis`。

## 6. 验证命令

```powershell
npm run lint
npm run build
```

## 7. 相关文档

- [../docs/design.md](../docs/design.md)
- [../docs/frontend_architecture.md](../docs/frontend_architecture.md)
- [../docs/backend_api_architecture.md](../docs/backend_api_architecture.md)
- [../api/README.md](../api/README.md)
