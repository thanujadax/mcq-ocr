import * as XLSX from "xlsx";
import { Bubble, StudentResult } from "@/app/marking-jobs/types/types";
import { BubbleStyle } from "@/components/UI/AnswerSheetBubble";
import axiosInstance from "@/utils/axiosclient";

export const _convertBlobToStudentResults = async (
  blob: Blob
): Promise<StudentResult[]> => {
  try {
    // 1. Convert blob to array buffer and load workbook
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });

    // 2. Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) {
      throw new Error("No worksheet found");
    }

    // 3. Convert rows to StudentResult format
    const results: StudentResult[] = [];

    // Convert worksheet to JSON array, skipping header row
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (
      | string
      | number
      | boolean
      | undefined
    )[][];
    rows.forEach((row, rowNumber) => {
      if (rowNumber === 0) return; // Skip header (first row)
      if (row && row[1]) {
        // Check if row has data (ExcelJS uses 1-based indexing)
        const parseNumberArray = (str: string): number[] => {
          if (!str || str === "-") return [];
          return str
            .split(",")
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n));
        };

        try {
          const labeledPoints: Bubble[][] = row[9]
            ? JSON.parse(String(row[9]))
            : [];

          // Column K (row[10]) is "Resolved" on new sheets but may legacy-hold
          // "Audit File Name" on older jobs run with save_intermediate_results=true.
          // Only treat as resolved if the cell is an actual boolean — anything else
          // (string, undefined, number) defaults to unresolved.
          const isResolved =
            typeof row[10] === "boolean" ? row[10] : false;

          results.push({
            row_number: rowNumber,
            index_number: String(row[0] || ""),
            correct: String(row[1] || "")
              .split(",")
              .filter((s) => s.trim() !== "" && s.trim() !== "-")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n)),
            incorrect: String(row[2] || "")
              .split(",")
              .filter((s) => s.trim() !== "" && s.trim() !== "-")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n)),
            more_than_one_marked: String(row[3] || "")
              .split(",")
              .filter((s) => s.trim() !== "" && s.trim() !== "-")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n)),
            not_marked: String(row[4] || "")
              .split(",")
              .filter((s) => s.trim() !== "" && s.trim() !== "-")
              .map((s) => Number(s.trim()))
              .filter((n) => !isNaN(n)),
            // columnwise_total: parseNumberArray(String(row[5] || "")),
            score: Number(row[5]) || 0,
            flag: Boolean(row[6] || false),
            flag_reason: String(row[7] || ""),
            answer_sheet_path: String(row[8] || ""),
            labeled_points: labeledPoints,
            is_resolved: isResolved,
          });
        } catch (parseError) {
          console.warn(`Error parsing row ${rowNumber}:`, parseError);
        }
      }
    });

    return results;
  } catch (error) {
    console.error("Error converting blob to student results:", error);
    throw error;
  }
};

export const getMarkingSchemeBubbleData = async (markingConfigId: number) => {
  const markingSchemeConfig = await axiosInstance.get(
    `/api/files/download?method=file_id&file_id=${markingConfigId}`
  );
  const markingSchemeConfigDataJson = markingSchemeConfig.data as Record<
    string,
    any
  >;
  console.log("Marking scheme config data:", markingSchemeConfigDataJson);
  if (!markingSchemeConfigDataJson["answers_with_coordinates"]) {
    throw new Error("Missing marking scheme bubble data");
  }
  const answersWithCoordinates =
    markingSchemeConfigDataJson["answers_with_coordinates"];
  const bubbleData: Bubble[][] = [];
  const numQuestions = markingSchemeConfigDataJson["num_questions"];
  const numOptionsPerQuestion =
    markingSchemeConfigDataJson["options_per_question"];
  for (let questionIndex = 0; questionIndex < numQuestions; questionIndex++) {
    bubbleData.push([]);
    for (
      let optionIndex = 0;
      optionIndex < numOptionsPerQuestion;
      optionIndex++
    ) {
      const bubble =
        answersWithCoordinates[
          questionIndex * numOptionsPerQuestion + optionIndex
        ];
      bubbleData[questionIndex].push({
        marked: bubble[0],
        coordinates: [bubble[1][0], bubble[1][1]],
      });
    }
  }
  return bubbleData;
};

