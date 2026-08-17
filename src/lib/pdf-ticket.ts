import jsPDF from "jspdf";
import type { BookingRecord, WaitlistRecord } from "./booking-api";
import { EVENT } from "./event-config";
import { roomForSeat, tierForSeat } from "./seat-layout";

export function generateTicketPdf(ticket: BookingRecord | WaitlistRecord, isWaitlist = false) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const isVerified = !isWaitlist && (ticket as BookingRecord).status === "verified";
  const isRejected = !isWaitlist && (ticket as BookingRecord).status === "rejected";
  const isPending = !isWaitlist && (ticket as BookingRecord).status === "pending";

  const primaryColor = [225, 6, 0]; // F1 Red
  const darkBg = [18, 18, 22]; // Dark sleek theme
  const cardBg = [28, 28, 35];
  const textColor = [255, 255, 255];
  const mutedTextColor = [160, 160, 175];

  // 1. Dark background container
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, 210, 297, "F");

  // 2. Decorative Top F1 Red Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 12, "F");

  // 3. Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("AWS SBG VITB", 15, 25);

  doc.setFontSize(22);
  doc.text("F1 GRAND PRIX SCREENING PASS", 15, 34);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`${EVENT.venue} · ${EVENT.dateLabel} · ${EVENT.timeLabel}`, 15, 41);

  // Divider line
  doc.setDrawColor(50, 50, 65);
  doc.setLineWidth(0.5);
  doc.line(15, 46, 195, 46);

  // 4. Verification Badge Banner
  let badgeText = "VERIFIED BY ORGANISERS";
  let badgeR = 16,
    badgeG = 185,
    badgeB = 129; // Emerald green

  if (isWaitlist) {
    badgeText = "WAITLISTED — SEAT RESERVED";
    badgeR = 168;
    badgeG = 85;
    badgeB = 247; // Purple
  } else if (isRejected) {
    badgeText = "REJECTED BY ORGANISER";
    badgeR = 239;
    badgeG = 68;
    badgeB = 68; // Red
  } else if (isPending) {
    badgeText = "PENDING VERIFICATION";
    badgeR = 245;
    badgeG = 158;
    badgeB = 11; // Amber
  }

  // Draw Badge Box
  doc.setFillColor(badgeR, badgeG, badgeB);
  doc.roundedRect(15, 52, 180, 14, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(badgeText, 105, 61, { align: "center" });

  // 5. Ticket Card Container
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(15, 73, 180, 125, 3, 3, "F");
  doc.setDrawColor(60, 60, 80);
  doc.roundedRect(15, 73, 180, 125, 3, 3, "D");

  // Code Section inside Card
  doc.setFillColor(38, 38, 50);
  doc.roundedRect(25, 82, 160, 20, 2, 2, "F");

  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(isWaitlist ? "WAITLIST CODE" : "BOOKING PASS CODE", 32, 90);

  doc.setTextColor(255, 255, 255);
  doc.setFont("courier", "bold");
  doc.setFontSize(18);
  doc.text(ticket.code, 32, 98);

  // Ticket Fields Grid
  const startY = 114;
  const col1X = 25;
  const col2X = 110;

  const renderField = (
    label: string,
    val: string,
    x: number,
    y: number,
    isHighlight = false,
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(label.toUpperCase(), x, y);

    doc.setFont("helvetica", isHighlight ? "bold" : "normal");
    doc.setFontSize(11);
    if (isHighlight) {
      doc.setTextColor(255, 215, 0); // Gold accent
    } else {
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    }
    doc.text(val || "—", x, y + 6);
  };

  renderField("Attendee Name", ticket.name, col1X, startY);
  renderField("Registration Number", ticket.regNo, col2X, startY);

  renderField("Email Address", ticket.email, col1X, startY + 16);
  renderField("Phone Number", ticket.phone, col2X, startY + 16);

  const seatsList = isWaitlist
    ? (ticket as WaitlistRecord).seat
    : (ticket as BookingRecord).seats
        .map((s) => {
          const rm = roomForSeat(s)?.name;
          const tr = tierForSeat(s)?.name;
          return `${s} (${[rm, tr].filter(Boolean).join(" · ")})`;
        })
        .join(", ");

  renderField("Assigned Seat(s)", seatsList, col1X, startY + 32, true);

  if (!isWaitlist) {
    const booking = ticket as BookingRecord;
    renderField("Total Paid", `₹${booking.amount}`, col2X, startY + 32);
    renderField("UPI Reference ID", booking.upiRef, col1X, startY + 48);
    renderField("Booking Date", new Date(booking.createdAt).toLocaleDateString(), col2X, startY + 48);
  } else {
    const wl = ticket as WaitlistRecord;
    renderField("Payment Status", "Pay on Room Opening", col2X, startY + 32);
    renderField("Waitlisted Date", new Date(wl.createdAt).toLocaleDateString(), col1X, startY + 48);
  }

  // 6. Barcode Visual Graphic Simulation
  const barcodeY = 208;
  doc.setFillColor(255, 255, 255);
  doc.rect(25, barcodeY, 160, 22, "F");

  // Draw pseudo barcode lines
  doc.setFillColor(0, 0, 0);
  let curX = 30;
  while (curX < 175) {
    const w = Math.random() > 0.4 ? 1.5 : 0.6;
    doc.rect(curX, barcodeY + 2, w, 14, "F");
    curX += w + (Math.random() > 0.5 ? 1.2 : 0.8);
  }

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`*${ticket.code}*`, 105, barcodeY + 20, { align: "center" });

  // 7. Footer Instructions
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text("• Present this PDF pass or show your booking code at the AB-02 entrance.", 105, 242, {
    align: "center",
  });
  doc.text("• Please carry your physical VIT Bhopal Student ID card.", 105, 248, {
    align: "center",
  });
  doc.text("• Gates open 15 minutes before event start time.", 105, 254, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 115);
  doc.text(`Generated on ${new Date().toLocaleString()} · AWS SBG VIT Bhopal`, 105, 275, {
    align: "center",
  });

  // Download PDF
  doc.save(`F1_Screening_Ticket_${ticket.code}.pdf`);
}
