# Release Process for OverType

## Pre-Release Checklist

### 1. Check for Temporary Files
**IMPORTANT: Do this first before any other release steps**

Run `git status` and check for uncommitted files that might be temporary:
- Test files in root directory (test-*.js, test-*.html)
- Debug files
- Temporary documentation (FINAL_*, TEMP_*, etc.)
- Personal test HTML files

If temporary files are found:
- Review each file
- Delete temporary/debug files
- Move useful tests to test/ directory
- Report back what was cleaned up

### 2. Update Version
- Update version in package.json
- Follow semantic versioning (major.minor.patch)

### 3. Update CHANGELOG.md
- Add new version section with date
- List all changes, fixes, and features
- Credit contributors if applicable

### 4. Run Tests
```bash
npm test
```
All tests must pass before proceeding.

### 5. Build Distribution Files
```bash
npm run build
```

### 6. Commit Changes
```bash
git add -A
git commit -m "Release v{version}"
```
Do NOT add co-author attribution unless specifically requested.

### 7. Create Git Tag
```bash
git tag v{version}
git push origin main --tags
```

### 8. Publish to NPM
```bash
npm publish
```

### 9. Create GitHub Release
- Go to GitHub releases page
- Create release from tag
- Copy CHANGELOG entry as release notes
- Attach dist files if needed

### 10. Post-Release
- Verify npm package is live
- Test installation in a clean project
- Update any example repos or documentation sites