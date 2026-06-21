from app.models.marking_job import MarkingJob


def autograde(data: dict):
  marking_job = MarkingJob( data, save_intermediate_results=False)
  marking_job.mark_answers()
  return marking_job


def autograde_with_intermediate_results(data: dict):
  marking_job = MarkingJob(data, save_intermediate_results=True)
  marking_job.mark_answers()
  return marking_job
