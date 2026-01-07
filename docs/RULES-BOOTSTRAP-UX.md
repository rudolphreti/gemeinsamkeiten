# Bootstrap UX Rules

- Use Bootstrap utilities first.
- Avoid custom CSS unless necessary.
- Prefer inline panels over modals.

CUD behavior:
- Create / Update / Delete operations MUST NOT:
  - scroll the page to the top,
  - trigger full re-renders,
  - refresh the page,
  - cause visual flicker or layout jumps.
- CUD must be handled smoothly with local state updates and targeted DOM changes only.
