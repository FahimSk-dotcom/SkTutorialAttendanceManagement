import { getClassSortRank } from "@/lib/classUtils";

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  month?: number;
  year?: number;
  batchFilter?: string;
  activeTab?: string;
}

/**
 * Safely loads an image in browser environment with timeout protection.
 */
function tryLoadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    setTimeout(() => resolve(null), 2500); // 2.5s timeout
    img.src = src;
  });
}

/**
 * Generates an advanced, executive-level PDF Attendance Report for SK Tutorials.
 * Matches exact UI style, official high-res Cloudinary emblem logo, perfectly aligned header,
 * structured KPI cards, class breakdown table, student matrix, and custom proprietor footer.
 */
export async function generateAttendancePDF(
  reportData: any,
  options: PDFExportOptions = {}
) {
  const { default: jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = (autoTableModule.default || autoTableModule) as any;

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const checkPageBreak = (neededHeight: number, currentY: number): number => {
    if (currentY + neededHeight > pageHeight - 20) {
      pdf.addPage();
      return 18;
    }
    return currentY;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const curMonthName = options.month ? monthNames[options.month - 1] : monthNames[new Date().getMonth()];
  const curYear = options.year || new Date().getFullYear();
  const batchLabel =
    options.batchFilter === "5-7"
      ? "5–7 Batch"
      : options.batchFilter === "7-9"
      ? "7–9 Batch"
      : "All Batches";

  // Normalize student list from reportData
  const rawList: any[] =
    reportData.studentRows || reportData.students || [];

  const studentList = rawList.map((st: any) => ({
    studentId: st.studentId,
    name: st.name,
    class: st.class,
    batch: st.batch,
    conducted: st.conducted ?? st.totalConducted ?? 0,
    present: st.present ?? st.presentCount ?? 0,
    absent: st.absent ?? st.absentCount ?? 0,
    percentage: st.percentage ?? 0,
    consecutiveAbsences: st.consecutiveAbsences ?? 0,
  }));

  // Sort by Grade Level then Name
  studentList.sort((a, b) => {
    const rankA = getClassSortRank(a.class);
    const rankB = getClassSortRank(b.class);
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });

  // Calculate Overall Totals
  const totalStudents = studentList.length;
  const totalConducted = studentList.reduce((acc, s) => acc + s.conducted, 0);
  const totalPresent = studentList.reduce((acc, s) => acc + s.present, 0);
  const totalAbsent = studentList.reduce((acc, s) => acc + s.absent, 0);
  const overallRate =
    totalConducted > 0 ? (totalPresent / totalConducted) * 100 : 0;

  // Class-wise statistics for Key Insights
  const classMap = new Map<string, { count: number; cond: number; pres: number; abs: number }>();
  studentList.forEach((s) => {
    const cls = s.class || "Other";
    if (!classMap.has(cls)) {
      classMap.set(cls, { count: 0, cond: 0, pres: 0, abs: 0 });
    }
    const item = classMap.get(cls)!;
    item.count += 1;
    item.cond += s.conducted;
    item.pres += s.present;
    item.abs += s.absent;
  });

  const classStatList = Array.from(classMap.entries()).map(([cls, stat]) => {
    const rate = stat.cond > 0 ? (stat.pres / stat.cond) * 100 : 0;
    const absRate = stat.cond > 0 ? (stat.abs / stat.cond) * 100 : 0;
    return {
      className: cls,
      ...stat,
      rate,
      absRate,
    };
  });

  // Best Attendance Class
  const sortedByRate = [...classStatList].sort((a, b) => b.rate - a.rate);
  const bestClassStat = sortedByRate[0] || { className: "N/A", rate: 0 };

  // Lowest Attendance Class (Needs Attention)
  const activeClassStats = classStatList.filter((c) => c.cond > 0);
  const sortedAscending = (activeClassStats.length > 0 ? activeClassStats : classStatList).sort(
    (a, b) => a.rate - b.rate
  );
  const lowestClassStat = sortedAscending[0] || { className: "N/A", rate: 0 };

  // Most Absences Class
  const sortedByAbs = (activeClassStats.length > 0 ? activeClassStats : classStatList).sort(
    (a, b) => b.absRate - a.absRate
  );
  const mostAbsentClassStat = sortedByAbs[0] || { className: "N/A", absRate: 0 };

  // === 1. HEADER WITH CLOUDINARY LOGO & PERFECT ALIGNMENT ===
  const CLOUDINARY_LOGO_URL =
    "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896530/86a65215-ce9c-427d-9cc5-f67d0a08040c_gyndgk.png";

  let logoImg = await tryLoadImage(CLOUDINARY_LOGO_URL);
  if (!logoImg && typeof window !== "undefined") {
    logoImg = await tryLoadImage(`${window.location.origin}/sk-logo.png`);
  }

  const logoX = 15;
  const logoY = 15;
  const logoSize = 22; // 22mm x 22mm crisp circular emblem
  if (logoImg) {
    try {
      pdf.addImage(logoImg, "PNG", logoX, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn("Logo rendering skipped", e);
    }
  }

  // Header Text Grouped and Perfectly Aligned to the Right of the Logo
  const textX = logoImg ? 41 : 15;

  // Line 1: Organization Name (Official Deep Navy from SK Tutorials logo)
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 30, 54);
  pdf.text("SK TUTORIALS", textX, logoY + 6);

  // Line 2: Tagline (Aligned with textX)
  pdf.setFontSize(10.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(71, 85, 105); // Slate 600
  pdf.text("SK Tutorials Attendance Management System", textX, logoY + 12.5);

  // Line 3: Report Period & Title (Aligned with textX)
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 30, 54);
  const reportMainTitle = options.title || `Monthly Attendance Report — ${curMonthName} ${curYear}`;
  pdf.text(reportMainTitle, textX, logoY + 19);

  let yPosition = logoY + logoSize + 4.5; // Exactly below the logo (approx 41.5mm)

  // Metadata Bar (Clean single-line header without Total Enrolled)
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  const now = new Date();
  const reportDateStr = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const reportTimeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  pdf.text(
    `Generated on: ${reportDateStr} at ${reportTimeStr}   |   Report Period: ${curMonthName} ${curYear}   |   Batch: ${batchLabel}`,
    15,
    yPosition
  );

  yPosition += 4.5;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(15, yPosition, pageWidth - 15, yPosition);

  yPosition += 7;

  // === 2. KEY INSIGHTS (EXACTLY MATCHING USER'S IMAGE 2) ===
  pdf.setFontSize(15);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 30, 54);
  pdf.text("Key Insights", 15, yPosition);
  yPosition += 5;

  const cardWidth = (pageWidth - 30 - 6) / 2;
  const cardHeight = 26;

  const drawInsightCard = (
    x: number,
    y: number,
    bgColor: [number, number, number],
    borderColor: [number, number, number],
    iconType: "check" | "cross_red" | "cross_orange" | "clock",
    title: string,
    value: string,
    desc: string,
    titleColor: [number, number, number]
  ) => {
    pdf.setFillColor(...bgColor);
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 3.5, 3.5, "FD");

    // Vector Icon
    if (iconType === "check") {
      // Green circle with white checkmark
      pdf.setFillColor(22, 163, 74);
      pdf.circle(x + 7.5, y + 7.5, 3, "F");
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.65);
      pdf.line(x + 6.3, y + 7.5, x + 7.1, y + 8.7);
      pdf.line(x + 7.1, y + 8.7, x + 8.9, y + 6.3);
    } else if (iconType === "cross_red") {
      // Red circle with white cross
      pdf.setFillColor(220, 38, 38);
      pdf.circle(x + 7.5, y + 7.5, 3, "F");
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.65);
      pdf.line(x + 6.3, y + 6.3, x + 8.7, y + 8.7);
      pdf.line(x + 8.7, y + 6.3, x + 6.3, y + 8.7);
    } else if (iconType === "cross_orange") {
      // Orange bold cross
      pdf.setDrawColor(234, 88, 12);
      pdf.setLineWidth(1.0);
      pdf.line(x + 5.5, y + 5.5, x + 9.5, y + 9.5);
      pdf.line(x + 9.5, y + 5.5, x + 5.5, y + 9.5);
    } else if (iconType === "clock") {
      // Clock circle with hands
      pdf.setDrawColor(180, 120, 10);
      pdf.setLineWidth(0.65);
      pdf.circle(x + 7.5, y + 7.5, 3, "S");
      pdf.line(x + 7.5, y + 7.5, x + 7.5, y + 5.8);
      pdf.line(x + 7.5, y + 7.5, x + 8.8, y + 7.5);
    }

    // Title
    pdf.setFontSize(10.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...titleColor);
    pdf.text(title, x + 13, y + 8.5);

    // Big Value
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...titleColor);
    pdf.text(value, x + 13, y + 16.5);

    // Subtitle Description
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...titleColor);
    pdf.text(desc, x + 13, y + 22);
  };

  // Card 1: Best Attendance (Green)
  drawInsightCard(
    15,
    yPosition,
    [220, 252, 231],
    [187, 247, 208],
    "check",
    "Best Attendance",
    `${bestClassStat.rate.toFixed(1)}%`,
    `${bestClassStat.className} leads`,
    [22, 163, 74]
  );

  // Card 2: Needs Attention (Red)
  drawInsightCard(
    15 + cardWidth + 6,
    yPosition,
    [254, 242, 242],
    [252, 165, 165],
    "cross_red",
    "Needs Attention",
    `${lowestClassStat.rate.toFixed(1)}%`,
    `${lowestClassStat.className} lowest`,
    [220, 38, 38]
  );

  yPosition += cardHeight + 4.5;

  // Card 3: Most Absences (Orange)
  drawInsightCard(
    15,
    yPosition,
    [255, 247, 237],
    [253, 186, 116],
    "cross_orange",
    "Most Absences",
    `${mostAbsentClassStat.absRate.toFixed(1)}%`,
    `${mostAbsentClassStat.className} highest rate`,
    [234, 88, 12]
  );

  // Card 4: Overall Attendance (Yellow)
  drawInsightCard(
    15 + cardWidth + 6,
    yPosition,
    [254, 249, 195],
    [253, 224, 71],
    "clock",
    "Overall Attendance",
    `${overallRate.toFixed(1)}%`,
    `${batchLabel} overall rate`,
    [180, 120, 10]
  );

  yPosition += cardHeight + 8;

  // === 3. CLASS-WISE BREAKDOWN SUMMARY TABLE (Executive Deep Navy) ===
  const classRows = classStatList
    .sort((a, b) => getClassSortRank(a.className) - getClassSortRank(b.className))
    .map((stat) => [
      stat.className,
      stat.count.toString(),
      stat.cond.toString(),
      stat.pres.toString(),
      stat.abs.toString(),
      `${stat.rate.toFixed(1)}%`,
    ]);

  if (classRows.length > 0) {
    yPosition = checkPageBreak(35, yPosition);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 30, 54);
    pdf.text("Class-wise Attendance Distribution", 15, yPosition);
    yPosition += 3.5;

    autoTable(pdf, {
      head: [["Class / Grade", "Students", "Classes Marked", "Present", "Absent", "Rate %"]],
      body: classRows,
      startY: yPosition,
      theme: "striped",
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        textColor: [31, 41, 55],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 30, 54], // Official SK Tutorials Deep Navy
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 15, right: 15 },
      didParseCell: (data: any) => {
        if (data.column.index === 5 && data.section === "body") {
          const pct = parseFloat(data.cell.text[0]);
          if (pct >= 90) data.cell.styles.textColor = [5, 150, 105];
          else if (pct >= 75) data.cell.styles.textColor = [217, 119, 6];
          else data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    yPosition = ((pdf as any).lastAutoTable?.finalY || yPosition) + 8;
  }

  // === 4. DETAILED STUDENT ATTENDANCE TABLE (Executive Charcoal Slate) ===
  yPosition = checkPageBreak(40, yPosition);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 30, 54);
  pdf.text("Student Attendance Matrix Details", 15, yPosition);
  yPosition += 3.5;

  const studentTableColumns = [
    "#",
    "Student ID",
    "Student Name",
    "Class",
    "Batch",
    "Conducted",
    "Present",
    "Absent",
    "Rate %",
  ];

  const studentTableRows = studentList.map((s, idx) => [
    (idx + 1).toString(),
    s.studentId,
    s.name,
    s.class,
    s.batch === "5-7" ? "5–7 Batch" : s.batch === "7-9" ? "7–9 Batch" : s.batch,
    s.conducted.toString(),
    s.present.toString(),
    s.absent.toString(),
    `${s.percentage}%`,
  ]);

  autoTable(pdf, {
    head: [studentTableColumns],
    body: studentTableRows,
    startY: yPosition,
    theme: "striped",
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800 Charcoal Header
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 18 },
      2: { cellWidth: 42, fontStyle: "bold" },
      3: { cellWidth: 24 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 16, halign: "center" },
      7: { cellWidth: 16, halign: "center" },
      8: { cellWidth: 16, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data: any) => {
      if (data.column.index === 8 && data.section === "body") {
        const pct = parseFloat(data.cell.text[0]);
        if (pct >= 90) data.cell.styles.textColor = [5, 150, 105]; // Emerald
        else if (pct >= 75) data.cell.styles.textColor = [217, 119, 6]; // Amber
        else data.cell.styles.textColor = [225, 29, 72]; // Rose
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // === 5. FOOTER ON ALL PAGES ===
  const signatureText = "Prof. Fahim Sir ( Proprietor )  |  SK Tutorials";
  const totalPages = (pdf as any).getNumberOfPages ? (pdf as any).getNumberOfPages() : 1;

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Divider line above footer
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(15, pageHeight - 14, pageWidth - 15, pageHeight - 14);

    // Line 1: Page number + system info (Left), Date (Right)
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Page ${i} of ${totalPages}  |  SK Tutorials Attendance Management System`,
      15,
      pageHeight - 9
    );
    pdf.text(now.toLocaleDateString("en-IN"), pageWidth - 35, pageHeight - 9);

    // Line 2: Signature
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(100, 116, 139);
    pdf.text(signatureText, 15, pageHeight - 4.5);
  }

  return pdf;
}
