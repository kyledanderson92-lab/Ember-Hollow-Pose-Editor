# Neon Stick Sol pose editor

Open **index.html** locally in Edge or Chrome. This copy renders rounded blue neon strokes with a circular head and small rotating square hands. It needs no login, subscription, server or build.

[Open the public editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/) · [Current action project JSON](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/exports/neon_stick_actions.json). To work on another computer, download the JSON, then import it through File. Export Project Backup carries your changes between computers; browser autosave does not sync.

The public editor's workspace UI is restored around Stick Sol: left pose/animation library, right contextual inspector, bottom timeline/comparison dock, compact File/Setup/Export menus, and sprite-export dialog. UI source was checked against public `main` at `3b19d32` (workspace introduced in `08d864b`); retired armor, contour and reference tools remain removed. Refresh an already-open tab to load version **2026.10.14.stick.simple**.

## Edit the current actions

1. Choose **File → Import JSON** and select **exports/neon_stick_actions.json**.
2. Choose an action under **Animations** in the left Library. The **Animation timeline** below the canvas opens; choose a key by its time or the key selector.
3. Drag the joint handles or use **Selected point** coordinates in the right inspector. Choose Normal to preserve current limb lengths, or Foreshortening to preserve the bend while compressing the limb. Restore limb proportions resets the selected limb to the rig baseline. Editing a selected timeline key updates that key automatically. **Save to Pose Library** saves a separate named library pose.
4. Duplicate/add keys and adjust **Time (s)** or transition interpolation as needed. Enable **Timeline preview** to scrub/play; turn it off to resume editing.
5. Choose **Export → Export Project Backup** and send that JSON back for integration. **Export animation JSON** saves just the selected action. **Export → Bake sprite frames…** opens the sprite export dialog.

The project includes **28 action timelines / 183 editable keys**: idle, run, takeoff/rise/apex/fall, landing, crouch, wall, corner hang, Slam, hurt/death pose references, three Dash directions, and normal/upward/sweep/air swings for sword, hammer and baton. These are sparse samples of the actual current procedural component. Running feet are local snapshots; world foot planting and dynamic ledge contacts remain procedural. Hurt/death colors are runtime effects rather than animated skeleton changes. Returned JSON does not automatically override gameplay; it supplies your authored animation feedback.

Wheel zooms; middle-drag or Space-drag pans. Mirror, limb swaps, bend flip, pins, connected-segment editing, weapon grip/depth/length, VFX, optional scarf posing, blend preview and sprite-frame export remain available. Rig mode changes the neutral skeleton; existing timeline keys stay independent. **Use pose as rig** changes the starting pose for New/Reset.

## Removed features and storage

Old Sol sprites, 3D/segmented body artwork, reference/head images and pose presets are removed. Outline/contour editing, image tracing, art-view scaffolds and PNG head tools are removed completely. The editor starts with an empty pose library. A fresh `ember-stick-sol-editor-v1` browser workspace is used; launching this updated editor clears the retired Sol project/backup keys while retaining unrelated browser storage. Project backups are portable JSON; browser autosave stays on this computer/origin.

This editor extends the stick workspace from commit `8e4293d` with the simplified UI and rotating square hands (version `2026.10.14.stick.simple`). `.pose-editor-public-files.json` lists the files to publish together. JSON retains the existing `geometric_sol_*` version 1 schema for compatibility. Head/foot rotation fields remain importable, but their inactive controls are removed.

## Simple workspace and advanced tools

The selected limb has Normal / Foreshortening and a single Restore limb proportions action. Disabling foreshortening retains compression and gaps; restore is explicit. Advanced body tools contain Free Edit (disable Preserve lengths), Apply to All Limbs, captured-bend/reach controls, individual segment lengths, pins, and extra segments. Foreshortening is a 2D projection illusion, not a 3D rig. Beyond connected reach it opens joint gaps.

Small square hands are drawn in editing, thumbnails, comparison, timeline previews, and baked sprites. An attached weapon hand follows the weapon angle with its fixed grip offset. The other hand follows forearm plus wrist rotation. Weapon rotation is available in the Weapon inspector; wrist rotation is shown when rotation lock is enabled. Head position, torso rotation and foot positions remain editable; circular-head and foot rotation controls are gone.

Enable the optional scarf through Setup → Optional accessories. Its inspector and canvas anchor remain hidden when it is off. Custom weapon/action ownership settings live in Advanced panels. Weapon definitions provide lengths and action overrides; retired width/color/perspective artwork metadata is discarded on import.

## Rebuild and validate

Run from the repository root:

```sh
node tools/sol_pose_editor/tests/stick_model.cjs
python -m http.server 8785 --bind 127.0.0.1 --directory tools/sol_pose_editor
# In another terminal:
node tools/sol_pose_editor/tests/stick_workspace.browser.cjs
```

The browser suite uses Playwright and `/usr/bin/chromium`; set `SOL_BROWSER` and `SOL_EDITOR_URL` for another executable or local URL. Managed browsers may require HTTP rather than file URLs. These checks cover stick grips, movement modes, pins, key edits, previews, exports and narrow-screen layout. The retained solver/animation regressions use the current stick rig; retired artwork-specific suites have been replaced. Game runtime integration remains a separate task.
