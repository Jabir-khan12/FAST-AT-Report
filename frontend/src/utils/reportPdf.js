import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { standardWeights } from '../data/defaultStandards';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
}

function formatDateMonthYear(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function sanitizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function splitLines(doc, text, maxWidth) {
  return doc.splitTextToSize(sanitizeText(text), maxWidth);
}

function loadImageAsDataUrl(src) {
  return fetch(src)
    .then((response) => response.blob())
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

function getStandardScore(response, standardKey) {
  const score = response?.standardScores?.[standardKey]?.weightedScore;
  return Number(score || 0).toFixed(2);
}

function getStandardTotal(response, standardKey) {
  const ratings = Array.isArray(response?.[standardKey]) ? response[standardKey] : [];
  return ratings.reduce((sum, value) => sum + Number(value || 0), 0);
}

function getSelectedMarkCell(rating, score) {
  const selectedRating = Number(rating || 0);
  const targetScore = Number(score || 0);
  if (!selectedRating || !targetScore) return '';
  return selectedRating === targetScore ? String(targetScore) : '';
}

function renderCoverPage(doc, response, titleText) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [30, 58, 138];
  const textColor = [51, 65, 85];

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(28);
  doc.text('NATIONAL UNIVERSITY', pageWidth / 2, 90, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.text('of Computer & Emerging Sciences', pageWidth / 2, 115, { align: 'center' });

  return loadImageAsDataUrl('/fast-uni-logo.jpeg')
    .catch(() => null)
    .then((logoDataUrl) => {
      if (logoDataUrl) {
        // Logo size increased heavily and centered perfectly
        doc.addImage(logoDataUrl, 'JPEG', pageWidth / 2 - 40, 150, 80, 80);
      }

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('ASSESSMENT TEAM REPORT', pageWidth / 2, 290, { align: 'center' });
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.text('2nd Evaluation Cycle as per', pageWidth / 2, 320, { align: 'center' });
      doc.text('Program Review for Effectiveness and Enhancement (PREE)', pageWidth / 2, 340, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text(response?.programName || 'BS Artificial Intelligence', pageWidth / 2, 380, { align: 'center' });

      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(formatDateMonthYear(response?.date), pageWidth / 2, 410, { align: 'center' });

      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(1.5);
      doc.line(40, pageHeight - 65, pageWidth - 40, pageHeight - 65);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const footerLines = doc.splitTextToSize(titleText || 'Institutional Quality Assessment & Effectiveness, Peshawar Campus', pageWidth - 80);
      doc.text(footerLines, pageWidth / 2, pageHeight - 45, { align: 'center' });
    });
}

function renderObservationsPage(doc, response, observationsList) {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text('Assessment Team Report', pageWidth / 2, y, { align: 'center' });
  y += 35;
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Observations / Findings by Assessment Team:', 20, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  const maxWidth = pageWidth - 40;
  const items = observationsList.length ? observationsList : [{ observations: response?.observations || 'No observations provided.' }];

  items.forEach((item, index) => {
    const text = sanitizeText(item.observations || item);
    const lines = splitLines(doc, text, maxWidth - 25);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}.`, 20, y);
    doc.setFont('helvetica', 'normal');
    for(let i = 0; i < lines.length; i++){
      doc.text(lines[i], 35, y + (i * 15));
    }
    y += Math.max(lines.length * 15, 15) + 20;
    
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 40;
    }
  });
}

function renderStandardTable(doc, response, standardKey, questions, weight, titleText, index, cumulativeScores, isFirstStandard) {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 40;
  
  const primaryColor = [30, 58, 138];
  const textColor = [51, 65, 85];
  const headerFill = [241, 245, 249];
  const borderColor = [226, 232, 240];
  
  let currentY = 30;

  if (isFirstStandard) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text('Rubric for Assessment Team', 20, currentY);
    currentY += 18;

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Scoring of Standard Items', 20, currentY);
    currentY += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const introText = 'Key areas of each standard are to be scored normally by considering the approach taken by the university and the results achieved. Maximum score for each item is 5 and the minimum is 1. The visiting team is required to mark the chosen score in the corresponding cell against each item. The total of the selected values (TV) for each standard will be determined and normalized in percentages. Each standard has a weight allocated to it. Scores pertaining to a particular standard will be the product of TV and its weightage. Below are the guidelines for awarding scores:';
    const introLines = doc.splitTextToSize(introText, pageWidth - 40);
    
    for(let i = 0; i < introLines.length; i++){
      doc.text(introLines[i], 20, currentY + (i * 14));
    }
    currentY += introLines.length * 14 + 10;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 20, right: 20 },
      theme: 'grid',
      head: [[
        { content: 'Result Overview', styles: { halign: 'left' } },
        { content: 'Score', styles: { halign: 'center' } }
      ]],
      body: [
        ['Poor performance in most of the areas.', '1'],
        ['Fair performance in most of the areas.', '2'],
        ['Good performance for most areas. No poor performance in any areas.', '3'],
        ['Good to excellent performance in all areas.', '4'],
        ['Excellent performance in most of the areas.', '5'],
      ],
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 8, valign: 'middle', textColor: [71, 85, 105], lineColor: borderColor, lineWidth: 0.5 },
      headStyles: { fillColor: headerFill, textColor: primaryColor, fontStyle: 'bold' },
      columnStyles: { 
        0: { cellWidth: 'auto', halign: 'left' },
        1: { halign: 'center', cellWidth: 70, fontStyle: 'bold' } 
      },
    });
    currentY = doc.lastAutoTable?.finalY + 25 || currentY + 110;
  } else {
    currentY += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text(`Standard ${index} - ${titleText}`, 20, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Weight: ${Number(weight).toFixed(2)}`, pageWidth - 20, currentY, { align: 'right' });
  currentY += 14;

  const questionNumberWidth = 25;
  const scoreColumnWidth = 25;
  const factorColumnWidth = contentWidth - questionNumberWidth - scoreColumnWidth * 5;
  
  const tableBody = questions.map((question, questionIndex) => {
    const rating = Number(response?.[standardKey]?.[questionIndex] || 0);
    return [
      String(questionIndex + 1),
      sanitizeText(question),
      getSelectedMarkCell(rating, 1),
      getSelectedMarkCell(rating, 2),
      getSelectedMarkCell(rating, 3),
      getSelectedMarkCell(rating, 4),
      getSelectedMarkCell(rating, 5),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: 20, right: 20 },
    theme: 'grid',
    head: [[
      { content: '#', styles: { halign: 'center' } },
      { content: 'Factors Evaluated', styles: { halign: 'left' } },
      { content: '1', styles: { halign: 'center' } },
      { content: '2', styles: { halign: 'center' } },
      { content: '3', styles: { halign: 'center' } },
      { content: '4', styles: { halign: 'center' } },
      { content: '5', styles: { halign: 'center' } }
    ]],
    body: tableBody,
    styles: { 
      font: 'helvetica', 
      fontSize: 10, 
      cellPadding: 8, 
      valign: 'middle',
      lineColor: borderColor,
      lineWidth: 0.5,
      textColor: [51, 65, 85],
    },
    headStyles: { 
      fillColor: headerFill, 
      textColor: primaryColor, 
      fontStyle: 'bold',
      lineColor: borderColor,
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: questionNumberWidth, halign: 'center', fontStyle: 'bold', textColor: [100, 116, 139] },
      1: { cellWidth: factorColumnWidth, halign: 'left' },
      2: { cellWidth: scoreColumnWidth, halign: 'center' },
      3: { cellWidth: scoreColumnWidth, halign: 'center' },
      4: { cellWidth: scoreColumnWidth, halign: 'center' },
      5: { cellWidth: scoreColumnWidth, halign: 'center' },
      6: { cellWidth: scoreColumnWidth, halign: 'center' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        const colIndex = hookData.column.index;
        if (colIndex >= 2 && colIndex <= 6) {
          const cellVal = hookData.cell.raw;
          if (cellVal) {
            hookData.cell.styles.fillColor = [238, 242, 255]; 
            hookData.cell.styles.textColor = [67, 56, 202]; 
            hookData.cell.styles.fontStyle = 'bold';
            hookData.cell.styles.fontSize = 11;
          }
        }
      }
    },
  });

  const finalY = doc.lastAutoTable?.finalY || 210;
  const totalEncircledValue = getStandardTotal(response, standardKey);
  const standardScore = getStandardScore(response, standardKey);

  autoTable(doc, {
    startY: finalY + 15,
    margin: { left: 20, right: 20 },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 8, halign: 'left', lineColor: borderColor, lineWidth: 0.5 },
    body: [
      [
        { content: 'Total Encircled Value (TV)', styles: { fontStyle: 'bold', textColor: textColor, fillColor: [248, 250, 252] } },
        { content: String(totalEncircledValue), styles: { halign: 'center', fontStyle: 'bold', textColor: primaryColor, fillColor: [248, 250, 252] } }
      ],
      [
        { content: `Score ${index} (S${index}) = [TV / (No. of Questions × 5)] × 100 × Weight`, styles: { fontStyle: 'bold', textColor: textColor, fillColor: [248, 250, 252] } },
        { content: standardScore, styles: { halign: 'center', fontStyle: 'bold', textColor: primaryColor, fillColor: [248, 250, 252] } }
      ],
    ],
    columnStyles: { 0: { cellWidth: contentWidth - 80 }, 1: { halign: 'center', cellWidth: 80 } },
    headStyles: { lineWidth: 0 },
  });

  cumulativeScores.push({
    standardKey,
    standardTitle: titleText,
    totalEncircledValue,
    weightedScore: Number(standardScore),
    weight: Number(weight),
  });
}

function renderCumulativePage(doc, response, cumulativeScores) {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 40;
  const primaryColor = [30, 58, 138];
  const textColor = [51, 65, 85];
  const headerFill = [241, 245, 249];
  const borderColor = [226, 232, 240];
  let y = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text('Assessment Team Report', pageWidth / 2, y, { align: 'center' });
  y += 35;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  
  doc.text(`Evaluator:   ${sanitizeText(response?.evaluatorName || '-')}`, 20, y);
  y += 18;
  doc.text(`Program:   ${sanitizeText(response?.programName || '-')}`, 20, y);
  y += 18;
  doc.text(`Institution:   ${sanitizeText(response?.institutionName || '-')}`, 20, y);
  y += 26;

  autoTable(doc, {
    startY: y,
    margin: { left: 20, right: 20 },
    theme: 'grid',
    head: [['Standard', 'Total Value', 'Weight', 'Weighted Score']],
    body: cumulativeScores.map((entry) => [
      entry.standardTitle,
      String(entry.totalEncircledValue),
      entry.weight.toFixed(2),
      entry.weightedScore.toFixed(2),
    ]),
    styles: { 
      font: 'helvetica', 
      fontSize: 10, 
      cellPadding: 9,
      lineColor: borderColor,
      lineWidth: 0.5,
      textColor: [71, 85, 105],
    },
    headStyles: { 
      fillColor: headerFill, 
      textColor: primaryColor, 
      fontStyle: 'bold',
      lineColor: borderColor,
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: contentWidth - 170, fontStyle: 'bold', textColor: textColor },
      1: { halign: 'center', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 50 },
      3: { halign: 'center', cellWidth: 70, fontStyle: 'bold', textColor: [67, 56, 202] },
    },
  });

  const overall = Number(response?.overallScore || 0).toFixed(2);
  const tableBottom = doc.lastAutoTable?.finalY || 120;
  
  autoTable(doc, {
    startY: tableBottom + 20,
    margin: { left: 20, right: 20 },
    theme: 'grid',
    body: [[
      { content: 'Cumulative Score of All Standards', styles: { fontStyle: 'bold', textColor: textColor, fillColor: [248, 250, 252] } },
      { content: overall, styles: { halign: 'center', fontStyle: 'bold', textColor: [67, 56, 202], fillColor: [238, 242, 255] } },
    ]],
    columnStyles: { 
      0: { cellWidth: contentWidth - 100, halign: 'right' }, 
      1: { halign: 'center', cellWidth: 100 } 
    },
    styles: { 
      font: 'helvetica', 
      fontSize: 12, 
      cellPadding: 12,
      lineColor: borderColor,
      lineWidth: 0.5,
    },
    headStyles: { lineWidth: 0 },
  });
}

export async function generateAssessmentReportPdf({
  scope,
  responses,
  selectedResponse,
  standardTitles,
  standards,
}) {
  const reportResponses = scope === 'selected' && selectedResponse ? [selectedResponse] : (responses || []);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const orderedKeys = Object.keys(standards || {});

  for (let responseIndex = 0; responseIndex < reportResponses.length; responseIndex += 1) {
    const response = reportResponses[responseIndex];
    if (responseIndex > 0) doc.addPage();

    await renderCoverPage(doc, response, 'Institutional Quality Assessment & Effectiveness, Peshawar Campus');
    renderObservationsPage(doc, response, [{ observations: response?.observations || 'No observations provided.' }]);

    const cumulativeScores = [];
    orderedKeys.forEach((standardKey, index) => {
      const questions = standards[standardKey] || [];
      const weight = standardWeights[standardKey] ?? 0;
      const title = standardTitles?.[standardKey] || standardKey;
      const isFirstStandard = index === 0;
      renderStandardTable(doc, response, standardKey, questions, weight, title, index + 1, cumulativeScores, isFirstStandard);
    });

    renderCumulativePage(doc, response, cumulativeScores);
  }

  return doc;
}
