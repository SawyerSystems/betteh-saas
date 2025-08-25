You are a senior full-stack engineer. Implement recurring, multi-day event creation and series management in the Schedule tab. Our calendar already blocks booking availability from events—preserve that behavior for all instances created by these rules.

Scope
	•	Add recurrence options to the event modal: None, Daily, Weekly, Bi-Weekly, Monthly, Yearly.
	•	Support start date and end date (or “no end / forever”) for recurring series.
	•	Support multi-day events inside a series (e.g., each instance spans Fri–Sun).
	•	Support all-day and timed events.
	•	Support timezone-aware scheduling and DST correctness.
	•	Support exception handling (skip or modify single instances).
	•	Support series delete options:
	1.	Only this event
	2.	This and following
	3.	All in series

Data model (adjust if schema differs)
	•	events (master/series rows and single events)
	•	id (uuid)
	•	title, notes, location
	•	is_all_day boolean
	•	start_at (tz aware) – series anchor
	•	end_at (tz aware)
	•	recurrence_rule (string, RFC 5545 RRULE or JSON equivalent)
	•	recurrence_end_at (nullable UNTIL)
	•	recurrence_exceptions (jsonb: array of ISO dates/times excluded)
	•	parent_event_id (nullable; for modified overrides that replace one instance)
	•	series_id (uuid for grouping; equals id for master row)
	•	created_by, updated_by, timestamps
	•	Do not expand/store all instances up front; generate occurrences on the fly for views and conflict checks. Persist overrides as needed.

Recurrence semantics (RRULE-like)
	•	Translate UI selections to RRULE fields:
	•	Daily → FREQ=DAILY;INTERVAL=1
	•	Weekly → FREQ=WEEKLY;INTERVAL=1;BYDAY=[checked weekdays] (default to start day)
	•	Bi-Weekly → FREQ=WEEKLY;INTERVAL=2;BYDAY=[…]
	•	Monthly → two modes: by date (e.g., 15th) or by weekday position (e.g., 3rd Tue) → BYMONTHDAY or BYDAY;BYSETPOS
	•	Yearly → FREQ=YEARLY;BYMONTH=[start month];BYMONTHDAY=[start day] (or weekday position equivalent)
	•	End conditions:
	•	Until date → UNTIL=<end_of_day in UTC> (inclusive)
	•	Forever → no UNTIL
	•	Optionally support COUNT if exposed later.
	•	Multi-day in a series: duration is end_at - start_at. Each generated instance keeps that duration.

UI/UX (modal)
	•	Divider: Repeat toggle → reveals recurrence controls.
	•	Controls:
	•	Frequency select (None/Daily/Weekly/Bi-Weekly/Monthly/Yearly)
	•	For Weekly: weekday checkboxes default to start date’s weekday
	•	For Monthly: radio (By date vs By weekday position)
	•	Starts: date & time
	•	Ends: On date (picker) or Never
	•	For multi-day: End date/time field (can be > start date)
	•	Summary chip under controls: “Repeats Weekly on Mon, Wed until Oct 31, 2025 • All-day • 3-day span”
	•	Validation:
	•	End must be after start
	•	For all-day: normalize to local midnight start/end boundaries
	•	Warn on very long “forever” series

Instance rendering
	•	Calendar views generate visible instances from the series master using RRULE (+ respect recurrence_exceptions and overrides).
	•	Each instance shows as a single pill spanning its days (for multi-day).
	•	Clicking an instance opens the instance actions (see Series Editing).

Series editing & deletes
	•	When opening an instance from a series, show options:
	•	Edit only this event → create an override row with parent_event_id = series_id and the new start_at/end_at/title/...; store the original instance datetime in recurrence_exceptions to suppress the generated one.
	•	Edit this and following → split the series:
	•	Adjust current series with recurrence_end_at = instance_start - epsilon
	•	Create a new series starting at the selected instance’s start with the new rule/fields
	•	Edit entire series → modify master rule/fields; keep existing overrides intact
	•	Delete flow:
	•	Only this event → add this instance’s start to recurrence_exceptions or delete its override row
	•	This and following → set recurrence_end_at = instance_start - epsilon and delete any overrides after that point
	•	All events in series → soft delete master + all overrides

Availability blocking
	•	Treat every resolved instance (generated + overrides) as a blocking interval for bookings.
	•	Conflict check: before saving, compute instances in the visible/affected range and ensure no overlap with existing bookings or events; if overlap, show conflict toast with quick links to conflicting items.

Performance
	•	For list/month/week/day views, window generation: only expand instances for the queried date range ± small buffer.
	•	Cache instance lists per series+range for the session.

Timezone & DST
	•	Store timestamps in UTC with the series’ local timezone id recorded; generate instances in local tz, then convert to UTC for persistence.
	•	Ensure DST rollovers keep wall-clock times consistent (e.g., 4:00 PM local stays 4:00 PM).

Edge cases
	•	End date inclusive vs exclusive: treat UNTIL as inclusive of the last instance’s start, not end; still keep duration for multi-day.
	•	Monthly “31st” on short months → roll to last day or skip (add a UI choice; default roll to last day).
	•	Weekly with multiple weekdays & multi-day duration → allow overlapping spans but warn if they self-overlap.

QA checklist
	•	Create Daily/Weekly/Monthly/Yearly with/without end date; verify counts in range.
	•	Create 3-day series instances; verify each blocks availability across all days.
	•	Perform Edit only this / this and following / entire series and validate results.
	•	Delete with each option and confirm calendar + booking rules update.
	•	DST transition weeks for timed and all-day events.
	•	Performance in month view with dozens of series.