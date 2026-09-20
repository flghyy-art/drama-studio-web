# 短剧工作室（drama-studio-web）

给创作者看项目、分集和正文的前端，不是空壳登录页。默认打开仓库里的 **yaofei-bus / 姚飞·公交资源暴露** 样例；本机 drama-skills 创作台在跑时，可切到实时模式，经 Vite 代理读 `/api/projects`、`/api/tree`、`/api/file`。

## 能看到什么

- 项目首页：标题来自 `short-drama.json`，画幅 **9:16**，EP001–EP004 分集地图与状态徽标
- EP001 三个页签：**剧本**（分场卡片）、**视觉设定**（人物 / 造型 / 地点 / 道具）、**分镜**（镜头卡片 + 冻结关键帧）
- **灰度母版**：预览区和 9:16 画框改单色，方便先看构图与明暗，以后再换动漫 / 写实皮
- 数据来源写在页顶。实时连不上时会说明原因，并回退到样例，不会假装「正在生成」

## 样例模式（默认）

不需要本机创作台。

```bash
npm install
npm run dev
```

浏览器打开终端提示的本地地址。仓库 `base` 是 `/drama-studio-web/`，所以开发地址一般是 `http://127.0.0.1:5173/drama-studio-web/`。左上角保持「样例」。首页应出现《姚飞·公交资源暴露》，点 EP001 可读三份已写入的 Markdown。

```bash
npm run build
npm run preview
```

## 实时模式（接本机创作台）

创作台大致是：

```bash
python3 …/dashboard_server.py --workspace <工作区> --port 8787
```

会话地址形如 `http://127.0.0.1:8787/#<token>`。本前端的 `/api` 由 Vite 转到同一台机器上的创作台。

1. 复制 `.env.example` 为 `.env`，按实际端口改 `DASHBOARD_ORIGIN`：

   ```bash
   DASHBOARD_ORIGIN=http://127.0.0.1:8787
   ```

2. 重启 `npm run dev`（或 `npm run preview`，预览同样走代理）。
3. 点页顶「实时」。若创作台要会话 token，把同一个 `#token` 接到本页地址后面再打开一次（会 `POST /api/session`）。
4. 前端会列 `/api/projects`，优先打开 `yaofei-bus` 或标题含「姚飞」的项目，再按文件名找 `short-drama.json`、`分集地图.md`、各集 `剧本.md` / `视觉设定.md` / `分镜.md`。

代理只在开发 / preview 服务器上生效。静态托管 `dist/` 时，请自行把 `/api` 反代到创作台，或继续用样例。

## 目录

```
src/fixtures/yaofei-bus/   样例 JSON 与 EP001 Markdown
src/api/                   样例装配、实时拉取、路径约定
src/lib/                   剧本 / 视觉 / 分镜解析
src/views/                 首页与三个阅读页
```

没有账号系统，也没有假的生成队列。缺某一集的正文时，页上会写出分集地图里已有的规划，而不是空白卡片。

## GitHub Pages

合并到 `main` 后，Actions 会构建 `dist` 并发布到 Pages。预期地址：

`https://flghyy-art.github.io/drama-studio-web/`

仓库设置里若尚未开通 Pages：Settings → Pages → Source 选 **GitHub Actions**。前端用 hash 路由（`#/demo/EP001/剧本`），子路径 `base` 不会把刷新打到 404。

Pages 上只有**样例**正文。浏览器不能跨站调用你本机的 dashboard；要走实时模式，请在本机 `npm run dev`，用 Vite 代理。
