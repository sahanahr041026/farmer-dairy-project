import io
import datetime
import math
from typing import List, Dict, Any, Optional

class SimplePDFBuilder:
    """
    Pure Python standards-compliant PDF 1.4 document generator.
    Produces valid, printable, styled multi-page PDFs with text, tables, borders, and running footers.
    Zero external binary dependencies.
    """
    def __init__(self, page_width=595, page_height=842): # A4 in points
        self.width = page_width
        self.height = page_height
        self.page_streams = [] # list of lists of command strings
        self.current_stream = []

    def draw_rect(self, x, y, w, h, fill_rgb=None, stroke_rgb=None, line_width=1):
        cmds = []
        if stroke_rgb:
            r, g, b = stroke_rgb
            cmds.append(f"{r:.2f} {g:.2f} {b:.2f} RG")
            cmds.append(f"{line_width} w")
        if fill_rgb:
            r, g, b = fill_rgb
            cmds.append(f"{r:.2f} {g:.2f} {b:.2f} rg")
            cmds.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re B" if stroke_rgb else f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re f")
        elif stroke_rgb:
            cmds.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re S")
        self.current_stream.append(" ".join(cmds))

    def draw_text(self, text: str, x: float, y: float, font="F1", size=10, rgb=(0.14, 0.20, 0.16)):
        r, g, b = rgb
        clean_text = (
            str(text)
            .replace('\\', '\\\\')
            .replace('(', '\\(')
            .replace(')', '\\)')
            .replace('₹', 'INR ') # WinAnsi standard font replacement for currency symbol
        )
        cmd = f"BT /{font} {size} Tf {r:.2f} {g:.2f} {b:.2f} rg {x:.2f} {y:.2f} Td ({clean_text}) Tj ET"
        self.current_stream.append(cmd)

    def draw_line(self, x1, y1, x2, y2, rgb=(0.8, 0.8, 0.8), width=1):
        r, g, b = rgb
        cmd = f"{width} w {r:.2f} {g:.2f} {b:.2f} RG {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S"
        self.current_stream.append(cmd)

    def finish_page(self):
        if self.current_stream:
            self.page_streams.append("\n".join(self.current_stream))
            self.current_stream = []

    def build(self) -> bytes:
        if self.current_stream or not self.page_streams:
            self.finish_page()

        total_pages = len(self.page_streams)

        # Standard objects:
        # Obj 1: Catalog
        # Obj 2: Pages tree
        # Obj 3: Font F1 (Helvetica)
        # Obj 4: Font F2 (Helvetica-Bold)
        # For each page p (0 to total_pages - 1):
        #   stream obj: 4 + p*2 + 1
        #   page obj:   4 + p*2 + 2

        catalog_obj = "<< /Type /Catalog /Pages 2 0 R >>"
        page_obj_nums = [4 + p * 2 + 2 for p in range(total_pages)]
        pages_list_str = " ".join([f"{num} 0 R" for num in page_obj_nums])
        pages_obj = f"<< /Type /Pages /Kids [{pages_list_str}] /Count {total_pages} >>"
        font_regular = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
        font_bold = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"

        all_objs = [catalog_obj, pages_obj, font_regular, font_bold]

        for p, stream_content in enumerate(self.page_streams):
            stream_obj_num = 4 + p * 2 + 1
            page_obj_num = 4 + p * 2 + 2
            stream_len = len(stream_content.encode('latin-1', 'replace'))
            stream_str = f"<< /Length {stream_len} >>\nstream\n{stream_content}\nendstream"
            page_str = (
                f"<< /Type /Page /Parent 2 0 R "
                f"/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> "
                f"/MediaBox [0 0 {self.width} {self.height}] "
                f"/Contents {stream_obj_num} 0 R >>"
            )
            all_objs.append(stream_str)
            all_objs.append(page_str)

        out = io.BytesIO()
        out.write(b"%PDF-1.4\n")
        offsets = []
        for i, obj_content in enumerate(all_objs, start=1):
            offsets.append(out.tell())
            out.write(f"{i} 0 obj\n{obj_content}\nendobj\n".encode('latin-1', 'replace'))

        xref_pos = out.tell()
        out.write(f"xref\n0 {len(all_objs) + 1}\n0000000000 65535 f \n".encode('latin-1'))
        for off in offsets:
            out.write(f"{off:010d} 00000 n \n".encode('latin-1'))

        trailer = f"trailer\n<< /Size {len(all_objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n"
        out.write(trailer.encode('latin-1'))
        return out.getvalue()


