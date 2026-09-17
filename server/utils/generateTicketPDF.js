const PDFDocument = require('pdfkit');
const { getSeatPosition, getSeatFare, getFareBreakdown } = require('./seatPricing');

/**
 * Generates a premium, professional invoice-style travel ticket PDF for CityLink.
 * Theme: Indigo (#4F5AE8), Orange (#FF6B35), Navy (#1E1F3B), Light Slate (#F5F6FA)
 * Pure ASCII strings used for 100% PDFKit base-14 font compatibility.
 */
const generateTicketPDF = (booking, res) => {
  const doc = new PDFDocument({ margin: 0, size: 'A4' });

  const filename = `CityLink-Ticket-${booking._id}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  const W = 595.28;   // A4 Width in points
  const H = 841.89;   // A4 Height in points
  const MARGIN = 36;
  const CW = W - MARGIN * 2; // Content Width: 523.28

  // ── Colors ────────────────────────────────────────────────
  const INDIGO      = '#4F5AE8';
  const INDIGO_DARK = '#3138B8';
  const INDIGO_LIGHT= '#EEF0FA';
  const GOLD        = '#FFD580';
  const NAVY        = '#1E1F3B';
  const GRAY_DARK   = '#374151';
  const GRAY        = '#6B7280';
  const GRAY_LIGHT  = '#9CA3AF';
  const BG_ROW_ALT  = '#F8F9FD';
  const BORDER      = '#D9DAE8';
  const WHITE       = '#FFFFFF';
  const GREEN       = '#10B981';

  // ── Helper Utilities ──────────────────────────────────────
  const drawRect = (x, y, w, h, fill, stroke, lineWidth = 1) => {
    doc.lineWidth(lineWidth);
    doc.rect(x, y, w, h);
    if (fill && stroke) {
      doc.fillColor(fill).strokeColor(stroke).fillAndStroke();
    } else if (fill) {
      doc.fillColor(fill).fill();
    } else if (stroke) {
      doc.strokeColor(stroke).stroke();
    }
  };

  const drawRoundedRect = (x, y, w, h, r, fill, stroke, lineWidth = 1) => {
    doc.lineWidth(lineWidth);
    doc.roundedRect(x, y, w, h, r);
    if (fill && stroke) {
      doc.fillColor(fill).strokeColor(stroke).fillAndStroke();
    } else if (fill) {
      doc.fillColor(fill).fill();
    } else if (stroke) {
      doc.strokeColor(stroke).stroke();
    }
  };

  // Safe data extraction
  const source = booking.route?.source || 'N/A';
  const destination = booking.route?.destination || 'N/A';
  const busName = booking.route?.bus?.busName || 'CityLink Express';
  const busNumber = booking.route?.bus?.busNumber || 'N/A';
  const busType = booking.route?.bus?.type || 'AC Sleeper';
  const duration = booking.route?.duration || 'N/A';
  const routeBaseFare = Number(booking.route?.fare) || 0;
  const departureDate = booking.route?.departureTime
    ? new Date(booking.route.departureTime).toLocaleDateString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      })
    : 'N/A';
  const departureTime = booking.route?.departureTime
    ? new Date(booking.route.departureTime).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
      })
    : 'N/A';

  const seatsArray = Array.isArray(booking.seats) ? booking.seats : [];
  const seatsCount = seatsArray.length || 1;
  const seatsDetailText = seatsArray
    .map((s) => `Seat ${s} (${getSeatPosition(s).isWindow ? 'Window' : 'Aisle'})`)
    .join(', ');
  const seatsText = seatsArray.length > 0 ? seatsDetailText : 'N/A';
  const totalFare = Number(booking.totalFare) || 0;
  
  // Calculate itemized breakdown (GST 5% included)
  const gstAmount = Math.round((totalFare * 5 / 105) * 100) / 100;
  const baseFare = Math.round((totalFare - gstAmount) * 100) / 100;
  const pnrString = `CL-${booking._id ? booking._id.toString().slice(-8).toUpperCase() : 'CITYLINK1'}`;

  // Breakdown of Window vs Aisle seats
  const breakdown = getFareBreakdown(routeBaseFare, seatsArray);

  // ═══════════════════════════════════════════════════════════
  // 1. TOP BRAND HEADER BAND (y: 0 to 100)
  // ═══════════════════════════════════════════════════════════
  doc.rect(0, 0, W, 100).fill(INDIGO);

  // Decorative subtle grid dots in header
  doc.save();
  doc.rect(0, 0, W, 100).clip();
  doc.opacity(0.08);
  doc.fillColor(WHITE);
  for (let gx = 16; gx < W; gx += 20) {
    for (let gy = 10; gy < 100; gy += 18) {
      doc.circle(gx, gy, 1).fill();
    }
  }
  doc.opacity(1);
  doc.restore();

  // Logo: CITY in white, LINK in gold
  doc.font('Helvetica-Bold').fontSize(26).fillColor(WHITE);
  doc.text('CITY', MARGIN, 24, { continued: true });
  doc.fillColor(GOLD).text('LINK');

  // Tagline under logo
  doc.font('Helvetica-Oblique').fontSize(9.5).fillColor('#D0D4FA');
  doc.text('Jisko jana hai woh jake rahega', MARGIN, 54);

  doc.font('Helvetica').fontSize(8).fillColor('#A8AEEE');
  doc.text('Official Digital Bus Travel Pass', MARGIN, 70);

  // Header Right Section
  const badgeW = 164;
  const badgeX = W - MARGIN - badgeW;
  // Badge background: semi-transparent white over indigo header
  drawRoundedRect(badgeX, 20, badgeW, 24, 5, '#7B85EF', '#A0A8F0');
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE);
  doc.text('GST TAX INVOICE / E-TICKET', badgeX, 27, { width: badgeW, align: 'center' });

  doc.font('Helvetica').fontSize(7.5).fillColor('#C8CCFA');
  doc.text('BOOKING REF / PNR', badgeX, 52, { width: badgeW, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD);
  doc.text(pnrString, badgeX, 66, { width: badgeW, align: 'center' });

  // ═══════════════════════════════════════════════════════════
  // 2. JOURNEY ROUTE BANNER (y: 110 to 166)
  // ═══════════════════════════════════════════════════════════
  const routeY = 110;
  const routeH = 56;
  drawRoundedRect(MARGIN, routeY, CW, routeH, 8, INDIGO_LIGHT, BORDER);

  // Origin (Left side)
  doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
  doc.text('FROM / ORIGIN', MARGIN + 16, routeY + 10, { width: 160 });
  doc.font('Helvetica-Bold').fontSize(15).fillColor(NAVY);
  doc.text(source, MARGIN + 16, routeY + 24, { width: 160, ellipsis: true });

  // Center Arrow Box & Duration
  const midX = MARGIN + CW / 2;
  const arrowBoxW = 96;
  const arrowBoxX = midX - arrowBoxW / 2;
  drawRoundedRect(arrowBoxX, routeY + 11, arrowBoxW, 20, 10, WHITE, BORDER);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(INDIGO);
  doc.text('--->', arrowBoxX, routeY + 16, { width: arrowBoxW, align: 'center' });
  doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
  doc.text(`Duration: ${duration}`, arrowBoxX, routeY + 36, { width: arrowBoxW, align: 'center' });

  // Destination (Right side)
  const destX = MARGIN + CW - 16 - 160;
  doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
  doc.text('TO / DESTINATION', destX, routeY + 10, { width: 160, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(15).fillColor(NAVY);
  doc.text(destination, destX, routeY + 24, { width: 160, align: 'right', ellipsis: true });

  // ═══════════════════════════════════════════════════════════
  // 3. TRIP & BUS DETAILS 4-CELL GRID (y: 174 to 228)
  // ═══════════════════════════════════════════════════════════
  const gridY = 174;
  const gridH = 52;
  const colW = CW / 4;

  const tripFields = [
    { label: 'DEPARTURE DATE & TIME', val1: departureDate, val2: departureTime },
    { label: 'BUS OPERATOR', val1: busName, val2: busType },
    { label: 'VEHICLE NUMBER', val1: busNumber, val2: 'AC Class Vehicle' },
    { label: 'BOOKING STATUS', val1: (booking.status || 'CONFIRMED').toUpperCase(), val2: booking.isCouple ? 'Couple Pass Locked' : 'Seat(s) Locked' },
  ];

  tripFields.forEach((f, i) => {
    const cx = MARGIN + i * colW;
    drawRect(cx, gridY, colW, gridH, i % 2 === 0 ? WHITE : BG_ROW_ALT, BORDER);
    
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(GRAY);
    doc.text(f.label, cx + 8, gridY + 7, { width: colW - 16, ellipsis: true });

    const valColor = f.label === 'BOOKING STATUS' ? GREEN : NAVY;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(valColor);
    doc.text(f.val1, cx + 8, gridY + 20, { width: colW - 16, ellipsis: true });

    doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
    doc.text(f.val2, cx + 8, gridY + 34, { width: colW - 16, ellipsis: true });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. TRAVELLER & SEAT TABLE (y: 236 to 298)
  // ═══════════════════════════════════════════════════════════
  const passY = 236;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY);
  doc.text('1. PASSENGER & SEAT DETAILS', MARGIN, passY);

  const tHeadY = passY + 13;
  const tHeadH = 20;

  // Table Column Widths
  const pCols = [
    { name: '#', w: 32, align: 'center' },
    { name: 'PASSENGER NAME', w: 160, align: 'left' },
    { name: 'PRIMARY CONTACT', w: 100, align: 'left' },
    { name: 'SEAT NUMBER(S)', w: 150, align: 'center' },
    { name: 'STATUS', w: CW - (32 + 160 + 100 + 150), align: 'center' },
  ];

  // Draw Table Header
  let currX = MARGIN;
  pCols.forEach((col) => {
    drawRect(currX, tHeadY, col.w, tHeadH, INDIGO_LIGHT, BORDER);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(NAVY);
    doc.text(col.name, currX + 4, tHeadY + 6, { width: col.w - 8, align: col.align });
    currX += col.w;
  });

  // Draw Table Row
  const rowY = tHeadY + tHeadH;
  const rowH = 24;
  currX = MARGIN;

  const rowValues = [
    { text: '01', align: 'center', bold: true },
    { text: booking.passengerName || 'Primary Traveller', align: 'left', bold: true },
    { text: booking.passengerPhone || 'N/A', align: 'left', bold: false },
    { text: seatsText, align: 'center', bold: true, color: INDIGO },
    { text: 'CONFIRMED', align: 'center', bold: true, color: GREEN },
  ];

  rowValues.forEach((rv, i) => {
    const w = pCols[i].w;
    drawRect(currX, rowY, w, rowH, WHITE, BORDER);
    
    doc.font(rv.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
    doc.fillColor(rv.color || NAVY);
    doc.text(rv.text, currX + 6, rowY + 7, { width: w - 12, align: rv.align, ellipsis: true });
    currX += w;
  });

  // ═══════════════════════════════════════════════════════════
  // 5. STRUCTURED PAYMENT & GST BREAKDOWN TABLE (y: 308 to 424)
  // ═══════════════════════════════════════════════════════════
  const payY = 308;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY);
  doc.text('2. FARE BREAKDOWN & TAX INVOICE (INR)', MARGIN, payY);

  const payHeadY = payY + 13;
  const payCols = [
    { name: 'ITEM DESCRIPTION', w: 320, align: 'left' },
    { name: 'QTY / SEATS', w: 80, align: 'center' },
    { name: 'AMOUNT (INR)', w: CW - 400, align: 'right' },
  ];

  let px = MARGIN;
  payCols.forEach((col) => {
    drawRect(px, payHeadY, col.w, tHeadH, INDIGO_LIGHT, BORDER);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(NAVY);
    doc.text(col.name, px + 6, payHeadY + 6, { width: col.w - 12, align: col.align });
    px += col.w;
  });

  // Dynamic Itemized Line Items for Window & Aisle seats
  const lineItems = [];
  if (breakdown.windowSeats.length > 0) {
    lineItems.push({
      desc: `Window Seat(s) (${breakdown.windowSeats.map(s => `Seat ${s}`).join(', ')}) - Premium Panoramic View`,
      qty: `${breakdown.windowSeats.length}`,
      amt: `INR ${breakdown.windowTotal.toFixed(2)}`,
    });
  }
  if (breakdown.aisleSeats.length > 0) {
    lineItems.push({
      desc: `Aisle Seat(s) (${breakdown.aisleSeats.map(s => `Seat ${s}`).join(', ')}) - Standard Travel Class`,
      qty: `${breakdown.aisleSeats.length}`,
      amt: `INR ${breakdown.aisleTotal.toFixed(2)}`,
    });
  }
  if (lineItems.length === 0) {
    lineItems.push({
      desc: `Bus Travel Fare (${source} to ${destination})`,
      qty: `${seatsCount}`,
      amt: `INR ${baseFare.toFixed(2)}`,
    });
  }
  lineItems.push({
    desc: 'CGST (2.5%) + SGST (2.5%) - Road Transport Passenger Service',
    qty: '5.0%',
    amt: `INR ${gstAmount.toFixed(2)}`,
  });

  let currentPayRowY = payHeadY + tHeadH;
  const payRowH = 22;

  lineItems.forEach((item, index) => {
    const isAlt = index % 2 === 1;
    let lx = MARGIN;

    [
      { text: item.desc, w: payCols[0].w, align: 'left', bold: false },
      { text: item.qty, w: payCols[1].w, align: 'center', bold: false },
      { text: item.amt, w: payCols[2].w, align: 'right', bold: true },
    ].forEach((cell) => {
      drawRect(lx, currentPayRowY, cell.w, payRowH, isAlt ? BG_ROW_ALT : WHITE, BORDER);
      doc.font(cell.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor(NAVY);
      doc.text(cell.text, lx + 8, currentPayRowY + 6, { width: cell.w - 16, align: cell.align });
      lx += cell.w;
    });

    currentPayRowY += payRowH;
  });

  // Highlighted Total Row (Indigo Banner)
  const totalRowH = 28;
  drawRect(MARGIN, currentPayRowY, payCols[0].w + payCols[1].w, totalRowH, INDIGO, INDIGO);
  drawRect(MARGIN + payCols[0].w + payCols[1].w, currentPayRowY, payCols[2].w, totalRowH, INDIGO_DARK, INDIGO_DARK);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE);
  doc.text('TOTAL INVOICE VALUE (INCL. ALL TAXES & CHARGES)', MARGIN + 12, currentPayRowY + 9);

  doc.font('Helvetica-Bold').fontSize(11.5).fillColor(GOLD);
  doc.text(`INR ${totalFare.toFixed(2)}`, MARGIN + payCols[0].w + payCols[1].w, currentPayRowY + 8, {
    width: payCols[2].w - 12,
    align: 'right',
  });

  // ═══════════════════════════════════════════════════════════
  // 6. IMPORTANT TRAVEL GUIDELINES BOX (y: 432 to 552)
  // ═══════════════════════════════════════════════════════════
  const guideY = 432;
  const guideH = 116;
  drawRoundedRect(MARGIN, guideY, CW, guideH, 6, '#FAFAFC', BORDER);

  // Guide Header
  drawRoundedRect(MARGIN, guideY, CW, 20, 6, INDIGO_LIGHT, BORDER);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(NAVY);
  doc.text('IMPORTANT PASSENGER GUIDELINES & TERMS OF TRAVEL', MARGIN + 10, guideY + 6);

  const guidelines = [
    '- Reporting Time: Please arrive at the designated boarding point at least 15 minutes prior to departure.',
    '- Mandatory ID Proof: All passengers must carry a valid original Government photo ID (Aadhaar / Passport / DL).',
    '- Baggage Allowance: 15 kg of personal luggage permitted per seat. Commercial/inflammable goods prohibited.',
    '- Digital Ticket: This PDF e-ticket or SMS with ' + pnrString + ' is accepted as valid boarding proof.',
    '- Cancellation Policy: Ticket cancellations and refunds can be managed directly via CityLink "My Bookings".',
  ];

  let gy = guideY + 26;
  guidelines.forEach((g) => {
    doc.font('Helvetica').fontSize(7.5).fillColor(GRAY_DARK);
    doc.text(g, MARGIN + 10, gy, { width: CW - 20 });
    gy += 17;
  });

  // ═══════════════════════════════════════════════════════════
  // 7. DASHED TEAR-LINE DIVIDER (y: 566)
  // ═══════════════════════════════════════════════════════════
  const tearY = 566;

  doc.font('Helvetica-Bold').fontSize(7).fillColor(GRAY);
  doc.text('[ TEAR ALONG THIS LINE ]', MARGIN, tearY - 4, { width: CW, align: 'center' });

  // Dashed Line
  doc.save();
  doc.moveTo(MARGIN, tearY + 8)
     .lineTo(MARGIN + CW, tearY + 8)
     .lineWidth(0.8)
     .strokeColor(BORDER)
     .dash(4, { space: 3 })
     .stroke();
  doc.restore();

  // ═══════════════════════════════════════════════════════════
  // 8. FOOTER PASSENGER RECEIPT SLIP & BRANDING (y: 586 to End)
  // ═══════════════════════════════════════════════════════════
  const slipY = 586;
  drawRoundedRect(MARGIN, slipY, CW, 52, 6, WHITE, BORDER);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(INDIGO);
  doc.text('CITYLINK PASSENGER BOARDING SLIP', MARGIN + 10, slipY + 8);

  doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
  doc.text(`Passenger: ${booking.passengerName || 'N/A'}  |  Route: ${source} -> ${destination}  |  Seats: ${seatsText}  |  Total: INR ${totalFare.toFixed(2)}`, MARGIN + 10, slipY + 22);
  doc.text(`Booking ID: ${booking._id || 'N/A'}  |  Issue Date: ${new Date().toLocaleDateString('en-IN')}`, MARGIN + 10, slipY + 36);

  // Tagline & Support Info
  const footInfoY = slipY + 64;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INDIGO);
  doc.text('CityLink Services', MARGIN, footInfoY, { continued: true });
  doc.font('Helvetica-Oblique').fillColor(GRAY).text(' - "Jisko jana hai woh jake rahega"');

  doc.font('Helvetica').fontSize(7.5).fillColor(GRAY);
  doc.text('24x7 Customer Support: support@citylink.in | Toll-Free: 1800-CITYLINK | Web: citylink.in', MARGIN, footInfoY + 14);

  // Subtle Watermark in bottom corner
  doc.font('Helvetica').fontSize(6.5).fillColor(GRAY_LIGHT);
  doc.text('Made by Sristi Priya', W - MARGIN - 140, H - 38, {
    width: 140,
    align: 'right',
  });

  // Bottom brand strip
  doc.rect(0, H - 24, W, 24).fill(INDIGO_DARK);
  doc.font('Helvetica').fontSize(7.5).fillColor('#D0D4FA');
  doc.text('(C) 2026 CityLink Reservations  |  Safe Travels & Happy Journey', 0, H - 16, {
    width: W,
    align: 'center',
  });

  doc.end();
};

module.exports = generateTicketPDF;
