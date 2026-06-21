import os

# --- CONFIGURATION ---
directory = "In24-CS1033-Marking/student-answers/V3"  # Change this to your folder
search_string = "REPEAT"
replace_string = "Z_REPEAT"

# --- MAIN LOGIC ---
for filename in os.listdir(directory):
    if search_string in filename:
        new_filename = filename.replace(search_string, replace_string)
        old_path = os.path.join(directory, filename)
        new_path = os.path.join(directory, new_filename)
        os.rename(old_path, new_path)
        print(f"Renamed: '{filename}' → '{new_filename}'")
