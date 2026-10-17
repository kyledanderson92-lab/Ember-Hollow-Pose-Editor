# Neon Stick Sol animator

[Open the editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/)

Source revision: **2026.10.17.image-timing.v39**. Refresh an open tab after updates.

Pose by dragging the character. Chain IK stays above the canvas; 2D, 3D, Free and Stretch movement control connected reach, foreshortening and extension. Common anchor pins are always visible. Select overlapping anchors through the anchor dropdown. Grip, Slide and Free hand modes control weapon contact; directly dragged Slide hands may cross the other hand, while weapon-driven sliding stops at overlap.

Head/torso selection offers Restore neck/torso length. Restore all lengths covers arms, legs, neck and torso. Shared proportions live in Character setup and save across poses and animation keys; body defaults correct overextension while preserving foreshortening. Reference images and character alignment can be dragged directly.

The animator supports timeline scrubbing, capture of interpolated poses as keys, onion skins, multiple ghosts, playback and transparent sprite exports. Effects are manually placed **single-image stickers or image sequences**. Choose an Image set and an individual thumbnail. Drag the image to move it; side handles stretch, corner resizes and top handle rotates. Shift-click images or timeline rows to select a group. The same handles and hue/flip controls work on one image or the selection. Each labeled interval below the character keys has draggable start/end markers; drag the bar to move it, or move multiple selected intervals together. Whole animation preserves keyed motion; This key animates visual changes at a character key. Sequence timing comes from its interval; there is no separate FPS to synchronize. v20 projects keep their placement/timing, using their held image or former start image.

Use **File → Import JSON** to load projects or animations. Save with **Export Project Backup**; browser autosave stays on the current computer/browser and does not sync across devices. Make a backup before importing or moving computers.

Downloads: [original 28-action project](exports/neon_stick_actions.json), [sword benchmark](exports/sword_forward_benchmark.json), [user-authored hammer attack](exports/hammer_slam_animation.json). Existing [action references](references/) and run-review downloads remain available as earlier review material.

Open index.html in Edge or Chrome, or use the hosted link. No account, installation or paid service required. This repository distributes the standalone editor and example animations; game runtime and private development documents are maintained separately.

The ten CraftPix sequences have [asset provenance](assets/effects/SOURCE.md). [Godot effect playback](runtime/README.md) consumes Export Godot effects JSON.

New stickers are fixed to the editor grid; **Attach to: Pelvis** optionally follows character movement and facing. Older projects keep their pelvis attachment. Switching attachment preserves saved key placements, and explicit sticker key animation remains supported. The Image selector is one row directly below Duplicate/Delete. While Effects is active, drag anywhere on the canvas to move the selected effect/group. Overlapping images and character controls cannot steal the drag. Choose Body, Weapon or Scarf to resume character editing; Shift/Ctrl/Cmd-click changes effect group selection.

Z order sits beside the sticker layers. The image browser closes after placement; exact timing, precision transforms and export use compact foldouts. Each image set shares an artwork-centered rotation pivot and tighter handles. Existing stickers retain their placed artwork at authored keys when migrated.

### Weapon-follow and shoulder-ray reveal

**Copy animation**, beside New/Delete, duplicates every key, effect, timing value and clip setting into an independently editable clip. The copy gets a unique name and stays on the selected key; Undo removes the copy in one step. Weapon-definition ownership remains the same.

Choose **Attach to → Follow Weapon** to follow the actual grip position and blade angle. Drag/rotate the sticker normally, or open **Weapon offset** for local Offset X/Y and Rotation offset. Enabling Weapon captures the current frame's attachment basis for all keys; existing keyed differences remain in that basis. Switching back to Grid/Pelvis preserves saved placements.

Open **Ray sweep reveal** and enable **Reveal with character ray**. A read-only guide starts at the existing shared shoulder/neck anchor, runs through the actual weapon tip, and extends beyond it. As the ray moves, the swept grid area uncovers the sticker. Passed areas stay revealed through direction reversals; artwork outside the actual sweep stays hidden. There is no independent center, angle range or direction setting. The sticker's timeline interval controls when history starts and ends. Scrubbing backward reconstructs earlier coverage.

