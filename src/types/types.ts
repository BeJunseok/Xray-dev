import { STORAGE_KEYS } from "@/content/constant/storageConstant";

export interface ShortcutConfig {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export const DEFAULT_SHORTCUT: ShortcutConfig = {
  key: "x",
  ctrlKey: true,
  shiftKey: true,
  altKey: false,
  metaKey: false,
};

export type ModeConfig = "screenshot" | "html";

export const DEFAULT_MODE: ModeConfig = "screenshot";

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface StorageData {
  [STORAGE_KEYS.MODE]?: ModeConfig;
  [STORAGE_KEYS.IS_ACTIVE]?: boolean;
  [STORAGE_KEYS.SHORTCUT]?: ShortcutConfig;
}
