# TimePost

基于 **React 19** + **Cloudflare Workers** (Hono.js) 的定时邮件发送服务。

## 功能特性

- **邮件编写** — WYSIWYG 富文本编辑器（TipTap），实时左右分屏预览
- **定时发送** — 精确到小时，Cloudflare Cron 每小时自动触发
- **联系人管理** — 每用户独立，支持标签与备注，可从联系人中选择收件人（支持多收件人）
- **邮件模板** — 公开（全员可读）或私有，一键应用到编辑器
- **邮件管理** — 草稿 / 定时中 / 已发送分标签管理，定时前可修改内容、修改时间、取消定时
- **用户认证** — 邮箱/密码登录、注册、登出、密码重置
- **双因素认证 (2FA)** — TOTP（验证器应用）、Passkey（WebAuthn 生物识别）、邮箱 OTP
- **管理后台** — 用户管理（角色、启用/禁用、模拟登录）、系统设置、邮件配置、安全设置
- **用户设置** — 语言切换（中/英）、明暗主题切换、时区设置、会话管理
- **国际化 (i18n)** — 中文和英文，自动检测浏览器语言

## 技术栈

- **前端**: React 19, Vite, Tailwind CSS v4, shadcn/ui, React Router v7, react-i18next, TipTap
- **后端**: Cloudflare Workers, Hono.js, D1 (SQLite), KV, Cloudflare Cron
- **认证**: JWT (access + refresh token, HttpOnly Cookie), bcrypt, WebAuthn

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 Wrangler

编辑 `worker/wrangler.toml`：
- 设置你的 `account_id`
- 创建 D1 数据库并设置 `database_id`
- 创建 KV 命名空间并设置其 `id`
- 设置 `JWT_SECRET`（随机 32 位以上字符串）
- 设置 `SETUP_SECRET`（用于数据库初始化的随机字符串）
- 设置 `TABLE_PREFIX`（可选，表名前缀，如 `timepost_`，留空则不加前缀）

### 3. 初始化数据库

```bash
# 先部署，然后调用 setup 接口：

# 方式一：GET（secret 在 URL 中）
curl https://your-worker.workers.dev/api/setup/your-setup-secret

# 方式二：POST（secret 在请求头中）
curl -X POST https://your-worker.workers.dev/api/setup \
  -H "X-Setup-Secret: your-setup-secret"
```

### 4. 启动开发

```bash
pnpm dev
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥（随机 32 位以上字符串） |
| `SETUP_SECRET` | 调用 setup 接口的密钥 |
| `TABLE_PREFIX` | 可选，所有数据库表名的前缀（如 `timepost_`） |

> 本地开发时直接在 `worker/wrangler.toml` 的 `[vars]` 中配置；CI/CD 部署时通过 GitHub Secrets/Variables 注入。

## 部署

### 手动部署

```bash
pnpm deploy
```

### CI/CD 自动部署

项目包含 GitHub Actions 工作流：

- **Deploy** — 推送到 `main` 分支时自动部署到 Cloudflare Workers
- **Release** — 推送 `v*` 标签时自动创建 GitHub Release
- **Tag** — 手动触发创建语义化版本标签

需要在 GitHub 仓库中配置以下 Secrets 和 Variables：

| 类型 | 名称 | 说明 | 必须 |
|------|------|------|------|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌 | 是 |
| Secret | `PAT_TOKEN` | 用于创建标签的 Personal Access Token | 否¹ |
| Secret | `JWT_SECRET` | JWT 签名密钥 | 是 |
| Secret | `SETUP_SECRET` | 数据库初始化密钥 | 是 |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | 是 |
| Variable | `D1_DATABASE_NAME` | D1 数据库名称 | 是 |
| Variable | `D1_DATABASE_ID` | D1 数据库 ID | 是 |
| Variable | `KV_NAMESPACE_ID` | KV 命名空间 ID | 是 |
| Variable | `TABLE_PREFIX` | 数据库表名前缀 | 否² |

¹ 仅在使用 Tag 工作流时需要。  
² 通过表名前缀可实现多项目共用同一个 D1 数据库。

## 项目结构

```
├── .github/
│   └── workflows/          # GitHub Actions 工作流
├── web/                    # 前端项目
│   └── src/
│       ├── components/     # 通用组件
│       │   ├── contacts/   # ContactSelector、ContactForm
│       │   ├── editor/     # RichTextEditor（TipTap）、EmailPreview
│       │   └── ui/         # shadcn/ui 基础组件
│       ├── hooks/          # useAuth
│       ├── layouts/        # AppLayout（含导航）
│       ├── locales/        # zh.json、en.json
│       ├── pages/
│       │   ├── admin/      # 管理后台
│       │   ├── auth/       # 登录、注册、2FA 等
│       │   ├── contacts/   # 联系人管理
│       │   ├── emails/     # 邮件列表、邮件编辑器
│       │   ├── home/       # 首页
│       │   ├── settings/   # 用户设置
│       │   ├── templates/  # 模板管理
│       │   └── about/      # 关于
│       ├── lib/            # api、i18n、utils
│       └── types/          # 类型定义
├── worker/                 # 后端项目
│   └── src/
│       ├── routes/         # auth、contacts、emails、templates、admin、me、setup
│       ├── core/           # 认证、时间工具
│       ├── middleware/     # 认证、管理员、限流
│       ├── db/
│       │   ├── queries/    # contacts、emails、templates、users、settings、twofa
│       │   └── schema.sql  # 数据库 Schema
│       └── services/       # 邮件发送、2FA
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```
