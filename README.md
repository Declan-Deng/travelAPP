# 香港旅行导览 App

这是一个面向手机端的 `Expo + React Native` 旅行导览项目，主题已经切换为香港。

现在的核心结构是：

- `行程`：按 `一日游 / 三日游 / 五日游` 查看路线、站点、评级和开放参考
- `地图`：查看当前路线、顺路补点、全港景点，并支持搜索、聚焦和定位
- `延伸`：按主题推荐、替代路线和区域索引继续扩展香港玩法
- `指南`：查看图册、路线故事线、时间安排和出发建议

## 内容来源

当前香港版本主要基于这些本地资料整理：

- `香港旅游方案.docx`
- `hong_kong_spot_details_with_address.json`
- `hk_spot_detail_images/`

这些资料位于你本机的 `/Users/declan/Downloads/香港行程/`。

## 架构

这个项目不是把网页整页包进 App，而是保留了原骨架后，重组为移动端应用结构。

- App 外层界面使用 React Native 组件实现，入口在 `App.tsx`
- 香港景点数据、路线和导览文案在 `src/data/hongKongData.ts`
- 搜索、距离、评级、开放时间和景点整理逻辑在 `src/lib/hongKong.ts`
- 图片映射在 `src/lib/citywalkImages.ts`
- 地图使用一套共享的 Leaflet HTML 内核：
  - `src/lib/sharedMapDocument.ts` 生成地图文档
  - `src/components/SharedMapFrame.web.tsx` 在 Web 端通过 `iframe` 渲染
  - `src/components/SharedMapFrame.native.tsx` 在 App 端通过 `WebView` 渲染
  - `src/components/MapSurface.tsx` 负责地图外层信息浮窗、按钮和联动

也就是说，当前结构是：

- 页面层：React Native
- 数据层：本地 TypeScript 数据与工具函数
- 地图层：Web / App 共用的一套地图内核

## 目录

- `App.tsx`
- `index.ts`
- `app.json`
- `assets/hongkong/`
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

当前最稳的预览方式是 Android development build 或 Expo 开发客户端：

1. 电脑启动 `npm start`
2. 手机安装对应的开发客户端
3. 手机与电脑连同一网络，或通过 USB 反向代理连接 Expo 服务

## 说明

- `android/` 和 `ios/` 这类原生目录不作为项目主体长期保留，需要时可以通过 Expo 重新生成
- 当前重点是保证手机端界面、地图联动、搜索、评级和开放时间信息可用
- 地图依赖外部瓦片与 Leaflet 资源，网络条件会直接影响地图显示
