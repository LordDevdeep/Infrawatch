# Contributing to INFRAWATCH

Thanks for considering contributing! INFRAWATCH is open-source civic-tech and we welcome PRs that help cities respond to urban safety crises faster.

## Quick contribution flow

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/short-description`
3. Make your changes (small, focused PRs win)
4. Test locally with `npm run dev`
5. Commit with a clear message: `feat: add multi-language notice translation`
6. Push and open a PR against `main`

## What we love receiving

- 🔌 **New city integrations** — adapt the schema and seed for Mumbai, Delhi, Chennai
- 🌍 **Real satellite data sources** — ISRO Bhuvan, Sentinel-2, Planet Labs adapters
- 🤖 **AI model adapters** — alternative vision models (Vertex AI, OpenAI, Claude)
- 📱 **Accessibility improvements** — keyboard nav, screen reader support, RTL
- 🌐 **Translations** — Kannada, Hindi, Tamil, Bengali, Marathi
- 🐛 **Bug fixes** with reproducer steps
- 📚 **Documentation** — architecture deep-dives, deployment guides

## What we'll politely decline

- ❌ Major rewrites without prior discussion (open an issue first)
- ❌ Dependency-heavy changes that bloat install size
- ❌ Removal of the demo data / seeded hotspots (essential for hackathon demos)

## Code style

- Use existing patterns — match the surrounding code's indentation, quoting, and naming
- No new dependencies without justification in the PR description
- Keep components under ~300 lines where possible
- Server routes should always validate input and use `requireRole` where appropriate
- Favor parameterized queries — never string-concat user input into SQL

## Reporting security issues

Found a security vulnerability? **Please don't open a public issue.** Email the maintainers privately or use GitHub's private vulnerability reporting feature.

## Code of conduct

Be kind. Assume good faith. Build for the people who'll be safer because of this work.

---

License: MIT — by submitting a contribution, you agree your work will be licensed under MIT as well.
