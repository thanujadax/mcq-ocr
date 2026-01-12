import cv2
import pyautogui
import numpy as np
from sklearn.cluster import KMeans
from sklearn.cluster import AgglomerativeClustering

img = cv2.imread("../samples/templates/1.9.jpg")

#change accordingly
num_of_options_per_question= 5
num_of_rows_per_column=[30,30,30]
num_of_columns=3

screen_width, screen_height = pyautogui.size()
scale = min(screen_width / img.shape[1], screen_height / img.shape[0])
new_width = int(img.shape[1] * scale*0.9)
new_height = int(img.shape[0] * scale*0.9)
resized_img=cv2.resize(img,(new_width,new_height))
imGray = cv2.cvtColor(resized_img,cv2.COLOR_BGR2GRAY)

template_width = imGray.shape[1]
min_thickness = 3  # Minimum thickness in pixels for a thick line (adjust this)

#_, thresh = cv2.threshold(imGray, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)
#thresh_inv = cv2.bitwise_not(thresh)

blur = cv2.GaussianBlur(imGray, (5, 5), 1)
edges = cv2.Canny(blur, 50, 150, apertureSize=3)
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

line_y=None
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
     
    
    # Check if contour is horizontal thick line meeting both conditions
    if h >= min_thickness and w >= (template_width / 2):
        
        # Optionally, further confirm it's a horizontal line by aspect ratio
        aspect_ratio = w / h
        if aspect_ratio > 3:  # e.g., width at least 3 times thickness
            
           
            line_thickness = h
            line_y = y + h
            break  # process only the first matching line  

if line_y is not None:
    img_below = resized_img[line_y+1:, :]  # crop everything below the line
    gray_below = imGray[line_y+1:, :]
else:
    img_below=resized_img
    gray_below=imGray

blur = cv2.GaussianBlur(gray_below, (5, 5), 1)
edges = cv2.Canny(blur, 50, 150, apertureSize=3)
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

#_,thrash =  cv2.threshold(gray_below,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)
#contours,_ = cv2.findContours(thrash,cv2.RETR_TREE,cv2.CHAIN_APPROX_NONE)

bubble_areas = []
circles=[]
for contour in contours :
    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour,True)
    if perimeter == 0 :
        continue
    circularity = 4* np.pi*(area / (perimeter * perimeter))
    x, y, w, h = cv2.boundingRect(contour)
    aspect_ratio = w / float(h)
    if (0.7 < circularity < 1.2) and (0.8<aspect_ratio<1.25):
        bubble_areas.append(area)
        circles.append(contour)
        

filtered_circles = []
filtered_areas = []

# First pass: keep only circles (not rectangles)
for contour, area in zip(circles, bubble_areas):
    epsilon = 0.01 * cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, epsilon, True)
    if len(approx) != 4:  # skip rectangles
        filtered_circles.append(contour)
        filtered_areas.append(area)
        
# Now filter by area
mean_area = np.mean(filtered_areas)
lower_threshold = mean_area * 0.5
upper_threshold = mean_area * 1.5

final_circles = []

for contour, area in zip(filtered_circles, filtered_areas):
    if lower_threshold <= area and area <= upper_threshold:
        final_circles.append(contour)
        
radii = []

#Here i will get the mean radius for all bubbles for the template and i will use it to detect missing bubble rows 

for cnt in final_circles:
    (x, y), radius = cv2.minEnclosingCircle(cnt)  # center, radius
    radii.append(radius)

# Mean radius
mean_radius = np.mean(radii) if radii else 0

centers = []  # will store (cx, cy) for each contour in the same order

for cnt in final_circles:
    M = cv2.moments(cnt)
    if M["m00"] != 0:  # avoid division by zero
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
    else:
        # fallback: use bounding box center
        x, y, w, h = cv2.boundingRect(cnt)
        cx = x + w // 2
        cy = y + h // 2
    
    centers.append((cx, cy))

