from reportlab.pdfgen.canvas import Canvas
from .Question import Question
class Column:
    def __init__(self, qustions_nos:list, options:list, x: int, y: int, width: int, height:int,gap_x_max:int,gap_y_max:int,
                 bubble_size:int, padding:int=10):
        self.qustions_nos = qustions_nos
        self.options = options
        self.bubble_size = bubble_size
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.padding = padding
        self.gap_x_max = gap_x_max
        self.gap_y_max = gap_y_max
    
    def draw(self, canvas:Canvas):
        x = self.x+self.padding
        y = self.y-self.padding
        # Find x gap to fill width
        self.gap_x = min(self.gap_x_max, (self.width - 2*self.padding - self.bubble_size*len(self.options))//(len(self.options)-1))
        # Find y gap to fill height
        self.gap_y = min(self.gap_y_max, (self.height - 2*self.padding - self.bubble_size*len(self.qustions_nos))//(len(self.qustions_nos)-1))
        # Draw options
        row_y_mid = y - self.bubble_size / 2
        canvas.setFont("Helvetica-Bold", 10)
        maxDigits = len(str(self.qustions_nos[-1]))
        maxQNWidth = canvas.stringWidth("9"*maxDigits+".", "Helvetica-Bold", 10)
        bubble_start_x = x + maxQNWidth + 5
        for opt_idx, opt in enumerate(self.options):
            bubble_x = bubble_start_x + opt_idx * (self.bubble_size + self.gap_x) + self.bubble_size / 2
            # set centered alignment
            text_width = canvas.stringWidth(opt, "Helvetica-Bold", 10)
            
            canvas.drawString(bubble_x-text_width/2, row_y_mid - 3, f"{opt}")
        y -= self.bubble_size
        question = Question(len(self.options), self.bubble_size, self.gap_x, self.gap_y, maxQNWidth)
        for q_no in self.qustions_nos:
            if y - self.bubble_size < self.padding:
                break
            question.draw(canvas, q_no, x, y)
            y -= (self.bubble_size + self.gap_y)
    
    def get_gaps(self):
        return self.gap_x, self.gap_y