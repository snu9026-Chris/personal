/**
 * 보고서 DOM을 PDF로 직접 다운로드.
 * window.print() 다이얼로그 없이 바로 .pdf 파일을 저장한다.
 *
 * - html2canvas로 렌더링된 DOM을 PNG로 캡처
 * - jsPDF로 A4 페이지에 분할 배치
 * - 양쪽 라이브러리는 dynamic import (서버 번들 회피)
 */

export async function exportReportPdf(elementId: string, filename: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(elementId);
  if (!el) {
    console.error(`PDF export: element #${elementId} not found`);
    return;
  }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // 캡처: 고해상도 위해 scale 2
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // 단일 페이지로 들어가면 그대로
  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  } else {
    // 멀티 페이지 분할
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  }

  // 파일명에서 위험 문자 제거
  const safeName = filename.replace(/[\\/:*?"<>|]/g, "_").trim() || "report";
  pdf.save(`${safeName}.pdf`);
}
