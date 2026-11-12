# 岳佳驹 · 作品集

一个纯静态的个人作品集，包含自我介绍、工作经历、短剧作品、产品开发、游戏广告、产品广告和图像作品。

**线上地址：** https://yuejiaju-portfolio-live.pages.dev/

旧地址 `https://yuejiaju-portfolio.pages.dev/` 会 301 跳转到新地址。

## 部署结构

- 网页与图片：Cloudflare Pages（Git 集成）
- 原片视频：GitHub Release `media-v1`
- 视频播放：Pages Function `/media/*` 代理 Release 视频，支持 Range 拖动
- 清晰度：高清（默认）、流畅、原画；切换时保留播放进度
- 播放器：隐藏下载入口并禁用视频右键菜单
- 页面构建：`build.mjs` 输出到 `dist`

## 自动部署

推送到 GitHub `main` 分支后，Cloudflare Pages 会自动构建并发布：

```powershell
git add -A
git commit -m "Update portfolio"
git push
```

连接关系：`yuejiaju/portfolio` → `yuejiaju-portfolio-live` → `main`

## 手动发布（备用）

双击项目目录里的：

```text
publish.cmd
```

或在 PowerShell 中运行：

```powershell
.\publish.cmd
```

脚本会重新构建 `dist` 并直接部署到 `yuejiaju-portfolio-live`。

## 视频更新

视频不进入 Git 仓库。每个视频在 `media-v1` Release 中包含三个文件：

```text
<原文件名>.mp4        # 原画
<原文件名>-hd.mp4     # 高清，默认
<原文件名>-sd.mp4     # 流畅
```

替换同名资源即可；页面视频地址保持 `/media/<文件名>`。

## 构建

```powershell
node build.mjs
```

`dist` 为 Cloudflare Pages 的发布目录，构建时会把视频路径重写为同域 `/media/`。
