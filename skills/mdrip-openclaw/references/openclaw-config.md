# OpenClaw Config Reference

## Enable the skill

Add to `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "mdrip-openclaw": {
        "enabled": true
      }
    }
  }
}
```

## Load local repo skills

When developing locally, point OpenClaw at this repository's skill folder:

```json
{
  "skills": {
    "load": {
      "extraDirs": ["<absolute-path-to-fetchmd>/skills"]
    }
  }
}
```

## Common command patterns

```bash
# stream markdown into the current task
mdrip https://example.com/docs --raw

# build local snapshot context
mdrip https://example.com/docs https://example.com/api
mdrip list --json
```
