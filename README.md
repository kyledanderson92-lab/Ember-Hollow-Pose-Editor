# Neon Stick Sol pose editor

Open **index.html** locally in Edge or Chrome. This copy renders rounded blue neon strokes with a circular head and small rotating square hands. It needs no login, subscription, server or build.

[Open the public editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/) · [Current action project JSON](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/exports/neon_stick_actions.json). To work on another computer, download the JSON, then import it through File. Export Project Backup carries your changes between computers; browser autosave does not sync.

The public editor's workspace UI is restored around Stick Sol: left pose/animation library, right contextual inspector, bottom timeline/comparison dock, compact File/Setup/Export menus, and sprite-export dialog. UI source was checked against public `main` at `3b19d32` (workspace introduced in `08d864b`); retired armor, contour and reference tools remain removed. Refresh an already-open tab to load version **2026.10.14.stick.motion.2**.

## Edit the current actions

1. Click **Load current action pack** in Animations, or choose **File → Import JSON** and select **exports/neon_stick_actions.json**. Loading the built-in pack asks before replacing the workspace and keeps a local backup plus Undo.
2. Choose an action under **Animations** in the left Library. The **Animation timeline** below the canvas opens; choose a key by its time or the key selector.
3. Drag the joint handles or use **Selected point** coordinates in the right inspector. Choose 2D movement for fixed connected limb lengths, 3d movement for shortening only, or stretch for shortening and extension. Restore limb proportions resets the selected limb to the rig baseline. Editing a selected timeline key updates that key automatically. **Save to Pose Library** saves a separate named library pose.
4. Duplicate/add keys and adjust **Time (s)** or transition interpolation as needed. Enable **Timeline preview** to scrub/play; turn it off to resume editing.
5. Choose **Export → Export Project Backup** and send that JSON back for integration. **Export animation JSON** saves just the selected action. **Export → Bake sprite frames…** opens the sprite export dialog.

The project includes **28 action timelines / 183 editable keys**: idle, run, takeoff/rise/apex/fall, landing, crouch, wall, corner hang, Slam, hurt/death pose references, three Dash directions, and normal/upward/sweep/air swings for sword, hammer and baton. These are sparse samples of the actual current procedural component. Running feet are local snapshots; world foot planting and dynamic ledge contacts remain procedural. Hurt/death colors are runtime effects rather than animated skeleton changes. Returned JSON does not automatically override gameplay; it supplies your authored animation feedback.

Wheel zooms; middle-drag or Space-drag pans. Mirror, limb swaps, bend flip, pins, connected-segment editing, weapon grip/depth/length, VFX, optional scarf posing, blend preview and sprite-frame export remain available. Rig mode changes the neutral skeleton; existing timeline keys stay independent. **Use pose as rig** changes the starting pose for New/Reset.

## Removed features and storage

Old Sol sprites, 3D/segmented body artwork, reference/head images and pose presets are removed. Outline/contour editing, image tracing, art-view scaffolds and PNG head tools are removed completely. The editor starts with an empty pose library. A fresh `ember-stick-sol-editor-v1` browser workspace is used; launching this updated editor clears the retired Sol project/backup keys while retaining unrelated browser storage. Project backups are portable JSON; browser autosave stays on this computer/origin.

This editor extends the stick workspace from commit `8e4293d` with the simplified UI and rotating square hands (version `2026.10.14.stick.motion.2`). `.pose-editor-public-files.json` lists the files to publish together. JSON retains the existing `geometric_sol_*` version 1 schema for compatibility. Head/foot rotation fields remain importable, but their inactive controls are removed.

## Simple workspace and advanced tools

The Movement selector applies to the selected limb or weapon:

- **2D movement:** limbs bend at full connected lengths; weapons retain their normal length. Switching from a depth mode restores the captured connected length. Pins can reject a switch that would move a locked point.
- **3d movement:** preserves the limb’s captured bend and allows shortening only. Reach stops at 100%; limbs never open gaps, and weapons never grow beyond their normal length.
- **stretch:** allows shortening and extension. Limbs extend by opening joint gaps without stretching their physical bones. Weapons extend their longitudinal geometry.

Select a weapon or choose Weapon in the inspector to set its mode. In 3d movement or stretch, drag the weapon tip or edit Weapon projected length. The sword and baton shorten along their full length, including the hilt; the hammer shaft shortens while its head keeps its width and height. Tip drag can optionally move the attached arm when aiming beyond weapon reach. Each limb and weapon has an independent mode, stored per key/pose. The advanced All limbs selector applies one mode to all four limbs atomically.

**Restore limb proportions** remains the only primary limb reset and restores default-rig lengths, preserving the selected depth mode. Advanced body tools retain captured-bend/reach controls, manual segment proportions, pins and extra segments. The old Free Edit checkbox and two-state all-limb toggle are removed. These controls simulate depth in 2D; they do not introduce a 3D rig. Older fixed-bend JSON without mode metadata remains stretch; legacy weapon poses retain their authored length and start in 2D movement until a mode is selected.

Small square hands are drawn in editing, thumbnails, comparison, timeline previews, and baked sprites. An attached weapon hand follows the weapon angle with its fixed grip offset. The other hand follows forearm plus wrist rotation. Weapon rotation is available in the Weapon inspector; wrist rotation is shown when rotation lock is enabled. Head position, torso rotation and foot positions remain editable; circular-head and foot rotation controls are gone.

Enable the optional scarf through Setup → Optional accessories. Its inspector and canvas anchor remain hidden when it is off. Custom weapon/action ownership settings live in Advanced panels. Weapon definitions provide lengths and action overrides; retired width/color/perspective artwork metadata is discarded on import.

## Rebuild and validate

Run from the repository root:

```sh
node tools/sol_pose_editor/tests/stick_model.cjs
python -m http.server 8785 --bind 127.0.0.1 --directory tools/sol_pose_editor
# In another terminal:
node tools/sol_pose_editor/tests/stick_workspace.browser.cjs
node tools/sol_pose_editor/tests/movement_modes.browser.cjs
```

The browser suite uses Playwright and `/usr/bin/chromium`; set `SOL_BROWSER` and `SOL_EDITOR_URL` for another executable or local URL. Managed browsers may require HTTP rather than file URLs. These checks cover stick grips, movement modes, pins, key edits, previews, exports and narrow-screen layout. The retained solver/animation regressions use the current stick rig; retired artwork-specific suites have been replaced. Game runtime integration remains a separate task.

## Motion workshop

Open **Motion workshop** under Animations for previous/next key ghosts, slow preview, whole-clip retiming (keys and effect cues), and **Create 3× Overclock copy**. The copy is independent, editable and undoable. Weapon inspector has a size multiplier; this grows the whole weapon independently from depth projection. Slow preview changes playback only. The original action export remains intact; the new reference-derived animation pack is pending source downloads. See [animation references and current status](ANIMATION_REFERENCES.md).