export const convertBubbleDataToMarkingSchemeConfig = (
  bubbleData: Bubble[][]
) => {
  const answersWithCoordinates: [boolean, [number, number]][] = [];

  // Flatten the 2D bubble data back to the original format
  for (
    let questionIndex = 0;
    questionIndex < bubbleData.length;
    questionIndex++
  ) {
    for (
      let optionIndex = 0;
      optionIndex < bubbleData[questionIndex].length;
      optionIndex++
    ) {
      const bubble = bubbleData[questionIndex][optionIndex];
      answersWithCoordinates.push([
        bubble.marked,
        [bubble.coordinates[0], bubble.coordinates[1]],
      ]);
    }
  }

  // Calculate metadata
  const numQuestions = bubbleData.length;
  const numOptionsPerQuestion =
    bubbleData.length > 0 ? bubbleData[0].length : 0;

  return {
    answers_with_coordinates: answersWithCoordinates,
    num_questions: numQuestions,
    options_per_question: numOptionsPerQuestion,
  };
};

export const _getBubbleStyle = (
  questionIndex: number,
  optionIndex: number,
  answers: Bubble[][],
  markingScheme: Bubble[][],
  isMarkingScheme: boolean,
  isEditing: boolean
): BubbleStyle => {
  if (isMarkingScheme) {
    // Marking scheme mode - always green with tick
    return {
      color: "green",
      icon: (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  }

  const studentAnswer = answers[questionIndex]?.[optionIndex];
  const correctAnswer = markingScheme[questionIndex]?.[optionIndex];

  if (!studentAnswer) {
    return { color: "gray", icon: null };
  }

  // Count marked answers for this question
  const markedCount =
    answers[questionIndex]?.filter((bubble) => bubble.marked).length || 0;

  if (markedCount > 1) {
    // Multiple answers marked - amber with warning icon
    return {
      color: "amber",
      icon: (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  }

  if (studentAnswer.marked && correctAnswer?.marked) {
    // Correct answer - green with tick
    return {
      color: "green",
      icon: (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  }

  if (studentAnswer.marked && !correctAnswer?.marked) {
    // Wrong answer - red with X icon
    return {
      color: "red",
      icon: (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  }

  // Handle unmarked questions - show all options as blue when no answer is marked
  if (markedCount === 0) {
    return {
      color: "blue",
      icon: null,
    };
  }

  // Not marked or correct but not selected - default case
  return { color: isEditing ? "green" : "transparent", icon: null };
};

export const _updateCounts = (
  newResult: StudentResult,
  questionIndex: number,
  markingSchemeRow: Bubble[]
): StudentResult => {
  newResult.correct = newResult.correct.filter(
    (index) => index !== questionIndex + 1
  );
  newResult.incorrect = newResult.incorrect.filter(
    (index) => index !== questionIndex + 1
  );
  newResult.more_than_one_marked = newResult.more_than_one_marked.filter(
    (index) => index !== questionIndex + 1
  );
  newResult.not_marked = newResult.not_marked.filter(
    (index) => String(index) !== String(questionIndex + 1)
  );

  const markedCount =
    newResult.labeled_points?.[questionIndex]?.filter((bubble) => bubble.marked)
      .length || 0;
  switch (markedCount) {
    case 0:
      newResult.not_marked.push(questionIndex + 1);
      newResult.not_marked.sort((a, b) => Number(a) - Number(b));
      break;
    case 1:
      const markedIndex = newResult.labeled_points?.[questionIndex]?.findIndex(
        (bubble: Bubble) => bubble.marked
      );
      if (markingSchemeRow[markedIndex!].marked) {
        newResult.correct.push(questionIndex + 1);
        newResult.correct.sort((a, b) => Number(a) - Number(b));
      } else {
        newResult.incorrect.push(questionIndex + 1);
        newResult.incorrect.sort((a, b) => Number(a) - Number(b));
      }
      break;
    default:
      newResult.more_than_one_marked.push(questionIndex + 1);
      newResult.more_than_one_marked.sort((a, b) => Number(a) - Number(b));
      break;
  }
  newResult.score = newResult.correct.length;
  return newResult;
};
