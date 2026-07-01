import { buildAllMessages } from "@appspine/frontend-shell";

import en from "../../messages/en.json";
import zhTW from "../../messages/zh-TW.json";

export const allMessages = buildAllMessages(en, zhTW);
export type Messages = typeof en;
