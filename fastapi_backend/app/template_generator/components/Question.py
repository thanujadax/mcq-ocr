from reportlab.pdfgen.canvas import Canvas
class Question:
    def __init__(self, options: int, bubble_size: int = 10, gap_x: int = 15, gap_y: int = 5, max_qn_width: int = 20):
        self.options = options
        self.bubble_size = bubble_size
        self.bubble_size = bubble_size
        self.gap_x = gap_x
        self.gap_y = gap_y
        self.max_qn_width = max_qn_width
    
    def draw(self, canvas:Canvas,question_no, x: int, y: int):
        row_y_mid = y - self.bubble_size / 2
        # Draw question number
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawString(x, row_y_mid - 3, f"{question_no}.")

        canvas.setLineWidth(1.5)
        # Draw bubbles
        bubble_start_x = x + self.max_qn_width + 5
        for opt in range(self.options):
            bubble_x = bubble_start_x + opt * (self.bubble_size + self.gap_x)
            canvas.circle(bubble_x + self.bubble_size / 2, row_y_mid, self.bubble_size / 2, stroke=1, fill=0)