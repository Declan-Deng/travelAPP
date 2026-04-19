export const hongKongImages = {
  "spot_detail_image_01.png": require("../../assets/hongkong/spot_detail_image_01.png"),
  "spot_detail_image_02.png": require("../../assets/hongkong/spot_detail_image_02.png"),
  "spot_detail_image_03.png": require("../../assets/hongkong/spot_detail_image_03.png"),
  "spot_detail_image_04.png": require("../../assets/hongkong/spot_detail_image_04.png"),
  "spot_detail_image_05.png": require("../../assets/hongkong/spot_detail_image_05.png"),
  "spot_detail_image_06.png": require("../../assets/hongkong/spot_detail_image_06.png"),
  "spot_detail_image_07.png": require("../../assets/hongkong/spot_detail_image_07.png"),
  "spot_detail_image_08.png": require("../../assets/hongkong/spot_detail_image_08.png"),
  "spot_detail_image_09.png": require("../../assets/hongkong/spot_detail_image_09.png"),
  "spot_detail_image_10.png": require("../../assets/hongkong/spot_detail_image_10.png"),
  "spot_detail_image_11.png": require("../../assets/hongkong/spot_detail_image_11.png"),
  "spot_detail_image_12.png": require("../../assets/hongkong/spot_detail_image_12.png"),
  "spot_detail_image_13.png": require("../../assets/hongkong/spot_detail_image_13.png"),
  "spot_detail_image_14.png": require("../../assets/hongkong/spot_detail_image_14.png"),
  "spot_detail_image_15.png": require("../../assets/hongkong/spot_detail_image_15.png"),
  "spot_detail_image_16.png": require("../../assets/hongkong/spot_detail_image_16.png"),
  "spot_detail_image_17.png": require("../../assets/hongkong/spot_detail_image_17.png"),
  "spot_detail_image_18.png": require("../../assets/hongkong/spot_detail_image_18.png"),
  "spot_detail_image_19.png": require("../../assets/hongkong/spot_detail_image_19.png"),
  "spot_detail_image_20.png": require("../../assets/hongkong/spot_detail_image_20.png"),
  "spot_detail_image_21.png": require("../../assets/hongkong/spot_detail_image_21.png"),
  "spot_detail_image_22.png": require("../../assets/hongkong/spot_detail_image_22.png"),
  "spot_detail_image_23.png": require("../../assets/hongkong/spot_detail_image_23.png"),
  "spot_detail_image_24.png": require("../../assets/hongkong/spot_detail_image_24.png"),
  "spot_detail_image_25.png": require("../../assets/hongkong/spot_detail_image_25.png"),
  "spot_detail_image_26.png": require("../../assets/hongkong/spot_detail_image_26.png"),
  "spot_detail_image_27.png": require("../../assets/hongkong/spot_detail_image_27.png"),
  "spot_detail_image_28.png": require("../../assets/hongkong/spot_detail_image_28.png"),
  "spot_detail_image_29.png": require("../../assets/hongkong/spot_detail_image_29.png"),
  "spot_detail_image_30.png": require("../../assets/hongkong/spot_detail_image_30.png"),
  "spot_detail_image_31.png": require("../../assets/hongkong/spot_detail_image_31.png"),
  "spot_detail_image_32.png": require("../../assets/hongkong/spot_detail_image_32.png"),
  "spot_detail_image_33.png": require("../../assets/hongkong/spot_detail_image_33.png"),
} as const;

export type HongKongImageKey = keyof typeof hongKongImages;

export function getHongKongImage(imageKey?: string | null) {
  if (imageKey && imageKey in hongKongImages) {
    return hongKongImages[imageKey as HongKongImageKey];
  }

  return hongKongImages["spot_detail_image_04.png"];
}
