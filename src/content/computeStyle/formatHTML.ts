const INDENT = "  ";
const INLINE_TEXT_MAX_LENGTH = 50;

/**
 * style 속성을 여러 줄로 포맷팅
 */
const formatStyleAttribute = (
  styleValue: string,
  currentIndent: string,
  nextIndent: string
): string => {
  if (!styleValue?.trim()) return "";

  const styles = styleValue
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (styles.length === 0) return "";

  // 짧은 단일 스타일은 한 줄로
  if (styles.length === 1 && styleValue.length < 60) {
    return `style="${styleValue}"`;
  }

  const formattedStyle = styles.join(`;\n${nextIndent}`);
  return `style="\n${nextIndent}${formattedStyle};\n${currentIndent}"`;
};

/**
 * HTML 속성들을 포맷팅
 */
const formatAttributes = (
  element: HTMLElement,
  currentIndent: string,
  nextIndent: string
): string => {
  const attributes = Array.from(element.attributes);
  if (attributes.length === 0) return "";

  return attributes
    .map(attr => {
      if (attr.name === "style") {
        return formatStyleAttribute(attr.value, currentIndent, nextIndent);
      }
      return `${attr.name}="${attr.value}"`;
    })
    .filter(attr => attr.length > 0)
    .join(" ");
};

/**
 * 자식이 단순 텍스트 하나인지 확인
 */
const isSingleShortText = (children: Node[]): boolean => {
  if (children.length !== 1) return false;

  const child = children[0];
  if (child.nodeType !== Node.TEXT_NODE) return false;

  const text = child.textContent?.trim() || "";
  return text.length > 0 && text.length < INLINE_TEXT_MAX_LENGTH;
};

const SELF_CLOSING_TAGS = [
  "br", "hr", "link", "area", "base", "col", "embed", "source", "track", "wbr",
];

/**
 * HTML 노드를 포맷팅된 문자열로 변환
 */
const formatHTML = (node: Node, depth: number = 0): string => {
  // 텍스트 노드
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    if (!text) return "";

    return text
      .replace(/\u00A0/g, "&nbsp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const currentIndent = INDENT.repeat(depth);
  const nextIndent = INDENT.repeat(depth + 1);

  // Self-closing 태그
  if (SELF_CLOSING_TAGS.includes(tagName)) {
    return `${currentIndent}<${tagName}>`;
  }

  const attrs = formatAttributes(element, currentIndent, nextIndent);
  const openTag = attrs ? `<${tagName} ${attrs}>` : `<${tagName}>`;
  const children = Array.from(node.childNodes);

  // 자식 없음
  if (children.length === 0) {
    return `${currentIndent}${openTag}</${tagName}>`;
  }

  // 단순 텍스트 (한 줄)
  if (isSingleShortText(children)) {
    const text = children[0].textContent?.trim();
    return `${currentIndent}${openTag}${text}</${tagName}>`;
  }

  // 여러 자식 (여러 줄)
  const childrenHTML = children
    .map(child => formatHTML(child, depth + 1))
    .filter(html => html.length > 0)
    .join("\n");

  if (!childrenHTML) {
    return `${currentIndent}${openTag}</${tagName}>`;
  }

  return `${currentIndent}${openTag}\n${childrenHTML}\n${currentIndent}</${tagName}>`;
};

export default formatHTML;
