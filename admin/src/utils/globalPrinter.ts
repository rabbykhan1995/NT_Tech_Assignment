type PrintOptions = {
  title?: string;
};

type POSPrintOptions = {
  title?: string;
  paperWidth?: "58mm" | "80mm"; // 58mm default, 80mm also common
};

export const printInvoice = (
  elementRef: React.RefObject<HTMLElement | null>,
  options: PrintOptions = {}
) => {
  if (!elementRef?.current) {
    console.error("No element found to print");
    return;
  }

  const { title = "Invoice" } = options;

  const printContent = elementRef.current.outerHTML;

  let styles = "";
  document
    .querySelectorAll("link[rel='stylesheet'], style")
    .forEach((node) => {
      styles += node.outerHTML;
    });

  const printHTML = `
    <html>
      <head>
        <title>${title}</title>
        ${styles}
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            * {
              background: white !important;
              background-color: white !important;
              background-image: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
              color: black !important;
            }
            #no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(printHTML);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };
};




export const printPOS = (
  elementRef: React.RefObject<HTMLElement | null>,
  options: POSPrintOptions = {}
) => {
  if (!elementRef?.current) {
    console.error("No element found to print");
    return;
  }

  const { title = "Receipt", paperWidth = "58mm" } = options;

  const printContent = elementRef.current.outerHTML;

  const printHTML = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 2px;
            box-sizing: border-box;
          }

          body {
            width: ${paperWidth};
            max-width: ${paperWidth};
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            background: #fff;
          }

          @media print {
            @page {
              size: ${paperWidth} auto; /* auto height = continuous/roll paper */
              margin: 0;
            }

            html, body {
              width: ${paperWidth};
              margin: 0;
              padding: 0;
            }

            * {
              color: black !important;
              background: white !important;
              background-color: white !important;
              background-image: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }

            #no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = paperWidth;
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(printHTML);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };
};

// স্টিকার প্রিন্টের জন্য অপশন টাইপ ডিফাইন করা হলো
export type BarcodePrintOptions = {
  title?: string;
  paperWidth?: string; // যেমন: '50mm', '38mm', '100mm' বা 'auto'
  paperHeight?: string; // স্টিকারের উচ্চতা যেমন: '30mm', '25mm' বা 'auto'
};

 export const printBarcodeSticker = (
  elementRef: React.RefObject<HTMLElement | null>,
  options: BarcodePrintOptions = {}
  ) => {
  if (!elementRef?.current) {
    console.error("No elements found to print barcode");
    return;
  }

  // ডিফল্ট সাইজ সাধারণত বারকোড স্টিকারের স্ট্যান্ডার্ড সাইজ অনুযায়ী সেট করা (যেমন: 50mm x 30mm)
  const {
    title = "Barcode-Sticker",
    paperWidth = "50mm",
    paperHeight = "30mm"
  } = options;

  // ভেতরের সব কার্ডের HTML কনটেন্ট রিড করা
  const printContent = elementRef.current.innerHTML;

   const printHTML = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            width: ${paperWidth};
            max-width: ${paperWidth};
            font-family: Arial, sans-serif;
            background: #fff;
            color: #000;
          }

          /* বারকোড র‍্যাপার স্টাইলিং */
          .print-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0px;
          }

          /* প্রতিটি বারকোড কার্ডকে একটি নির্দিষ্ট পেজ ব্রেক হিসেবে গণ্য করা হবে */
          .barcode-card {
            width: ${paperWidth};
            height: ${paperHeight};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4px;
            background: white;
            page-break-after: always; /* প্রতিটি স্টিকারের পর নতুন পেজ বা রোল পুশ হবে */
            break-after: page;
          }

          @media print {
            @page {
              size: ${paperWidth} ${paperHeight}; /* স্টিকারের নির্দিষ্ট উইডথ এবং হাইট */
              margin: 0;
            }

            html, body {
              width: ${paperWidth};
              height: ${paperHeight};
              margin: 0;
              padding: 0;
            }

            * {
              color: black !important;
              background: white !important;
              background-color: white !important;
              background-image: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-wrap">
          ${printContent}
        </div>
      </body>
    </html>
  `;

  // ব্যাকগ্রাউন্ড প্রিন্টিং এর জন্য হিডেন iframe তৈরি করা
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = paperWidth;
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(printHTML);
  doc.close();

  // আইফ্রেম লোড কমপ্লিট হলে প্রিন্ট ডায়ালগ ওপেন করা
  iframe.onload = () => {
    // কিছু কিছু ব্রাউজারে SVG বারকোড রেন্ডার হতে সামান্য সময় নেয়, তাই অল্প একটু ডিলে দেওয়া নিরাপদ
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // প্রিন্ট ট্র্রিগার হওয়ার পর DOM থেকে iframe রিমুভ করা
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 150);
  };
};