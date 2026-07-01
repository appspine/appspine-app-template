import en from "../../messages/en.json";
import zhTW from "../../messages/zh-TW.json";

export const allMessages = {
  en,
  "zh-TW": zhTW,
} as const;

export type Messages = typeof en;
