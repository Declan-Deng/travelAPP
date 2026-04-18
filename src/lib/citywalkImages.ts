export const citywalkImages = {
  "anping-bridge.jpg": require("../../assets/citywalk/anping-bridge.jpg"),
  "blanc-de-chine.jpg": require("../../assets/citywalk/blanc-de-chine.jpg"),
  "cai-residences.jpg": require("../../assets/citywalk/cai-residences.jpg"),
  "caoan.jpg": require("../../assets/citywalk/caoan.jpg"),
  "chongwu.jpg": require("../../assets/citywalk/chongwu.jpg"),
  "dejimen.jpg": require("../../assets/citywalk/dejimen.jpg"),
  "fuwen.jpg": require("../../assets/citywalk/fuwen.jpg"),
  "guanyue.jpg": require("../../assets/citywalk/guanyue.jpg"),
  "kaiyuan.jpg": require("../../assets/citywalk/kaiyuan.jpg"),
  "laojunyan.jpg": require("../../assets/citywalk/laojunyan.jpg"),
  "longshan.jpg": require("../../assets/citywalk/longshan.jpg"),
  "luoyang-bridge.jpg": require("../../assets/citywalk/luoyang-bridge.jpg"),
  "maritime-museum.jpg": require("../../assets/citywalk/maritime-museum.jpg"),
  "nanwai.jpg": require("../../assets/citywalk/nanwai.jpg"),
  "qingjing.jpg": require("../../assets/citywalk/qingjing.jpg"),
  "qingshuiyan.jpg": require("../../assets/citywalk/qingshuiyan.jpg"),
  "quanzhou-old-city.jpg": require("../../assets/citywalk/quanzhou-old-city.jpg"),
  "shibosi.jpg": require("../../assets/citywalk/shibosi.jpg"),
  "tianhou.jpg": require("../../assets/citywalk/tianhou.jpg"),
  "wudian.jpg": require("../../assets/citywalk/wudian.jpg"),
  "wulin.jpg": require("../../assets/citywalk/wulin.jpg"),
  "xunpu.jpg": require("../../assets/citywalk/xunpu.jpg"),
  "zhenwu.jpg": require("../../assets/citywalk/zhenwu.jpg"),
} as const;

export type CitywalkImageKey = keyof typeof citywalkImages;

export function getCitywalkImage(imageKey?: string | null) {
  if (imageKey && imageKey in citywalkImages) {
    return citywalkImages[imageKey as CitywalkImageKey];
  }

  return citywalkImages["quanzhou-old-city.jpg"];
}
