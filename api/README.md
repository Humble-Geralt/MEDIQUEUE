# MediQueue Backend API

MediQueue 后端采用 `Python 3.12 + FastAPI + Pydantic v2 + Uvicorn`。当前实现面向项目 MVP，负责为医生端、候诊大屏端、患者端提供统一的队列状态、优先申请处理和实时同步能力。

当前版本特点：
- 使用 `uv` 管理依赖和运行命令
- 使用内存 `store` 支持本地开发和演示
- 支持 REST API + WebSocket 双通道
- 优先申请分析当前基于 `MockLlmAdapter`
- 提供仅供演示环境使用的 `POST /api/v1/dev/reset` 用于重置 demo 队列

## 1. 快速启动

在仓库根目录执行：

```powershell
uv --directory api sync
uv --directory api run uvicorn main:app
```

默认会在 `http://127.0.0.1:8000` 启动服务。

开发态热更新：

```powershell
uv --directory api run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

启动后可先检查：
- 根路径：`GET /`
- 健康检查：`GET /api/v1/health`

## 2. 目录结构

```text
api/
  AGENTS.md
  README.md
  pyproject.toml
  uv.lock
  main.py
  adapters/
  core/
  routes/
  schemas/
  services/
  store/
```

各层职责：
- `main.py`：应用入口、中间件、异常处理、路由注册
- `routes/`：HTTP / WebSocket 入口，保持轻量
- `services/`：业务规则、快照构建、队列状态流转
- `schemas/`：请求体、响应体、共享模型
- `store/`：当前 MVP 的内存存储
- `adapters/`：LLM 等外部能力适配层
- `core/`：配置、枚举、错误定义

## 3. 当前能力范围

已实现：
- 获取完整候诊队列快照
- 获取患者个人队列视图
- 医生叫下一位、跳过当前、暂停叫号、恢复叫号
- 患者提交紧急优先申请
- 医生审核优先申请
- WebSocket 广播队列和叫号状态变更
- 演示环境重置队列

当前未做：
- 持久化数据库
- 真实 LLM 服务接入
- 护士端、管理后台、审计系统
- HIS / EMR 集成

## 4. API 概览

当前已落地接口：
- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/queue?roomNo=101`
- `GET /api/v1/patients/{patient_id}/queue-view`
- `POST /api/v1/calls/next`
- `POST /api/v1/calls/recall`
- `POST /api/v1/calls/skip`
- `POST /api/v1/calls/pause`
- `POST /api/v1/calls/resume`
- `POST /api/v1/priority-requests`
- `POST /api/v1/priority-requests/{request_id}/review`
- `POST /api/v1/tts`
- `POST /api/v1/dev/reset`
- `WS /ws/rooms/{room_no}`

TTS and realtime notes:
- queue-related WebSocket events now only broadcast business facts such as `call.started`, `call.recalled`, and `priority.reviewed`
- the frontend requests `POST /api/v1/tts` after receiving those events when it needs spoken audio
- `POST /api/v1/tts` accepts a plain `text` field and returns a generated clip payload with `text`, `audioBase64`, and optional `url`

接口约定：
- REST 基础前缀为 `/api/v1`
- 统一响应结构为 `success / data / error / meta`
- 对外 JSON 字段保持 camelCase
- 修改类接口优先使用 `expectedSnapshotVersion` 做乐观并发控制

## 5. 演示开发接口

`POST /api/v1/dev/reset`

用途：
- 仅供联调中心和本地演示使用
- 将内存队列恢复为初始 mock 数据
- 清空当前叫号、暂停状态和优先申请队列

请求体示例：

```json
{
  "roomNo": "101"
}
```

该接口执行成功后，后端会广播一次 `queue.updated`，使医生端、大屏端、患者端立即回到统一初始状态。

## 6. 运行与验证命令

常用命令：

```powershell
uv --directory api sync
uv --directory api run uvicorn main:app
uv --directory api run uvicorn main:app --reload
uv --directory api run --no-cache python -m compileall .
```

说明：
- 所有后端命令都建议从仓库根目录执行
- 依赖变更后应保持 `pyproject.toml` 与 `uv.lock` 同步
- 当前最小验证基线是 `compileall`

## 7. 协作规则

后端目录已按层级补齐 `AGENTS.md`。开始修改前，至少应阅读：
- 当前目录规则：[./AGENTS.md](./AGENTS.md)

如果要修改更深层目录，还要继续读取对应子目录下的 `AGENTS.md`，例如：
- 路由层：[./routes/AGENTS.md](./routes/AGENTS.md)
- 服务层：[./services/AGENTS.md](./services/AGENTS.md)
- 模型层：[./schemas/AGENTS.md](./schemas/AGENTS.md)

## 8. 相关文档

- 后端架构说明：[../docs/backend_api_architecture.md](../docs/backend_api_architecture.md)
- 前端架构说明：[../docs/frontend_architecture.md](../docs/frontend_architecture.md)
- 产品需求文档：[../docs/prd_v2.md](../docs/prd_v2.md)
- 仓库总说明：[../README.md](../README.md)