def generate_passbook_pdf(
    cooperative: Dict[str, Any],
    farmer: Dict[str, Any],
    records: List[Dict[str, Any]],
    period_start: str,
    period_end: str,
    reference_no: Optional[str] = None
) -> bytes:
    """
    Generates a standards-compliant multi-page printable digital E-Passbook PDF.
    Meets all Section 1 requirements:
    - Multi-page pagination with repeated table headers and running page numbers
    - Detailed collection breakdown: Date, Session, Qty, Fat %, SNF %, Rate/L, Calculated Amount, Status
    - Summary section: Morning Qty, Evening Qty, Total Qty, Total Milk Value, Sessions Count, Corrected Count
    - Exact word-for-word legal clarification on calculated milk value vs confirmed payment
    - Unique reference number, generation timestamp, and digital verification seal
    """
    pdf = SimplePDFBuilder()

    # DairySathi Design Palette
    c_primary = (0.14, 0.36, 0.23)       # #245C3A Forest Green
    c_leaf = (0.43, 0.68, 0.41)          # #6FAF68 Fresh Leaf Green
    c_accent = (0.95, 0.77, 0.35)        # #F2C45A Golden Yellow
    c_cream = (0.97, 0.97, 0.94)         # #F8F7EF Warm Cream
    c_dark = (0.14, 0.20, 0.16)          # #24332A Dark Charcoal
    c_gray = (0.45, 0.50, 0.47)
    c_white = (1.0, 1.0, 1.0)
    c_border = (0.85, 0.88, 0.85)
    c_pending = (0.75, 0.50, 0.10)
    c_settled = (0.14, 0.55, 0.25)
    c_corrected = (0.85, 0.45, 0.10)

    # Reference Number
    coop_code = cooperative.get("code", "KMF-COOP-01")
    farmer_uid = farmer.get("farmer_uid", "DS-FARM-001")
    if not reference_no:
        clean_s = period_start.replace('-', '')
        clean_e = period_end.replace('-', '')
        reference_no = f"DS-PB-{coop_code}-{farmer_uid}-{clean_s}-{clean_e}"

    # Aggregates Calculation
    total_litres = sum(float(r.get("quantity_litres", 0.0)) for r in records)
    morning_litres = sum(float(r.get("quantity_litres", 0.0)) for r in records if str(r.get("session", "")).lower() == "morning")
    evening_litres = sum(float(r.get("quantity_litres", 0.0)) for r in records if str(r.get("session", "")).lower() == "evening")
    total_amount = sum(float(r.get("total_amount", 0.0)) for r in records)
    paid_amount = sum(float(r.get("total_amount", 0.0)) for r in records if r.get("payment_status") == "settled")
    session_count = len(records)
    corrected_count = sum(1 for r in records if r.get("record_status") == "corrected")

    valid_fats = [float(r["fat_percentage"]) for r in records if r.get("fat_percentage") is not None]
    avg_fat = sum(valid_fats) / len(valid_fats) if valid_fats else 0.0
    valid_snfs = [float(r["snf_percentage"]) for r in records if r.get("snf_percentage") is not None]
    avg_snf = sum(valid_snfs) / len(valid_snfs) if valid_snfs else 0.0

    # Pagination Setup:
    # Page 1 can display header banner, farmer card, metrics box, and up to 14 records.
    # Continuation pages can display continuation banner and up to 30 records.
    # Total pages estimated:
    if len(records) <= 14:
        total_pages = 1
        page1_max_records = len(records)
    else:
        page1_max_records = 14
        rem = len(records) - page1_max_records
        total_pages = 1 + math.ceil(rem / 30)

    # Helper function to render table headers
    def draw_table_headers(y_pos):
        pdf.draw_rect(35, y_pos, 525, 20, fill_rgb=c_primary)
        headers = [
            ("Date", 42),
            ("Session", 110),
            ("Qty (L)", 165),
            ("Fat %", 215),
            ("SNF %", 260),
            ("Rate/L", 305),
            ("Milk Value (INR)", 365),
            ("Status", 475)
        ]
        for title, x_pos in headers:
            pdf.draw_text(title, x_pos, y_pos + 6, font="F2", size=8, rgb=c_white)
        return y_pos - 2

    # Helper for page footer
    gen_time_str = datetime.datetime.now().strftime("%d-%b-%Y %H:%M:%S")
    def draw_page_footer(current_page, max_pages):
        pdf.draw_line(35, 38, 560, 38, rgb=c_border, width=0.5)
        pdf.draw_text(
            f"Page {current_page} of {max_pages}  |  Ref: {reference_no}  |  Generated: {gen_time_str}",
            40, 26, font="F1", size=7.5, rgb=c_gray
        )
        pdf.draw_text(
            "DairySathi - Official Electronic Cooperative Statement",
            370, 26, font="F1", size=7.5, rgb=c_gray
        )

    # ========================== PAGE 1 ==========================
    # Top Banner
    pdf.draw_rect(0, 735, 595, 107, fill_rgb=c_primary)

    coop_name = cooperative.get("name", "Dairy Cooperative Society Ltd.")
    coop_locality = cooperative.get("locality", "Karnataka")
    coop_phone = cooperative.get("contact_phone", "080-12345678")
    coop_address = cooperative.get("address") or f"{coop_locality}, Karnataka"

    pdf.draw_text("DAIRYSATHI MILK E-PASSBOOK", 40, 810, font="F2", size=17, rgb=c_white)
    pdf.draw_text(f"{coop_name}  (Code: {coop_code})", 40, 790, font="F2", size=11, rgb=c_accent)
    pdf.draw_text(f"Address: {coop_address}  |  Contact: {coop_phone}", 40, 773, font="F1", size=8.5, rgb=c_cream)
    pdf.draw_text(f"Statement Reference: {reference_no}", 40, 758, font="F2", size=8.5, rgb=c_white)
    pdf.draw_text(f"Statement Period: {period_start} to {period_end}", 40, 744, font="F1", size=8.5, rgb=c_accent)

    # Farmer Information Card
    pdf.draw_rect(35, 655, 525, 70, fill_rgb=c_cream, stroke_rgb=c_leaf, line_width=1.2)
    farmer_name = farmer.get("full_name", "Farmer")
    farmer_phone = farmer.get("phone", "N/A")
    farmer_village = farmer.get("village", "N/A")
    farmer_bank = farmer.get("bank_account_no", "N/A")
    farmer_ifsc = farmer.get("ifsc_code", "N/A")

    pdf.draw_text("REGISTERED MEMBER PROFILE", 48, 710, font="F2", size=9, rgb=c_primary)
    pdf.draw_text(f"Farmer Name: {farmer_name}", 48, 695, font="F2", size=9.5, rgb=c_dark)
    pdf.draw_text(f"Farmer UID: {farmer_uid}", 48, 680, font="F1", size=8.5, rgb=c_dark)
    pdf.draw_text(f"Village / Locality: {farmer_village}", 48, 665, font="F1", size=8.5, rgb=c_dark)

    pdf.draw_text(f"Registered Phone: {farmer_phone}", 270, 695, font="F1", size=8.5, rgb=c_dark)
    pdf.draw_text(f"Bank Account: {farmer_bank}", 270, 680, font="F1", size=8.5, rgb=c_dark)
    pdf.draw_text(f"IFSC Code: {farmer_ifsc}", 270, 665, font="F1", size=8.5, rgb=c_dark)

    # Comprehensive Summary Metrics Section (6 cards)
    card_y = 600
    card_w = 83
    card_gap = 5
    card_h = 45

    # 1. Total Litres
    pdf.draw_rect(35, card_y, card_w, card_h, fill_rgb=c_white, stroke_rgb=c_border)
    pdf.draw_text("TOTAL QTY", 40, card_y + 30, font="F1", size=6.5, rgb=c_gray)
    pdf.draw_text(f"{total_litres:.1f} L", 40, card_y + 12, font="F2", size=10, rgb=c_primary)

    # 2. Morning Qty
    pdf.draw_rect(35 + card_w + card_gap, card_y, card_w, card_h, fill_rgb=c_white, stroke_rgb=c_border)
    pdf.draw_text("MORNING QTY", 40 + card_w + card_gap, card_y + 30, font="F1", size=6.5, rgb=c_gray)
    pdf.draw_text(f"{morning_litres:.1f} L", 40 + card_w + card_gap, card_y + 12, font="F2", size=9.5, rgb=c_dark)

    # 3. Evening Qty
    pdf.draw_rect(35 + (card_w + card_gap) * 2, card_y, card_w, card_h, fill_rgb=c_white, stroke_rgb=c_border)
    pdf.draw_text("EVENING QTY", 40 + (card_w + card_gap) * 2, card_y + 30, font="F1", size=6.5, rgb=c_gray)
    pdf.draw_text(f"{evening_litres:.1f} L", 40 + (card_w + card_gap) * 2, card_y + 12, font="F2", size=9.5, rgb=c_dark)

    # 4. Avg Quality (Fat/SNF)
    pdf.draw_rect(35 + (card_w + card_gap) * 3, card_y, card_w, card_h, fill_rgb=c_white, stroke_rgb=c_border)
    pdf.draw_text("AVG FAT / SNF", 40 + (card_w + card_gap) * 3, card_y + 30, font="F1", size=6.5, rgb=c_gray)
    pdf.draw_text(f"{avg_fat:.1f}% / {avg_snf:.1f}%", 40 + (card_w + card_gap) * 3, card_y + 12, font="F2", size=8.5, rgb=c_dark)

    # 5. Sessions Recorded & Corrected
    pdf.draw_rect(35 + (card_w + card_gap) * 4, card_y, card_w, card_h, fill_rgb=c_white, stroke_rgb=c_border)
    pdf.draw_text("SESSIONS (ADJ)", 40 + (card_w + card_gap) * 4, card_y + 30, font="F1", size=6.5, rgb=c_gray)
    pdf.draw_text(f"{session_count} ({corrected_count} adj)", 40 + (card_w + card_gap) * 4, card_y + 12, font="F2", size=9, rgb=c_dark)

    # 6. Total Milk Value
    pdf.draw_rect(35 + (card_w + card_gap) * 5, card_y, card_w + 3, card_h, fill_rgb=c_cream, stroke_rgb=c_leaf, line_width=1)
    pdf.draw_text("GROSS VALUE", 40 + (card_w + card_gap) * 5, card_y + 30, font="F2", size=6.5, rgb=c_primary)
    pdf.draw_text(f"INR {total_amount:,.2f}", 40 + (card_w + card_gap) * 5, card_y + 12, font="F2", size=9, rgb=c_primary)

    # Table Header on Page 1
    y = 565
    pdf.draw_text("DETAILED COLLECTION & QUALITY INTAKE LOG", 35, y, font="F2", size=9.5, rgb=c_primary)
    y -= 18
    y = draw_table_headers(y)

    page1_records = records[:page1_max_records]
    for i, rec in enumerate(page1_records):
        bg = c_cream if i % 2 == 0 else c_white
        pdf.draw_rect(35, y - 16, 525, 16, fill_rgb=bg, stroke_rgb=c_border, line_width=0.5)

        r_date = str(rec.get("collection_date", ""))
        r_sess = str(rec.get("session", "")).capitalize()
        r_qty = f"{float(rec.get('quantity_litres', 0.0)):.1f}"
        fat = rec.get("fat_percentage")
        r_fat = f"{float(fat):.1f}%" if fat is not None else "-"
        snf = rec.get("snf_percentage")
        r_snf = f"{float(snf):.1f}%" if snf is not None else "-"
        r_rate = f"INR {float(rec.get('rate_per_litre', 0.0)):.2f}"
        r_amt = f"INR {float(rec.get('total_amount', 0.0)):,.2f}"
        
        status_raw = str(rec.get("record_status") or rec.get("payment_status") or "recorded").lower()
        if status_raw == "corrected":
            r_status = "Corrected"
            st_color = c_corrected
        elif status_raw == "settled":
            r_status = "Settled"
            st_color = c_settled
        else:
            r_status = "Recorded"
            st_color = c_dark

        pdf.draw_text(r_date, 42, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_sess, 110, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_qty, 165, y - 11, font="F2", size=8, rgb=c_dark)
        pdf.draw_text(r_fat, 215, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_snf, 260, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_rate, 305, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_amt, 365, y - 11, font="F2", size=8, rgb=c_primary)
        pdf.draw_text(r_status, 475, y - 11, font="F2", size=8, rgb=st_color)

        y -= 16

    if not records:
        pdf.draw_rect(35, y - 28, 525, 28, fill_rgb=c_white, stroke_rgb=c_border)
        pdf.draw_text("No milk collection records found for this farmer in the selected statement period.", 95, y - 17, font="F1", size=8.5, rgb=c_gray)
        y -= 28

    # Helper function for rendering the final Totals and Certification Box
    def draw_final_summary_and_notice(cur_y):
        # Totals Row
        pdf.draw_rect(35, cur_y - 18, 525, 18, fill_rgb=c_cream, stroke_rgb=c_leaf, line_width=1)
        pdf.draw_text(f"PERIOD TOTAL: {total_litres:.1f} L (Morn: {morning_litres:.1f}L | Eve: {evening_litres:.1f}L)", 42, cur_y - 13, font="F2", size=8, rgb=c_primary)
        pdf.draw_text(f"Total Milk Value: INR {total_amount:,.2f}", 340, cur_y - 13, font="F2", size=8.5, rgb=c_primary)
        pdf.draw_text(f"Paid: INR {paid_amount:,.2f}", 485, cur_y - 13, font="F2", size=8, rgb=c_settled)
        cur_y -= 26

        # Critical Financial Clarification Box (Section 1.2 requirement word-for-word)
        pdf.draw_rect(35, cur_y - 48, 525, 46, fill_rgb=c_cream, stroke_rgb=c_accent, line_width=1.2)
        pdf.draw_text("IMPORTANT FINANCIAL CLARIFICATION & NOTICE:", 45, cur_y - 12, font="F2", size=8, rgb=c_pending)
        notice_line1 = "Milk value shown in this passbook represents the calculated value of recorded milk collections."
        notice_line2 = "It does not confirm that payment has been made. Payment status is shown only when verified payment records are available."
        pdf.draw_text(notice_line1, 45, cur_y - 25, font="F1", size=7.5, rgb=c_dark)
        pdf.draw_text(notice_line2, 45, cur_y - 37, font="F2", size=7.5, rgb=c_dark)
        cur_y -= 54

        # Official Stamp and Certification Box
        pdf.draw_rect(35, cur_y - 40, 525, 38, fill_rgb=c_white, stroke_rgb=c_border)
        pdf.draw_text("OFFICIAL COOPERATIVE VERIFICATION & SIGNATURE SEAL:", 45, cur_y - 12, font="F2", size=7.5, rgb=c_primary)
        pdf.draw_text("1. All milk intakes logged through calibrated dairy cooperative weighing and testing equipment.", 45, cur_y - 23, font="F1", size=7, rgb=c_dark)
        pdf.draw_text("2. Inquiries regarding weights, Fat/SNF tests or adjustments must be reported within 3 days.", 45, cur_y - 33, font="F1", size=7, rgb=c_dark)

        pdf.draw_text("Digital System Verified", 420, cur_y - 15, font="F2", size=7.5, rgb=c_primary)
        pdf.draw_line(410, cur_y - 22, 535, cur_y - 22, rgb=c_leaf, width=1)
        pdf.draw_text(f"Issued by Secretary / Admin", 420, cur_y - 32, font="F1", size=6.5, rgb=c_gray)

    # If single page, render totals and notice immediately on Page 1
    if total_pages == 1:
        draw_final_summary_and_notice(y - 8)
        draw_page_footer(1, 1)
        pdf.finish_page()
    else:
        # Finish Page 1
        draw_page_footer(1, total_pages)
        pdf.finish_page()

        # ========================== CONTINUATION PAGES ==========================
        current_rec_idx = page1_max_records
        for p in range(2, total_pages + 1):
            # Continuation Header
            pdf.draw_rect(0, 775, 595, 67, fill_rgb=c_primary)
            pdf.draw_text("DAIRYSATHI MILK E-PASSBOOK (CONTINUATION SHEET)", 40, 818, font="F2", size=13, rgb=c_white)
            pdf.draw_text(f"{coop_name}  |  Farmer: {farmer_name} ({farmer_uid})", 40, 800, font="F1", size=9.5, rgb=c_accent)
            pdf.draw_text(f"Statement Ref: {reference_no}  |  Period: {period_start} to {period_end}", 40, 786, font="F1", size=8, rgb=c_cream)

            # Table Header
            y = 750
            y = draw_table_headers(y)

            # Table rows for this page
            page_records = records[current_rec_idx : current_rec_idx + 30]
            current_rec_idx += len(page_records)

            for i, rec in enumerate(page_records):
                bg = c_cream if i % 2 == 0 else c_white
                pdf.draw_rect(35, y - 16, 525, 16, fill_rgb=bg, stroke_rgb=c_border, line_width=0.5)

                r_date = str(rec.get("collection_date", ""))
                r_sess = str(rec.get("session", "")).capitalize()
                r_qty = f"{float(rec.get('quantity_litres', 0.0)):.1f}"
                fat = rec.get("fat_percentage")
                r_fat = f"{float(fat):.1f}%" if fat is not None else "-"
                snf = rec.get("snf_percentage")
                r_snf = f"{float(snf):.1f}%" if snf is not None else "-"
                r_rate = f"INR {float(rec.get('rate_per_litre', 0.0)):.2f}"
                r_amt = f"INR {float(rec.get('total_amount', 0.0)):,.2f}"

                status_raw = str(rec.get("record_status") or rec.get("payment_status") or "recorded").lower()
                if status_raw == "corrected":
                    r_status = "Corrected"
                    st_color = c_corrected
                elif status_raw == "settled":
                    r_status = "Settled"
                    st_color = c_settled
                else:
                    r_status = "Recorded"
                    st_color = c_dark

                pdf.draw_text(r_date, 42, y - 11, font="F1", size=8, rgb=c_dark)
                pdf.draw_text(r_sess, 110, y - 11, font="F1", size=8, rgb=c_dark)
                pdf.draw_text(r_qty, 165, y - 11, font="F2", size=8, rgb=c_dark)
                pdf.draw_text(r_fat, 215, y - 11, font="F1", size=8, rgb=c_dark)
                pdf.draw_text(r_snf, 260, y - 11, font="F1", size=8, rgb=c_dark)
                pdf.draw_text(r_rate, 305, y - 11, font="F1", size=8, rgb=c_dark)
                pdf.draw_text(r_amt, 365, y - 11, font="F2", size=8, rgb=c_primary)
                pdf.draw_text(r_status, 475, y - 11, font="F2", size=8, rgb=st_color)

                y -= 16

            # If last page, render final summary and notice
            if p == total_pages:
                draw_final_summary_and_notice(y - 8)

            draw_page_footer(p, total_pages)
            pdf.finish_page()

    return pdf.build()
