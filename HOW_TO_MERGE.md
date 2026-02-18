# How to Merge Calendar Export Feature to Main Branch

## Quick Summary

Your Calendar Export feature is ready on the `claude/fervent-mcclintock` branch and needs to be merged into the `main` branch. Here are all the methods to do it:

---

## Method 1: Using GitHub Web Interface (Easiest) ⭐

### Steps:

1. **Open GitHub in your browser**
   - Go to: https://github.com/icy-hippo/custody-scheduler

2. **Go to the Pull Requests tab**
   - Click "Pull requests" at the top

3. **Create a new Pull Request**
   - Click "New pull request" button
   - Select base: `main`
   - Select compare: `claude/fervent-mcclintock`

4. **Review the PR**
   - Title: "Add Calendar Export Feature - iCal Format Support"
   - Description: Copy from `PR_SUMMARY.md`
   - Verify all 12 files are shown

5. **Merge the PR**
   - Click "Create pull request"
   - Review the changes
   - Click "Merge pull request" button
   - Confirm the merge

6. **Delete the branch (optional)**
   - GitHub will offer to delete the branch
   - Click "Delete branch" to clean up

### That's it! 🎉

---

## Method 2: Using Command Line (Advanced)

### Option A: Merge via Command Line

```bash
# Navigate to your main repository
cd "C:\Users\rcban\custody scheduler\custody-scheduler"

# Make sure main is up to date
git checkout main
git pull origin main

# Merge the feature branch
git merge claude/fervent-mcclintock

# Push the merged code back to GitHub
git push origin main

# Delete the feature branch (optional)
git branch -d claude/fervent-mcclintock
git push origin --delete claude/fervent-mcclintock
```

### Option B: Create PR then merge via Command Line

```bash
# 1. Create the PR on GitHub (see Method 1)

# 2. Once PR is created and approved, merge via CLI:
cd "C:\Users\rcban\custody scheduler\custody-scheduler"

# Fetch latest from GitHub
git fetch origin

# Switch to main and pull latest
git checkout main
git pull origin main

# Merge the branch
git merge --no-ff origin/claude/fervent-mcclintock

# Push to GitHub
git push origin main

# Delete the branch
git branch -d claude/fervent-mcclintock
git push origin --delete claude/fervent-mcclintock
```

---

## Method 3: Using Git GUI Tools

If you have GitHub Desktop or another Git GUI installed:

### GitHub Desktop:
1. Open GitHub Desktop
2. Go to "Branch" menu → "New Branch"
3. Select "Publish branch" to sync with GitHub
4. In GitHub web interface, create PR and merge

### Visual Studio Code:
1. Open VSCode
2. Click Source Control icon (left sidebar)
3. Under "Branches", select `claude/fervent-mcclintock`
4. Right-click → "Merge Branch" and select `main`
5. Publish changes

### TortoiseGit:
1. Right-click folder
2. TortoiseGit → Merge
3. Select `claude/fervent-mcclintock` as the branch to merge
4. Commit and push

---

## Step-by-Step: Complete Process

### Step 1: Verify Your Changes Are Ready

```bash
cd "C:\Users\rcban\custody scheduler\custody-scheduler\.claude\worktrees\fervent-mcclintock"
git log --oneline -1
# Should show: ea76f2b Add Calendar Export feature...
```

### Step 2: View What Will Be Merged

```bash
# See all files that will be merged
git diff main...claude/fervent-mcclintock --name-only

# See detailed changes
git diff main...claude/fervent-mcclintock
```

### Step 3: Create Pull Request on GitHub

**Via Web Browser (Recommended):**
1. Go to: https://github.com/icy-hippo/custody-scheduler/pull/new/claude/fervent-mcclintock
2. GitHub will pre-fill the branch comparison
3. Add PR details:
   - **Title**: Add Calendar Export Feature - iCal Format Support
   - **Description**: Use text from PR_SUMMARY.md
4. Click "Create pull request"

### Step 4: Review the PR

- GitHub will show:
  - Number of files changed (12)
  - Number of additions (3200+)
  - Number of deletions (0 to minimal)
  - All files added/modified

### Step 5: Merge the PR

**Option A: Simple Merge (Recommended)**
```
Click "Merge pull request" → "Confirm merge"
```

**Option B: Squash and Merge** (combines all commits into one)
```
Click dropdown → "Squash and merge" → "Confirm merge"
```

**Option C: Rebase and Merge** (keeps commit history clean)
```
Click dropdown → "Rebase and merge" → "Confirm merge"
```

### Step 6: Update Local Repository

After merging on GitHub, update your local main branch:

```bash
cd "C:\Users\rcban\custody scheduler\custody-scheduler"
git checkout main
git pull origin main
```

### Step 7: Verify Merge

```bash
# Check that files are now on main
git log --oneline -5

# Should see your Calendar Export commit
# And previous commits before it
```

