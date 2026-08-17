# 911systems — Unit Grouping Prototype

Pure HTML/CSS/JavaScript prototype for the new Unit grouping behavior on Dispatch.

## Non-negotiable component rule

**Always use only the components and UI patterns that already exist in the provided 911systems frontend. Do not redesign, restyle, replace, wrap, or invent alternative Unit components unless the task explicitly requires a new component.**

The source of truth is the dark/new Unit UI in the provided frontend. The white Figma screens/sketches are used only to understand grouping flow and animation; they are never a visual source.

## Source components used as the design-system reference

The static prototype is a direct HTML/CSS/JS translation of the structure and behavior in these existing source files:

- `apps/cad/src/components/units/UnitListItem.tsx`
- `apps/cad/src/components/units/UnitListPanel.tsx`
- `apps/cad/src/components/units/AvailableBoard.tsx`
- `apps/cad/src/components/units/AssignedBoard.tsx`
- `apps/cad/src/components/units/UnitsTabsList.tsx`
- `apps/cad/src/components/units/BoardFilters.tsx`
- `apps/cad/src/components/units/SubStatusFilter.tsx`
- `apps/cad/src/components/units/status.ts`
- `apps/cad/src/components/units/unit-drag-image.ts`
- `apps/cad/src/components/units/unit-sections/status-actions/ActiveActions.tsx`
- `apps/cad/src/components/units/unit-sections/status-actions/AssignmentStepper.tsx`
- `apps/cad/src/routes/_authenticated/cfs/_dispatch/$cfsId/units.tsx`
- `apps/cad/src/index.css` for the actual dark theme tokens.

Because this deliverable must stay pure HTML/CSS/vanilla JS, React/Radix components are not imported at runtime. Their DOM hierarchy, spacing, tabs, badges, filters, expanded fields, action surfaces, status stepper, theme values, and drag behavior are translated directly into the static prototype.

## Grouping behavior implemented

- Works in both CFS details and Map view contexts.
- Available and Assigned use the existing lifted tabs pattern.
- Drag one Unit row onto another Unit row to group it.
- The dragged Unit becomes a sub-unit of the target/top Unit.
- A sub-unit inherits the top Unit's assignment, tab, address, and status.
- Status changes on the top Unit cascade to every sub-unit.
- Normal action surfaces are removed from sub-units; only `Ungroup` remains.
- `Ungroup` on a sub-unit removes only that Unit.
- `Ungroup` on the top Unit removes all sub-units.
- The group starts collapsed after drop and expands through the same UnitListItem collapsible interaction.
- Assigning a group to a CFS moves every member to Assigned.
- Closing the CFS keeps the group together and moves the group according to the top Unit.
- Ungrouping restores each Unit's original behavior. In the required example, `1002 – Fire Truck` returns to Standby after it is removed from the `1001 – Police Car` group.
- Logs record grouped assignment, including `1001 – Police Car with sub-unit 1002 – Fire Truck was assigned to CFS2507027`.

## Recommended test flow

1. In **Available**, drag `1002 – Fire Truck` onto `1001 – Police Car`.
2. Click `1001 – Police Car` to expand the collapsed group.
3. Click **Assign to CFS**.
4. In **Assigned**, use the existing assignment stepper to set the top Unit to **On Scene**.
5. Use **Close CFS** in the prototype controls. The group moves together to Available.
6. Expand `1002 – Fire Truck` under the group and click **Ungroup**. It restores its original Standby behavior.

## Files

- `index.html` — static composition of the existing Unit system UI.
- `styles.css` — source-derived dark theme and Unit component styling.
- `app.js` — prototype state and new grouping behavior only.