A faint full-art guide remains while posing a selected effect. Playback shows the actual masked artwork and the selected ray guide; guides never enter sprite exports. Move the sticker into the sweep and adjust its timeline interval. Whole-animation and This-key transforms, selected-effect drag protection, JSON/autosave and Undo remain available. Reveal requires an animation; a still pose has no swept history. Hold/facing jumps and absent weapons do not paint fictitious travel.

Import [weapon_effects_example.json](exports/weapon_effects_example.json) through File for **weapon_follow_example** and **weapon_sweep_example**, based on the existing sword benchmark. These examples do not change approved game attacks. The previous local angular settings migrate to shoulder-ray reveal. Native export uses version 6 for advanced clips: resolved transforms at 120 Hz plus boundaries, with shared ray histories and a union mask. Still-image clips without advanced attachments/reveal export as version 4; forward sequences use version 7, reversed sequences use version 8, and custom image timing uses version 9. Sampling approximates motion between samples; native reveals are capped at 2,048 ray samples per interval (about 17 seconds) and 200,000 sticker states per clip. Human visual review remains necessary.

Effect color sliders stack **Opacity, Saturation, Brightness, Tint strength**. Saturation/brightness use 0-200%; opacity/tint use 0-100%. Hue remains available, with a Tint color picker and nearby Reset color (preserves opacity). Colors support key/whole-animation scope, groups, undo and exports. Use the current bundled native player/shader together.

### Floor constraint

Enable **Floor** above the canvas. **Floor settings** offers numeric height and **Set below feet**. Larger height values move the floor downward. The setting belongs to the selected animation (all keys) or the current standalone pose; older projects start with it off. New keys and animation copies retain the clip setting. Turning it off keeps authored edits; Undo restores the entire pre-toggle state.

Feet can slide along or lift above the floor. Existing leg solvers retain movement modes, Chain IK behavior and authoring pins; impossible pin/reach combinations reject the edit. Scrubbing, preview capture and baked sprites correct sinking between keys. The green floor guide is editor-only and never enters exported artwork. Settings and corrected poses survive project/animation JSON and autosave. This does not automatically change approved game attacks.

This first version constrains feet only, without gravity, slopes, whole-body collision or horizontal foot planting. Contact clearance accounts for the rounded foot stroke when the floor is configured; update Floor settings after changing character stroke thickness. See [milestone 080](../../milestones/080-pose-floor-constraint.md) for verification and human-review status.

### Sprite-reference run and matching limbs

Import [sprite_reference_run.json](exports/sprite_reference_run.json) with File -> Import JSON, then select **base / sprite_reference_run** and press Play. This adds a separate clip without replacing the existing project or built-in run. It has 25 editable keys (including the repeated closing key), a 0.72-second loop, alternating steps and the floor enabled. Weapon/scarf are hidden for clear limb posing; they remain available through the normal controls. [Animated preview](exports/sprite_reference_run_preview.gif).

The supplied 12 images are manually traced and retargeted to Sol's own segment lengths. Opposite sides form the second step; timing and small flight offsets are authored choices because the source contains no FPS metadata. [Source/provenance](references/stickmanrun/SOURCE.md). Human motion review remains; no gameplay animation is automatically changed.

Both arms, both legs and both hands now use the same character line color and opacity throughout the editor, playback and sprite exports. The darker rear-side cue and its appearance picker are removed; older rig JSON remains readable.

### Edit selected animation keys together

Ctrl/Cmd-click timeline keys to add/remove individual keys; Shift-click selects a range. Clicking an already selected key makes it active while keeping the group. Blue keys are selected; the orange outline identifies the active pose. **Editing N keys**, **Select all keys** and **Active key only** appear above the ruler.

