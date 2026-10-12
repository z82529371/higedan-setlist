import { toPng } from "html-to-image";

/**
 * 乾淨匯出 DOM 節點為高解析度、真透明圓角且無跑版之 PNG 圖片
 *
 * 核心解決方案：
 * 1. 【解決小尺寸跑版】：使用獨立離屏宿主（Offscreen Container），鎖定標準目標寬度（例如 440px / 540px）
 *    進行重新排版與自然高度計算，不受使用者當前螢幕尺寸（如 360px 手機）影響，避免高度估算錯誤與底部留白。
 * 2. 【解決偽圓角（真透明圓角）】：移除 Canvas 頂層不透明底色，保留原生 Alpha 透明通道；
 *    同時去除外圍裁切陰影，確保四個圓角外側呈現真正的透明像素。
 * 3. 【解決裝飾裁切】：針對帶有負位移的裝飾（如紙膠帶），提供垂直補償邊距，防止圖片頂部被裁截。
 *
 * @param {HTMLElement} sourceNode - 要擷取的來源 DOM 節點
 * @param {Object} options - 匯出設定
 * @param {number} [options.width=440] - 匯出的標準寬度 (px)
 * @param {number} [options.pixelRatio=2] - 像素密度（預設 2x 高解析度）
 * @param {string} [options.borderRadius="16px"] - 卡片圓角半徑
 * @param {number} [options.topPadding=0] - 頂部裝飾留白補償 (px)
 * @param {string} [options.cardBackground] - 卡片內部底色
 * @param {Function} [options.filter] - 節點過濾函數
 * @returns {Promise<string>} PNG Data URL
 */
export async function exportElementToPng(sourceNode, options = {}) {
  const {
    width = 440,
    pixelRatio = 2,
    borderRadius = "16px",
    topPadding = 0,
    cardBackground,
    filter,
  } = options;

  if (!sourceNode) return null;

  // 1. 深度複製節點，避免影響當前畫面上正在呈現的 DOM
  const clone = sourceNode.cloneNode(true);

  // 2. 移除所有標記為忽略匯出的元素（如按鈕、切換器、提示）
  const ignoreList = clone.querySelectorAll(
    ".slip-ignore-export, [data-export-ignore='true'], button"
  );
  ignoreList.forEach((el) => {
    // 若該按鈕在原本票券內部不屬於裝飾，則移除
    if (el.classList.contains("slip-ignore-export") || el.getAttribute("data-export-ignore") === "true") {
      el.remove();
    }
  });

  // 3. 建立完全隔離的離屏宿主容器
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  host.style.width = `${width}px`;
  host.style.minWidth = `${width}px`;
  host.style.maxWidth = `${width}px`;
  host.style.margin = "0";
  host.style.padding = topPadding > 0 ? `${topPadding}px 0 0 0` : "0";
  host.style.zIndex = "-9999";
  host.style.opacity = "0";
  host.style.pointerEvents = "none";
  host.style.backgroundColor = "transparent";
  host.style.boxSizing = "border-box";

  // 4. 標準化克隆節點樣式（鎖定寬度、消除生硬截斷的外陰影、強制圓角與內部裁切）
  clone.style.width = `${width}px`;
  clone.style.minWidth = `${width}px`;
  clone.style.maxWidth = `${width}px`;
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.transform = "none";
  clone.style.boxSizing = "border-box";
  if (borderRadius) {
    clone.style.borderRadius = borderRadius;
    clone.style.overflow = "hidden";
  }
  if (cardBackground) {
    clone.style.backgroundColor = cardBackground;
  }

  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    // 5. 等待瀏覽器完成離屏排版計算
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const targetElement = topPadding > 0 ? host : clone;
    const computedHeight = Math.ceil(
      topPadding > 0
        ? host.getBoundingClientRect().height
        : clone.getBoundingClientRect().height
    );

    // 6. 呼叫 toPng，絕不填入不透明 backgroundColor，完整保留透明圓角
    const dataUrl = await toPng(targetElement, {
      pixelRatio,
      skipFonts: true,
      cacheBust: true,
      filter,
      width,
      height: computedHeight,
      canvasWidth: width * pixelRatio,
      canvasHeight: computedHeight * pixelRatio,
      style: {
        transform: "none",
        margin: "0",
        boxShadow: "none",
      },
    });

    return dataUrl;
  } finally {
    // 確保離屏節點必定清理，不殘留於 DOM
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }
}
