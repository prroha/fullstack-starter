// =====================================================
// HTML Sanitization (XSS Prevention)
// =====================================================

/** Tags allowed in rich text content */
const ALLOWED_TAGS = new Set([
  "p", "br", "b", "i", "u", "s", "em", "strong", "sub", "sup",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr", "img",
]);

/** Attributes allowed per tag (all others are stripped) */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  span: new Set(["style"]),
  div: new Set(["style"]),
  p: new Set(["style"]),
};

/** CSS properties allowed in style attributes */
const ALLOWED_STYLE_PROPERTIES = new Set([
  "color", "background-color", "font-size", "font-weight", "font-style",
  "text-align", "text-decoration", "margin", "padding",
  "margin-left", "margin-right", "padding-left", "padding-right",
]);

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      const prop = decl.split(":")[0]?.trim().toLowerCase();
      return prop && ALLOWED_STYLE_PROPERTIES.has(prop);
    })
    .join("; ");
}

function sanitizeElement(el: Element): void {
  const tagName = el.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    // Replace disallowed element with its text content
    el.replaceWith(document.createTextNode(el.textContent || ""));
    return;
  }

  // Remove disallowed attributes
  const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || new Set<string>();
  const attrsToRemove: string[] = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const attrName = el.attributes[i].name.toLowerCase();
    // Strip all event handlers (on*)
    if (attrName.startsWith("on") || !allowedAttrs.has(attrName)) {
      attrsToRemove.push(el.attributes[i].name);
    }
  }
  for (const attr of attrsToRemove) {
    el.removeAttribute(attr);
  }

  // Sanitize style attribute if present
  if (el.hasAttribute("style")) {
    const sanitized = sanitizeStyle(el.getAttribute("style") || "");
    if (sanitized) {
      el.setAttribute("style", sanitized);
    } else {
      el.removeAttribute("style");
    }
  }

  // Sanitize href to prevent javascript: URIs
  if (el.hasAttribute("href")) {
    const href = el.getAttribute("href") || "";
    if (/^\s*javascript\s*:/i.test(href) || /^\s*data\s*:/i.test(href)) {
      el.removeAttribute("href");
    }
  }

  // Sanitize img src to prevent javascript: URIs
  if (el.hasAttribute("src")) {
    const src = el.getAttribute("src") || "";
    if (/^\s*javascript\s*:/i.test(src)) {
      el.removeAttribute("src");
    }
  }

  // Recursively sanitize children (iterate in reverse since DOM may mutate)
  const children = Array.from(el.children);
  for (const child of children) {
    sanitizeElement(child);
  }
}

/**
 * Sanitizes HTML string to prevent XSS attacks.
 * Uses the browser's DOMParser to parse and then walks the tree,
 * removing disallowed tags, attributes, and event handlers.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof window === "undefined") return html || "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const children = Array.from(doc.body.children);
    for (const child of children) {
      sanitizeElement(child);
    }
    return doc.body.innerHTML;
  } catch {
    // If parsing fails, strip all HTML as a safety fallback
    return html.replace(/<[^>]*>/g, "");
  }
}
