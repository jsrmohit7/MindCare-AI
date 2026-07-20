import io
from typing import Any, Dict, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from datetime import datetime

class MonthlyPDFGenerator:
    """
    Service responsible for compiling monthly wellness analytics and generating
    a premium branded ReportLab PDF report stream.
    """

    @staticmethod
    def generate_report(
        user_email: str,
        month_str: str,
        checkins: List[Dict[str, Any]],
        ai_summary: str,
        stats: Dict[str, Any]
    ) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()

        # Custom Branded Styles
        title_style = ParagraphStyle(
            name="TitleStyle",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.HexColor("#4f46e5"), # Indigo brand color
            spaceAfter=12,
            fontName="Helvetica-Bold"
        )
        
        section_style = ParagraphStyle(
            name="SectionStyle",
            parent=styles["Heading2"],
            fontSize=16,
            textColor=colors.HexColor("#1e1b4b"),
            spaceBefore=14,
            spaceAfter=8,
            fontName="Helvetica-Bold"
        )

        body_style = ParagraphStyle(
            name="BodyStyle",
            parent=styles["Normal"],
            fontSize=10.5,
            textColor=colors.HexColor("#334155"),
            leading=15,
            spaceAfter=10
        )

        header_style = ParagraphStyle(
            name="HeaderStyle",
            parent=styles["Normal"],
            fontSize=9.5,
            textColor=colors.white,
            fontName="Helvetica-Bold",
            alignment=1 # Centered
        )

        cell_style = ParagraphStyle(
            name="CellStyle",
            parent=styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#334155"),
            alignment=1 # Centered
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("MindCare AI — Monthly Progress Report", title_style))
        story.append(Paragraph(f"<b>User Account:</b> {user_email}", body_style))
        story.append(Paragraph(f"<b>Reporting Month:</b> {month_str}", body_style))
        story.append(Paragraph(f"<b>Generated At:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", body_style))
        story.append(Spacer(1, 15))

        # 2. Executive AI Trend Summary Section
        story.append(Paragraph("🧠 AI Wellness Narrative", section_style))
        story.append(Paragraph(ai_summary, body_style))
        story.append(Spacer(1, 15))

        # 3. Monthly Metrics Summary Cards
        story.append(Paragraph("📈 Key Monthly Indicators", section_style))
        
        avg_score = stats.get("avg_score", 0)
        max_streak = stats.get("longest_streak", 0)
        total_days = stats.get("total_checkins", 0)

        summary_data = [
            [
                Paragraph("<b>Average Wellness Score</b>", cell_style),
                Paragraph("<b>Longest Active Streak</b>", cell_style),
                Paragraph("<b>Total Check-Ins Completed</b>", cell_style)
            ],
            [
                Paragraph(f"<font size=14 color='#4f46e5'><b>{avg_score:.1f}%</b></font>", cell_style),
                Paragraph(f"<font size=14 color='#10b981'><b>{max_streak} Days</b></font>", cell_style),
                Paragraph(f"<font size=14 color='#f59e0b'><b>{total_days}</b></font>", cell_style)
            ]
        ]
        summary_table = Table(summary_data, colWidths=[175, 175, 175])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))

        # 4. Daily Logs Table Section
        story.append(Paragraph("📋 Daily Wellness logs", section_style))

        # Table headers
        table_content = [
            [
                Paragraph("Date", header_style),
                Paragraph("Mood", header_style),
                Paragraph("Stress", header_style),
                Paragraph("Anxiety", header_style),
                Paragraph("Sleep", header_style),
                Paragraph("Water", header_style),
                Paragraph("Score", header_style)
            ]
        ]

        # Insert newest logs up to max 25 rows for pagination clean layout
        for log in checkins[:25]:
            table_content.append([
                Paragraph(log.get("date", ""), cell_style),
                Paragraph(log.get("mood", ""), cell_style),
                Paragraph(f"{log.get('stress', 5)}/10", cell_style),
                Paragraph(f"{log.get('anxiety', 5)}/10", cell_style),
                Paragraph(log.get("sleep", ""), cell_style),
                Paragraph(log.get("water", ""), cell_style),
                Paragraph(f"<b>{log.get('wellness_score', 0)}</b>", cell_style)
            ])

        col_widths = [75, 80, 55, 60, 110, 80, 65]
        log_table = Table(table_content, colWidths=col_widths)
        log_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        story.append(log_table)

        # Footer Notice
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            "<i>Note: This monthly summary is compiled from your daily self-reported check-in metrics and processed using watsonx.ai. MindCare reports do not represent clinical diagnoses.</i>",
            ParagraphStyle(name="Footnote", parent=styles["Normal"], fontSize=8, textColor=colors.HexColor("#64748b"))
        ))

        doc.build(story)
        buffer.seek(0)
        return buffer
