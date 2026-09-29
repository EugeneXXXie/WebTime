# WebTime

[English](README.md) · **简体中文**

![WebTime 深色首页，使用合成演示数据](docs/images/dashboard-dark.png)

<details>
<summary>更多截图：浅色设置与 Popup</summary>

![WebTime 浅色设置](docs/images/settings-light.png)

<img src="docs/images/popup-light.png" alt="WebTime 浅色 Popup，使用合成演示数据" width="380">

</details>

截图来自真实浏览器渲染，使用合成演示数据，不代表个人浏览记录。

一个零运行时依赖、Manifest V3、本地优先的浏览器使用时间扩展。原生 JavaScript / HTML / CSS，无需构建、安装 npm 依赖或注册账户。

## 安装

1. 在 Chrome 打开 `chrome://extensions`（Edge 使用 `edge://extensions`）。
2. 开启「开发者模式」，点击「加载已解压的扩展程序」。
3. 选择本 README 所在的 项目根文件夹（名称可以是 `webtime` 或 `screen-time`），确保该文件夹直接包含 `manifest.json`。
4. 将 WebTime 固定在工具栏。正常浏览网页后，点击扩展图标，再点击 **Open Dashboard**。

要求 Chrome / Chromium 120+。首次安装的数据为空；不会向真实记录写入演示数据。

## 功能

- Today：今日总时间、昨日变化、网站数、会话数、平均会话、24 小时活动、网站排行与占比、联动环图、最近七天。
- 7 Days / 30 Days：包含今天的滚动周期、每日平均、每日活动、周期网站排行、最近七天的逐小时 Browser Rhythm。
- Websites：全部历史网站、搜索、按时间 / 最近访问 / 名称排序、30 天网站详情。
- 独立 Popup、Dark / Light / System、Full / Reduced / Off 动画、键盘焦点与图表提示。
- JSON 导出、严格校验且需确认的替换导入、二次确认清空。
- 统计页面每 5 秒取得最新快照，实时状态秒级显示；更新保留现有 DOM 与键盘焦点。

## 统计口径与准确性边界

只累计 **正常浏览器窗口有焦点 + 激活标签页为 HTTP(S) + 系统 idle 状态为 active** 的时间。内部页面、扩展页面、文件页面、无焦点窗口和无痕标签页不计时。多个窗口只统计当前获得焦点的一个。

默认 60 秒无键鼠输入后暂停，可改为 30 / 60 / 120 / 300 秒。该阈值之前的时间会计入。持续看视频但没有输入，也会按阈值暂停；本扩展不申请内容脚本权限来判断媒体状态。这里的“实际使用”是浏览器 API 可观察的活动状态，并非目光或注意力检测。

- 按本机当地日期和小时拆分间隔；移除域名前导 `www.`，其他子域保持独立。不合并 `google.com` 与 `google.co.jp`。
- 会话指连续浏览同一域名的一段时间；同域切换 URL 不新建会话。失焦、idle、域名切换和恢复中断会开始新会话。会话数归于会话开始日期。
- 服务线程运行时每 20 秒保存，浏览器事件触发时保存，并设 30 秒 alarm 作恢复保障。总量与检查点在同一个 storage key 中原子保存。
- `storage.session` 的标记区分后台线程重启和浏览器重启，避免把浏览器关闭期间计入历史。
- Chrome 不保证定时唤醒；间隔超过 45 秒或系统时钟倒退时，丢弃无法可靠确认的整段间隔。异常崩溃可能损失最后一个未保存周期；后台严重节流时可能少计。不会声称在休眠/崩溃场景能做到秒级绝对准确。
- 历史按记录当时的本地日期保留；更改系统时区不会重新划分旧记录。
- 保存使用 Chrome 默认本地配额，不额外申请 unlimitedStorage。配额错误会保留已有磁盘数据并返回错误；备份导入限 8 MB。

官方依据：[Service Worker 生命周期](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)、[Alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)、[Idle](https://developer.chrome.com/docs/extensions/reference/api/idle)、[本地 favicon API](https://developer.chrome.com/docs/extensions/how-to/ui/favicons)。

## 隐私与权限

所有统计仅写 `chrome.storage.local`。不读取历史、不上传数据、不使用远端字体/脚本/图标、无账号、无服务器、无遥测。只保存域名、由域名确定的显示名、每日/每小时秒数、会话数与最后统计时间。不保存访问路径、query、完整 URL、网页标题或 favicon URL。

权限只有：

| 权限    | 用途                                |
| ------- | ----------------------------------- |
| tabs    | 确定当前活动标签页的域名            |
| idle    | 检测系统 idle / locked              |
| storage | 本地统计与浏览器会话标记            |
| alarms  | 后台定期检查点与恢复                |
| favicon | 从浏览器自己的 favicon 缓存显示图标 |

favicon 通过扩展的 `_favicon` 端点查询，仅传域名根地址，不直接加载网站的 `favIconUrl`，避免任意远端图标请求；失败则显示首字母。没有第三方 favicon API。CSP 禁止网络连接和远端脚本。

## 本地预览

在此目录执行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8765/dashboard/index.html?demo` 查看明确标注的合成演示数据。去掉 `?demo` 是空状态预览。普通网页预览不会计时；安装扩展才会启用浏览器 API。演示设置仅在当前页面内存中保存。

## 开发与验证

扩展运行时不需要 Node、npm 或构建。贡献者使用 Node.js 22+：

```sh
npm ci
npm test
npx playwright install chromium
npm run test:ui
npm run test:extension
npm run format:check
```

Linux 可使用 `npx playwright install --with-deps chromium`。测试默认使用 Playwright 安装的完整 Chromium；可以用 `CHROME_PATH` 环境变量指定现代 Chrome。开发依赖不会成为扩展运行依赖。

测试截图位于被 Git 忽略的 `tests/artifacts/`；README 展示图位于 `docs/images/`。完整测试范围与人工验收步骤见 [测试说明](TESTING.md)。

## 从 ScreenTime 更新

在相同目录、相同扩展 ID 下重新加载即可。此改名不修改存储键或 version-1 数据格式，旧版 JSON 备份仍可导入。新导出文件名为 `webtime-backup-YYYY-MM-DD.json`。如果更换安装目录或扩展 ID，应先导出、再在新安装中导入备份。

## 开源

采用 [MIT 许可证](LICENSE)。欢迎提交 Issue / PR；参见 [贡献指南](CONTRIBUTING.md)、[隐私说明](PRIVACY.md)、[安全报告](SECURITY.md)和[更新记录](CHANGELOG.md)。

## 文件结构

```text
manifest.json              扩展清单
background/service-worker.js  浏览器事件、串行写入、恢复
tracking/core.js           域名处理、时间分桶、汇总、备份验证
storage/storage.js        原子本地存储封装
shared/                   共用样式、格式化、主题、图标、提示
dashboard/                导航、页面、自定义 SVG 图表
popup/                    工具栏弹窗
settings/                 设置、导入导出与确认弹窗
assets/icons/             本地扩展图标
tests/                    逻辑、浏览器及扩展测试
```
