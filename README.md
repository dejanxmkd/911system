# 911systems — Unit Grouping Prototype

Pure HTML/CSS/JavaScript prototype for unit grouping on Dispatch.

## PERMANENT SOURCE-OF-TRUTH RULE — DO NOT OVERRIDE

**The provided 911systems frontend repository is the only UI/design-system source of truth.**

For every current and future change to this prototype:

- Use only components, patterns, states, spacing, typography, colors, borders, badges, buttons, tabs, filters, unit rows, expanded sections, action layouts, animations, and interaction conventions that already exist in the provided frontend files.
- Do not visually recreate or "interpret" a component from a screenshot when the component exists in the frontend source. Read the source component and mirror its structure and styling.
- Do not invent alternative UI, wrappers, cards, controls, layouts, colors, spacing, icons, or design-system patterns.
- Do not redesign existing components.
- New task logic may be added only on top of the existing components/patterns, with the minimum new UI required by the task.
- The dark **Unit Cards Definition** and the corresponding source files are authoritative. White screens/sketches are **flow/behavior references only** and must never be used as the visual source.
- If a screenshot and the source code differ, follow the current source code unless the user explicitly says the screenshot is the newer definition.

### Unit component sources used as authority

- `apps/cad/src/components/units/UnitListItem.tsx`
- `apps/cad/src/components/units/UnitListPanel.tsx`
- `apps/cad/src/components/units/AvailableBoard.tsx`
- `apps/cad/src/components/units/AssignedBoard.tsx`
- `apps/cad/src/components/units/UnitsTabsList.tsx`
- `apps/cad/src/components/units/BoardFilters.tsx`
- `apps/cad/src/components/units/SubStatusFilter.tsx`
- `apps/cad/src/components/units/status.ts`
- `apps/cad/src/components/units/unit-sections/status-actions/ActiveActions.tsx`
- `apps/cad/src/components/units/unit-sections/status-actions/AssignmentStepper.tsx`
- shared `@911/ui` Button / Badge / Collapsible patterns and the existing dark theme tokens

## Card behavior mirrored from `UnitListItem.tsx`

- 2px agency stripe on the left.
- Unit name + agency abbreviation + type on one line.
- Existing status badge palette from `status.ts`.
- Address / Offline secondary line.
- Chevron + collapsible expanded body.
- Existing fields layout for Call, Shift, Standby, Crew, Vehicles.
- Existing fade-divider before actions.
- Existing `ActiveActions` arrangement in Available.
- Existing `AssignmentStepper` arrangement in Assigned.
- Group collapsed summary follows the actual `UnitListItem.tsx` grouping block: `Group · N units` plus compact sub-unit rows.
- Expanded grouping follows the actual source: `Ungroup all`, then `Sub-units · controlled by [top unit]`, effective inherited status, `Follows [top unit]`, fields, and `Ungroup unit`.

## Grouping logic

- Drag one unit card onto another.
- Dropped unit becomes a sub-unit of the target/top unit.
- Sub-units inherit top-unit CFS state/status.
- Sub-units expose no normal unit actions.
- Top-unit status changes cascade to all sub-units.
- Top-unit `Ungroup all` removes every sub-unit.
- Sub-unit `Ungroup unit` removes only that unit.
- Groups remain together when a CFS closes and follow the top unit's close behavior.
- After ungrouping, the unit returns to its original behavior.
- Assignment logs include the top unit and sub-unit(s).
