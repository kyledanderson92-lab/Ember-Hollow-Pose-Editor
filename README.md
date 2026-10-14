# Neon Stick Sol pose editor

Open **index.html** locally in Edge or Chrome. This copy renders rounded blue neon strokes with a circular head and elbow/knee joints. It needs no login, subscription, server or build.

[Open the public editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/) · [Current action project JSON](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/exports/neon_stick_actions.json). To work on another computer, download the JSON, then import it through File. Export Project Backup carries your changes between computers; browser autosave does not sync.

The public editor's workspace UI is restored around Stick Sol: left pose/animation library, right contextual inspector, bottom timeline/comparison dock, compact File/Setup/Export menus, and sprite-export dialog. UI source was checked against public `main` at `3b19d32` (workspace introduced in `08d864b`); retired armor, contour and reference tools remain removed. Refresh an already-open tab to load version **2026.10.14.stick.workspace**.

## Edit the current actions

1. Choose **File → Import JSON** and select **exports/neon_stick_actions.json**.
2. Choose an action under **Animations** in the left Library. The **Animation timeline** below the canvas opens; choose a key by its time or the key selector.
3. Drag the joint handles or use **Selected point** coordinates in the right inspector. Chain IK retains the current segment lengths. Editing a selected timeline key updates that key automatically. **Save to Pose Library** saves a separate named library pose.
4. Duplicate/add keys and adjust **Time (s)** or transition interpolation as needed. Enable **Timeline preview** to scrub/play; turn it off to resume editing.
5. Choose **Export → Export Project Backup** and send that JSON back for integration. **Export animation JSON** saves just the selected action. **Export → Bake sprite frames…** opens the sprite export dialog.

The project includes **28 action timelines / 183 editable keys**: idle, run, takeoff/rise/apex/fall, landing, crouch, wall, corner hang, Slam, hurt/death pose references, three Dash directions, and normal/upward/sweep/air swings for sword, hammer and baton. These are sparse samples of the actual current procedural component. Running feet are local snapshots; world foot planting and dynamic ledge contacts remain procedural. Hurt/death colors are runtime effects rather than animated skeleton changes. Returned JSON does not automatically override gameplay; it supplies your authored animation feedback.

Wheel zooms; middle-drag or Space-drag pans. Mirror, limb swaps, bend flip, pins, connected-segment editing, weapon grip/depth/length, VFX, optional scarf posing, blend preview and sprite-frame export remain available. Rig mode changes the neutral skeleton; existing timeline keys stay independent. **Use pose as rig** changes the starting pose for New/Reset.

## Removed features and storage

Old Sol sprites, 3D/segmented body artwork, reference/head images and pose presets are removed. Outline/contour editing, image tracing, art-view scaffolds and PNG head tools are removed completely. The editor starts with an empty pose library. A fresh `ember-stick-sol-editor-v1` browser workspace is used; launching this updated editor clears the retired Sol project/backup keys while retaining unrelated browser storage. Project backups are portable JSON; browser autosave stays on this computer/origin.

The local source and public standalone editor use the same Stick Sol workspace. `.pose-editor-public-files.json` lists the standalone files published together; keep the UI modules, stick renderer, rig and action JSON synchronized when updating either copy. JSON keeps the existing `geometric_sol_*` version 1 type names for timeline/tool compatibility; the rig now explicitly requires `presentation_style: neon_stick` and contains no body art.

## Rebuild and validate

From the game repository root in PowerShell, run Godot 4.6.3 console headlessly with `--script res://tools/sol_pose_editor/export_neon_stick_actions.gd`, then `node tools/sol_pose_editor/build_stick_action_export.cjs`. The first step writes presentation samples under `.godot`; the second regenerates the stick default rig and exported project.

For editor-only work, run `node --test tools/sol_pose_editor/tests/model.test.cjs` and the browser suites `browser.cjs`, `workspace.test.cjs`, `authoring.test.cjs` and `blend.test.cjs` under the same tests folder (Playwright with local Edge; set `SOL_EDITOR_URL` to the local index.html file URL for authoring/blend). No game import or game tests are required when game files do not change. Runtime cleanup results belong to [milestone 052](../../milestones/052-stick-only-editor-and-action-export.md); UI restoration and editor-only validation belong to [milestone 053](../../milestones/053-restore-public-pose-editor-workspace.md).
