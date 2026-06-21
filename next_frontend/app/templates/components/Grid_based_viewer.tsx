import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";

interface ColumnStart {
  starting_x: number;
  starting_y: number;
}

interface BubbleCoordinate {
  x: number;
  y: number;
}

interface BubbleConfigs {
  x_offset: number;
  y_offset: number;
  columns: Record<string, ColumnStart>;
}

interface GridConfigData {
  metadata: {
    num_questions: number;
    column_row_distribution: number[];
    num_of_options_per_question: number;
  };
  bubble_configs: BubbleConfigs;
}

interface GridBasedViewerProps {
  templateImage: string | null;
  configData: GridConfigData | null;
  configId: string | null;
  jobId: number | null;
  onClose: () => void;
}

interface ConfigJobResponse {
  template_id: number;
}

interface SelectedColumn {
  key: string;
  originalPosition: ColumnStart;
}

const Grid_based_viewer: React.FC<GridBasedViewerProps> = ({
  templateImage,
  configData,
  configId,
  jobId,
  onClose,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState<number>(1);

  const [columns, setColumns] = useState<Record<string, ColumnStart>>({});
  const [xOffset, setXOffset] = useState<number>(0);
  const [yOffset, setYOffset] = useState<number>(0);
  const [bubbles, setBubbles] = useState<BubbleCoordinate[][][]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<SelectedColumn | null>(
    null
  );
  const [draggedColumn, setDraggedColumn] = useState<SelectedColumn | null>(
    null
  );
  const [hoverColumnKey, setHoverColumnKey] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isInvalidPosition, setIsInvalidPosition] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const CLICK_COOLDOWN = 300; // milliseconds
  const DRAG_THRESHOLD = 5; // pixels
  const originalConfigString = JSON.stringify(configData);

  // === Utility functions ===
  const checkPositionValidity = useCallback(
    (columnKey: string, newX: number): boolean => {
      const columnKeys = Object.keys(columns).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
      const currentColumnIndex = columnKeys.indexOf(columnKey);

      // Check constraints based on column position
      if (currentColumnIndex > 0) {
        // Not the first column - check if it's not too far left
        const prevColumnKey = columnKeys[currentColumnIndex - 1];
        const prevColumnX = columns[prevColumnKey].starting_x;
        if (newX < prevColumnX) {
          return false;
        }
      }

      if (currentColumnIndex < columnKeys.length - 1) {
        // Not the last column - check if it's not too far right
        const nextColumnKey = columnKeys[currentColumnIndex + 1];
        const nextColumnX = columns[nextColumnKey].starting_x;
        if (newX > nextColumnX) {
          return false;
        }
      }

      return true;
    },
    [columns]
  );

  const generateBubblesFromGrid = useCallback((): BubbleCoordinate[][][] => {
    if (!configData?.metadata) {
      return [];
    }

    const {
      num_questions,
      column_row_distribution,
      num_of_options_per_question,
    } = configData.metadata;
    const generatedBubbles: BubbleCoordinate[][][] = [];

    let questionIndex = 0;
    const columnKeys = Object.keys(columns);

    column_row_distribution.forEach((rowsInColumn, columnIndex) => {
      const columnBubbles: BubbleCoordinate[][] = [];
      // Use the actual column key from the config data
      const columnKey = columnKeys[columnIndex];
      const columnStart = columns[columnKey];

      if (!columnStart) {
        return;
      }

      for (
        let row = 0;
        row < rowsInColumn && questionIndex < num_questions;
        row++
      ) {
        const rowBubbles: BubbleCoordinate[] = [];

        for (let option = 0; option < num_of_options_per_question; option++) {
          const bubbleX = columnStart.starting_x + option * xOffset;
          const bubbleY = columnStart.starting_y + row * yOffset;

          rowBubbles.push({
            x: bubbleX,
            y: bubbleY,
          });
        }

        columnBubbles.push(rowBubbles);
        questionIndex++;
      }

      generatedBubbles.push(columnBubbles);
    });

    return generatedBubbles;
  }, [configData, columns, xOffset, yOffset]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    return { x: x / scale, y: y / scale };
  };

  const hitTest = (x: number, y: number) => {
    const hitRadius = 15;

    // First check individual bubbles
    const columnKeys = Object.keys(columns).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );
    for (let colIdx = 0; colIdx < bubbles.length; colIdx++) {
      const column = bubbles[colIdx];
      for (let rowIdx = 0; rowIdx < column.length; rowIdx++) {
        const row = column[rowIdx];
        for (let bubbleIdx = 0; bubbleIdx < row.length; bubbleIdx++) {
          const bubble = row[bubbleIdx];
          const dist = Math.hypot(bubble.x - x, bubble.y - y);
          if (dist <= hitRadius) {
            return columnKeys[colIdx]; // Return actual column key
          }
        }
      }
    }

    // Fallback to column starting positions
    for (const key of Object.keys(columns)) {
      const s = columns[key];
      const dist = Math.hypot(s.starting_x - x, s.starting_y - y);
      if (dist <= hitRadius) return key;
    }
    return null;
  };

  // === Canvas Drawing ===
  const drawBubble = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color = "#2BFA0B",
      isHovered = false
    ) => {
      const radius = isHovered ? 7 : 5;
      ctx.beginPath();
      ctx.arc(x * scale, y * scale, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.closePath();
    },
    [scale]
  );

  const drawGuides = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      sx: number,
      sy: number,
      xOff: number,
      yOff: number
    ) => {
      // Horizontal line
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ff0000";
      ctx.setLineDash([]);
      ctx.moveTo(sx * scale, sy * scale);
      ctx.lineTo((sx + xOff) * scale, sy * scale);
      ctx.stroke();

      // Vertical line
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ff0000";
      ctx.setLineDash([]);
      ctx.moveTo(sx * scale, sy * scale);
      ctx.lineTo(sx * scale, (sy + yOff) * scale);
      ctx.stroke();
    },
    [scale]
  );

  // === Mouse / Drag logic (EXACTLY like cluster-based) ===
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    // Prevent double-click issues
    const now = Date.now();
    if (now - lastClickTime < CLICK_COOLDOWN) {
      return;
    }
    setLastClickTime(now);

    const pt = getCanvasCoords(e);
    if (!pt) return;

    const hit = hitTest(pt.x, pt.y);
    if (!hit) return;

    // Find and select the column
    const selected: SelectedColumn = {
      key: hit,
      originalPosition: { ...columns[hit] },
    };

    setSelectedColumn(selected);
    setDragStartPos(pt);
    // Don't set isDragging or draggedColumn yet - wait for actual movement
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    // Check if we should start dragging
    if (selectedColumn && dragStartPos && !isDragging) {
      const dist = Math.hypot(pt.x - dragStartPos.x, pt.y - dragStartPos.y);
      if (dist > DRAG_THRESHOLD) {
        setIsDragging(true);
        setDraggedColumn(selectedColumn);
      }
    }

    // Hover detection (only when not dragging) - check individual bubbles
    if (!isDragging) {
      let foundHover = false;
      const hoverRadius = 10 / scale; // Convert screen pixels to image coordinates

      for (let colIdx = 0; colIdx < bubbles.length; colIdx++) {
        const column = bubbles[colIdx];
        for (let rowIdx = 0; rowIdx < column.length; rowIdx++) {
          const row = column[rowIdx];
          for (let bubbleIdx = 0; bubbleIdx < row.length; bubbleIdx++) {
            const bubble = row[bubbleIdx];
            const dist = Math.hypot(bubble.x - pt.x, bubble.y - pt.y);
            if (dist < hoverRadius && !foundHover) {
              // Convert column index to the actual column key for hover
              const columnKeys = Object.keys(columns);
              setHoverColumnKey(columnKeys[colIdx]);
              foundHover = true;
              break;
            }
          }
          if (foundHover) break;
        }
        if (foundHover) break;
      }

      if (!foundHover) setHoverColumnKey(null);
    }

    if (isDragging && selectedColumn) {
      setMousePos(pt);

      // Check if the current position is valid
      const isValid = checkPositionValidity(selectedColumn.key, pt.x);
      setIsInvalidPosition(!isValid);

      // Only update column position if it's valid (for visual feedback)
      if (isValid) {
        setColumns((prev) => {
          const next = { ...prev };
          next[selectedColumn.key] = {
            starting_x: parseFloat(pt.x.toFixed(2)),
            starting_y: parseFloat(pt.y.toFixed(2)),
          };
          return next;
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !selectedColumn || !mousePos) {
      // Reset states if drag didn't actually happen
      setSelectedColumn(null);
      setDraggedColumn(null);
      setDragStartPos(null);
      return;
    }

    // Validate column order constraints
    const newX = parseFloat(mousePos.x.toFixed(2));
    const isValidPosition = checkPositionValidity(selectedColumn.key, newX);

    if (!isValidPosition) {
      const columnKeys = Object.keys(columns).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
      const currentColumnIndex = columnKeys.indexOf(selectedColumn.key);
      let errorMessage = "";

      if (currentColumnIndex > 0) {
        errorMessage = `Column ${
          currentColumnIndex + 1
        } must be to the right of Column ${currentColumnIndex}`;
      } else if (currentColumnIndex < columnKeys.length - 1) {
        errorMessage = `Column ${
          currentColumnIndex + 1
        } must be to the left of Column ${currentColumnIndex + 2}`;
      }

      showToast(errorMessage, "error");
      // Reset states without updating position
      setIsDragging(false);
      setSelectedColumn(null);
      setDraggedColumn(null);
      setMousePos(null);
      setDragStartPos(null);
      setIsInvalidPosition(false);
      return;
    }

    // Update the column starting position to the final mouse position
    setColumns((prev) => {
      const next = { ...prev };
      next[selectedColumn.key] = {
        starting_x: newX,
        starting_y: parseFloat(mousePos.y.toFixed(2)),
      };
      return next;
    });

    // Finalize the position
    setIsDragging(false);
    setSelectedColumn(null);
    setDraggedColumn(null);
    setMousePos(null);
    setDragStartPos(null);
    setIsInvalidPosition(false);
  };

  // === Save logic ===
  const handleSubmit = async () => {
    if (!configData || isSaving) return;
    if (!configId) {
      showToast("Invalid configuration ID", "error");
      return;
    }

    const newBubbleConfigs: BubbleConfigs = {
      x_offset: parseFloat(xOffset.toFixed(2)),
      y_offset: parseFloat(yOffset.toFixed(2)),
      columns: {},
    };

    Object.keys(columns).forEach((k) => {
      newBubbleConfigs.columns[k] = {
        starting_x: Math.round(columns[k].starting_x),
        starting_y: Math.round(columns[k].starting_y),
      };
    });

    const newConfigObj = {
      metadata: configData.metadata,
      bubble_configs: newBubbleConfigs,
    };

    const newConfigString = JSON.stringify(newConfigObj);
    if (originalConfigString === newConfigString) {
      showToast("No changes detected. Redirecting...", "info");
      router.push("/templates");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("file_id", configId);
      formData.append("config_data", JSON.stringify(newConfigObj));

      await axiosInstance.put("/api/files/update-config", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showToast("Configuration updated successfully!", "success");
      router.push("/templates");
    } catch (err) {
      console.error(err);
      showToast("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!jobId) return;

    try {
      const response = await axiosInstance.get(
        `/api/templates/config-job/${jobId}`
      );
      const uploadData: ConfigJobResponse = response.data as ConfigJobResponse;
      const TemRecordId = uploadData.template_id;
      await axiosInstance.delete(`/api/templates/${TemRecordId}`);

      showToast("You can re-enter again !", "success");
      // Close the viewer FIRST to unmount TemplateBubbleViewer
      onClose();
      // Small delay to ensure cleanup, then navigate
      setTimeout(() => {
        router.push("/templates/create?reset=true");
      }, 100);
    } catch (error) {
      console.error(
        "Error while getting configJob record ID or deleting  template:",
        error
      );
      showToast("Failed to remove entered template", "error");
    }
  };

  const handleXOffsetChange = (v: string) => {
    const num = parseFloat(v);
    if (!Number.isNaN(num)) setXOffset(num);
  };

  const handleYOffsetChange = (v: string) => {
    const num = parseFloat(v);
    if (!Number.isNaN(num)) setYOffset(num);
  };

  // === Load initial config ===
  useEffect(() => {
    if (!configData) return;
    const bc = configData.bubble_configs;
    const cols: Record<string, ColumnStart> = {};
    Object.keys(bc.columns).forEach((k) => {
      cols[k] = {
        starting_x: parseFloat(bc.columns[k].starting_x.toFixed(2)),
        starting_y: parseFloat(bc.columns[k].starting_y.toFixed(2)),
      };
    });
    setColumns(cols);
    setXOffset(parseFloat(bc.x_offset.toFixed(2)));
    setYOffset(parseFloat(bc.y_offset.toFixed(2)));
  }, [configData]);

  // === Update bubbles when configuration changes ===
  useEffect(() => {
    // Only generate bubbles if we have the required data
    if (!configData?.metadata || Object.keys(columns).length === 0) {
      return;
    }

    const generatedBubbles = generateBubblesFromGrid();
    setBubbles(generatedBubbles);
  }, [generateBubblesFromGrid, configData, columns]);

  // === Canvas Rendering ===
  useEffect(() => {
    if (!templateImage || !configData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = templateImage;
    image.onload = () => {
      const maxWidth = 900;
      const maxHeight = 1100;
      const scaleX = maxWidth / image.width;
      const scaleY = maxHeight / image.height;
      const scaleFactor = Math.min(scaleX, scaleY, 1);
      canvas.width = image.width * scaleFactor;
      canvas.height = image.height * scaleFactor;
      setScale(scaleFactor);

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw all bubbles except the ones being dragged

        bubbles.forEach((column, colIdx) => {
          column.forEach((row, rowIdx) => {
            row.forEach((bubble, bubbleIdx) => {
              // Skip drawing bubbles from the column being dragged
              if (draggedColumn && colIdx === parseInt(draggedColumn.key) - 1) {
                return;
              }

              // Convert column index to the actual column key for hover comparison
              const columnKeys = Object.keys(columns);
              const isHover =
                hoverColumnKey === columnKeys[colIdx] && !isDragging;
              drawBubble(ctx, bubble.x, bubble.y, "#2BFA0B", isHover);
            });
          });
        });

        // Draw column starting positions as reference points (guides)
        Object.keys(columns).forEach((k) => {
          const s = columns[k];
          // Skip drawing guides for the column being dragged
          if (draggedColumn && k === draggedColumn.key) {
            return;
          }
          drawGuides(ctx, s.starting_x, s.starting_y, xOffset, yOffset);
        });

        // Draw the dragging column's bubbles at new positions
        if (isDragging && mousePos && draggedColumn) {
          const draggedColumnIndex = parseInt(draggedColumn.key) - 1; // Convert "1" to 0, "2" to 1, etc.
          const draggedColumnBubbles = bubbles[draggedColumnIndex];

          if (draggedColumnBubbles) {
            // Calculate offset from original position
            const originalColumn = columns[draggedColumn.key];
            const offsetX = mousePos.x - originalColumn.starting_x;
            const offsetY = mousePos.y - originalColumn.starting_y;

            // Draw all bubbles in the dragged column at new positions
            draggedColumnBubbles.forEach((row, rowIdx) => {
              row.forEach((bubble, bubbleIdx) => {
                const newX = bubble.x + offsetX;
                const newY = bubble.y + offsetY;
                // Use different colors based on validity
                const bubbleColor = isInvalidPosition ? "#FF0000" : "#F60D0D"; // Red for invalid, darker red for valid
                drawBubble(ctx, newX, newY, bubbleColor, false);
              });
            });

            // Draw guides for the dragged column at new position
            drawGuides(ctx, mousePos.x, mousePos.y, xOffset, yOffset);
          }
        }
      };

      render();
    };
  }, [
    templateImage,
    configData,
    columns,
    xOffset,
    yOffset,
    hoverColumnKey,
    isDragging,
    mousePos,
    draggedColumn,
    bubbles,
    drawBubble,
    drawGuides,
    isInvalidPosition,
  ]);

  return (
    <div className="relative w-full h-full flex">
      {/* Canvas */}
      <div className="flex-1 flex justify-center items-start p-6 bg-gray-50 overflow-y-auto">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-xl shadow-lg cursor-pointer bg-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>
      </div>

      {/* Sidebar - Right Side */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-lg p-2 mr-3">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </span>
              Grid Configuration
            </h3>

            {configData?.metadata && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      Total Questions
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold">
                      {configData.metadata.num_questions}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      Options per Question
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-semibold">
                      {configData.metadata.num_of_options_per_question}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">
                      Row Distribution
                    </span>
                  </div>
                  <div className="space-y-2">
                    {configData.metadata.column_row_distribution.map(
                      (rows, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            Column {idx + 1}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md font-medium">
                            {rows} rows
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-orange-100 text-orange-600 rounded-lg p-2 mr-3">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </span>
              Global Offsets
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  X Offset
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={xOffset.toFixed(2)}
                  onChange={(e) => handleXOffsetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Y Offset
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={yOffset.toFixed(2)}
                  onChange={(e) => handleYOffsetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                💡 <strong>Tip:</strong> Click and drag any green bubble to move
                the entire column. Columns must maintain their order (Column 1
                left of Column 2, etc.). Red bubbles indicate invalid positions.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save & Continue"
            )}
          </button>
          <button
            onClick={handleEdit}
            className="w-full py-3 px-4 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            Edit Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Grid_based_viewer;
