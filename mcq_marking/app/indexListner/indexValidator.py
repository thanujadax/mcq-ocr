from rapidfuzz.distance import Levenshtein, Hamming
import re

def get_regex_from_list(label_list):
    ''' Given a list of labels, return a a generalized regex pattern string'''
    includes_matrix = []
    matrix_height = 0
    options = 4 # digits/ A-Z / a-z / other characters
    for label in label_list:
        # adjust matrix height
        if len(label) > matrix_height:
            for _ in range(len(label) - matrix_height):
                includes_matrix.append([False]*options)
            matrix_height = len(label)
        # fill in includes matrix
        for i, char in enumerate(label):
            if char.isdigit():
                includes_matrix[i][0] = True
            elif char.isupper():
                includes_matrix[i][1] = True
            elif char.islower():
                includes_matrix[i][2] = True
            else:
                includes_matrix[i][3] = True
    # build regex string from includes matrix
    regex_str = ""
    for row in includes_matrix:
        # if other characters are included, we use . to match any character
        if row[3]:
            regex_str += "."
        else:
            char_class = ""
            if row[0]:
                char_class += "0-9"
            if row[1]:
                char_class += "A-Z"
            if row[2]:
                char_class += "a-z"
            regex_str += f"[{char_class}]"
    return regex_str

def get_matching_index(predicted_label,regex_str, possible_labels):
    ''' Given a predicted label, a regex string and a list of possible labels,
    return the best matching label from the possible labels based on exact match or hamming distance.
        Returns a tuple of (best_matching_label, is_exact_match, is_guess)'''
    # check if possible_labels is empty
    if not possible_labels:
        raise ValueError("The list of possible labels is empty.")
    pattern = re.compile(regex_str)
    # first validate possible index number using regex
    for label in possible_labels:
        if not pattern.fullmatch(label):
            raise ValueError(f"Possible label '{label}' does not match the regex pattern '{regex_str}'")

    match = pattern.search(str(predicted_label))
    # if match, we use exact match test and if fails hamming distance
    if match:
        matched_str = match.group(0)
        # Check for exact match
        if matched_str in possible_labels:
            return matched_str, True, False
        else:
            # Use Hamming distance to find the closest match
            hamming_distances = [(label, Hamming.distance(matched_str, label)) for label in possible_labels]
            closest_match = min(hamming_distances, key=lambda x: x[1]) # this gives us the tuple (label, distance)
            # Check if there's more than one candidate with the same minimum distance
            min_distance = closest_match[1]
            candidates = [label for label, dist in hamming_distances if dist == min_distance]
            if len(candidates) > 1:
                return closest_match[0], False, True
            else:
                return closest_match[0], False, False
    else:
        # If no match found using regex, we use Levenshtein distance on the whole predicted label
        levenshtein_distances = [(label, Levenshtein.distance(str(predicted_label), label)) for label in possible_labels]
        closest_match = min(levenshtein_distances, key=lambda x: x[1])
        min_distance = closest_match[1]
        candidates = [label for label, dist in levenshtein_distances if dist == min_distance]
        if len(candidates) > 1:
            return closest_match[0], False, True
        else:
            return closest_match[0], False, False