**Position (X/Y)** applies the same grid-space movement to matching anchors in every selected key, starting from each pose's own position. **Angle** applies the same clockwise angle around each anchor's own parent, preserving each pose's radius. A hand turns around its elbow; a torso turns around its pelvis, including upside-down/mirrored poses. Pelvis and anchors located exactly at their pivot require Position mode. There is no Match position command.

Drag a character anchor, or use arrow keys: Position moves 0.1 grid units (Shift: 1); Angle turns 1 degree (Shift: 10). Pins, grips, movement permissions and floor constraints remain respected. If any selected key cannot reach the target, that pointer update changes none of them and the status identifies the key/time. Each completed drag is one Undo; Escape or pointer cancellation restores the whole gesture.

Hold a selected key for a quarter-second, then drag to move selected key times together, preserving spacing while allowing keys to pass unselected keys in either direction. Keys reorder by time; only timeline bounds limit the group. Exact time overlaps are rejected, so keep dragging beyond the occupied time. The earliest key defines zero: dragging before it extends the start and shifts the remaining timeline right; moving it inward trims the start. Numeric Time uses the same behavior. Transition changes apply to all selected outgoing transitions. Duplicate/Delete and other pose properties edit the active key only; effect stickers retain their own existing selection/scope.

Selection and mode persist in local editor state and history, without changing animation JSON. Import/clip changes repair/reset the selection. Group edits survive project save/import and sprite export. [Milestone 085](../../milestones/085-multiple-key-editing.md) records validation and human usability review.

Selecting a character key clears selected effects and returns to Body editing. Quick clicks only select keys. Hold a key still for a quarter-second until the timing highlight appears, then drag at least 6 pixels to change timing. Moving before the hold completes keeps that gesture selection-only. Ctrl/Cmd/Shift selection clicks never retime. Empty ruler space still scrubs immediately; numeric Time remains available.

### Image sequences and alignment

Choose an Image set, then **Add entire image sequence** to create one animated effect with one timeline interval. It plays the included images once, in original order, equally dividing its start/end time by default. Small divisions inside the bar show the image slots. Existing stickers remain single images; **Playback** switches one selected effect between Single image and Image sequence.

Click a numbered thumbnail to select it and preview its part of the interval without creating a character key or an Undo step. **Remove image** excludes it; the remaining images immediately share the same interval using their relative durations (equal unless customized). Removed thumbnails remain dimmed so you can select and restore them. Restore all images retains individual alignment corrections. At least one image remains. These choices apply across all character keys, independently of the This key transform scope.

All images retain their common source canvas, scale and set pivot. Their changing bounds reflect the authored arc/travel, so images are not individually cropped, resized or centered. **Image alignment** overlays the selected image brightly with included neighbors faintly; Image X/Y make small local corrections to that image across the whole clip. Reset image alignment restores its original source placement. Offsets rotate, mirror and scale with the effect. [Alignment review](assets/effects/ALIGNMENT.md).

Position, attachment, transforms and colors continue working for the sequence. Character-ray reveal keeps its accumulated mask as images change. Sprite export includes image transition times even at a low requested FPS (up to the existing 500-frame limit). Export Godot effects uses version 7 for equal forward sequences, version 8 for equal reversed sequences and version 9 for custom image timing; use the updated bundled player. Native export retains image choices and corrections, including weapon-follow and ray reveal. Old projects and still-image clips keep their previous behavior. Human review of artistic alignment remains necessary.

### Scale the saved animation duration

Open **Clip settings → Duration (s)** and enter the desired total length in seconds. All character key times and effect start/end times scale by the same ratio, including keys outside the current selection. A 1-second clip changed to 0.5 seconds becomes twice as fast, with the earliest key at zero and all relative timing preserved. Poses, interpolation, sequence images, alignment corrections and attachment settings stay intact. Ray reveal and image-sequence timing follow the scaled intervals.

The change is saved in the animation and its project/sprite/native exports. One Undo restores the earlier timing; other animations are unaffected. **Preview speed** changes only how the editor plays the clip. Duration requires at least two timed keys; invalid values or compression below the supported key spacing reject the edit without partially changing timing. Maximum duration is 600 seconds; effect intervals must also remain within 600 seconds.

