import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  web_accessible_resources: [
    {
      resources: ["assets/fonts/*.ttf"],
      matches: ["<all_urls>"],
    },
  ],
  icons: {
    48: "public/logo.png",
  },
  action: {
    default_icon: {
      48: "public/logo.png",
    },
    default_popup: "src/popup/index.html",
  },
  permissions: ["contentSettings", "activeTab", "scripting", "storage"],
  content_scripts: [
    {
      js: ["src/content/main.tsx"],
      matches: ["<all_urls>"],
    },
  ],
  background: {
    service_worker: "src/background/serviceWorker.ts",
    type: "module",
  },
});

