import logging

logger = logging.getLogger(__name__)

def get_coordinates_of_bubbles_grid(config):
    # Configuration parameters
    x_offset = float(config['bubble_configs']['x_offset'])
    y_offset = float(config['bubble_configs']['y_offset'])
    column_row_distribution = config['metadata']['column_row_distribution']
    
    coordinates = []

    for column, num_rows in enumerate(column_row_distribution):  # Loop through each column
        # Starting x for the column
        x_row = int(config['bubble_configs']['columns'][str(column+1)]['starting_x'])
        column_y_start = int(config['bubble_configs']['columns'][str(column+1)]['starting_y'])

        for row in range(num_rows):  # Process each question (row) in the column
            y_row = column_y_start + row * y_offset

            for choice in range(int(config['metadata']['options_per_question'])):
                x = x_row + (choice * x_offset)
                coordinates.append([int(round(x)), int(round(y_row))])

    return coordinates


def get_choice_distribution(config):
    options_per_question = int(config['metadata']['options_per_question'])
    return [options_per_question for _ in range(config['metadata']['num_questions'])]

def reconstruct_bubbles(template_config):
    num_columns = int(template_config["metadata"]["num_columns"])
    num_rows = int(template_config["metadata"]["column_row_distribution"])
    num_options = int(template_config["metadata"]["options_per_question"])

    # initialize empty 3D list
    coordinates = [[[] for _ in range(num_rows)] for _ in range(num_columns)]

    for col_idx, (col_key, col_rows) in enumerate(template_config["bubbles"].items()):
        for row_idx, (row_key, row_points) in enumerate(col_rows.items()):
            coordinates[col_idx][row_idx] = [(p["x"], p["y"]) for p in row_points]

    return coordinates