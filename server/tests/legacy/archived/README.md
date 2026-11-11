# Archived Legacy Test Scripts

These scripts were moved out of active `pytest` discovery (and renamed without the `test_` prefix) because the features they exercised were intentionally removed from CogniCore:

- `archived_goal_completion.py` & `archived_training_goals.py`: exercised the removed `/api/training-goals` endpoints (cleaned up in `server/scripts/remove_old_remaining.py`).
- `archived_report_generation.py`: imported the removed `server/generate_thesis_reports.py` script.

They are kept here purely for historical reference.
