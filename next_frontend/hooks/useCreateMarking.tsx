"use client";

import React, { createContext, useContext } from "react";
import { MarkingJob } from "@/app/marking-jobs/create/components/types";
import { useState } from "react";

const CreateMarkingContext = createContext<
  [MarkingJob, React.Dispatch<React.SetStateAction<MarkingJob>>] | undefined
>(undefined);

const CreateMarkingProvider = ({ children }: { children: React.ReactNode }) => {
  const [markingJob, setMarkingJob] = useState<MarkingJob>({
    id: null,
    name: null,
    description: null,
    status: null,
    priority: null,
    template_id: null,
    marking_scheme_id: null,
    marking_config_id: null,
    answer_sheets_folder_id: null,
    save_intermediate_results: null,
    total_answer_sheets: null,
    processed_answer_sheets: null,
    failed_answer_sheets: null,
    processing_started_at: null,
    processing_completed_at: null,
    error_message: null,
    error_details: null,
    results_summary: null,
    created_at: null,
    updated_at: null,
    created_by: null,
    markingSchemeFile: null,
    answerSheetsFile: null,
  });

  return (
    <CreateMarkingContext.Provider value={[markingJob, setMarkingJob]}>
      {children}
    </CreateMarkingContext.Provider>
  );
};

export const useCreateMarking = () => {
  const context = useContext(CreateMarkingContext);
  if (context === undefined) {
    throw new Error(
      "useCreateMarking must be used within a CreateMarkingProvider"
    );
  }
  return context;
};

export default CreateMarkingProvider;
