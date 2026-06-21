import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";

interface BubbleCoordinate {
  x: number;
  y: number;
}

type BubbleTuple = [number, number];

interface ClusterConfigData {
  metadata: {
    num_columns: number;
    num_of_options_per_question: number;
    column_row_distribution: number[];
  };
  bubbles: BubbleTuple[][][]; // [column][row][bubble] where bubble is [x, y]
}

interface ColumnBounds {
  x_min: number;
  x_max: number;
  rows: {
    y_mean: number;
    y_min: number;
    y_max: number;
  }[];
}

interface SelectedBubble {
  colIndex: number;
  rowIndex: number;
  bubbleIndex: number;
  originalCoord: BubbleCoordinate;
}

interface ConfigJobResponse {
  template_id: number;
}

interface ClusterBasedViewerProps {
  templateImage: string | null;
  configData: ClusterConfigData;
  configId: string | null;
  jobId: number | null;
  onClose: () => void;
}

const Cluster_based_viewer: React.FC<ClusterBasedViewerProps> = ({
  templateImage,
  configData,
  configId,
  jobId,
  onClose,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [columnBounds, setColumnBounds] = useState<ColumnBounds[]>([]);
  const [bubbles, setBubbles] = useState<BubbleCoordinate[][][]>([]);
  const [selectedBubble, setSelectedBubble] = useState<SelectedBubble | null>(
    null
  );
  const [draggedBubble, setDraggedBubble] = useState<SelectedBubble | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState<BubbleCoordinate | null>(null);
  const [hoveredBubble, setHoveredBubble] = useState<BubbleCoordinate | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [dragStartPos, setDragStartPos] = useState<BubbleCoordinate | null>(
    null
  );

  const CLICK_COOLDOWN = 300; // milliseconds
  const DRAG_THRESHOLD = 5; // pixels
  // Calculate column bounds
  const calculateBounds = (bubbleData: BubbleCoordinate[][][]) => {
    return bubbleData.map((column) => {
      const allXCoords = column.flat().map((b) => b.x);
      const x_min = Math.min(...allXCoords) - 10;
      const x_max = Math.max(...allXCoords) + 10;

      const rows = column.map((row) => {
        const yCoords = row.map((b) => b.y);
        return {
          y_mean: yCoords.reduce((a, b) => a + b, 0) / yCoords.length,
          y_min: Math.min(...yCoords) - 10,
          y_max: Math.max(...yCoords) + 10,
        };
      });

      return { x_min, x_max, rows };
    });
  };

  // Find column/row position
  const findPosition = (
    x: number,
    y: number
  ): { col: number; row: number; isNewRow: boolean } | null => {
    let targetCol = -1;
    for (let i = 0; i < columnBounds.length; i++) {
      if (x >= columnBounds[i].x_min && x <= columnBounds[i].x_max) {
        targetCol = i;
        break;
      }
    }

    if (targetCol === -1) {
      return null;
    }

    const bounds = columnBounds[targetCol];
    for (let i = 0; i < bounds.rows.length; i++) {
      if (y >= bounds.rows[i].y_min && y <= bounds.rows[i].y_max) {
        return { col: targetCol, row: i, isNewRow: false };
      }
    }

    const rowMeans = bounds.rows.map((r) => r.y_mean);
    rowMeans.push(y);
    rowMeans.sort((a, b) => a - b);
    const targetRow = rowMeans.indexOf(y);

    return { col: targetCol, row: targetRow, isNewRow: true };
  };

  const handleMouseUp = () => {
    if (!isDragging || !selectedBubble || !mousePos) {
      // Reset states if drag didn't actually happen
      setSelectedBubble(null);
      setDraggedBubble(null);
      setDragStartPos(null);
      return;
    }

    const position = findPosition(
      Math.round(mousePos.x),
      Math.round(mousePos.y)
    );

    // Create a deep copy to avoid mutating original state directly
    const newBubbles = bubbles.map((col) => col.map((row) => [...row]));

    // Remove the original bubble first
    newBubbles[selectedBubble.colIndex][selectedBubble.rowIndex].splice(
      selectedBubble.bubbleIndex,
      1
    );

    if (!position) {
      // Outside valid column - restore to original position
      showToast(
        "The bubble must be placed within a valid column's boundaries",
        "error"
      );
      newBubbles[selectedBubble.colIndex][selectedBubble.rowIndex].splice(
        selectedBubble.bubbleIndex,
        0,
        selectedBubble.originalCoord
      );
    } else {
      const isSameRow =
        position.col === selectedBubble.colIndex &&
        position.row === selectedBubble.rowIndex;

      if (isSameRow) {
        // Same row - insert at correct position based on x-coordinate
        const newCoord = {
          x: Math.round(mousePos.x),
          y: Math.round(mousePos.y),
        };

        const row = newBubbles[position.col][position.row];
        const insertIndex = row.findIndex((b) => b.x > newCoord.x);

        if (insertIndex === -1) {
          row.push(newCoord); // Add to end
        } else {
          row.splice(insertIndex, 0, newCoord); // Insert at correct position
        }
      } else if (position.isNewRow) {
        // New row within valid column
        newBubbles[position.col].splice(position.row, 0, [
          {
            x: Math.round(mousePos.x),
            y: Math.round(mousePos.y),
          },
        ]);
      } else {
        // Move to another existing row
        const maxOptions = configData.metadata.num_of_options_per_question;
        const rowLength = newBubbles[position.col][position.row].length;

        if (rowLength < maxOptions) {
          const newCoord = {
            x: Math.round(mousePos.x),
            y: Math.round(mousePos.y),
          };

          const row = newBubbles[position.col][position.row];
          const insertIndex = row.findIndex((b) => b.x > newCoord.x);

          if (insertIndex === -1) {
            row.push(newCoord);
          } else {
            row.splice(insertIndex, 0, newCoord);
          }
        } else {
          // Exceeds allowed bubbles per row
          showToast(`Maximum ${maxOptions} bubbles allowed per row`, "error");
          // Restore bubble to original place
          newBubbles[selectedBubble.colIndex][selectedBubble.rowIndex].splice(
            selectedBubble.bubbleIndex,
            0,
            selectedBubble.originalCoord
          );
        }
      }
    }

    // Update state safely
    setBubbles(newBubbles);
    setColumnBounds(calculateBounds(newBubbles));
    setIsDragging(false);
    setSelectedBubble(null);
    setDraggedBubble(null);
    setMousePos(null);
    setDragStartPos(null);
  };

  // Edit handler
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

  // Save configuration handler
  const handleSubmit = async () => {
    if (isSaving) return; // prevent multiple calls

    const newBubbles = bubbles.map((column) =>
      column.filter((row) => row.length > 0)
    );

    let isValid = true;
    let errorMessage = "";

    newBubbles.forEach((column, colIdx) => {
      column.forEach((row, rowIdx) => {
        if (row.length !== configData.metadata.num_of_options_per_question) {
          isValid = false;
          errorMessage = `Column ${colIdx + 1}, Row ${rowIdx + 1} has ${
            row.length
          } bubbles. Expected ${
            configData.metadata.num_of_options_per_question
          }`;
        }
      });
    });

    if (!isValid) {
      showToast(errorMessage, "error");
      return;
    }

    // Normalize updated bubbles to same format as original ([x, y])
    const updatedNormalized = newBubbles.map((column) =>
      column.map((row) => row.map((coord) => [coord.x, coord.y]))
    );

    // Check if there are changes
    const original = JSON.stringify(configData.bubbles);
    const updated = JSON.stringify(updatedNormalized);

    if (original === updated) {
      showToast("No changes detected. Redirecting...", "info");
      router.push("/templates");
      return;
    }

    if (!configId) {
      showToast("Invalid configuration ID", "error");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("file_id", configId);
      formData.append(
        "config_data",
        JSON.stringify({
          metadata: configData.metadata,
          bubbles: updatedNormalized,
        })
      );

      await axiosInstance.put("/api/files/update-config", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showToast("Configuration updated successfully!", "success");
      router.push("/templates");
    } catch (error) {
      console.error(error);
      showToast("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Draw bubble helper
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    // Prevent double-click issues
    const now = Date.now();
    if (now - lastClickTime < CLICK_COOLDOWN) {
      return;
    }
    setLastClickTime(now);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    let minDist = Infinity;
    let selected: SelectedBubble | null = null;

    bubbles.forEach((column, colIdx) => {
      column.forEach((row, rowIdx) => {
        row.forEach((bubble, bubbleIdx) => {
          const dist = Math.hypot(bubble.x - x, bubble.y - y);
          if (dist < minDist && dist < 10) {
            minDist = dist;
            selected = {
              colIndex: colIdx,
              rowIndex: rowIdx,
              bubbleIndex: bubbleIdx,
              originalCoord: { ...bubble },
            };
          }
        });
      });
    });

    if (selected !== null) {
      setSelectedBubble(selected);
      setDragStartPos({ x, y });
      // Don't set isDragging or draggedBubble yet - wait for actual movement
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    // Check if we should start dragging
    if (selectedBubble && dragStartPos && !isDragging) {
      const dist = Math.hypot(mouseX - dragStartPos.x, mouseY - dragStartPos.y);
      if (dist > DRAG_THRESHOLD) {
        setIsDragging(true);
        setDraggedBubble(selectedBubble);
      }
    }

    // Hover detection (only when not dragging)
    if (!isDragging) {
      let foundHover = false;
      bubbles.forEach((column) => {
        column.forEach((row) => {
          row.forEach((bubble) => {
            const dist = Math.hypot(bubble.x - mouseX, bubble.y - mouseY);
            if (dist < 8 && !foundHover) {
              setHoveredBubble(bubble);
              foundHover = true;
            }
          });
        });
      });
      if (!foundHover) setHoveredBubble(null);
    }

    if (isDragging) {
      setMousePos({ x: mouseX, y: mouseY });
    }
  };

  useEffect(() => {
    if (!templateImage || !configData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = templateImage;

    image.onload = () => {
      const maxWidth = 800;
      const maxHeight = 1000;
      const scaleX = maxWidth / image.width;
      const scaleY = maxHeight / image.height;
      const scaleFactor = Math.min(scaleX, scaleY);

      canvas.width = image.width * scaleFactor;
      canvas.height = image.height * scaleFactor;
      setScale(scaleFactor);

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw all bubbles except the one being dragged
        bubbles.forEach((column, colIdx) => {
          column.forEach((row, rowIdx) => {
            row.forEach((bubble, bubbleIdx) => {
              // Skip if this is the bubble being dragged
              if (
                draggedBubble &&
                colIdx === draggedBubble.colIndex &&
                rowIdx === draggedBubble.rowIndex &&
                bubbleIdx === draggedBubble.bubbleIndex
              ) {
                return;
              }
              const isHovered = hoveredBubble === bubble;
              drawBubble(ctx, bubble.x, bubble.y, "#2BFA0B", isHovered);
            });
          });
        });

        // Draw the dragging bubble in red
        if (isDragging && mousePos) {
          drawBubble(ctx, mousePos.x, mousePos.y, "#F60D0D");
        }
      };

      draw();
    };
  }, [
    templateImage,
    configData,
    scale,
    bubbles,
    isDragging,
    mousePos,
    hoveredBubble,
    draggedBubble,
    drawBubble,
  ]);

  useEffect(() => {
    if (!configData?.bubbles) return;

    const initialBubbles = configData.bubbles.map((column) =>
      column.map((row) =>
        row.map((coord) => ({
          x: coord[0],
          y: coord[1],
        }))
      )
    );
    setBubbles(initialBubbles);
    setColumnBounds(calculateBounds(initialBubbles));
  }, [configData]);

  return (
    <div className="relative w-full h-full flex">
      {/* Canvas */}
      <div className="flex-1 flex justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-xl shadow-lg cursor-pointer bg-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0v6m14-6v6"
                  />
                </svg>
              </span>
              Cluster Configuration
            </h3>

            {configData?.metadata && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Columns</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold">
                      {configData.metadata.num_columns}
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
                      (rows: number, idx: number) => (
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

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">
                    💡 <strong>Tip:</strong> Double-click a green bubble and
                    drag (without releasing after 2nd click) to move it (turns
                    blue). Release to a valid location (turns green again).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={() => handleSubmit()}
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

export default Cluster_based_viewer;
