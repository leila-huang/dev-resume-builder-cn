import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportPdfFromPages = async (container: HTMLElement, fileName = 'resume.pdf') => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageNodes = Array.from(container.querySelectorAll<HTMLElement>('[data-page]'));

  for (let i = 0; i < pageNodes.length; i += 1) {
    const canvas = await html2canvas(pageNodes[i], { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    if (i < pageNodes.length - 1) {
      pdf.addPage();
    }
  }

  pdf.save(fileName);
};

export const printWithStyles = () => {
  window.print();
};

export const calcPageHeightPx = (): number => {
  const a4HeightMm = 297;
  const heightPx = (a4HeightMm / 25.4) * 96;
  return Math.floor(heightPx);
};