---

## Understanding the Files

### What's Being Merged

```
New Files:
├── src/components/CalendarExport.js (NEW)
├── src/services/CalendarExportService.js (NEW)
├── CALENDAR_EXPORT_*.md (documentation files)
├── README_CALENDAR_EXPORT.md
├── CALENDAR_EXPORT_INDEX.md
├── PR_SUMMARY.md
└── HOW_TO_MERGE.md

Modified Files:
└── src/pages/ParentDashboard.js (+2 lines)

Total: 12+ files, ~3200 lines added, 0 breaking changes
```

### Size of Changes

- **Code**: ~430 lines (service + component)
- **Documentation**: ~1500+ lines
- **Dependencies Added**: 0
- **Breaking Changes**: 0

---

## Troubleshooting Common Issues

### Issue: "Can't merge - conflicts detected"

**Solution:**
Conflicts are unlikely since we only modified ParentDashboard.js slightly. If they occur:

```bash
# Start the merge
git merge origin/claude/fervent-mcclintock

# If conflicts, resolve them in the files
# Then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Issue: "Branch is behind main"

**Solution:**
Rebase the feature branch on latest main:

```bash
git checkout claude/fervent-mcclintock
git rebase origin/main
git push -f origin claude/fervent-mcclintock
```

### Issue: "Permission denied" or "Can't push"

**Solution:**
Make sure you're authenticated:

```bash
# Check your Git credentials
git config user.name
git config user.email

# If needed, authenticate with GitHub
# For Windows, use: git config --global credential.helper wincred
```

### Issue: "Where's my commit?"

**Solution:**
Check which branch you're on:

```bash
git branch -a  # List all branches
git log --oneline -5  # Show recent commits

# Make sure you're on main after merging
git checkout main
git log --oneline -5
```

---

## Recommended Merge Strategy

### Best Practice: Use GitHub Web Interface with PR Review

**Why?**
- Easy to review changes
- Creates a record in GitHub
- Safe merging with conflict detection
- Professional workflow

**Steps:**
1. Go to: https://github.com/icy-hippo/custody-scheduler/pulls
2. Click "New pull request"
3. Set: base=main, compare=claude/fervent-mcclintock
4. Add PR description from PR_SUMMARY.md
5. Click "Create pull request"
6. Review the "Files changed" tab
7. Click "Merge pull request"
8. Confirm merge

---

## After Merging

### 1. Verify the Merge

```bash
git checkout main
git pull origin main
git log --oneline -5
# Should show the Calendar Export commit
```

### 2. Verify Files are Present

```bash
# Check if new files exist on main
ls src/services/CalendarExportService.js
ls src/components/CalendarExport.js
ls README_CALENDAR_EXPORT.md
```

### 3. Run Tests (if applicable)

```bash
npm install
npm start
# Test the export feature in the browser
```

### 4. Update Documentation (optional)

If you have a CHANGELOG, add:
```
## [Version X.X.X] - 2026-02-17

### Added
- Calendar Export feature
  - Export events to iCal format
  - Export custody schedules
  - Support for Google Calendar, Apple Calendar, Outlook, etc.
  - Complete user and developer documentation
```

### 5. Tag Release (optional)

```bash
git tag -a v1.1.0 -m "Add Calendar Export feature"
git push origin v1.1.0
```

---

## Quick Reference

### View Merged Changes
```bash
git log main..claude/fervent-mcclintock --oneline
```

### View All Changed Files
```bash
git diff --name-only main...claude/fervent-mcclintock
```

### See Detailed Diff
```bash
git diff main...claude/fervent-mcclintock
```

### Create PR from Command Line (if gh CLI installed)
```bash
gh pr create --base main --head claude/fervent-mcclintock \
  --title "Add Calendar Export Feature" \
  --body "$(cat PR_SUMMARY.md)"
```

---

## Summary

| Method | Time | Difficulty | Recommended |
|--------|------|------------|-------------|
| GitHub Web UI | 5 min | Easy | ✅ YES |
| Command Line | 5 min | Medium | Yes |
| Git GUI Tool | 5 min | Easy | If preferred |

**Recommendation: Use GitHub Web Interface (Method 1) - it's the safest and easiest!**

---

## Need More Help?

### Understanding Git Branches
- https://guides.github.com/features/mastering-markdown/
- https://git-scm.com/book/en/v2/Git-Branching-Branch-Management

### GitHub PR Documentation
- https://docs.github.com/en/pull-requests/collaborating-with-pull-requests

### Git Merge Strategies
- https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging

---

## You're All Set! 🎉

Your Calendar Export feature is ready to merge. Choose the method that works best for you and follow the steps above. If you have any questions, refer back to this guide!

**Main Steps:**
1. Go to GitHub
2. Create a Pull Request from `claude/fervent-mcclintock` to `main`
3. Review and merge
4. Done! 🚀
