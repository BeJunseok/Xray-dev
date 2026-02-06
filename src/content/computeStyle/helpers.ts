import {
  DEFAULT_VALUES,
  MEANINGLESS_VALUES,
  LAYOUT_CRITICAL_PROPS,
} from "@/content/constant/styleConstant";

/**
 * 4방향 값을 축약
 */
export const getShorthand = (top: string, right: string, bottom: string, left: string): string => {
  if (top === right && right === bottom && bottom === left) {
    return top;
  }
  if (top === bottom && right === left) {
    return `${top} ${right}`;
  }
  if (right === left) {
    return `${top} ${right} ${bottom}`;
  }
  return `${top} ${right} ${bottom} ${left}`;
};

/**
 * 상대 URL을 절대 URL로 변환
 */
export const toAbsoluteUrl = (url: string): string => {
  if (url.startsWith("data:") || url.startsWith("http")) {
    return url;
  }

  const cleanUrl = url.replace(/['"]/g, "").trim();

  try {
    return new URL(cleanUrl, document.baseURI).href;
  } catch (error) {
    console.warn("Failed to convert URL to absolute:", cleanUrl, error);
    return cleanUrl;
  }
};

/**
 * font-family 값 정리 (쌍따옴표 -> 따옴표 통일)
 */
export const cleanFontFamily = (fontString: string): string => {
  if (!fontString) return "";
  return fontString.replace(/"/g, "'");
};

/**
 * url()을 절대 경로로 변환
 */
export const processUrlValue = (value: string): string => {
  if (!value.includes("url(")) {
    return value;
  }

  return value.replace(/url\((.*?)\)/g, (_, urlContent) => {
    return `url('${toAbsoluteUrl(urlContent)}')`;
  });
};

/**
 * 요소의 inline style에서 원본 CSS 값 반환
 */
export const getAuthoredStyleValue = (element: HTMLElement, prop: string): string | null => {
  const inlineValue = element.style.getPropertyValue(prop);
  return inlineValue || null;
};

/**
 * width/height 포함 여부 결정
 * - inline 텍스트 요소: 제외
 * - 부모와 동일한 width: 제외 (100% 자동 채움)
 * - flex-grow > 0: 제외 (자동 확장)
 */
export const shouldIncludeDimension = (
  element: HTMLElement,
  prop: "width" | "height",
  value: string,
  computed: CSSStyleDeclaration,
  parentComputed: CSSStyleDeclaration | null
): { include: boolean; useMax?: boolean; originalValue?: string } => {
  const display = computed.getPropertyValue("display");

  // inline style에 명시된 원본 값 확인
  const authoredValue = getAuthoredStyleValue(element, prop);
  if (authoredValue) {
    const flexibleValues = ["auto", "fit-content", "max-content", "min-content"];
    const isFlexible = flexibleValues.includes(authoredValue) || authoredValue.includes("%");

    return {
      include: true,
      originalValue: isFlexible ? authoredValue : undefined,
    };
  }

  // inline 텍스트 요소는 제외
  if (display === "inline") {
    const hasTextContent = element.textContent?.trim() !== "";
    const bgImage = computed.getPropertyValue("background-image");
    if (hasTextContent && (!bgImage || bgImage === "none")) {
      return { include: false };
    }
  }

  // block 요소의 width가 부모와 동일하면 제외
  if (prop === "width" && parentComputed) {
    const parentWidth = parentComputed.getPropertyValue("width");
    if (
      value === parentWidth &&
      (display === "block" || display === "flex" || display === "grid")
    ) {
      return { include: false };
    }
  }

  // flex 자식의 flex-grow > 0이면 width 제외
  if (prop === "width" && parentComputed) {
    const parentDisplay = parentComputed.getPropertyValue("display");
    if (parentDisplay === "flex" || parentDisplay === "grid") {
      const flexGrow = computed.getPropertyValue("flex-grow");
      if (parseFloat(flexGrow) > 0) {
        return { include: false };
      }
    }
  }

  return { include: true };
};

/**
 * 의미있는 CSS인지 확인
 */
export const isMeaningfulValue = (prop: string, value: string, tagName: string): boolean => {
  if (!value) return false;

  // 레이아웃 필수 속성은 항상 유지
  if (LAYOUT_CRITICAL_PROPS.has(prop)) {
    return true;
  }

  // <a> 태그의 text-decoration: none 유지 (브라우저 기본 밑줄 제거)
  if (tagName === "a" && prop === "text-decoration" && value === "none") {
    return true;
  }

  // white-space: nowrap 유지
  if (prop === "white-space" && value === "nowrap") {
    return true;
  }

  // list-style-type: none은 리스트 요소에서만 유지
  if (prop === "list-style-type") {
    const listElements = ["ul", "ol", "li"];
    if (listElements.includes(tagName) && value === "none") {
      return true;
    }
    if (!listElements.includes(tagName)) {
      return false;
    }
  }

  // form 요소의 transparent background 유지
  if (prop === "background-color" && (value === "rgba(0, 0, 0, 0)" || value === "transparent")) {
    const formElements = ["button", "input", "select", "textarea"];
    if (formElements.includes(tagName)) {
      return true;
    }
  }

  if (MEANINGLESS_VALUES.has(value)) {
    return false;
  }

  return true;
};

/**
 * CSS 값이 기본값인지 확인
 */
export const isDefaultValue = (prop: string, value: string): boolean => {
  const defaultValue = DEFAULT_VALUES[prop];

  if (!defaultValue) {
    return false;
  }

  if (Array.isArray(defaultValue)) {
    return defaultValue.includes(value);
  }

  return value === defaultValue;
};
