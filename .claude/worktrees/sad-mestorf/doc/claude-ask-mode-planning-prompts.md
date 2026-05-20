# Claude Code – Ask Mode Planning Prompts

This file contains **reusable, high-signal prompts** for using **Ask mode** in Claude Code to plan app build phases efficiently without wasting usage limits.

---

## 0. Session Setup (Always First)

Use this at the start of every new Ask-mode session.

```
Read docs/plan.md.
This file is the source of truth for the app build.
Confirm once read.
```

---

## 1. Generate High-Level Build Phases

```
Based on docs/plan.md, break the build into clear phases.

For each phase:
- Name
- Goal
- Explicit IN scope
- Explicit OUT of scope
- Clear definition of “done”

Do not include implementation or code details.
```

---

## 2. Stress-Test the Phases

```
Review the proposed phases and identify:
- dependency issues
- phases that are too large or vague
- phases that should be merged or split
- hidden assumptions or risks

Be critical and direct.
```

---

## 3. Optimize Phase Order

```
Reorder the phases for fastest learning and lowest risk.

Optimize for:
- early validation
- minimal rework
- ability to pause safely between phases

Briefly explain any reordering.
```

---

## 4. Lock Phase 1 Only

```
Focus only on Phase 1.

Define:
- entry criteria
- exact deliverables
- non-goals
- risks to watch for
- clear stop-and-review point

Keep it concise.
```

---

## 5. High-Leverage Follow-Up Prompts

### MVP Scope Control
```
Which parts of this plan are overengineered for an MVP?
What can be postponed safely?
```

### Unknowns & Validation
```
What questions must be answered before Phase 2?
Which require real user data vs assumptions?
```

### Time-Boxed Reality Check
```
If I had only 2 weeks, which phases survive?
What gets cut first?
```

### Skeptical Cofounder Test
```
Argue against this plan as a skeptical technical cofounder.
Where does it fail?
```

---

## Usage Notes

- Use **Ask mode only** (read-only).
- Save valuable outputs back into markdown files.
- Start a new chat per planning phase.
- Reference files instead of re-explaining context.

The repo is the memory.
