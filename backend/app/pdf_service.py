import io
import datetime
from typing import List, Dict, Any

class SimplePDFBuilder:
    """
    Pure Python standards-compliant PDF 1.4 document generator.
    Produces valid, printable, styled PDFs with text, tables, and borders.
    """
    def __init__(self, page_width=595, page_height=842): # A4 in points
        self.width = page_width
        self.height = page_height
        self.objects = []
        self.pages = []
        self.current_stream = []

    def _add_object(self, content: str) -> int:
        self.objects.append(content)
        return len(self.objects)

    def draw_rect(self, x, y, w, h, fill_rgb=None, stroke_rgb=None, line_width=1):
        cmds = []
        if stroke_rgb:
            r, g, b = stroke_rgb
            cmds.append(f"{r:.2f} {g:.2f} {b:.2f} RG")
            cmds.append(f"{line_width} w")
        if fill_rgb:
            r, g, b = fill_rgb
            cmds.append(f"{r:.2f} {g:.2f} {b:.2f} rg")
            cmds.append(f"{x} {y} {w} {h} re B" if stroke_rgb else f"{x} {y} {w} {h} re f")
        elif stroke_rgb:
            cmds.append(f"{x} {y} {w} {h} re S")
        self.current_stream.append(" ".join(cmds))

    def draw_text(self, text: str, x: float, y: float, font="F1", size=10, rgb=(0.14, 0.20, 0.16)):
        r, g, b = rgb
        # Escape parentheses and backslashes for PDF string
        clean_text = str(text).replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
        cmd = f"BT /{font} {size} Tf {r:.2f} {g:.2f} {b:.2f} rg {x:.2f} {y:.2f} Td ({clean_text}) Tj ET"
        self.current_stream.append(cmd)

    def draw_line(self, x1, y1, x2, y2, rgb=(0.8, 0.8, 0.8), width=1):
        r, g, b = rgb
        cmd = f"{width} w {r:.2f} {g:.2f} {b:.2f} RG {x1} {y1} m {x2} {y2} l S"
        self.current_stream.append(cmd)

    def finish_page(self):
        stream_content = "\n".join(self.current_stream)
        stream_len = len(stream_content.encode('latin-1', 'replace'))
        stream_obj = f"<< /Length {stream_len} >>\nstream\n{stream_content}\nendstream"
        stream_idx = self._add_object(stream_obj)

        page_obj = f"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /MediaBox [0 0 {self.width} {self.height}] /Contents {stream_idx} 0 R >>"
        page_idx = self._add_object(page_obj)
        self.pages.append(page_idx)
        self.current_stream = []

    def build(self) -> bytes:
        if self.current_stream or not self.pages:
            self.finish_page()

        # Obj 1: Catalog
        # Obj 2: Pages tree
        # Obj 3: Helvetica Font
        # Obj 4: Helvetica-Bold Font
        catalog_obj = "<< /Type /Catalog /Pages 2 0 R >>"
        pages_list_str = " ".join([f"{p} 0 R" for p in self.pages])
        pages_obj = f"<< /Type /Pages /Kids [{pages_list_str}] /Count {len(self.pages)} >>"
        font_regular = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
        font_bold = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"

        all_objs = [catalog_obj, pages_obj, font_regular, font_bold] + self.objects

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
    period_end: str
) -> bytes:
    """
    Generates a high-quality digital e-passbook PDF statement for a farmer.
    """
    pdf = SimplePDFBuilder()

    # Colors
    c_primary = (0.14, 0.36, 0.23)      # #245C3A Forest Green
    c_leaf = (0.43, 0.68, 0.41)         # #6FAF68 Fresh Leaf Green
    c_accent = (0.95, 0.77, 0.35)       # #F2C45A Golden Yellow
    c_cream = (0.97, 0.97, 0.94)        # #F8F7EF Warm Cream
    c_dark = (0.14, 0.20, 0.16)         # #24332A Charcoal
    c_gray = (0.50, 0.55, 0.52)
    c_white = (1.0, 1.0, 1.0)
    c_border = (0.85, 0.88, 0.85)
    c_pending = (0.75, 0.50, 0.10)
    c_settled = (0.14, 0.55, 0.25)

    # Top Banner Background
    pdf.draw_rect(0, 742, 595, 100, fill_rgb=c_primary)

    # Cooperative Header
    coop_name = cooperative.get("name", "Dairy Cooperative Society Ltd.")
    coop_code = cooperative.get("code", "KMF-COOP-01")
    coop_locality = cooperative.get("locality", "Karnataka")
    coop_phone = cooperative.get("contact_phone", "080-12345678")

    pdf.draw_text("DAIRYSATHI - DIGITAL MILK PASSBOOK", 40, 805, font="F2", size=16, rgb=c_white)
    pdf.draw_text(f"{coop_name} (Code: {coop_code})", 40, 785, font="F2", size=11, rgb=c_accent)
    pdf.draw_text(f"Locality: {coop_locality} | Contact: {coop_phone} | Authorized Dairy Passbook", 40, 768, font="F1", size=9, rgb=c_white)
    pdf.draw_text(f"Official Electronic Statement Issued: {datetime.date.today().strftime('%d %B %Y')}", 40, 752, font="F1", size=8, rgb=c_cream)

    # Farmer Information Box
    pdf.draw_rect(35, 645, 525, 82, fill_rgb=c_cream, stroke_rgb=c_leaf, line_width=1.5)

    farmer_name = farmer.get("full_name", "Farmer")
    farmer_uid = farmer.get("farmer_uid", "DS-FARM-001")
    farmer_phone = farmer.get("phone", "N/A")
    farmer_village = farmer.get("village", "N/A")
    farmer_bank = farmer.get("bank_account_no", "N/A")
    farmer_ifsc = farmer.get("ifsc_code", "N/A")

    pdf.draw_text("FARMER PROFILE & STATEMENT PERIOD", 50, 712, font="F2", size=10, rgb=c_primary)
    pdf.draw_text(f"Farmer Name: {farmer_name}", 50, 695, font="F2", size=9.5, rgb=c_dark)
    pdf.draw_text(f"Farmer UID: {farmer_uid}", 50, 680, font="F1", size=9, rgb=c_dark)
    pdf.draw_text(f"Village / Locality: {farmer_village}", 50, 665, font="F1", size=9, rgb=c_dark)

    pdf.draw_text(f"Contact Phone: {farmer_phone}", 240, 695, font="F1", size=9, rgb=c_dark)
    pdf.draw_text(f"Bank Account: {farmer_bank} ({farmer_ifsc})", 240, 680, font="F1", size=9, rgb=c_dark)
    pdf.draw_text(f"Statement Range: {period_start} to {period_end}", 240, 665, font="F2", size=9, rgb=c_primary)

    # Financial Summary Metrics Box
    total_litres = sum(r.get("quantity_litres", 0.0) for r in records)
    total_amount = sum(r.get("total_amount", 0.0) for r in records)
    paid_amount = sum(r.get("total_amount", 0.0) for r in records if r.get("payment_status") == "settled")
    pending_amount = total_amount - paid_amount
    valid_fats = [r.get("fat_percentage") for r in records if r.get("fat_percentage") is not None]
    avg_fat = sum(valid_fats) / len(valid_fats) if valid_fats else 0.0

    pdf.draw_rect(35, 595, 122, 42, fill_rgb=c_white, stroke_rgb=c_border)
    pdf.draw_text("TOTAL MILK COLLECTED", 42, 624, font="F1", size=7, rgb=c_gray)
    pdf.draw_text(f"{total_litres:.1f} Litres", 42, 606, font="F2", size=11, rgb=c_primary)

    pdf.draw_rect(167, 595, 122, 42, fill_rgb=c_white, stroke_rgb=c_border)
    pdf.draw_text("AVERAGE FAT %", 174, 624, font="F1", size=7, rgb=c_gray)
    pdf.draw_text(f"{avg_fat:.2f}%", 174, 606, font="F2", size=11, rgb=c_dark)

    pdf.draw_rect(299, 595, 126, 42, fill_rgb=c_white, stroke_rgb=c_border)
    pdf.draw_text("GROSS CALCULATED EARNINGS", 306, 624, font="F1", size=7, rgb=c_gray)
    pdf.draw_text(f"INR {total_amount:,.2f}", 306, 606, font="F2", size=11, rgb=c_primary)

    pdf.draw_rect(435, 595, 125, 42, fill_rgb=c_cream, stroke_rgb=c_accent)
    pdf.draw_text("PENDING / OUTSTANDING", 442, 624, font="F1", size=7, rgb=c_pending)
    pdf.draw_text(f"INR {pending_amount:,.2f}", 442, 606, font="F2", size=11, rgb=c_pending)

    # Milk Collection Records Table
    y = 560
    pdf.draw_text("DETAILED DAILY COLLECTION & QUALITY LOG", 35, y, font="F2", size=10, rgb=c_primary)
    y -= 18

    # Table Header
    pdf.draw_rect(35, y, 525, 20, fill_rgb=c_primary)
    headers = [
        ("Date", 42),
        ("Session", 105),
        ("Qty (L)", 160),
        ("Fat %", 215),
        ("SNF %", 265),
        ("Rate (INR)", 315),
        ("Amount (INR)", 385),
        ("Status", 475)
    ]
    for h_title, h_x in headers:
        pdf.draw_text(h_title, h_x, y + 6, font="F2", size=8, rgb=c_white)
    y -= 2

    # Rows (paginate if more than 22 records)
    records_to_show = records[:24]
    for i, rec in enumerate(records_to_show):
        bg = c_cream if i % 2 == 0 else c_white
        pdf.draw_rect(35, y - 16, 525, 16, fill_rgb=bg, stroke_rgb=c_border, line_width=0.5)

        r_date = str(rec.get("collection_date", ""))
        r_sess = str(rec.get("session", "")).capitalize()
        r_qty = f"{rec.get('quantity_litres', 0.0):.1f}"
        fat = rec.get("fat_percentage")
        r_fat = f"{fat:.1f}%" if fat is not None else "-"
        snf = rec.get("snf_percentage")
        r_snf = f"{snf:.1f}%" if snf is not None else "-"
        r_rate = f"{rec.get('rate_per_litre', 0.0):.2f}"
        r_amt = f"{rec.get('total_amount', 0.0):.2f}"
        r_status = str(rec.get("payment_status", "pending")).capitalize()
        status_color = c_settled if r_status == "Settled" else c_pending

        pdf.draw_text(r_date, 42, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_sess, 105, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_qty, 160, y - 11, font="F2", size=8, rgb=c_dark)
        pdf.draw_text(r_fat, 215, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_snf, 265, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_rate, 315, y - 11, font="F1", size=8, rgb=c_dark)
        pdf.draw_text(r_amt, 385, y - 11, font="F2", size=8, rgb=c_primary)
        pdf.draw_text(r_status, 475, y - 11, font="F2", size=8, rgb=status_color)

        y -= 16

    if not records:
        pdf.draw_rect(35, y - 30, 525, 30, fill_rgb=c_white, stroke_rgb=c_border)
        pdf.draw_text("No milk collection records found for the selected date range.", 160, y - 18, font="F1", size=9, rgb=c_gray)
        y -= 30

    # Total Row
    y -= 4
    pdf.draw_rect(35, y - 18, 525, 18, fill_rgb=c_cream, stroke_rgb=c_leaf, line_width=1)
    pdf.draw_text("TOTAL", 42, y - 13, font="F2", size=8.5, rgb=c_primary)
    pdf.draw_text(f"{total_litres:.1f} L", 160, y - 13, font="F2", size=8.5, rgb=c_primary)
    pdf.draw_text(f"INR {total_amount:,.2f}", 385, y - 13, font="F2", size=8.5, rgb=c_primary)
    pdf.draw_text(f"Paid: INR {paid_amount:,.2f}", 470, y - 13, font="F2", size=8, rgb=c_settled)

    # Footer Notice and Stamp Block
    pdf.draw_rect(35, 60, 525, 65, fill_rgb=c_cream, stroke_rgb=c_border)
    pdf.draw_text("OFFICIAL COOPERATIVE CERTIFICATION & NOTICE:", 45, 110, font="F2", size=8, rgb=c_primary)
    pdf.draw_text("1. Rates are automatically computed based on tested Milk Fat & SNF percentages per cooperative bylaws.", 45, 98, font="F1", size=7.5, rgb=c_dark)
    pdf.draw_text("2. Calculated earnings represent provisional milk value. Payment is marked Settled upon bank credit.", 45, 87, font="F1", size=7.5, rgb=c_dark)
    pdf.draw_text("3. Any discrepancies must be reported to the Dairy Secretary within 3 working days with this e-passbook.", 45, 76, font="F1", size=7.5, rgb=c_dark)

    pdf.draw_text("Authorized Signature & Seal", 410, 75, font="F2", size=8, rgb=c_primary)
    pdf.draw_line(400, 88, 540, 88, rgb=c_leaf, width=1)
    pdf.draw_text("[Digital System Verified]", 418, 65, font="F1", size=7, rgb=c_gray)

    # Page Footer
    pdf.draw_text("DairySathi Platform - Empowering Dairy Farmers & Cooperatives", 180, 25, font="F1", size=7.5, rgb=c_gray)

    return pdf.build()
