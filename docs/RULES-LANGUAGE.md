# Language Rules

UI (user-facing):
- All UI text MUST be in German (prefer Austrian German).
- No gender suffixes/symbols (":", "*", "_").
- Avoid the word "dies" in UI copy; use natural Austrian alternatives.

Code (developer-facing):
- Identifiers (files, variables, functions): English.
- Comments: English.
- User-visible errors: German.
- Developer logs: English ok, avoid noisy spam.

Internationalization rule:
- No hard-coded German strings inside business logic.
- Define UI strings in a dedicated module and import them.
