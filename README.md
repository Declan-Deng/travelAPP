# 泉州古城导览 App

这是泉州古城导览项目的 `Expo + React Native` 版本，面向手机端使用。

它保留了原来网页版的核心内容，但交互已经重组为 App 结构：

- `主线`：古城推荐步行线，按顺序查看站点、评分、开放参考和详情
- `地图`：查看主线、古城顺路景点和全域延伸景点，并支持搜索与聚焦
- `延伸`：按主题、行程建议和区域查看泉州外围玩法
- `指南`：查看图册、路线故事线、时间安排和出发信息

## 架构

这个项目不是把网页整页嵌进 App。

- App 外层界面使用 React Native 组件实现，入口在 `App.tsx`
- 景点数据和导览元数据在 `src/data/quanzhouData.ts`
- 数据整理、搜索、距离、评分和开放时间逻辑在 `src/lib/quanzhou.ts`
- 图片映射在 `src/lib/citywalkImages.ts`
- 地图使用一套共享的 Leaflet HTML 内核：
  - `src/lib/sharedMapDocument.ts` 生成地图文档
  - `src/components/SharedMapFrame.web.tsx` 在 Web 端通过 `iframe` 渲染
  - `src/components/SharedMapFrame.native.tsx` 在 App 端通过 `WebView` 渲染
  - `src/components/MapSurface.tsx` 负责地图外层信息浮窗、按钮和联动

也就是说，现在的结构是：

- 页面层：React Native
- 数据层：本地 TypeScript 数据与工具函数
- 地图层：Web / App 共用的一套地图内核

## 目录

- `App.tsx`
- `index.ts`
- `app.json`
- `assets/citywalk/`
- `src/components/`
- `src/data/`
- `src/lib/`

## 本地运行

先确认 Node 版本。Expo 54 建议使用较新的 Node 20+ 环境。

```bash
node -v
```

启动开发服务：

```bash
cd "/Users/declan/Documents/New project/quanzhou-citywalk-rn"
npm start
```

常用命令：

- `npm start`：启动 Expo 开发服务
- `npm run web`：在浏览器里预览
- `npm run android`：生成或更新 Android 原生目录并运行
- `npm run ios`：生成或更新 iOS 原生目录并运行

## 真机预览

当前最稳的预览方式是 `Expo Go`：

1. 电脑启动 `npm start`
2. 手机安装 `Expo Go`
3. 手机与电脑连同一网络，或通过 USB 反向代理连接 Expo 服务

## 说明

- `android/` 和 `ios/` 这类原生目录不作为项目主体保留；需要时可以通过 Expo 重新生成
- 当前重点是保证手机端界面、地图联动、搜索、评分和开放时间信息可用
- 地图依赖外部瓦片与 Leaflet 资源，网络条件会直接影响地图显示

## 已做清理

- 移除了未使用的导航和模糊依赖
- 删掉了本地生成的 `android/` 目录和项目内无关缓存文件
- README 已按当前实际结构重写
