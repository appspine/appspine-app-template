import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Appspine App Template",
  version: packageJson.version,
  copyright: `© ${currentYear}, Appspine App Template.`,
  meta: {
    title: "Appspine App Template",
    description:
      "Appspine App Template is a fully customizable starter for business systems built with Next.js 16, Tailwind CSS v4, and shadcn/ui.",
  },
};
