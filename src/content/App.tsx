import computeStyles from "@/content/computeStyle";
import formatHTML from "@/content/computeStyle/formatHTML";
import { DEFAULT_MODE, DEFAULT_SHORTCUT, ModeConfig, ShortcutConfig } from "@/types/types";
import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { STORAGE_KEYS } from "@/content/constant/storageConstant";
import { StorageData, Rect } from "@/types/types";

const Z_INDEX = { OVERLAY: 999999, TOOLTIP: 1000000 } as const;

const COLORS = {
  LOCKED: { BORDER: "#ef4444", BACKGROUND: "rgba(239, 68, 68, 0.2)" },
  UNLOCKED: { BORDER: "#3b82f6", BACKGROUND: "rgba(59, 130, 246, 0.2)" },
} as const;

/**
 * border-radius를 적용해 clip /
 */
const applyBorderRadiusClip = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  radius: { tl: number; tr: number; br: number; bl: number }
) => {
  ctx.beginPath();
  ctx.moveTo(radius.tl, 0);
  ctx.lineTo(w - radius.tr, 0);
  ctx.quadraticCurveTo(w, 0, w, radius.tr);
  ctx.lineTo(w, h - radius.br);
  ctx.quadraticCurveTo(w, h, w - radius.br, h);
  ctx.lineTo(radius.bl, h);
  ctx.quadraticCurveTo(0, h, 0, h - radius.bl);
  ctx.lineTo(0, radius.tl);
  ctx.quadraticCurveTo(0, 0, radius.tl, 0);
  ctx.closePath();
  ctx.clip();
};

/**
 * 캡쳐해 클립보드에 복사
 */
const captureScreenshot = async (targetEl: HTMLElement): Promise<void> => {
  const rect = targetEl.getBoundingClientRect();
  const response = await chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" });

  if (!response.success) {
    throw new Error(response.error || "Failed to capture screenshot");
  }

  const img = new Image();
  img.src = response.dataUrl;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const scaleX = img.width / window.innerWidth;
  const scaleY = img.height / window.innerHeight;

  const computed = window.getComputedStyle(targetEl);
  const borderRadius = {
    tl: parseFloat(computed.borderTopLeftRadius) || 0,
    tr: parseFloat(computed.borderTopRightRadius) || 0,
    br: parseFloat(computed.borderBottomRightRadius) || 0,
    bl: parseFloat(computed.borderBottomLeftRadius) || 0,
  };

  const canvas = document.createElement("canvas");
  canvas.width = rect.width * scaleX;
  canvas.height = rect.height * scaleY;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  const hasRadius = Object.values(borderRadius).some(r => r > 0);
  if (hasRadius) {
    applyBorderRadiusClip(ctx, canvas.width, canvas.height, {
      tl: borderRadius.tl * scaleX,
      tr: borderRadius.tr * scaleX,
      br: borderRadius.br * scaleX,
      bl: borderRadius.bl * scaleX,
    });
  }

  ctx.drawImage(
    img,
    rect.left * scaleX,
    rect.top * scaleY,
    rect.width * scaleX,
    rect.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Failed to create blob"))), "image/png");
  });

  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
};

