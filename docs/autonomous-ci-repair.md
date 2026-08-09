# Autonomous Codex CI repair

The `Autonomous Codex CI repair` workflow watches completed runs of `Validate, QA, and deploy Pages`. When a pull-request run fails, it retrieves the failed jobs, log excerpt, and artifact inventory, asks the official `openai/codex-action` for a minimal repair, validates the patch in a credential-free job, and pushes it to the same PR branch. That push starts the normal PR validation again.

## One-time setup

1. Add the Actions secret `OPENAI_API_KEY` with an OpenAI API key allowed to use Codex.
2. Create and install a GitHub App on **this repository only**. Grant it repository **Contents: read and write** and **Metadata: read**; do not grant pull-request merge or administration permissions.
3. Add the App ID as the Actions repository variable `CODEX_REPAIR_APP_ID`.
4. Add the App private key as the Actions secret `CODEX_REPAIR_APP_PRIVATE_KEY`.
5. Allow Actions to read repository contents and create PR labels/comments. The workflow declares its own least-privilege job permissions, so the repository's default workflow token can remain read-only.

The App token is needed because pushes made with the workflow `GITHUB_TOKEN` do not trigger a new workflow run. The App installation token is short-lived, scoped to this repository, used only by the final push job, and has no merge permission.

If any credential is missing, the workflow fails closed before counting or attempting a repair and reports the missing configuration in its job summary/log.

## Limits and trust boundary

Repairs run only for an open, same-repository PR whose branch is `codex/**`, whose PR author and failed-run actor both have write access, and whose current head SHA is exactly the SHA that failed. Forks, stale runs, non-PR runs, non-Codex branches, and ambiguous PR associations are rejected.

Visible labels record durable PR-scoped attempts: `codex-repair-1`, `codex-repair-2`, and `codex-repair-3`. Authoritative success clears the attempt label. A failure after the third repair adds `codex-repair-exhausted` and one comment with the last failed run, failed jobs, and final log excerpt. That label means human intervention is required. A missing or protected Codex patch also stops and posts a human-review comment rather than bypassing the guard. Per-PR concurrency and a second head-SHA check prevent concurrent or stale pushes.

Codex never receives a GitHub write token. The API key is handled by the official action's proxy, and PR-controlled validation runs later in a separate job with no secrets. `.github/**`, `tests/**`, `package.json`, and `package-lock.json` are protected from autonomous changes. Logs and repository contents are explicitly treated as untrusted data.

## Disable or reset

Disable the `Autonomous Codex CI repair` workflow in the repository Actions settings (or remove its secrets) to stop autonomous repair. After a human resolves an exhausted sequence, remove all `codex-repair-*` labels to allow a future failure to begin a new three-attempt sequence.
