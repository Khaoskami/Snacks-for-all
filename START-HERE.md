# Complete FNB donation release

This ZIP contains the entire application, including the FNB donation page, admin protection, recipe search repair and deployment fixes.

## Remove old files as well as replacing matching ones

Uploading files alone cannot remove old files from GitHub.

For a clean local Git replacement, extract this ZIP outside your existing clone. From the extracted project folder run:

```sh
node scripts/replace-project.mjs "/path/to/existing-git-clone"
```

The target must be the dedicated application repository, not a monorepo. Old source, settings and workflows are moved to a sibling backup. Git history and local environment files are preserved. Review any custom workflows you need to restore.

Then open the target clone, review `git status`, and commit all additions, modifications AND deletions with `git add -A`. Push to Railway's connected branch. Use `npm run build` as the Railway build command.

If using GitHub only in a browser, delete the old application files/folders before uploading the extracted contents into that same project root. Keep the existing repository and Railway service.

See README.md for the complete deployment instructions. No database schema change is required. The old donation-provider variable is unused and may be removed from Railway.
