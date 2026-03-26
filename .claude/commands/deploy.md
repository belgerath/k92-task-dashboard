Deploy the K92 Task Dashboard to GitHub Pages.

IMPORTANT: This is the ONLY way to deploy. Never deploy without following ALL steps in order.

## Steps (execute in order, do not skip any):

### 1. Run validation tests
```
cd "C:/Users/ccook/K92TaskDashboard/K92 Task Dashboard" && node tests/tiles-zones.test.js
```
If any test fails, STOP. Fix the issue before continuing.

### 2. Commit source to main
Stage and commit ALL changed source files (src/, tests/) to the `main` branch. Use a descriptive commit message. This ensures source is NEVER lost.
```
git add src/ tests/
git commit -m "<descriptive message>"
```
If there are no changes to commit, that's fine — proceed to step 3.

### 3. Build (MUST be on main branch)
```
rm -rf dist && npm install && npm run build
```
Build MUST succeed before deploying. Always clean dist first.

### 4. Copy built files to temp BEFORE switching branches
CRITICAL: The gh-pages branch has its own stale dist/ folder. If you `cp dist/*` after checking out gh-pages, you get the WRONG files.
```
cp dist/taskpane.html /tmp/k92_taskpane.html
cp dist/taskpane.js /tmp/k92_taskpane.js
cp dist/polyfill.js /tmp/k92_polyfill.js
cp dist/commands.html /tmp/k92_commands.html
cp dist/commands.js /tmp/k92_commands.js
cp dist/manifest.xml /tmp/k92_manifest.xml
```

### 5. Deploy to gh-pages
```
rm -f commands.html commands.js polyfill.js
git checkout gh-pages
cp /tmp/k92_taskpane.html taskpane.html
cp /tmp/k92_taskpane.js taskpane.js
cp /tmp/k92_polyfill.js polyfill.js
cp /tmp/k92_commands.html commands.html
cp /tmp/k92_commands.js commands.js
cp /tmp/k92_manifest.xml manifest.xml
git add taskpane.html taskpane.js polyfill.js commands.html commands.js manifest.xml
git commit -m "Deploy from main <commit-hash>"
git push origin gh-pages
git checkout main
```

### 6. Verify
Confirm you are back on `main` branch and source files are intact:
```
git status
git log --oneline -1
```

## NEVER DO:
- Never use `git stash` during deploy — this caused repeated data loss
- Never deploy without committing source to main first
- Never skip the validation tests
- Never `cp dist/*` AFTER checking out gh-pages — the gh-pages branch has its own stale dist/ that overwrites your build
- Always copy to /tmp/ BEFORE switching branches
