import { Bubble } from "@/app/marking-jobs/types/types";
import { colorClasses } from "@/constants/answersheet_view_color_classes";
import React from "react";

export interface BubbleStyle {
  color: string;
  icon: React.ReactNode;
}

interface AnswerSheetBubbleProps {
  bubble: Bubble;
  bubbleStyle: BubbleStyle;
  questionIndex: number;
  optionIndex: number;
  isInteractive: boolean;
  handleBubbleClick: (questionIndex: number, optionIndex: number) => void;
}

const AnswerSheetBubble = ({
  bubble,
  bubbleStyle,
  questionIndex,
  optionIndex,
  isInteractive,
  handleBubbleClick,
}: AnswerSheetBubbleProps) => {
  // Get color classes or fallback to gray for unknown colors
  const colorClass =
    colorClasses[bubbleStyle.color as keyof typeof colorClasses] ||
    colorClasses.gray;

  return (
    <div
      key={`${questionIndex}-${optionIndex}`}
      className={`absolute z-10 ${
        isInteractive ? "cursor-pointer" : "cursor-default"
      }`}
      style={{
        left: `${bubble.coordinates[0] - 10}px`,
        top: `${bubble.coordinates[1] - 10}px`,
        width: "15px",
        height: "15px",
      }}
      onClick={() => handleBubbleClick(questionIndex, optionIndex)}
    >
      {/* Visible circle background */}
      {bubbleStyle.color !== "transparent" && (
        <div
          className={`w-[18px] h-[18px] rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
            bubble.marked
              ? `${colorClass.bg} ${colorClass.border} scale-110`
              : `bg-transparent text-transparent ${colorClass.border700} ${
                  isInteractive
                    ? `${colorClass.borderHover} hover:scale-105`
                    : ""
                }`
          }`}
        >
          {/* Checkmark when selected */}
          {bubble.marked && bubbleStyle.icon}
        </div>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute -bottom-6 left-0 text-xs bg-black/70 text-white px-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Q{questionIndex + 1}-{optionIndex + 1}
        </div>
      )}
    </div>
  );
};

export default AnswerSheetBubble;
