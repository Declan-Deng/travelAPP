# 香港旅行导览

一个面向手机端的香港旅行规划 App，基于 `Expo + React Native` 构建。  
项目重点是把香港的一日游、三日游、五日游内容，整理成适合手机查看和操作的行程、地图与发现页。

## 项目现在是什么

当前版本不是网页套壳，也不是一堆静态页面拼起来的 Demo。

- 页面主体是 React Native 界面
- 内容数据已经整理进仓库，不依赖你本机额外文件才能运行
- 地图使用一套共享的 Leaflet 地图文档
  - Web 端通过 `iframe` 渲染
  - App 端通过 `WebView` 渲染

当前底部导航有 3 个主入口：

- `行程`：选择 `1 天 / 3 天 / 5 天` 方案，查看每日安排、路线逻辑、站点和出发信息
- `地图`：查看路线、聚焦单个景点、搜索地点、定位当前位置
- `发现`：查看区域索引、主题推荐、替代路线、图册和故事线

## 仓库结构

```text
.
├── App.tsx                         # 主界面、底部导航、弹层和页面状态
├── app.json                        # Expo 配置
├── index.ts                        # Expo 入口
├── assets/
│   ├── hongkong/                   # 景点图片
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── favicon.png
└── src/
    ├── components/
    │   ├── MapSurface.tsx
    │   ├── SharedMapFrame.tsx
    │   ├── SharedMapFrame.native.tsx
    │   └── SharedMapFrame.web.tsx
    ├── data/
    │   ├── hongKongData.ts
    │   └── hongKongSpots.json
    └── lib/
        ├── hongKong.ts
        ├── hongKongImages.ts
        └── sharedMapDocument.ts
```

## 运行前准备

建议环境：

- Node.js 20 或更高版本
- npm 10 或更高版本

先确认版本：

```bash
node -v
npm -v
```

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 启动 Expo 开发服务

```bash
npm start
```

启动后你会得到 Expo 的开发面板，可以选择：

- 用 `Expo Go` 在手机上预览
- 用 Android development build 运行真机版本
- 用浏览器快速看布局

## 常用命令

```bash
npm start
npm run web
npm run android
npm run ios
```

对应含义：

- `npm start`：启动 Expo 开发服务
- `npm run web`：浏览器预览，适合快速看布局，不建议作为最终验收方式
- `npm run android`：生成或更新 Android 原生目录并运行 Android development build
- `npm run ios`：生成或更新 iOS 原生目录并运行 iOS development build

## 推荐的调试方式

### 1. 只看 UI

如果只是检查布局、文案、层级和大部分交互：

```bash
npm start
```

然后用 `Expo Go` 打开项目即可。

### 2. 要验证定位或更接近真机行为

定位、原生权限和部分地图行为，建议用 Android development build：

```bash
npm run android
```

说明：

- 仓库里不长期保留 `android/` 和 `ios/` 目录
- 需要时由 Expo 重新生成
- 这也是为什么你第一次执行 `npm run android` 时，耗时会比 `Expo Go` 更长

## 数据与图片

运行这个仓库不需要额外下载原始资料。当前项目已经包含：

- 结构化的香港路线与景点数据：`src/data/`
- 图片资源：`assets/hongkong/`
- 景点图片映射：`src/lib/hongKongImages.ts`

也就是说，别人直接克隆仓库后就能运行，不需要再去找你本机的资料目录。

## 地图说明

地图不是原生 SDK，而是统一的一套共享地图文档：

- 逻辑集中在 `src/lib/sharedMapDocument.ts`
- Web 端和 App 端共用同一套点位和路线数据

这样做的目的，是让调试和展示时的地图表现尽量一致。  
需要注意的是，地图依赖外部底图和路线服务，网络状态会直接影响地图加载速度和路线几何结果。

## 如果你是第一次接手这个项目

建议按这个顺序看：

1. 先看 `App.tsx`
   这里掌握页面结构、底部导航、弹层和主要状态
2. 再看 `src/data/hongKongData.ts`
   这里是路线、图册、主题推荐和页面内容
3. 再看 `src/lib/hongKong.ts`
   这里是搜索、评分、开放时间、距离等整理逻辑
4. 最后看 `src/components/MapSurface.tsx` 和 `src/lib/sharedMapDocument.ts`
   这里是地图的显示与交互

## 当前仓库约定

- 项目以手机端为主，Web 预览只用于辅助开发
- 生成目录 `android/`、`ios/` 不提交到仓库
- 业务数据和图片都尽量保留在仓库内，避免依赖本机绝对路径
- 修改图片映射时，优先同步维护 `src/lib/hongKongImages.ts`

## 排错建议

### 地图加载慢或为空白

- 先确认网络是否正常
- 再确认开发机和手机能访问外部地图资源

### 手机定位没有返回

- 先确认系统定位服务已开启
- 再确认 App 已获得前台定位权限
- 如果是在 `Expo Go` 中遇到问题，优先用 development build 再验证一次

### Android 原生目录看不到

这是正常的。项目默认不提交 `android/`、`ios/`，需要时通过 Expo 重新生成。

