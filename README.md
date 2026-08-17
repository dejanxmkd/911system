# 911systems — Unit Grouping Prototype

Pure HTML/CSS/JavaScript prototype for the new unit-grouping behavior on Dispatch.

## Non-negotiable design-system rule

**Always use only the components, layouts, patterns, spacing, typography, status badges, tabs, filters, unit rows, expanded unit details, and actions that already exist in the defined 911systems Unit UI. Do not redesign, restyle, replace, wrap, or invent alternative components unless the task explicitly requires a new component.**

The dark/new Unit UI from the provided 911systems frontend is the source of truth. Any white screens or sketches are for interaction/flow reference only and must never be used as the visual design source.

## Scope implemented

- Pure HTML, CSS, and vanilla JavaScript. No framework and no build step.
- Same Unit UI model for **CFS details** and **Map view** contexts.
- Grouping is available in **Available** and **Assigned**.
- Drag one unit card onto another to create a group.
- Dropped unit becomes a sub-unit of the target/top unit.
- Sub-units inherit the top unit's status, assignment, and movement between tabs.
- Status changes on the top unit cascade to every sub-unit.
- Sub-units do not expose normal unit actions; only **Ungroup** remains.
- **Ungroup** on a sub-unit removes only that sub-unit.
- **Ungroup** on the top unit removes every sub-unit.
- Grouped units render as a collapsed unit group and expand using the existing unit-card interaction.
- Assigning a grouped unit to a CFS moves the whole group to **Assigned**.
- Closing a CFS keeps the group together and moves the group according to the top unit.
- After ungrouping, each unit returns to its own original behavior.
- Example outcome supported: `1002 – Fire Truck` follows `1001 – Police Car` to Available while grouped, then falls back to Standby after being ungrouped.
- Prototype log explicitly records grouped assignment, e.g. `1001 – Police Car with sub-unit 1002 – Fire Truck was assigned to CFS2507027`.

## Files

- `index.html` — prototype structure using only the Unit system-design surface.
- `styles.css` — dark Unit UI styling derived from the defined Unit components.
- `app.js` — drag/drop grouping, status cascade, assign, close-CFS, ungroup, fallback, and log behavior.

## Demo

Open `index.html` directly in a browser.

Recommended flow:
1. In **Available**, drag `1002 – Fire Truck` onto `1001 – Police Car`.
2. Expand the top card to see the group.
3. Click **Assign**. Both move to **Assigned**.
4. Set the top unit to **On Scene**. The sub-unit follows.
5. Click **Close CFS**. Both move together to **Available**.
6. Expand the sub-unit and click **Ungroup**. `1002 – Fire Truck` falls back to **Standby**.
