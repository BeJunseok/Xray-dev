import { getStyleString } from "@/content/computeStyle/styleExtraction";

/**
 * ::before, ::after 가상 요소를 span 요소로 생성
 */
export const createPseudoElement = (
  originalElement: HTMLElement,
  pseudoType: "::before" | "::after",
  originalComputed: CSSStyleDeclaration
): HTMLElement | null => {
  try {
    const view = originalElement.ownerDocument.defaultView;
    if (!view) {
      return null;
    }

    const pseudoComputed = view.getComputedStyle(originalElement, pseudoType);
    const content = pseudoComputed.getPropertyValue("content");

    if (!content || content === "none" || content === "normal") {
      return null;
    }

    const fakeEl = document.createElement("span");
    fakeEl.setAttribute("data-pseudo", pseudoType.replace("::", ""));

    let styleString = getStyleString(pseudoComputed, originalComputed, false, "span", fakeEl);

    // content 값 정리
    let cleanContent = content.replace(/^['"]|['"]$/g, "");
    cleanContent = cleanContent.replace(/\\00a0/gi, " ");

    // 가상 요소는 명시적 크기가 필요
    const width = pseudoComputed.getPropertyValue("width");
    const height = pseudoComputed.getPropertyValue("height");
    const bgImage = pseudoComputed.getPropertyValue("background-image");
    const hasBackgroundImage = bgImage && bgImage !== "none";

    const additionalStyles: string[] = [];

    if (width && width !== "auto" && width !== "0px") {
      if (
        hasBackgroundImage &&
        styleString.includes("max-width:") &&
        !styleString.includes("width:")
      ) {
        styleString = styleString.replace(/max-width:\s*([^;]+)/g, `width: $1`);
      } else if (!styleString.includes("width:") && !styleString.includes("max-width:")) {
        additionalStyles.push(`width: ${width}`);
      }
    }

    if (height && height !== "auto" && height !== "0px") {
      if (!styleString.includes("height:")) {
        additionalStyles.push(`height: ${height}`);
      }
    }

    if (additionalStyles.length > 0) {
      styleString = styleString
        ? `${styleString}; ${additionalStyles.join("; ")}`
        : additionalStyles.join("; ");
    }

    const isDecorativeElement = !cleanContent || cleanContent.trim() === "" || cleanContent === " ";

    if (styleString) {
      fakeEl.setAttribute("style", styleString);
    }

    if (!isDecorativeElement && cleanContent) {
      fakeEl.textContent = cleanContent;
    }

    return fakeEl;
  } catch (error) {
    console.error(`Failed to create pseudo element ${pseudoType}:`, error);
    return null;
  }
};
