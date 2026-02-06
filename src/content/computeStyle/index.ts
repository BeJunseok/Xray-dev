import { toAbsoluteUrl } from "@/content/computeStyle/helpers";
import { getStyleString } from "@/content/computeStyle/styleExtraction";
import { createPseudoElement } from "@/content/computeStyle/pseudoElements";

/**
 * HTML 요소에 계산된 스타일을 inline으로 적용한 복제본 생성
 */
const computeStyles = (element: HTMLElement, isRoot: boolean = true): HTMLElement => {
  const clone = element.cloneNode(false) as HTMLElement;

  try {
    const view = element.ownerDocument.defaultView;
    if (!view) {
      return clone;
    }

    const computed = view.getComputedStyle(element);
    const parentElement = element.parentElement;
    const parentComputed = parentElement ? view.getComputedStyle(parentElement) : null;
    const tagName = element.tagName.toLowerCase();

    clone.removeAttribute("class");
    clone.removeAttribute("id");

    // img, source, a 태그의 src/href를 절대 경로로 변환
    if (["img", "source", "a"].includes(tagName)) {
      const src = element.getAttribute("src");
      if (src) {
        clone.setAttribute("src", toAbsoluteUrl(src));
      }

      const href = element.getAttribute("href");
      if (href) {
        clone.setAttribute("href", toAbsoluteUrl(href));
      }
    }

    const styleString = getStyleString(computed, parentComputed, isRoot, tagName, element);
    if (styleString) {
      clone.setAttribute("style", styleString);
    }

    // ::before 처리 (SVG 제외)
    const isSvgElement = element.namespaceURI === "http://www.w3.org/2000/svg";
    if (!isSvgElement) {
      const beforeEl = createPseudoElement(element, "::before", computed);
      if (beforeEl) {
        clone.appendChild(beforeEl);
      }
    }

    // 자식 노드 재귀 처리
    Array.from(element.childNodes).forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        clone.appendChild(computeStyles(child as HTMLElement, false));
      } else if (child.nodeType === Node.TEXT_NODE) {
        clone.appendChild(child.cloneNode(true));
      } else {
        clone.appendChild(child.cloneNode(true));
      }
    });

    // ::after 처리 (SVG 제외)
    if (!isSvgElement) {
      const afterEl = createPseudoElement(element, "::after", computed);
      if (afterEl) {
        clone.appendChild(afterEl);
      }
    }

    return clone;
  } catch (error) {
    console.error("Failed to compute styles:", error);
    return clone;
  }
};

export default computeStyles;
