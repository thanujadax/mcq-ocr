from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from io import BytesIO
from .components.Column import Column

class TemplateDrawer:
    def __init__(self, background_path: str):
        self.buffer = BytesIO()
        self.canvas = canvas.Canvas(self.buffer, pagesize=A4, bottomup=1)
        self.width, self.height = A4
        self.background_path = background_path
    
    def draw_background(self):
        self.canvas.drawImage(self.background_path, 0, 0, width=self.width, height=self.height)
    
    def writeTitle(self, title: str, x: int, y: int, font_size: int = 24):
        # Write title underlined in Helvetica-Bold
        y = self.height-y
        self.canvas.setFont("Helvetica-Bold", font_size)
        self.canvas.drawString(x, y, title)
        title_width = self.canvas.stringWidth(title, "Helvetica-Bold", font_size)
        self.canvas.line(x, y - 2, x + title_width, y - 2)
    
    def get_file(self) -> bytes:
        self.canvas.save()
        self.buffer.seek(0)
        return self.buffer.getvalue()
    
    def mark_bubbles(self, questions: int, option_count: int, max_qpc: int, start_x: int, start_y: int, bubble_size: int = 10, gap_x_max: int = 20, gap_y_max: int = 15,
                     expected_width: int = 500, expected_height: int = 700, padding: int = 10, column_gap: int = 20):
        x = start_x+padding
        y = self.height - (start_y+padding)
        # Assuming we have alphabet options like a, b, c, d...
        options = [chr(97 + i) for i in range(option_count)]
        question_numbers = list(range(1, questions + 1))
        remeinder = questions % max_qpc
        full_columns = questions // max_qpc

        total_columns = full_columns + (1 if remeinder > 0 else 0)
        column_height = expected_height
        column_width = (expected_width - (total_columns - 1) * column_gap) // total_columns
        for i in range(full_columns):
            col = Column(question_numbers[i*max_qpc:(i+1)*max_qpc], options, x, y, column_width, column_height, gap_x_max, gap_y_max, bubble_size, 10)
            col.draw(self.canvas)
            x += column_width + column_gap
            gap_x_max, gap_y_max = col.get_gaps()
        if remeinder > 0:
            col = Column(question_numbers[full_columns*max_qpc:], options, x, y, column_width, column_height, gap_x_max, gap_y_max, bubble_size, 10)
            col.draw(self.canvas)