#!/usr/bin/env bash
# Auto-commit and push all changes at end of day.
# Scheduled via launchd — see com.resumematch.dailypush.plist

REPO="/Users/vigyatsingh/Desktop/Resume /resumematch"
LOG="/Users/vigyatsingh/Desktop/Resume /resumematch/tasks/daily-push.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

cd "$REPO" || exit 1

# Stage everything except node_modules (covered by .gitignore)
git add -A

# Only commit if there are staged changes
if git diff --cached --quiet; then
  echo "[$DATE] nothing to commit" >> "$LOG"
  exit 0
fi

git commit -m "chore: daily snapshot $(date '+%Y-%m-%d')" \
  -m "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push origin main >> "$LOG" 2>&1
STATUS=$?

if [ $STATUS -eq 0 ]; then
  echo "[$DATE] pushed successfully" >> "$LOG"
else
  echo "[$DATE] push FAILED (exit $STATUS)" >> "$LOG"
fi
