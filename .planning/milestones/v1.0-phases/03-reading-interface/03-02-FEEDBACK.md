# 03-02 Feedback - Issues Found

## Transcript List Page (03-01 issues, but fix now)

1. **Text color broken** - Title/content text appears too light gray, hard to read
2. **All dates show "Date unknown"** - Date formatting not working, should show actual dates
3. **Sort by date** - Need visual indicator or toggle for sort order
4. **Filters/Tags not visible** - Topic tag filter buttons not appearing
5. **Search UX** - Consider showing results in dropdown without requiring click (nice-to-have)

## Transcript Reader Page (03-02 issues)

1. **Text color broken** - Same issue, text too light
2. **Timestamps not showing** - Left gutter appears empty even when timestamps should exist
3. **Gutter showing when no timestamps** - Unnecessary left padding when there are no timestamps
4. **Speaker label shows both names concatenated** - "Terence McKennaRalph Abraham" instead of separate labels. The `shouldShowSpeaker` logic or data may be wrong

## Priority Fixes

1. Text color (affects both pages)
2. Date formatting (list page)
3. Speaker label parsing (reader page)
4. Timestamp display / gutter logic (reader page)
5. Tag filters visibility (list page)

## Resume Instructions

After /clear, run `/gsd:execute-phase 3` - it will see 03-01 has SUMMARY but 03-02 doesn't. Read this feedback file and fix issues before completing 03-02.
