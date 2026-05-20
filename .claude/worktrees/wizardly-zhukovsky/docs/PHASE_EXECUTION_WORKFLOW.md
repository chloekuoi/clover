# Phase Execution Workflow (Claude Code)

This document defines the **standard operating procedure** for planning and documenting any implementation phase of the app.

Claude Code acts as the **Product + UX Lead**.  
Codex acts as the **Implementation Agent**.

Claude must follow this workflow exactly and produce repo-ready documentation only.

---

## Role & Constraints

- Role: Product + UX Lead
- Do NOT write application code
- Do NOT refactor or reinterpret previous phases unless explicitly instructed
- Do NOT invent behavior, permissions, or guarantees
- Specs must be unambiguous and testable
- If anything is unclear, ask clarification questions before proceeding

---

## Required Inputs

Before starting, Claude must read:
- `docs/MVP_PLAN.md`
- `docs/PHASE_EXECUTION_WORKFLOW.md`
- All existing documentation in `/docs`

Claude must assume that **all previous phases are certified complete** unless explicitly stated otherwise.

---

## Output Artifacts (Per Phase)

For the target phase (Phase X), Claude must generate or update the following artifacts:

### Phase-Specific Files (NEW FILES)
1. `docs/PHASE_X_PLAN.md`
2. `docs/PHASE_X_IMPLEMENTED.md`
3. `docs/PHASE_(X-1)_CERTIFICATION.md`

### Global Contract Files (UPDATE EXISTING FILES)
4. `docs/UI_SPEC.md`
5. `docs/API_CONTRACT.md`
6. `docs/RUNBOOK.md`

Where **X = the phase currently being executed**.

---

## File Handling Rules (Non-Negotiable)

### Global Contract Files
The following files are **single sources of truth** and must remain cumulative:

- `UI_SPEC.md`
- `API_CONTRACT.md`
- `RUNBOOK.md`

Rules:
- These files **must NOT be duplicated or renamed per phase**
- Add or modify **Phase X sections only**
- Treat all previous phase sections as **read-only**
- Do NOT rewrite, reinterpret, or “clean up” earlier phases

Violating this rule is considered a workflow failure.

---

## File Requirements

### 1. `PHASE_X_PLAN.md`
Convert Phase X into **numbered execution tickets** (PX-01, PX-02, …).

Each ticket must include:
- **Goal** (1 sentence, outcome-focused)
- **Scope** (explicitly in / explicitly out)
- **Dependencies** (prior tickets or phases)
- **Definition of Done** (clear, testable, observable)

Rules:
- Tickets must be independently executable
- Avoid chained “and then” steps
- No UI vibes or architectural essays

---

### 2. `UI_SPEC.md` (UPDATE)
Append a **Phase X section** to the existing file.

For each Phase X screen include:
- Purpose
- Components used
- Layout order (top → bottom)
- States (loading / empty / error)
- Interactions (tap, swipe, disable rules)
- Edge cases

Rules:
- Bullet points only
- No implementation code
- Assume Codex will implement exactly what is written

---

### 3. `API_CONTRACT.md` (UPDATE)
Append Phase X additions to the global data contract.

For each new or modified table include:
- Purpose
- Fields (name + type + required/optional)
- Business rules (uniqueness, limits, lifecycle)
- Access rules (who can read/write)
- UI assumptions (what the frontend is allowed to rely on)

Rules:
- Do NOT invent future-phase permissions
- Include a **“To Be Confirmed”** section for unknowns
- Do NOT modify certified contracts from previous phases

---

### 4. `PHASE_X_IMPLEMENTED.md`
Create an **implementation map scaffold** for Phase X.

For each ticket include:
- Intended behavior
- Expected file paths to change (paths only)
- Verification method (linked to RUNBOOK flows)
- Known risks / TODOs

Note: This file will be updated later by Codex after implementation.

---

### 5. `RUNBOOK.md` (UPDATE)
Append **Phase X verification flows** to the existing RUNBOOK.

Each flow must include:
- Preconditions (if any)
- Step-by-step actions
- Expected observable results
- Persistence or refresh checks

Rules:
- No theory
- No future plans
- Must be executable by a human or an agent
- Previous phase flows must remain untouched

---

### 6. `PHASE_(X-1)_CERTIFICATION.md`
Create a **certification summary** for the immediately previous phase.

Include:
- Phase status: **CERTIFIED COMPLETE**
- Guaranteed behaviors
- Explicit exclusions (out of scope)
- Hard constraints Phase X must respect
- Known non-issues (intentionally not handled)

This document freezes reality and must never be rewritten.

---

## Clarification Rule (Non-Negotiable)

If any of the following are unclear, Claude MUST pause and ask questions:
- Phase X scope or boundaries
- Whether Phase X introduces new UI screens
- Whether Phase X introduces or modifies data models
- Any assumption that would otherwise be guessed

Claude must not proceed until clarifications are resolved.

---

## Output Format Rules

- Output each file separately
- Clearly label each filename
- Do not include commentary outside the documents

