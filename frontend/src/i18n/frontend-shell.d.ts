import type { Messages } from "./messages";

// Gives frontend-shell's useTranslations() the real per-namespace key union for this app's
// own messages instead of a plain `string`, via TypeScript declaration merging.
declare module "@appspine/frontend-shell" {
  interface FrontendShellMessages extends Messages {}
}
