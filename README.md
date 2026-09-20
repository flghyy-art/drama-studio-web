# 短剧工作室（drama-studio-web）

给创作者看项目、分集和正文的前端，不是空壳登录页。打开后**只走实时项目**：经 Vite 代理读本机 drama-skills 创作台的 `/api/projects`、`/api/tree`、`/api/file`，并把改过的 Markdown **写回**。没有样例模式，也不会在连不上创作台时回退到仓库里的样例正文。

## 能看到什么

- 项目首页：标题来自 `short-drama.json`，画幅 **9:16**，分集地图与状态徽标
- 各集三个页签：**剧本**（分场卡片）、**视觉设定**（人物 / 造型 / 地点 / 道具）、**分镜**（镜头卡片 + 冻结关键帧）
- 可切到 **编辑**：左侧改 Markdown，右侧即时看到解析卡片；保存走 `PUT /api/file` 乐观锁
- **灰度母版**：预览区和 9:16 画框改单色，方便先看构图与明暗，以后再换动漫 / 写实皮
- 数据来源写在页顶。创作台连不上时，页上会明确写出「创作台未接通」，**不会**用样例冒充正在编辑的项目

## 本机实时（接创作台）

创作台大致是：

```bash
python3 …/dashboard_server.py --workspace <工作区> --port 8787
```

会话地址形如 `http://127.0.0.1:8787/#<token>`。本前端的 `/api` 由 Vite 转到同一台机器上的创作台。

1. 复制 `.env.example` 为 `.env`，按实际端口改 `DASHBOARD_ORIGIN`：

   ```bash
   DASHBOARD_ORIGIN=http://127.0.0.1:8787
   ```

2. 启动前端：

   ```bash
   npm install
   npm run dev
   ```

   浏览器打开终端提示的本地地址。仓库 `base` 是 `/drama-studio-web/`，所以开发地址一般是 `http://127.0.0.1:5173/drama-studio-web/`。

3. 若创作台要会话 token，把同一个 `#token` 接到本页地址后面再打开一次（会 `POST /api/session`）。
4. 前端会列 `/api/projects`，优先打开 `yaofei-bus` 或标题含「姚飞」的项目，再按文件名找 `short-drama.json`、`分集地图.md`、各集 `剧本.md` / `视觉设定.md` / `分镜.md`。
5. 打开一集的 **剧本 / 视觉设定 / 分镜**，点「编辑」。首次进入编辑会再 `GET /api/file` 拿正文和 `version`（SHA-256）。改完点「保存」：

   ```http
   PUT /api/file?project=<id>&path=<相对路径>
   Content-Type: application/json

   { "content": "<全文>", "expectedVersion": "<载入时的 sha256>" }
   ```

   成功则用返回的新 `version` 刷新解析卡片。若创作台上文件已变，接口回 **409**，页上会提示重新载入，避免覆盖别人的稿。会话 token 与阅读相同（`POST /api/session` / cookie / 地址栏 `#token`），没有另做一套登录。

```bash
npm run build
npm run preview
```

预览同样走 `/api` 代理。

## Cloudflare 隧道

远程改稿时，不要把静态 `dist/` 单独挂出去却指望它自己找到本机创作台。正确路径是：

1. 本机创作台照常跑在 `DASHBOARD_ORIGIN`（默认 `8787`）。
2. 本机再跑 `npm run dev` 或 `npm run preview`，由 Vite 把 `/api` 转到创作台。
3. 用 Cloudflare Tunnel 指到 Vite（`127.0.0.1:5173` 或 `4173`），例如：

   ```bash
   cloudflared tunnel --url http://127.0.0.1:5173
   ```

4. 用隧道给出的 `https://….trycloudflare.com/drama-studio-web/` 打开。Vite 已允许隧道主机名；`/api` 仍由本机代理写回创作台。

也可以只隧道创作台，再自行把前端的 `/api` 反代过去。无论哪种，前端都只认实时接口，没有样例可切。

## 目录

```
src/api/                   实时拉取、写回、路径约定
src/lib/                   剧本 / 视觉 / 分镜解析
src/views/                 首页与三个阅读页
src/fixtures/yaofei-bus/   旧样例正文，应用不再加载
```

没有账号系统，也没有假的生成 / 投产按钮。缺某一集的正文时，页上会写出分集地图里已有的规划，而不是空白卡片。

## GitHub Pages

推到或合并进 `main` 后，Actions 会构建 `dist` 并发布到 Pages。打开中的 PR 只跑 `npm run build`，不会发布。预期地址：

`https://flghyy-art.github.io/drama-studio-web/`

仓库设置里若尚未开通 Pages：Settings → Pages → Source 选 **GitHub Actions**。前端用 hash 路由（`#/EP001/剧本`），子路径 `base` 不会把刷新打到 404。旧书签 `#/live/…`、`#/demo/…` 仍能打开对应集，但不再有样例模式。

Pages 是静态页，浏览器不能跨站调用你本机的 dashboard。打开后应看到「创作台未接通」和连接说明，**不会**再出现仓库样例正文。要阅读和写回，请在本机 `npm run dev`，或按上面用 Cloudflare 隧道接到 Vite。
