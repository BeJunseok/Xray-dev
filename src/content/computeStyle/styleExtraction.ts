import { ALL_STYLES, INHERITED_STYLES } from "@/content/constant/styleConstant";

import {
  getShorthand,
  processUrlValue,
  cleanFontFamily,
  shouldIncludeDimension,
  isMeaningfulValue,
  isDefaultValue,
} from "./helpers";

/**
 * margin/padding 값을 shorthand로 변환
 */
export const processSpacing = (
  computed: CSSStyleDeclaration,
  name: "margin" | "padding"
): string | null => {
  const top = computed.getPropertyValue(`${name}-top`);
  const right = computed.getPropertyValue(`${name}-right`);
  const bottom = computed.getPropertyValue(`${name}-bottom`);
  const left = computed.getPropertyValue(`${name}-left`);

  if (!top || !right || !bottom || !left) return null;
  if ([top, right, bottom, left].every(v => v === "0px")) return null;

  return `${name}: ${getShorthand(top, right, bottom, left)}`;
};

/**
 * border 속성을 shorthand로 변환
 */
export const processBorderProperty = (
  computed: CSSStyleDeclaration,
  prop: "width" | "style" | "color",
  tagName?: string
): string | null => {
  const top = computed.getPropertyValue(`border-top-${prop}`);
  const right = computed.getPropertyValue(`border-right-${prop}`);
  const bottom = computed.getPropertyValue(`border-bottom-${prop}`);
  const left = computed.getPropertyValue(`border-left-${prop}`);

  if (!top || !right || !bottom || !left) return null;

  const formElements = ["button", "input", "select", "textarea", "fieldset"];
  const isFormElement = tagName && formElements.includes(tagName);

  const isMeaningful = (() => {
    switch (prop) {
      case "width":
        return [top, right, bottom, left].some(v => v !== "0px");
      case "style":
        return isFormElement || [top, right, bottom, left].some(v => v !== "none");
      case "color":
        return [top, right, bottom, left].some(
          v => v !== "rgba(0, 0, 0, 0)" && v !== "transparent"
        );
    }
  })();

  if (!isMeaningful) return null;

  const shorthand = getShorthand(top, right, bottom, left);
  if (shorthand === "0px" || (shorthand === "none" && !isFormElement)) return null;

  return `border-${prop}: ${shorthand}`;
};

/**
 * border-radius를 shorthand로 변환
 */
export const processBorderRadius = (computed: CSSStyleDeclaration): string | null => {
  const tl = computed.getPropertyValue("border-top-left-radius");
  const tr = computed.getPropertyValue("border-top-right-radius");
  const br = computed.getPropertyValue("border-bottom-right-radius");
  const bl = computed.getPropertyValue("border-bottom-left-radius");

  if (!tl || !tr || !br || !bl) return null;
  if ([tl, tr, br, bl].every(v => v === "0px")) return null;

  return `border-radius: ${getShorthand(tl, tr, br, bl)}`;
};

/**
 * inline-block 자식만 있는 block은 flex로 변환
 */
const processDisplayValue = (value: string, element: HTMLElement): string => {
  if (value !== "block") return value;

  const children = element.children;
  if (children.length <= 1) return value;

  for (let i = 0; i < children.length; i++) {
    const display = window.getComputedStyle(children[i]).getPropertyValue("display");
    if (display !== "inline-block" && display !== "inline") {
      return value;
    }
  }
  return "flex";
};

/**
 * 애니메이션 중인 transform은 제외
 */
const shouldSkipTransform = (value: string): boolean => {
  if (value === "none" || value === "matrix(1, 0, 0, 1, 0, 0)") return true;

  const match = value.match(
    /matrix\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/
  );
  if (match && parseFloat(match[6]) !== 0) return true;

  return false;
};

/**
 * position 속성 처리
 */
const shouldSkipPositioning = (value: string, computed: CSSStyleDeclaration): boolean => {
  const position = computed.getPropertyValue("position");
  if (position === "static" || position === "relative") return true;
  if (value === "auto") return true;
  return false;
};

/**
 * 단일 속성 처리
 */
const processProperty = (
  prop: string,
  computed: CSSStyleDeclaration,
  parentComputed: CSSStyleDeclaration | null,
  isRoot: boolean,
  tagName: string,
  element: HTMLElement
): string | null => {
  let value = computed.getPropertyValue(prop);

  if (isDefaultValue(prop, value)) return null;

  // display
  if (prop === "display") {
    value = processDisplayValue(value, element);
  }

  // transform
  if (prop === "transform" && shouldSkipTransform(value)) {
    return null;
  }

  // width/height
  if (prop === "width" || prop === "height") {
    const result = shouldIncludeDimension(element, prop, value, computed, parentComputed);
    if (!result.include) return null;

    const finalValue = result.originalValue || value;
    return result.useMax ? `max-${prop}: ${finalValue}` : `${prop}: ${finalValue}`;
  }

  // position
  if (["top", "left", "right", "bottom"].includes(prop)) {
    if (shouldSkipPositioning(value, computed)) return null;
  } else if (!isMeaningfulValue(prop, value, tagName)) {
    return null;
  }

  // 상속 속성 최적화
  if (!isRoot && parentComputed && INHERITED_STYLES.includes(prop as any)) {
    if (!(tagName === "a" && prop === "color")) {
      if (value === parentComputed.getPropertyValue(prop)) return null;
    }
  }

  // 값 후처리
  value = processUrlValue(value);
  if (prop === "font-family") {
    value = cleanFontFamily(value);
  }

  return `${prop}: ${value}`;
};

const DEFAULT_MARGIN_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "dl",
  "dd",
  "blockquote",
  "pre",
  "figure",
  "hr",
]);
const DEFAULT_PADDING_TAGS = new Set(["ul", "ol", "dd"]);

/**
 * computed style을 inline style 문자열로 변환
 */
export const getStyleString = (
  computed: CSSStyleDeclaration,
  parentComputed: CSSStyleDeclaration | null,
  isRoot: boolean,
  tagName: string,
  element: HTMLElement
): string => {
  if (["br", "hr", "wbr"].includes(tagName)) return "";

  const styles: string[] = [];

  // 일반 속성
  ALL_STYLES.forEach(prop => {
    const result = processProperty(prop, computed, parentComputed, isRoot, tagName, element);
    if (result) styles.push(result);
  });

  // Margin
  const margin = processSpacing(computed, "margin");
  styles.push(margin || (DEFAULT_MARGIN_TAGS.has(tagName) ? "margin: 0" : ""));

  // Padding
  const padding = processSpacing(computed, "padding");
  styles.push(padding || (DEFAULT_PADDING_TAGS.has(tagName) ? "padding: 0" : ""));

  // Border
  const borderWidth = processBorderProperty(computed, "width", tagName);
  const borderStyle = processBorderProperty(computed, "style", tagName);
  const borderColor = processBorderProperty(computed, "color", tagName);

  if (borderWidth) styles.push(borderWidth);
  if (borderStyle) styles.push(borderStyle);
  if (borderColor && (borderWidth || borderStyle)) styles.push(borderColor);

  // Border Radius
  const borderRadius = processBorderRadius(computed);
  if (borderRadius) styles.push(borderRadius);

  return styles.filter(Boolean).join("; ");
};
