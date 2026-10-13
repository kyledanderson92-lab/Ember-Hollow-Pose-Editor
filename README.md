# Ember Hollow — Sol Pose Editor

Browser editor for geometric character proportions, Bézier outlines and saved poses.

[Open the editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/)

Use Pose mode for a working pose, Rig geometry for the default skeleton, and Outlines for shapes. The reference overlay, wheel zoom and pan help precise adjustments. Save Current Pose and Duplicate Current Pose act on the current draft. Use pose as rig makes the draft the New/Reset starting point. Blend interpolates angles and bone lengths; separate arm/leg swaps include attachment points.

Body view offers five categories (profile, 3/4 front, front, 3/4 back, back) with mirrored left/right variants. Changing view carries the current limb pose, lengths, added segments and weapon grip to the new shoulder/hip scaffold. Preset shoulders/hips can be locked independently or manually overridden; Snap roots restores the selected scaffold without resetting the pose. World pins are preserved; an incompatible switch leaves the previous pose/view intact. Rig geometry edits each view scaffold; Outlines edits its body contours independently. View art is geometric development art, and cross-view blend switches art at the midpoint rather than performing a 3D turn.

Connected segments can be extended from endpoints and safely removed. Pin any anchor, resize a pose bone explicitly, and restore selected/chain/all lengths from the separate rig baseline. Weapon attachment supports detached, position-only and hand-rotation modes with a captured grip offset.

Work stays in this browser. Export Project backs up the rig, current pose, saved library and reference setup. Import that JSON on another computer to continue; browser storage does not sync across computers or between local and online editor origins. Full backups download instead of blocking rig adoption when browser backup storage is full.

For offline use, download the repository ZIP, extract it and open index.html. No login, server or build is needed. Public distribution contains the standalone browser files, generated character preset and supplied reference image. Game code, development documents and development history are maintained separately.

Version 2026.10.13.9. Source distribution is copied from tools/sol_pose_editor in the development repository. Review .pose-editor-public-files.json before future updates; copy only its listed files.

## Multi-key animation workflow

Open **Animation sequences & sprite export**. Choose a weapon family/action and
click **New animation**. Pose the selected key, duplicate it, edit the duplicate,
switch views and repeat. Selected key edits autosave locally; key duplication
preserves the complete pose state. Use previous/next, the key selector/markers,
timestamps or marker dragging to author timing. First key starts at zero.

Outgoing transitions support Linear, Ease In, Ease Out, Ease In/Out and exact
Hold. Hold keeps the source unchanged until the destination time. Identical
neighboring keys remain separate and can also author holds. Scrub/play/loop is
read-only and uses only adjacent keys through the existing pose interpolator.
Discrete view/art state snaps; angular values use shortest paths, so use several
keys for a full spin. Existing two-pose preview remains available.

Sequences are `{type:"geometric_sol_animation",version:1,id,name,weapon_type,
weapon_id,keys:[{id,time,interpolation,pose}]}`. Complete pose snapshots include
joints/current lengths, pins, views/manual roots, attachments/grip offsets,
weapon/limb projection and added segments. One project rig and its outlines/views
are shared instead of copied per key. Project JSON adds `animations` and
`weapon_definitions`; JSON remains canonical and survives undo/redo/reload.
Limits: 100 sequences, 500 keys each, 200 custom definitions, 25 MB JSON imports.

## Foreshortening

In **Pose foreshortening**, select an arm/leg and capture its current bend.
Fixed Bend dragging rotates the compound limb around its root; cursor distance
sets a common scale, preserving elbow/knee angle and segment ratio. Numeric
scale is relative to the capture. Pins can reject incompatible moves. Normal
IK retains current geometry; baseline-length recovery re-captures the restored
shape. Fixed-bend state is stored in `pose.limb_modes`, while current lengths
remain joint-coordinate distances and the separate neutral rig remains baseline.

Weapon projection uses `weapon.projected_length` and a definition baseline,
rather than adding tip anchors to the existing pin/IK graph. Hammer shafts
shorten without uniformly shrinking heads; sword blades shorten without shrinking
grips. Length interpolates across keys. Missing length uses the definition
baseline. Existing hand rotation/grip attachment remains active.

## Weapon families and overrides

Animation families are sword/hammer/baton/base. Individual weapon owners can
override an action while inheriting others: weapon + action → family + action
→ base + action. New weapon definition prepares an individual override owner;
create a new animation and assign the same action name to author that override.
Selecting a family animation shows its family owner explicitly.

Definitions have ID/name/family/baseline length, with optional head width, blade
width and color supported by current vector rendering. More detailed definitions
can be edited in project JSON. `perspective_art` preserves metadata for future
weapon artwork variants; alternate raster sprite loading is a future hook.

## Sprite export

Export a ZIP using key weapons, or choose a specific weapon: its action override/
family/base sequence is resolved and its definition applied to generated frames.
The archive contains transparent per-frame PNGs, a PNG sprite sheet, `frames.json`
with times/durations/rectangles/pivots/root positions and `editable_project.json`.
One common crop/pivot aligns all frames; grid, handles, references and ghosts are
excluded. Export never replaces or edits the canonical source.

FPS sampling includes every authored key time; choose Key frames only for exact
authored frames. Added key samples can produce nonuniform durations: use the
metadata. The terminal key frame has zero elapsed duration. Work limits are
500 frames, 2048-pixel cells, 8192-pixel sheet sides and 32 million cell pixels;
oversized exports fail rather than cut frames. Lower FPS/pixels per unit to fit.

Current rendering is vector-to-PNG; final pixel-art/animation quality needs artist
review. Godot SpriteFrames importer, alternate weapon raster artwork, per-property
easing tracks and special baked-frame replacement UI remain future hooks.

Manual tests: author six-plus keys, scrub/loop, test explicit and duplicate holds,
retime/delete/undo, capture and scale arms/legs, test pins and baseline reset,
duplicate through profile/3/4/front, verify weapon grip/projection, create a
legendary override, export PNGs and reload the editable project.

Files added for this release: `animation.js`, `projection.js`, `animation_editor.js`,
`sprite_export.js`. Existing model, chain/view constraints, rendering, persistence,
HTML/style and distribution manifest were extended; existing systems remain.
