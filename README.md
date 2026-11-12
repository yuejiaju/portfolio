# 岳佳驹 · 作品集

一个纯静态的个人作品集，包含自我介绍、工作经历、短剧作品、产品开发、游戏广告、产品广告和图像作品。

**线上地址：** https://yuejiaju-portfolio.pages.dev/

## 部署结构

- 网页与图片：Cloudflare Pages
- 原片视频：GitHub Release `media-v1`
- 视频播放：Pages Function `/media/*` 代理 Release 原片，支持 Range 拖动
- 页面构建：`build.mjs` 输出到 `dist`

## 本地修改后同步

双击项目目录里的：

```text
publish.cmd
```

或在 PowerShell 中运行：

```powershell
.\publish.cmd
```

脚本会重新构建 `dist` 并部署到 Cloudflare Pages。

> 当前 Cloudflare 项目是 Direct Upload。若需要 Git push 后全自动部署，需要在 Cloudflare 中新建一个连接 GitHub 仓库的 Pages 项目。

## 视频更新

视频不进入 Git 仓库。替换 `media-v1` Release 中的同名资源即可；页面视频地址保持 `/media/<文件名>`。

## 构建

```powershell
node build.mjs
```

`dist` 为 Cloudflare Pages 的发布目录，构建时会把视频路径重写为同域 `/media/`。
