'use client';

/**
 * Exports HTML content to a downloadable PDF file using html2pdf.js.
 *
 * @param {string} content - The HTML string to convert to PDF.
 * @param {string} filename - The desired filename (without extension).
 * @returns {Promise<void>}
 */
export async function exportToPDF(content, filename = 'ParserProof-Export') {
  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.innerHTML = content;
  container.style.fontFamily = 'Arial, Helvetica, sans-serif';
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.6';
  container.style.color = '#1a1a1a';
  container.style.padding = '20px';

  const options = {
    margin: [10, 15, 10, 15],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  await html2pdf().set(options).from(container).save();
}
