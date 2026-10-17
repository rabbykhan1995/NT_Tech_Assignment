// utils/globalPrinter.ts
//
// Tauri-র WebView-এ iframe.contentWindow.print() reliably কাজ করে না।
// window.print() নিজে কাজ করে, তাই এখানে iframe বাদ দিয়ে সরাসরি
// window.print() ব্যবহার করা হয়েছে — শুধু print-এর সময় CSS দিয়ে
// বাকি সব hide করে শুধু target element visible রাখা হচ্ছে।

const PRINT_ATTR = "data-print-target";
const STYLE_ID = "dynamic-print-style";

type PrintConfig = {
  paperWidth?: string; // '58mm' | '80mm' | 'auto' | '210mm' ইত্যাদি
  paperHeight?: string; // 'auto' | '30mm' ইত্যাদি
  extraCss?: string; // paperWidth/height ছাড়া অতিরিক্ত print-only CSS
};

let cleanupFn: (() => void) | null = null;
let previousTitle: string | null = null;

const cleanupPrint = (elementRef: React.RefObject<HTMLElement | null>) => {
  elementRef.current?.removeAttribute(PRINT_ATTR);
  document.getElementById(STYLE_ID)?.remove();

  if (previousTitle !== null) {
    document.title = previousTitle;
    previousTitle = null;
  }

  if (cleanupFn) {
    window.removeEventListener("afterprint", cleanupFn);
    cleanupFn = null;
  }
};

const printElement = (
  elementRef: React.RefObject<HTMLElement | null>,
  config: PrintConfig = {}
) => {
  if (!elementRef?.current) {
    console.error("No element found to print");
    return;
  }

  // আগের কোনো leftover style/attr থাকলে সরিয়ে দাও (double-click safety)
  if (cleanupFn) cleanupPrint(elementRef);

  const { paperWidth = "auto", paperHeight = "auto", extraCss = "" } = config;

  elementRef.current.setAttribute(PRINT_ATTR, "true");

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @media print {
      @page {
        size: ${paperWidth === "auto" ? "auto" : `${paperWidth} ${paperHeight}`};
        margin: ${paperWidth === "auto" ? "1cm" : "0"};
      }

      body * {
        visibility: hidden !important;
      }

      [${PRINT_ATTR}], [${PRINT_ATTR}] * {
        visibility: visible !important;
      }

      [${PRINT_ATTR}] {
        position: absolute !important;
        top: 0;
        left: 0;
        width: ${paperWidth === "auto" ? "100%" : paperWidth};
        max-width: ${paperWidth === "auto" ? "100%" : paperWidth};
      }

      [${PRINT_ATTR}] * {
        background: white !important;
        background-color: white !important;
        background-image: none !important;
        color: black !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }

      #no-print {
        display: none !important;
      }

      ${extraCss}
    }
  `;
  document.head.appendChild(style);

  cleanupFn = () => cleanupPrint(elementRef);
  window.addEventListener("afterprint", cleanupFn, { once: true });

  // style + attribute paint হওয়ার জন্য এক ফ্রেম সময় দাও, তারপর print
  requestAnimationFrame(() => {
    setTimeout(() => window.print(), 30);
  });
};

// ---------- Public API (আগের signature-ই রাখা হয়েছে, শুধু ভেতরের implementation বদলেছে) ----------

type PrintOptions = {
  title?: string;
};

type POSPrintOptions = {
  title?: string;
  paperWidth?: "58mm" | "80mm";
};

export type BarcodePrintOptions = {
  title?: string;
  paperWidth?: string;
  paperHeight?: string;
};

export const printInvoice = (
  elementRef: React.RefObject<HTMLElement | null>,
  options: PrintOptions = {}
) => {
  const { title = "Invoice" } = options;
  previousTitle = document.title;
  document.title = title;

  printElement(elementRef, {
    paperWidth: "auto", // normal A4/letter page size
    paperHeight: "auto",
  });
};

export const printPOS = (
  elementRef: React.RefObject<HTMLElement | null>,
  options: POSPrintOptions = {}
) => {
  const { title = "Receipt", paperWidth = "58mm" } = options;
  previousTitle = document.title;
  document.title = title;

  printElement(elementRef, {
    paperWidth,
    paperHeight: "auto",
    extraCss: `
      [${PRINT_ATTR}] {
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px;
        line-height: 1.4;
      }
    `,
  });
};

export const printBarcodeSticker = (
  elementRef: React.RefObject<HTMLElement | null>,
  options: BarcodePrintOptions = {}
) => {
  const {
    title = "Barcode-Sticker",
    paperWidth = "50mm",
    paperHeight = "30mm",
  } = options;
  previousTitle = document.title;
  document.title = title;

  printElement(elementRef, {
    paperWidth,
    paperHeight,
    extraCss: `
      .barcode-card {
        page-break-after: always;
        break-after: page;
      }
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    `,
  });
};