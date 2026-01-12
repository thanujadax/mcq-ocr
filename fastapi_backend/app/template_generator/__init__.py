from .TemplateDrawer import TemplateDrawer
def generate_template_pdf(titel:str, questions:int, options:int, max_qpc:int) -> bytes:
    '''Generate a PDF of the MCQ template'''
    drawer = TemplateDrawer(background_path='app/template_generator/default/template_bg_default.png')
    drawer.draw_background()
    drawer.writeTitle(titel, x=70, y=50, font_size=9)
    drawer.mark_bubbles(questions, options, max_qpc, start_x=50, start_y=90, bubble_size=15, gap_x_max=10, gap_y_max=10,
                        expected_width=460, expected_height=680, padding=10)
    result = drawer.get_file()
    return result