// 스타일 속성
const STYLE_CATEGORIES = {
  LAYOUT: [
    "display",
    "position",
    "z-index",
    "float",
    "clear",
    "box-sizing",
    "top",
    "left",
    "right",
    "bottom",
  ] as const,

  DIMENSIONS: ["width", "height", "min-width", "min-height", "max-width", "max-height"] as const,

  BACKGROUND: [
    "background-color",
    "background-image",
    "background-size",
    "background-position",
    "background-repeat",
  ] as const,

  TYPOGRAPHY: [
    "color",
    "font-family",
    "font-size",
    "font-weight",
    "line-height",
    "text-align",
    "text-decoration",
    "letter-spacing",
    "word-spacing",
    "white-space",
    "word-break",
    "word-wrap",
  ] as const,

  VISUAL: [
    "box-shadow",
    "opacity",
    "overflow",
    "vertical-align",
    "cursor",
    "transform",
    "fill",
  ] as const,

  FLEXBOX: [
    "flex-direction",
    "justify-content",
    "align-items",
    "gap",
    "flex-wrap",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "align-self",
    "order",
  ] as const,

  GRID: ["grid-template-columns", "grid-template-rows"] as const,

  LIST: ["list-style-type", "list-style-position", "list-style-image"] as const,
} as const;

//모든 스타일 
export const ALL_STYLES = Object.values(STYLE_CATEGORIES).flat();

// 상속되는 스타일 
export const INHERITED_STYLES = [
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "text-align",
  "text-transform",
  "letter-spacing",
  "word-spacing",
  "white-space",
  "visibility",
  "opacity",
  "color",
] as const;

// CSS 기본값
export const DEFAULT_VALUES: Record<string, string | string[]> = {
  position: "static",
  "flex-direction": "row",
  "flex-wrap": "nowrap",
  "background-position": "0% 0%",
  "background-repeat": "repeat",
  "background-size": "auto",
  float: "none",
  clear: "none",
  "vertical-align": "baseline",
  "flex-grow": "0",
  "flex-shrink": "1",
  "flex-basis": "auto",
  "align-self": "auto",
  order: "0",
  "white-space": "normal",
  opacity: "1",
  "list-style-type": "disc",
  "list-style-position": "outside",
  "list-style-image": "none",
};

// 무의미한 값들 
export const MEANINGLESS_VALUES = new Set([
  "none",
  "auto",
  "normal",
  "0px",
  "rgba(0, 0, 0, 0)",
  "rgb(0, 0, 0)",
  "transparent",
]);

// 레이아웃에 필수적인 속성들 
export const LAYOUT_CRITICAL_PROPS = new Set([
  "display",
  "position",
  "width",
  "height",
  "box-sizing",
]);
