import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export const exportPdfFromPages = async (
  container: HTMLElement,
  fileName = "resume.pdf"
) => {
  // `compress: true` significantly reduces output size (especially for multi-page exports)
  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageNodes = Array.from(
    container.querySelectorAll<HTMLElement>("[data-page]")
  );

  if (pageNodes.length === 0) {
    console.error("No pages found for PDF export");
    return;
  }

  console.log(`Exporting ${pageNodes.length} page(s) to PDF...`);

  // Keep it crisp but not gigantic:
  // - We still rasterize (html2canvas), so scale controls sharpness most.
  // - Use JPEG + PDF compression to keep file sizes reasonable.
  const scale = 4;
  const jpegQuality = 0.92;

  const root =
    typeof document !== "undefined" ? document.documentElement : null;
  root?.classList.add("exporting-pdf");

  try {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageNodes.length; i += 1) {
      console.log(`Rendering page ${i + 1}/${pageNodes.length}...`);

      const rect = pageNodes[i].getBoundingClientRect();
      const targetW = Math.max(1, Math.round(rect.width));
      const targetH = Math.max(1, Math.round(rect.height));

      const canvas = await html2canvas(pageNodes[i], {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        // Ensure every page captures the same A4-sized box to keep font sizes consistent
        width: targetW,
        height: targetH,
        windowWidth: targetW,
        windowHeight: targetH,
        // Avoid scroll-related offsets that can create large blank areas on the first page
        scrollX: typeof window !== "undefined" ? -window.scrollX : 0,
        scrollY: typeof window !== "undefined" ? -window.scrollY : 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", jpegQuality);
      // Draw to full A4 page (no border/shadow captured; ratio should match with fixed .page height)
      pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH, undefined, "SLOW");
      if (i < pageNodes.length - 1) {
        pdf.addPage();
      }
    }

    console.log("PDF export complete");
    pdf.save(fileName);
  } finally {
    root?.classList.remove("exporting-pdf");
  }
};

export const printWithStyles = () => {
  window.print();
};

export const calcPageHeightPx = (): number => {
  const a4HeightMm = 297;
  // Pagination uses block heights inside the padded page.
  // Fallback: default padding is 8mm top+bottom (actual pagination reads from DOM)
  const pagePaddingMmY = 8 * 2;
  const heightPx = ((a4HeightMm - pagePaddingMmY) / 25.4) * 96;
  return Math.floor(heightPx);
};