### Extend or trim the start of an animation

Hold and drag any character key, including the earliest key. Dragging a key through zero and farther left extends the start: that key becomes the new zero, and the other keys and effect intervals shift right. Dragging the earliest key inward trims the beginning; the earliest remaining key becomes zero and the other times shift left. The clip always saves with nonnegative times and its earliest key at zero. Its duration still follows the latest key. Exact overlaps remain rejected; keep dragging past the occupied time.

**Keys → Add key before first** inserts the current pose (or the displayed preview pose) at zero and moves all existing keys and effect intervals right by 0.1 seconds. Select the new key to edit it, or adjust the interval by dragging. A new key keeps its own ID; existing IDs are not renumbered.

Selected groups keep their spacing. Moving every key together has no net effect after normalizing zero. Effect durations remain intact when extending; trimming the start clips any effect interval portions before zero, matching first-key deletion. Sequence images, ray reveal, cached preview times and exports use the adjusted timeline. Undo/Redo restores the whole edit, Escape cancels a drag, and the 600-second animation/effect limit remains enforced.

In **Setup → Reference image**, enable **Flip horizontally** to mirror the image around its center. Its placement and size stay unchanged. The setting supports Undo/Redo and saves in project backups and browser storage; it does not affect exported character sprites.

The Poses library shows Rename, Duplicate current pose and Delete saved pose as full-width buttons below New pose / Save current pose, above the thumbnails. These actions are always visible without opening a menu.

The Effects layer list includes effects from the entire animation, even when the active character key contains none. Selecting an effect from its timeline bar, label or layer entry opens a nearby key that contains it when needed. Selection does not copy effect data into missing keys or add an Undo step. Character key selection still clears effect selection.

### Reverse an effect sequence

Select a sequence effect, then enable **Reverse sequence** above its thumbnails. The included images play backwards across the same interval, with original image numbers and alignment offsets preserved. Thumbnails and the numbered boxes on its timeline bar show the actual playback order. Removed images stay excluded; restoring them keeps the selected direction.

You can also **drag either end of a sequence's timeline bar past the other end**. This reverses the images while resizing the interval on the opposite side of the fixed endpoint. Dragging back across it restores the original direction during that gesture. Stored start/end times remain chronological, with a 1 ms minimum span and the existing clip bounds. Checkbox reversal keeps the duration unchanged. Still-image endpoints retain their previous trim behavior. Hover the bar for exact start/end seconds.

Direction applies to that effect across all character keys, independently of This key transform scope. One Undo restores timing/direction; Escape cancels a drag. Ray reveal still follows the weapon forward and keeps its accumulated mask. Reversing images does not reverse the character animation or weapon motion. Project backups, sprite exports and native v8 exports retain reverse playback; use the updated bundled native player. Existing sequences default to forward.

## Per-image timing

Select one sequence and open **Exact timing** in Effects. Each included image has **Start (s)** and **End (s)** in playback order. Changing an internal boundary also changes its neighbor's boundary; the images stay contiguous. Changing the first Start or last End preserves every other image boundary. For a fast slash with a lingering finish, set the overall effect to the fast swing duration first, then extend only the last image's End. The numbered timeline cells show the relative durations.

If that End goes past the animation, the editor adds a hold of the final character pose, preserving earlier key times and motion. Repeated extensions reuse an unchanged final hold. Shortening an effect later keeps those character keys; trim them explicitly if desired. A timing edit and any added hold share one Undo step. Invalid or inverted times are rejected without adding history.

Custom duration stays with its original image when reversing, removing or restoring images. Removing an image redistributes the fixed effect interval using the remaining relative durations. **Reset to equal timing** shares the current interval equally. Overall effect endpoint edits and animation Duration still scale image timing proportionally; per-image fields preserve the other boundaries. Times are absolute animation seconds, limited to 0–600 seconds. Native custom timing requires the bundled version-9-capable player; project and sprite exports preserve timing. Ray reveal and image alignment remain unchanged.
