# Ember Hollow — Sol Pose Editor

Browser editor for geometric character proportions, Bézier outlines and saved poses.

[Open the editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/)

Use Pose mode for a working pose, Rig geometry for the default skeleton, and Outlines for shapes. The reference overlay, wheel zoom and pan help precise adjustments. Save Current Pose and Duplicate Current Pose act on the current draft. Use pose as rig makes the draft the New/Reset starting point. Blend interpolates angles and bone lengths; separate arm/leg swaps include attachment points.

Body view offers five categories (profile, 3/4 front, front, 3/4 back, back) with mirrored left/right variants. Changing view carries the current limb pose, lengths, added segments and weapon grip to the new shoulder/hip scaffold. Preset shoulders/hips can be locked independently or manually overridden; Snap roots restores the selected scaffold without resetting the pose. World pins are preserved; an incompatible switch leaves the previous pose/view intact. Rig geometry edits each view scaffold; Outlines edits its body contours independently. View art is geometric development art, and cross-view blend switches art at the midpoint rather than performing a 3D turn.

Connected segments can be extended from endpoints and safely removed. Pin any anchor, resize a pose bone explicitly, and restore selected/chain/all lengths from the separate rig baseline. Weapon attachment supports detached, position-only and hand-rotation modes with a captured grip offset.

Work stays in this browser. Export Project backs up the rig, current pose, saved library and reference setup. Import that JSON on another computer to continue; browser storage does not sync across computers or between local and online editor origins. Full backups download instead of blocking rig adoption when browser backup storage is full.

For offline use, download the repository ZIP, extract it and open index.html. No login, server or build is needed. Public distribution contains the standalone browser files, generated character preset and supplied reference image. Game code, development documents and development history are maintained separately.

Version 2026.10.13.11. Source distribution is copied from tools/sol_pose_editor in the development repository. Review .pose-editor-public-files.json before future updates; copy only its listed files.

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

## Unified limb Depth / Extension

Click **Depth / Extension: Off** in the top toolbar to enable all four limbs with one button. Click again to return all limbs to normal IK. Per-limb controls remain in the sidebar for mixed workflows.
Pose the bend with Normal IK first. One hand/foot drag rotates the captured bent
limb around its shoulder/hip and continuously controls compression or separation:

- Inside connected reach: both physical bones use the same proportional depth scale.
- At connected reach: depth scale is 1 and both gaps are zero.
- Outside connected reach: bone scale stays 1; extra reach opens two joint gaps.

Connected reach is the magnitude of the captured root-to-end vector, including
the current bend, rather than the straightened sum of bone lengths. Captured
vectors contain pose-intended connected proportions; the neutral rig remains
canonical baseline. **Reach multiplier** is relative to that connected reach:
0.7 means 70% physical lengths, 1 reconnects, 2 creates one connected reach of
extra separation. The readout shows actual **Depth scale** and elbow/wrist or
knee/ankle gaps. Actual depth scale never exceeds 1.

Each gap defaults to half of `max(0, desired reach - connected reach)`.
Gaps extend along the rotated root-to-tip axis, so the two equal distances add
exactly to the requested radial reach. Upper/lower bone orientations and their
bend remain unchanged. This chosen mechanical extension direction follows the
posed chain; it does not independently offset joints along screen X/Y. Stored
`gap_share` defaults to 0.5 and can support future ratio controls without a new
solver. This release intentionally provides no custom-ratio UI.

The existing `pose.limb_modes[limb]` schema retains `mode: "fixed_bend"` for
compatibility. It stores connected `vectors`, common `scale`, whole-limb
`rotation`, `gaps: [middle, endpoint]`, and `gap_share`. Resulting joint anchors
remain in `pose.joints`; physical pieces end before each gap. Length displays,
contour transforms and attached-hand rotation use these physical bone pieces,
while pin/chain solving uses anchor spans. Weapons retain grip offsets, rotation
inheritance and their separate projected length. Body-view changes translate the
compound shape with all mode/gap values intact unless a pin blocks the change.

Animation keys store the complete state. Between two enabled keys, connected
lengths, bone/bend angles and radial reach interpolate with the selected easing;
each sample applies the same compression/separation rule. Compression-to-extension
crosses scale 1 / gap 0, and extending/reconnecting keys do not stretch bones.
Preview and sprite export share the renderer and never rewrite source keys.
Solver mode remains categorical when only one adjacent key enables it; keep the
mode enabled through an extension animation for continuous gap interpolation.

**Capture current bend** redefines connected proportions from the current visible
physical bones without removing open gaps. Capturing while compressed makes those
shortened proportions the new connected reference. Returning to Normal IK keeps
all joints, physical bone lengths, gap magnitudes, weapon position and angle exactly
where they are. It releases the captured bend so elbows/knees can be adjusted
normally; ordinary hand/foot IK preserves those authored lengths. Shortening an
arm to 70%, switching Off and bending the elbow therefore keeps both bones at 70%.

For separated limbs, release converts gaps to optional `pose.limb_gaps[limb].offsets`
(two vectors local to their anchor spans). These offsets rotate with each span
while IK bends the chain, preserving actual bone lengths and mechanical gaps.
This state follows pose keys, blending, copy/swap/mirror, views and JSON/local
storage. Re-enabling captures current physical bones and gap directions without
moving the joints; subsequent drag keeps that current bend. Unusual folded gaps
pointing against the connected reach must be reset or reoriented before recapture.

**Reset selected limb lengths** in the Depth / Extension sidebar reconnects that
limb and restores both bones to the rig baseline. It leaves other limbs alone.
The existing **Reset segment length**, **Reset chain lengths** and **Reset all
lengths** remain under Connected segments. Resets/manual length edits are explicit
geometry changes; incompatible pins reject them atomically. An enabled affected
limb re-captures restored lengths, while an off limb stays in normal IK. Toggling
Off itself moves nothing and needs no unpinning. Independent middle-joint drag
and elbow/knee rotation are available after releasing the fixed-bend mode.

Limits: bones cannot compress below 0.1 local units; total extension gaps clamp to
2000 units. Fully folded near-zero-reach limbs must be unfolded before capture.
Legacy captures with scale above 1 preserve their visible lengths as the connected
reference on import instead of snapping into a newly separated pose. Small gaps
can be partially covered by joint caps/strokes; assess readability by playtesting.

Manual test: pose a bent arm with an attached hammer, capture, then drag inward,
through connected reach and far outward in one gesture. Check both gaps/readout,
fixed bend, hammer grip and shaft length. Repeat for a knee/foot. Duplicate keys
with gap amounts 0 → small → large → small → 0, switch profile/3/4 views between
keys, then preview, reload/export/import and export a transparent sprite archive.
Test a pinned elbow/knee/hand to confirm rejected movement leaves the pose intact.

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

Animation/export modules: `animation.js`, `projection.js`, `animation_editor.js`,
`sprite_export.js`. Existing model, chain/view constraints, rendering, persistence,
HTML/style and distribution manifest were extended; existing systems remain.