# Assume centers is a list of (cx, cy)
# Convert to numpy array
points = np.array(centers)

# Extract only X coordinates for column clustering
X_coords = points[:, 0].reshape(-1, 1)

# K-Means with safe parameters
kmeans_cols = KMeans(
    n_clusters=num_of_columns,
    init='k-means++',
    n_init=15,      # retry with 50 different seeds
    random_state=42 # fixed for reproducibility
)
col_labels = kmeans_cols.fit_predict(X_coords)

# Group points by column label
columns = [[] for _ in range(3)]
for point, label in zip(points, col_labels):
    columns[label].append(tuple(point))

# Sort columns by their X-center so it's always left-to-right
col_centers_x = [np.mean([p[0] for p in col]) for col in columns]
sorted_indices = np.argsort(col_centers_x)
columns = [columns[i] for i in sorted_indices]

# topmost y (None if column empty)
topmost_y_per_col = [min(col, key=lambda p: p[1])[1] if col else None for col in columns]
topmost_y_per_col = np.array(topmost_y_per_col)
global_min_y = np.min(topmost_y_per_col)

# Create an empty structure: 3 columns, each with 30 empty slots
bubbles = [[[] for _ in range(num_of_rows_per_column[col])] for col in range(num_of_columns)]

row_bubbles=[]

for i in range(num_of_columns):
    if len(columns[i]) == num_of_options_per_question*num_of_rows_per_column[i]:
        columns[i] = sorted(columns[i], key=lambda p: p[1])  # sort by y-coordinate
        for x in range(num_of_rows_per_column[i]):
            row_bubbles=columns[i][:num_of_options_per_question]
            columns[i]=columns[i][num_of_options_per_question:]
            # Sort in place by x-coordinate (tuple[0])
            row_bubbles.sort(key=lambda p: p[0])
            bubbles[i][x]=row_bubbles
