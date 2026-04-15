const isFileProtocol = () => {
  if (typeof window === "undefined" || !window.location) return false;
  const protocol = window.location.protocol?.toLowerCase() || "";
  const userAgent = window.navigator?.userAgent?.toLowerCase() || "";
  return protocol === "file:" || protocol === "chrome:" || userAgent.includes("electron");
};

const isProduction = () => {
  return typeof import.meta !== "undefined" && import.meta.env?.PROD === true;
};

export const resolveTemplateAssetPath = (path) => {
  if (typeof path !== "string") return path;

  const trimmed = path.trim();
  if (!trimmed) return "";

  const normalized = trimmed.replace(/\\/g, "/");

  if (
    normalized.startsWith("file://") ||
    normalized.startsWith("data:") ||
    /^(https?:)?\/\//i.test(normalized)
  ) {
    try { return decodeURI(normalized); } catch { return normalized; }
  }

  if (normalized.startsWith("assets/") || normalized.startsWith("/")) {
    return normalized;
  }

  if (/\.[a-z0-9]+$/i.test(normalized)) {
    return `assets/user/${normalized}`;
  }

  return normalized;
};

export const getBrightness = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    const needsAnonymous = /^(https?:)?\/\//i.test(url) || url.startsWith("data:");

    if (needsAnonymous) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(128);
          return;
        }

        const w = 50, h = 50;
        canvas.width = w;
        canvas.height = h;

        ctx.drawImage(img, 0, 0, w, h);

        const data = ctx.getImageData(0, 0, w, h).data;

        let r = 0, g = 0, b = 0;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        const pixels = data.length / 4;

        r /= pixels;
        g /= pixels;
        b /= pixels;

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        resolve(brightness);
      } catch {
        resolve(128);
      }
    };

    img.onerror = () => resolve(128); // default brightness
    img.src = url;
  });
};

export const formatCssUrl = (path) => {
  const resolvedPath = resolveTemplateAssetPath(path);
  if (!resolvedPath) return "";

  // Ensure we don't have double slashes after file:///
  // and ensure any backslashes are forward slashes for CSS
  // 1. Convert Windows backslashes \ to forward slashes /
  let cleanPath = resolvedPath.replace(/\\/g, "/");

  // 2. Encode special characters (including quotes, spaces, and parens)
  // encodeURI handles the URL structure, but we use replace to
  // specifically catch any remaining double quotes that might break CSS.
  cleanPath = encodeURI(cleanPath).replace(/"/g, "%22");

  return `url("${cleanPath}")`;
};
