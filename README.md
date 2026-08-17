# 911systems — Unit Grouping Prototype

Pure HTML/CSS/vanilla-JavaScript prototype for the new Unit grouping behavior.

## HARD RULE — existing product UI is the source of truth

**For every current and future change in this prototype, use only components, layouts, spacing, typography, colors, borders, badges, tabs, filters, fields, buttons, action surfaces and interaction patterns that already exist in the provided 911systems frontend. Do not redesign them, restyle them, invent replacements, or introduce a new visual pattern unless the task explicitly requires a genuinely new component.**

The dark **Unit Cards Definition** and the implementation in the provided frontend are authoritative. White sketches / Figma flow screens are **logic and animation references only**. They must never be used as the visual source.

### Source files to follow

- `apps/cad/src/components/units/UnitListItem.tsx` — authoritative Unit card/row structure.
- `apps/cad/src/components/units/UnitListPanel.tsx`
- `apps/cad/src/components/units/AvailableBoard.tsx`
- `apps/cad/src/components/units/AssignedBoard.tsx`
- `apps/cad/src/components/units/UnitsTabsList.tsx`
- `apps/cad/src/components/ui/lifted-tabs.tsx`
- `apps/cad/src/components/units/BoardFilters.tsx`
- `apps/cad/src/components/units/SubStatusFilter.tsx`
- `apps/cad/src/components/units/status.ts` — status labels and badge palette.
- `apps/cad/src/constants/unit.ts` — agency stripe and selected-row gradient colors.
- `apps/cad/src/components/units/unit-sections/status-actions/ActiveActions.tsx`
- `apps/cad/src/components/units/unit-sections/status-actions/AssignmentStepper.tsx`
- `apps/cad/src/index.css` — theme tokens.

Because the prototype deliverable is intentionally pure HTML/CSS/JS, React components are translated to static DOM, but their visual hierarchy and behavior must remain equivalent to the source components.

## What is new in this prototype

Only the Unit-grouping behavior is new:

- Drag one existing Unit card onto another Unit card.
- The dragged Unit becomes a sub-unit of the target/top Unit.
- The top Unit controls the group's assignment and status.
- Sub-units follow the top Unit's status and CFS movement.
- Sub-units retain the existing Unit-card visual pattern but expose only `Ungroup` as an action.
- `Ungroup` on a sub-unit removes only that Unit.
- `Ungroup` on the top Unit removes all sub-units.
- Grouping works in both Available and Assigned.
- The same grouping logic is intended for CFS Details and Map View; the Unit UI itself does not change between those contexts.
- Assignment logs are emitted in the prototype console, including the required wording, e.g. `1001 – Police Car with sub-unit 1002 – Fire Truck was assigned to CFS2507027`.
- While grouped, CFS completion/closure moves the group with the top Unit. After ungrouping, each Unit returns to its own configured behavior; `1002 – Fire Truck` returns to Standby.

## Do not add prototype chrome

Do not add fake CFS pages, fake maps, demo headers, explanatory panels, standalone logs panels, or other surrounding UI just to demonstrate the feature. The prototype should show the existing Unit surface and the requested behavior only.
