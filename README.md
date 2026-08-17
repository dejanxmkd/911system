# 911systems Unit Grouping Prototype

Interactive HTML/CSS/JavaScript prototype for the new grouped-unit behavior on the dispatch page.

## Non-negotiable component rule

**Always use only components and UI patterns that already exist in this prototype / the defined 911systems Unit UI. Do not redesign, restyle, replace, wrap, or invent alternative components unless the task explicitly asks for a component change.**

The dark **Unit Cards Definition** is the UI source of truth. The white grouping screens are reference sketches for flow/behavior only and must not be used as the visual design source.

## Implemented behavior

- Available, Assigned, and Off duty tabs.
- Same grouped-unit interaction can be previewed from **CFS details** and **Map view**.
- Drag one unit card onto another unit card to group them.
- The dropped unit becomes a sub-unit of the top unit.
- A sub-unit inherits the top unit status and CFS assignment.
- Status changes on the top unit cascade to all sub-units.
- Action buttons are removed from sub-units; they only expose **Ungroup**.
- **Ungroup** on a sub-unit removes only that unit.
- **Ungroup** on a top unit removes the entire group.
- Groups render collapsed/compact by default and expand by clicking the card.
- CFS close behavior keeps grouped units together.
- After ungrouping, each unit falls back to its original behavior (`AVAILABLE` or `STANDBY`).
- Assignment feedback demonstrates the log wording, e.g. `1001 – Police Car with sub-unit 1002 – Fire Truck assigned to CFS2507027`.

## Prototype demo

Open `index.html` in a browser. No build step is required.

Recommended scenario:

1. In **Available**, drag `1002 – Fire Truck` onto `1001 – Police Car`.
2. Expand `1001 – Police Car` to inspect the group.
3. Click **Assign**. Both units move together to **Assigned**.
4. Change the top unit status to **On Scene**. The sub-unit follows.
5. Use **Actions → Close** simulation by clicking the top red `Actions` button and confirming. Both grouped units move to **Available**.
6. Ungroup `1002 – Fire Truck`. It falls back to **Standby** because that is its original behavior.

## Files

- `index.html` — application structure and existing UI composition.
- `styles.css` — dark 911systems Unit UI styling.
- `app.js` — prototype state, grouping, drag/drop, status cascade, ungroup, and close behavior.