# Now `columns[0]`, `columns[1]`, `columns[2]` are left, middle, right columns
    else:
        # Convert the column points to numpy array
        col_points = np.array(columns[i])
        
        # Extract only Y coords for clustering
        Y_coords = col_points[:, 1].reshape(-1, 1)
        
        #Perform KMeans clustering into 30 rows
        # kmeans_rows = KMeans(
        #     n_clusters=num_of_rows_per_column[i],
        #     init='k-means++',
        #     n_init=20,
        #     random_state=42
        # )
        # row_labels = kmeans_rows.fit_predict(Y_coords)
        
        # # Use Agglomerative Clustering instead of KMeans for rows
        agglo_rows = AgglomerativeClustering(
                n_clusters=num_of_rows_per_column[i],   # same as with KMeans
                metric='euclidean',                # default, can also use 'manhattan', etc.
                linkage='ward'                       # 'ward' works well for continuous values like y-coordinates
            )

        row_labels = agglo_rows.fit_predict(Y_coords)

        # Group points by their cluster (row)
        clustered_rows = [[] for _ in range(num_of_rows_per_column[i])]
        for point, label in zip(col_points, row_labels):
            clustered_rows[label].append(tuple(point))
        
        # Sort clusters top-to-bottom by the cluster center (Y mean)
        row_centers_y = [np.mean([p[1] for p in row]) if row else 1e9 for row in clustered_rows]
        sorted_row_indices = np.argsort(row_centers_y)
        row_centers_y.sort()
        
        # Now process each row
        for row_idx, cluster_idx in enumerate(sorted_row_indices):
            row_points = clustered_rows[cluster_idx]
            
            # Sort row bubbles left-to-right by X coordinate
            row_points.sort(key=lambda p: p[0])
            
            # Assign into bubbles array
            bubbles[i][row_idx] = row_points
            

        # compute differences between consecutive rowCentersY
        diffs = [row_centers_y[i+1] - row_centers_y[i] for i in range(len(row_centers_y) - 1)]

        # find the smallest value in diffs
        min_diff = min(diffs)

        # define threshold = min_diff + bubble_radius
        threshold = min_diff + mean_radius
        
        # find all indices where diff < threshold
        # we keep both values and indices
        small_diffs = [(idx, val) for idx, val in enumerate(diffs) if val < threshold]
        for idx, _ in small_diffs:
            row_centers_y[idx]=None
        new_row_centers_y = [d for d in row_centers_y if d is not None]   
        if (len(small_diffs) < num_of_rows_per_column[i] ):
            # merge rows in bubbles[i] where small differences were found
            for idx, val in small_diffs:
                # concatenate row idx and idx+1 into row idx
                bubbles[i][idx] = bubbles[i][idx] + bubbles[i][idx + 1]
                # sort merged row by x-coordinate (assuming bubble is (x, y))
                bubbles[i][idx] = sorted(bubbles[i][idx], key=lambda p: p[0])
                # empty row idx+1
                bubbles[i][idx + 1] = []
                        # also "empty out" those small differences in diffs array
            for idx, val in small_diffs:
                diffs[idx] = None   # mark removed
            
            bubbles[i] = [row for row in bubbles[i] if row]   # drop []
            diffs = [d for d in diffs if d is not None]
        rows = bubbles[i]   # all 30 rows for this column

        # --- Step 1: Find reference row ---
        tolerance = 10  # pixels, adjust based on template spacing
        reference_x = None
        for row in rows:
            if len(row) == num_of_options_per_question:
                reference_x = [p[0] for p in row]  # store X only
                break
                # --- Step 1: Find reference_x using all complete rows ---
        #valid_rows = [row for row in rows if len(row) == num_of_options_per_question]

        #if not valid_rows:
            #print(f"No reference row found in column {i}")
            #continue

        # Collect X values for each option position across valid rows
        #all_x_positions = [[] for _ in range(num_of_options_per_question)]
        #for row in valid_rows:
            #row_sorted = sorted(row, key=lambda p: p[0])  # ensure left-to-right
            #for idx, (x, _) in enumerate(row):
                #all_x_positions[idx].append(x)

        # Mean X for each bubble position
        #reference_x = [int(np.mean(x_list)) for x_list in all_x_positions]

        if reference_x is None:
            print(f"No reference row found in column {i}")
            continue
        
        #if cv has missed some rows those will impute below
        if (len(bubbles[i]) < num_of_rows_per_column[i]):
            number_of_missed_rows = len(small_diffs)
            diffs = np.array(diffs)
            median_diff = np.median(diffs)
            #mad = np.median(np.abs(diffs - median_diff))
            
            # threshold: anything above this is a "large diff"
            threshold_large = median_diff + mean_radius
            large_diffs  = [(idx, val) for idx, val in enumerate(diffs) if val > threshold_large]
            if len(large_diffs) == len(small_diffs):
                large_diffs_sorted = sorted(large_diffs, key=lambda x: x[0], reverse=True)

                for idx, _ in large_diffs_sorted:
                    # sanity checks
                    if idx < 0 or idx + 1 >= len(bubbles[i]):
                        # index out of range: skip (shouldn't normally happen)
                        print(f"warning: skip invalid large_diff idx={idx}")
                        continue

                    # compute mean y for row idx and row idx+1 (average across all bubbles in the row)
                    # each row is a list of (x,y) tuples
                    row1 = bubbles[i][idx]
                    row2 = bubbles[i][idx + 1]

                    
                    # if a row is empty (edge-case), fall back to row_centers_y if available
                    if row1:
                        mean_y1 = float(np.mean([p[1] for p in row1]))
                    else:
                        mean_y1 = float(row_centers_y[idx])

                    if row2:
                        mean_y2 = float(np.mean([p[1] for p in row2]))
                    else:
                        mean_y2 = float(row_centers_y[idx + 1])
                    # midpoint Y for the imputed row
                    mid_y = (mean_y1 + mean_y2) / 2.0
                    mid_y_int = int(round(mid_y))

                    # build the new row: one (x, y) tuple per option using reference_x
                    # ensure reference_x length matches num_of_options_per_question
                    new_row = [(int(reference_x[j]), mid_y_int) for j in range(num_of_options_per_question)]

                    # insert the new row at position idx+1 (this shifts existing rows to the right)
                    bubbles[i].insert(idx + 1, new_row)

                    # also insert mid_y into row_centers_y at the same position to keep arrays aligned
                    row_centers_y.insert(idx + 1, mid_y)
                number_of_missed_rows=0
           

            
            if len(large_diffs) < len(small_diffs) and len(large_diffs)!=0:
                #number of missed consecetive rows
                n=1
                new_rows_to_be_inserted=[]
                while(len(large_diffs)!=0):
                    threshold_range = median_diff*n
                    
                    current_diffs = []

                    # make a copy since we are modifying the list
                    for item in large_diffs[:]:
                        if item[1] < (threshold_range + 3*mean_radius):
                            current_diffs.append(item)
                            large_diffs.remove(item)
                            number_of_missed_rows -= n
                    
                    current_diffs_sorted = sorted(current_diffs, key=lambda x: x[0], reverse=True)
                    for idx, _ in current_diffs_sorted:
                        # sanity checks
                        if idx < 0 or idx + 1 >= len(bubbles[i]):
                            # index out of range: skip (shouldn't normally happen)
                            print(f"warning: skip invalid large_diff idx={idx}")
                            continue

                        # compute mean y for row idx and row idx+1 (average across all bubbles in the row)
                        # each row is a list of (x,y) tuples
                        row1 = bubbles[i][idx]
                        row2 = bubbles[i][idx + 1]

                        
                        # if a row is empty (edge-case), fall back to row_centers_y if available
                        if row1:
                            mean_y1 = float(np.mean([p[1] for p in row1]))
                        else:
                            mean_y1 = float(row_centers_y[idx])

                        if row2:
                            mean_y2 = float(np.mean([p[1] for p in row2]))
                        else:
                            mean_y2 = float(row_centers_y[idx + 1])
                        
                        # step size: split the vertical gap into n+1 equal segments
                        step = (mean_y2 - mean_y1) / (n + 1)

                        new_rows = []
                        for k in range(1, n + 1):
                            # compute y for the k-th missing row
                            y_k = mean_y1 + step * k
                            y_k_int = int(round(y_k))

                            # build the new row (all x from reference_x, same y)
                            new_row = [(int(reference_x[j]), y_k_int) for j in range(num_of_options_per_question)]
                            new_rows.append(new_row)

                        # insert rows into bubbles[i], without overwriting
                        # insert in reverse order to preserve index positions
                        for row in reversed(new_rows):
                            pair = (idx, row)
                            if not new_rows_to_be_inserted:
                                # if empty, just add
                                new_rows_to_be_inserted.append(pair)
                            else:
                                inserted = False
                                for pos, (existing_idx, _) in enumerate(new_rows_to_be_inserted):
                                    if existing_idx < idx:
                                        # insert before the first smaller existing_idx
                                        new_rows_to_be_inserted.insert(pos, pair)
                                        inserted = True
                                        break
                                if not inserted:
                                    # if no smaller index was found, append at the end
                                    new_rows_to_be_inserted.append(pair)
                    n=n+1 
                # Now insert all new rows in one go, in correct order
                for idx, row in new_rows_to_be_inserted:
                    bubbles[i].insert(idx + 1, row)
                    row_centers_y.insert(idx + 1, row[0][1])
             # this if-clause will execute if the system failed to detect last rows in a column   
            if len(large_diffs) == 0 and number_of_missed_rows != 0:
                tolerance = median_diff * 0.5   # can adjust this factor
                valid_range = (global_min_y - tolerance, global_min_y + tolerance)
                if valid_range[1] < topmost_y_per_col[i]:
                     # Difference from expected
                     imputed_rows = []
                     current_first_y=float(np.mean([p[1] for p in bubbles[i][0]]))
                     diff = current_first_y - global_min_y
                     approx_missing = diff / median_diff
                     # Round with tolerance
                     missing_count = int(round(approx_missing))
                     if missing_count <= number_of_missed_rows:
                        number_of_missed_rows = number_of_missed_rows-missing_count
                        for m in range(missing_count):
                            y_new = current_first_y - (m + 1) * median_diff
                            y_new_int = int(round(y_new))
                            new_row = [(int(reference_x[j]), y_new_int) for j in range(num_of_options_per_question)]
                            imputed_rows.append(new_row)
                            
                        for row in imputed_rows:
                            bubbles[i].insert(0,row)
                            row_centers_y.insert(0,row[0][1])
                # if still some rows are missing, append them at the end
                if number_of_missed_rows != 0:
                    last_row_index = len(bubbles[i])-1
                    last_row = bubbles[i][last_row_index]
                    if last_row:
                        mean_y = float(np.mean([p[1] for p in last_row]))
                    else:
                        mean_y = float(row_centers_y[last_row_index])
                    
                    step = median_diff
                    new_rows = []
                    for k in range(1, number_of_missed_rows + 1):
                                # compute y for the k-th missing row
                                y_k = mean_y + step * k
                                y_k_int = int(round(y_k))

                                # build the new row (all x from reference_x, same y)
                                new_row = [(int(reference_x[j]), y_k_int) for j in range(num_of_options_per_question)]
                                new_rows.append(new_row)

                            # insert rows into bubbles[i], without overwriting
                            # insert in reverse order to preserve index positions
                    for row in new_rows:
                        bubbles[i].append(row)
                        row_centers_y.append(row[0][1])


        # Fix each row if there are any missing bubble coordinates for a row
        for row_idx, row in enumerate(rows):
            if len(row) == num_of_options_per_question:
                continue  # this row is fine

            elif len(row) < num_of_options_per_question:
                # Missing bubbles
                avg_y = np.mean([p[1] for p in row]) if row else 0
                new_row = row.copy()
                for ref_x in reference_x:
                    # Check if a bubble already near ref_x
                    found = any(abs(p[0] - ref_x) <= tolerance for p in row)
                    if not found:
                        new_row.append((ref_x, int(avg_y)))  # impute missing
                # Sort by X again
                new_row.sort(key=lambda p: p[0])
                bubbles[i][row_idx] = new_row

            elif len(row) > num_of_options_per_question:
                # Extra bubbles
                new_row = []
                for ref_x in reference_x:
                    # Find bubble closest to ref_x
                    candidates = [p for p in row if abs(p[0] - ref_x) <= tolerance]
                    if candidates:
                        # Pick the one closest to ref_x
                        best = min(candidates, key=lambda p: abs(p[0] - ref_x))
                        new_row.append(best)
                # Sort by X again
                new_row.sort(key=lambda p: p[0])
                bubbles[i][row_idx] = new_row


font = cv2.FONT_HERSHEY_SIMPLEX
font_scale = 0.5
color = (0, 0, 255)   # red
thickness = 1

for col_idx in range(num_of_columns):        # Loop through columns
    count = 1
    for row_idx in range(num_of_rows_per_column[col_idx]):   # Loop through rows/questions
        for opt_idx in range(num_of_options_per_question):   # Loop through options
            cx, cy = bubbles[col_idx][row_idx][opt_idx]   # coordinates of bubble center
            
            # Draw the number on the image
            cv2.putText(
                img_below, str(count), (cx, cy), 
                font, font_scale, color, thickness, cv2.LINE_AA
            )
            count += 1  # increase numbering

# Show the result
cv2.imshow("Bubbles with numbering", resized_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