const App = () => {
  const [mode, setMode] = useState<ModeConfig>(DEFAULT_MODE);
  const [isActive, setIsActive] = useState(true);
  const [shortcut, setShortcut] = useState<ShortcutConfig>(DEFAULT_SHORTCUT);
  const [isLocked, setIsLocked] = useState(false);
  const [hoveredRect, setHoveredRect] = useState<Rect | null>(null);
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const rafIdRef = useRef<number | null>(null);

  // Storage 초기화 및 변경 감지
  useEffect(() => {
    const init = async () => {
      try {
        const data = (await chrome.storage.local.get(Object.values(STORAGE_KEYS))) as StorageData;
        setMode(data[STORAGE_KEYS.MODE] ?? DEFAULT_MODE);
        setIsActive(data[STORAGE_KEYS.IS_ACTIVE] ?? true);
        setShortcut(data[STORAGE_KEYS.SHORTCUT] ?? DEFAULT_SHORTCUT);
      } catch (error) {
        console.error("Failed to initialize storage:", error);
      }
    };

    const onChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.MODE]) {
        setMode((changes[STORAGE_KEYS.MODE].newValue as ModeConfig) ?? DEFAULT_MODE);
      }
      if (changes[STORAGE_KEYS.IS_ACTIVE]) {
        const val = changes[STORAGE_KEYS.IS_ACTIVE].newValue as boolean;
        setIsActive(val ?? true);
        if (!val) {
          setHoveredRect(null);
          setTargetEl(null);
          setIsLocked(false);
        }
      }
      if (changes[STORAGE_KEYS.SHORTCUT]) {
        setShortcut(
          (changes[STORAGE_KEYS.SHORTCUT].newValue as ShortcutConfig) ?? DEFAULT_SHORTCUT
        );
      }
    };

    init();
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const isOurAppElement = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    return target.id === "xray-root" || target.closest("#xray-root") !== null;
  }, []);

  const updateRect = useCallback((element: HTMLElement) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

    rafIdRef.current = requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      setHoveredRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    });
  }, []);

  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      if (isLocked || isOurAppElement(e.target)) return;

      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const valid = elements.filter(el => {
        if (isOurAppElement(el) || el.tagName === "BODY" || el.tagName === "HTML") return false;

        const style = window.getComputedStyle(el);
        if (style.position === "absolute" || style.position === "fixed") {
          const rect = el.getBoundingClientRect();
          const parent = (el as HTMLElement).parentElement;
          if (parent) {
            const pRect = parent.getBoundingClientRect();
            if ((rect.width * rect.height) / (pRect.width * pRect.height) > 0.8) return false;
          }
        }
        return true;
      }) as HTMLElement[];

      if (valid.length === 0) return;
      setTargetEl(valid[0]);
      updateRect(valid[0]);
    },
    [isLocked, isOurAppElement, updateRect]
  );

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (isOurAppElement(e.target)) return;

      const tag = document.activeElement?.tagName.toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || tag === "select";

      if (e.code === "Space" && !isInput && targetEl) {
        e.preventDefault();
        setIsLocked(prev => !prev);
        return;
      }

      if (isLocked && e.key === "Escape") {
        e.preventDefault();
        setIsLocked(false);
        return;
      }

      if (!targetEl) return;

      const isMatch =
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        e.ctrlKey === shortcut.ctrlKey &&
        e.shiftKey === shortcut.shiftKey &&
        e.altKey === shortcut.altKey &&
        e.metaKey === shortcut.metaKey;

      if (!isMatch) return;

      e.preventDefault();

      try {
        if (mode === "html") {
          const html = formatHTML(computeStyles(targetEl));
          await navigator.clipboard.writeText(html);
          toast.success("HTML copied to clipboard!", { duration: 2000 });
        } else {
          setIsCapturing(true);
          await new Promise(r => setTimeout(r, 50));
          try {
            await captureScreenshot(targetEl);
            toast.success("Screenshot copied to clipboard!", { duration: 2000 });
          } finally {
            setIsCapturing(false);
          }
        }
      } catch (error) {
        console.error("Failed to copy:", error);
        setIsCapturing(false);
        toast.error("Failed to copy. Please try again.", { duration: 3000 });
      }
    },
    [targetEl, shortcut, isLocked, isOurAppElement, mode]
  );

  const handleScroll = useCallback(() => {
    if (targetEl) updateRect(targetEl);
  }, [targetEl, updateRect]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!isActive) return;

    const opt = { capture: true };
    document.addEventListener("mouseover", handleMouseOver, opt);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, opt);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, opt);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, opt);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isActive, handleMouseOver, handleKeyDown, handleScroll]);

  if (!isActive) return null;

  const colors = isLocked ? COLORS.LOCKED : COLORS.UNLOCKED;

  return (
    <>
      {hoveredRect && !isCapturing && (
        <div
          style={{
            position: "absolute",
            top: hoveredRect.top,
            left: hoveredRect.left,
            width: hoveredRect.width,
            height: hoveredRect.height,
            border: `2px solid ${colors.BORDER}`,
            backgroundColor: colors.BACKGROUND,
            pointerEvents: "none",
            zIndex: Z_INDEX.OVERLAY,
            transition: "all 0.1s ease",
            boxSizing: "border-box",
          }}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {isLocked && hoveredRect && !isCapturing && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: COLORS.LOCKED.BORDER,
            color: "white",
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: "bold",
            zIndex: Z_INDEX.TOOLTIP,
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            whiteSpace: "nowrap",
          }}
          role="status"
          aria-live="polite"
        >
          🔒 Locked: Move mouse away and copy (Press Space to unlock)
        </div>
      )}
    </>
  );
};

export default App;
