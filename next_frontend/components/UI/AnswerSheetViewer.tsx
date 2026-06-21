import React from "react";
import Image from "next/image";
import { Bubble } from "@/app/marking-jobs/types/types";
import AnswerSheetBubble from "./AnswerSheetBubble";
import { _getBubbleStyle } from "@/app/utils/results";



interface AnswerSheetViewerProps {
  imageUrl: string;
  bubbleData: Bubble[][];
  onBubbleToggle?: (questionIndex: number, optionIndex: number) => void;
  showBubbles?: boolean;
  isInteractive?: boolean;
  width?: number;
  height?: number;
  className?: string;
  isMarkingScheme: boolean;
  markingScheme?: Bubble[][];
}

export const AnswerSheetViewer = ({
  imageUrl,
  bubbleData,
  onBubbleToggle,
  showBubbles = true,
  isInteractive = true,
  width = 1200,
  height = 1600,
  className = "",
  isMarkingScheme = true,
  markingScheme = [],
}: AnswerSheetViewerProps) => {
  const handleBubbleClick = (questionIndex: number, optionIndex: number) => {
    if (isInteractive && onBubbleToggle) {
      onBubbleToggle(questionIndex, optionIndex);
    }
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="relative bg-gray-100 border border-gray-200 rounded-lg overflow-hidden"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Background Image */}
        <Image
          src={imageUrl}
          alt="Answer sheet"
          width={width}
          height={height}
          className="w-full h-full"
          draggable={false}
          unoptimized
          priority
        />

        {/* Positioned Bubbles */}
        {showBubbles &&
          bubbleData.map((question, questionIndex) =>
            question.map((bubble, optionIndex) => {
              const bubbleStyle = _getBubbleStyle(
                questionIndex,
                optionIndex,
                bubbleData,
                markingScheme,
                isMarkingScheme,
                isInteractive
              );
              return (
                <AnswerSheetBubble
                  key={`${questionIndex}-${optionIndex}`}
                  bubble={bubble}
                  bubbleStyle={bubbleStyle}
                  questionIndex={questionIndex}
                  optionIndex={optionIndex}
                  isInteractive={isInteractive}
                  handleBubbleClick={handleBubbleClick}
                />
              );
            })
          )}
      </div>
    </div>
  );
};
