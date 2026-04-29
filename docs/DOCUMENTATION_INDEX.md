# 文档索引 | Documentation Index

本文档是 Grimoire Web 的文档地图。新增、移动或废弃文档时，请同步更新这里。

## 推荐阅读顺序

1. `README.md`: 了解项目定位、功能和本地启动方式。
2. `docs/PROJECT_STRUCTURE.md`: 确认当前仓库血统、部署绑定和目录职责。
3. `docs/ARCHITECTURE.md`: 阅读技术架构、数据流和核心模块。
4. `docs/DEPLOYMENT.md`: 部署到 Cloudflare Pages + Supabase。
5. `docs/TESTING.md`: 运行单元、集成和 E2E 测试。
6. `CHANGELOG.md`: 查看最近维护记录。

## 根目录文档

| 文档 | 用途 |
| --- | --- |
| `README.md` | 项目总览、功能概览、快速开始、文档入口 |
| `CHANGELOG.md` | 版本与维护记录 |
| `USER_GUIDE.md` | 玩家和普通用户上手指南 |
| `STORYTELLER_MANUAL.md` | 说书人操作手册和最佳实践 |
| `AGENTS.md` | 自动化代理在本仓库中的执行规范 |
| `.claude/DEPLOYMENT_STATUS.md` | 当前 Cloudflare/Supabase 部署状态记录 |

## 工程文档

| 文档 | 用途 |
| --- | --- |
| `docs/PROJECT_STRUCTURE.md` | 当前项目结构、仓库关系、部署绑定 |
| `docs/ARCHITECTURE.md` | 技术架构、数据流、核心模块说明 |
| `docs/CONTRIBUTING.md` | 贡献流程、代码规范、PR 检查 |
| `docs/DEPLOYMENT.md` | 生产部署步骤、环境变量、故障排查 |
| `docs/TESTING.md` | 测试策略、命令和覆盖率说明 |
| `docs/RELEASE_READINESS.md` | 发布前就绪度检查 |

## 运维与专项文档

| 文档 | 用途 |
| --- | --- |
| `docs/PERFORMANCE.md` | 性能优化措施 |
| `docs/PWA.md` | PWA、manifest、Service Worker 配置 |
| `docs/LIGHTHOUSE_OPTIMIZATION_GUIDE.md` | Lighthouse 优化建议 |
| `docs/SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md` | Supabase Edge Function 部署 |
| `docs/VAPID_KEY_GENERATION_GUIDE.md` | Web Push VAPID 密钥生成 |
| `docs/TEST_OFFLINE_OPERATIONS.md` | 离线操作测试计划 |
| `docs/TEST_PUSH_NOTIFICATIONS.md` | 推送通知测试计划 |
| `docs/DEPLOYMENT_GUIDE_v0.9.0.md` | v0.9.0 旧版部署指南，保留作历史参考 |
| `docs/analysis/performance-optimization-report.md` | 性能优化分析报告 |

## 规则与内容资料

| 路径 | 用途 |
| --- | --- |
| `blood-on-the-clocktower/trouble-brewing/complete-index.md` | Trouble Brewing 资料索引 |
| `blood-on-the-clocktower/trouble-brewing/complete-rules-manual.md` | Trouble Brewing 完整规则手册 |
| `blood-on-the-clocktower/trouble-brewing/storyteller-complete-guide.md` | Trouble Brewing 说书人指南 |
| `blood-on-the-clocktower/guides/*-complete-guide.md` | 单角色深度指南 |

## 归档资料

| 文档 | 用途 |
| --- | --- |
| `docs/aether-archive/README.md` | 记录从废弃 Grimoire-Aether 版本保留的代码片段 |
| `docs/aether-archive/*.ref` | 不可直接运行的参考实现，需要适配当前数据模型 |

## 自动化技能资料

`.codex/skills/` 下的 Markdown 是本地自动化技能的说明和参考资料，不是产品文档。只有在维护 Codex 技能、CI 修复流程或 Playwright 自动化流程时才需要阅读。
