# Ember Hollow — Sol Pose Editor

Browser editor for geometric character proportions, Bézier outlines and saved poses.

[Open the editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/)

Use Pose mode for a working pose, Rig geometry for the default skeleton, and Outlines for shapes. The reference overlay, wheel zoom and pan help precise adjustments. Save Current Pose and Duplicate Current Pose act on the current draft. Use pose as rig makes the draft the New/Reset starting point. Blend interpolates angles and bone lengths; separate arm/leg swaps include attachment points.

Body view offers five categories (profile, 3/4 front, front, 3/4 back, back) with mirrored left/right variants. Changing view carries the current limb pose, lengths, added segments and weapon grip to the new shoulder/hip scaffold. Preset shoulders/hips can be locked independently or manually overridden; Snap roots restores the selected scaffold without resetting the pose. World pins are preserved; an incompatible switch leaves the previous pose/view intact. Rig geometry edits each view scaffold; Outlines edits its body contours independently. View art is geometric development art, and cross-view blend switches art at the midpoint rather than performing a 3D turn.

Connected segments can be extended from endpoints and safely removed. Pin any anchor, resize a pose bone explicitly, and restore selected/chain/all lengths from the separate rig baseline. Weapon attachment supports detached, position-only and hand-rotation modes with a captured grip offset.

Work stays in this browser. Export Project backs up the rig, current pose, saved library and reference setup. Import that JSON on another computer to continue; browser storage does not sync across computers or between local and online editor origins. Full backups download instead of blocking rig adoption when browser backup storage is full.

For offline use, download the repository ZIP, extract it and open index.html. No login, server or build is needed. Public distribution contains the standalone browser files, generated character preset and supplied reference image. Game code, development documents and development history are maintained separately.

Version 2026.10.13.20. Source distribution is copied from tools/sol_pose_editor in the development repository. Review .pose-editor-public-files.json before future updates; copy only its listed files.

## Multi-key animation workflow

Choose/create a sequence in the left **Animations** library, then open **Animation timeline** below the canvas. Choose a weapon family/action and
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

## Weapon grip and tip controls

Weapon artwork now uses the **middle of the five-unit hilt** as local origin.
The visible grip handle sits exactly at `joints.weapon_socket`; there is no displaced
handle or offset between pivot and hilt midpoint. Existing authored socket offsets
are retained. **Center grip on hand** removes that positional offset and aligns the
hilt midpoint to the existing hand articulation anchor, keeping grip angle settings.
A pinned grip must be unpinned before centering if it is currently displaced.

Each equipped sword, hammer and baton has a **weapon tip** handle at its actual
longitudinal distal end, including the weapon's current projected length. It is a
derived editing handle, not a new bone/joint in exported skeleton topology. Custom
definition lengths work too; hammer head width and grip dimensions remain unchanged.

Drag the tip around the grip to aim. **Tip drag moves attached arm** defaults On:
pulling inward/outward from that arc translates the requested grip and moves the
attached hand through existing current-length IK or Depth / Extension, then aims
the weapon. Turn it Off for angle-only dragging around a stationary grip. Detached
weapons also aim around their stationary grip without moving the arm. For attached weapons, both tip aiming and numeric weapon-angle edits turn the wrist
with the weapon, retaining the hand-to-weapon grip angle. Numeric angle editing
remains available with rotation inheritance locked; it adjusts the wrist rather
than fighting that constraint. Detached weapons rotate without changing the hand. Pin conflicts reject moves; unreachable normal-IK targets clamp to arm reach
and a fixed projected weapon length rather than stretching the weapon. Facing and
body-view changes use the same derived tip geometry.

The actual grip can overlap the hand handle when aligned. Dragging that shared point
moves the attached hand unless **weapon socket** was explicitly selected in Selected
point; select it there to adjust a positional offset independently. The tip supports
pointer dragging, exact Selected point X/Y coordinates and arrow-key nudges.

**No weapon** in the existing Weapon selector hides both artwork and weapon handles.
It preserves the last kind, projected length and attachment settings, so selecting
that weapon again restores them. Poses/keys serialize this as `weapon.visible:false`;
missing visibility means equipped. Visibility changes discretely at transition
midpoint (or obeys Hold), while keys/source JSON remain complete. Ghosts, previews,
local reload, project imports and transparent sprite export honor the same state.
Weapon-family animation sets remain sword/hammer/baton; unequipped keys can appear in
any sequence without adding a new weapon family.

Manual test: aim each weapon using its tip, pull an attached hammer to reposition
its arm, repeat with a shortened/released arm, switch views and verify the hilt
pivot. Select No weapon, reload, equip again, then duplicate visible/unequipped
animation keys and preview/export to verify the toggle.

## Authored combat VFX

Choose **Effects** in the right inspector, then open **Authored combat VFX**.
Create pose keys first, pick a preset/type, then **+ Add effect**. Twelve effects per
pose are supported. Effects are inserted across the selected animation's keys with
stable IDs. Edit width/size, opacity, placement or rotation on individual keys to
animate them with the existing easing/Hold. Duplicate keys retain independent full
snapshots. Delete effect removes that ID from the animation; Undo restores it.

Five procedural types are available:

- **Weapon Trail / Swoop:** tip/head/grip path, width, taper, smoothing, curvature,
  exaggeration, start/end extension, optional progressive reveal, and frozen path.
- **Impact Burst:** position/rotation, size, ray count, thickness and directional stretch.
- **Shockwave:** center/rotation, ellipse width/height, thickness, opacity and scale.
- **Afterimage:** selected source key or negative time offset, opacity, offset and scale;
  reuses the previous full character/weapon pose without recursive effect rendering.
- **Speed Lines:** center/anchor, rotation/direction, deterministic count, length, spread
  and thickness. No random particle simulation is involved.

Eight presets populate editable values: Wide Anime Slash, Heavy Hammer Arc, Fast
Thin Slash, Ground Slam Burst, Ground Shockwave, Dash Streak, Heavy Impact and
Character Afterimage. Ground presets use the pelvis plus a 24-unit ground offset;
adjust it for your actual pose. Presets do not lock any controls.

**Shared active range** accepts seconds or key references. Start/end key references
follow retiming; conflicting ranges reject a retime. Matching IDs share timing
edits across keys. Small tracks under the pose-key timeline show those ranges;
click a track to select its effect. Scrub, Play/Pause and Loop use the same animation
clock as the character. Geometry/opacity/transform values interpolate between
adjacent pose keys; effect type, layer, enabled state and source choices are discrete.
A single-key active interval creates a deliberate impact/smear frame.

For a slash, choose Path start/end keys and **weapon tip**. For hammer arcs choose
**weapon head**, which samples the head center rather than its distal edge. The
solver samples 25 poses over the authored range using current weapon projection,
root/facing, views, attachments and animation easing. A ribbon follows those points;
width/taper shape its edges, smoothing blends neighboring path samples, and
curvature/exaggeration/extensions deliberately reshape it. Unequipped motion breaks
ribbons rather than connecting across missing weapons. **Reveal with motion** grows
through the source range; otherwise the full swoop is shown during its active range.
**Freeze current swoop path** stores the longest continuous path as editable source
geometry for that key, independent of future weapon motion. Parameter and transform
controls can then produce exaggerated smear frames. Use live weapon path restores
motion-derived geometry. There is no freehand node/vector editor.

Effects serialize as optional `pose.vfx` objects: unique ID, type, enabled/opacity/
color, layer, pixel snapping/opacity steps, transform, range, source and typed params.
Frozen trails also store `path_points`. These complete objects live in animation
key poses and in project/pose JSON. Source animation/key references and optional
`vfx_frame_time` preserve saved pose-library presentation. Export Project or animation
JSON carries motion sources; a standalone pose without its source animation can
show static primitives/frozen trails but cannot reconstruct afterimages/live trails.

Layer choices are behind character, behind weapon, between character and weapon,
in front of character and in front of everything. Ordering follows the weapon's
existing front/behind setting. Each object has one layer; a ribbon cannot wrap
partially behind/in front without separate authored objects. Afterimages reuse the
whole source pose, rather than offering per-body-part masks. The shared renderer
prevents previews and baked output from taking different paths.

Sprite ZIP export includes VFX in bounds, layer order and PNG/sheet pixels. Thick
strokes get extra padding. Normal FPS exports include authored pose keys plus exact
VFX appearance boundaries; key-only export intentionally samples pose keys only.
Editable project JSON in the archive remains the source of truth. Effects rasterize
directly at selected output resolution, with optional integer vertex/placement
snapping, crisp edge hints, stepped opacity and no blur filters. This supports pixel
art workflows but does not guarantee production art style; inspect at gameplay scale.
Existing frame/pixel limits still reject oversized exports without truncating them.

Manual test: make a four-key sword swing, add Wide Anime Slash, set source keys and
vary width/opacity on the impact key. Try Heavy Hammer Arc with head sampling; add a
burst at contact, an expanding/fading ground shockwave, Dash Streak and Afterimage.
Retiming, duplication, scrub and loop should keep effects synchronized. Save/reload,
export/import the project and bake at 1–2 pixels/unit; check layering, crisp edges and
smear readability. Runtime damage, collision, particles, hit-stop and camera effects
remain Godot responsibilities.

## Approved turnaround rig and hair

In **Setup**, click **Apply approved view rig** to install the five traced, editable view scaffolds and body outlines while retaining your current pose. Choose a Body view, then **Load traced view pose** to start from that view's measured reference pose. Refine the joints in Pose/Rig geometry and the Bézier contours in Outlines; save each finished pose to your library. Loading another reference preserves already-installed contour edits. Applying the approved rig again deliberately restores its original traced contours.

All five views include transparent head/hair crops from the supplied approved sheet, using original RGB pixels. Head position, rotation and head-radius scaling move the combined image as one rigid piece. The scarf remains separate. Mirrored left views reflect the right artwork, including its asymmetric hair. Head/hair assets are embedded in sprite exports and retained through project JSON.

Profile far-side joints are inferred where hidden; hands and feet use simplified editable contour fits. These are starting points for your final alignment. Existing saved custom rigs and poses are retained until you explicitly apply/load the reference. **Use pose as rig** can adopt an adjusted pose as your default skeleton. Export Project before significant manual work.

## Manual scarf animation

Choose **Scarf** in the right inspector. Its compact section offers **Scarf Visible**, **Edit Tail A/B** and independent layer selectors. In Pose mode, select a tail and drag its three blue controls; the hollow root follows the neck and is edited through the existing scarf-root/head joints. Arrow keys nudge a focused control (Shift for a larger step). Select the same tail button again to hide controls; the global Handles checkbox also hides them.

Each tail is a broad tapered polygon generated from a short smoothed centerline: one shared neck root plus three downstream controls. There is no physics, collision, wind or automatic lag. Width is initialized from rig scarf width and stored per tail; advanced width adjustments are available through editable JSON. Existing legacy poses without scarf metadata retain their original fixed artwork until scarf authoring begins.

Pose/key JSON stores optional `scarf: {version:1, visible:true, tails:{a:{points:[[x,y],[x,y],[x,y]],width,layer},b:{points,width,layer}}}`. Coordinates are local to the scarf root, rotated by the torso; the root follows head translation and view retargeting. Changing views preserves the local tail points; **Mirror Pose** reflects them. Head rotation alone does not rotate the neck attachment. **Use pose as rig** retains the scarf as the New/Reset neutral shape.

Duplicate keys copy the complete scarf state. Points and widths interpolate using the existing outgoing-key easing; Hold keeps the earlier shape until the next key. Visibility and layers switch at the transition midpoint. Legacy keys missing metadata use the standard neutral tail shape when mixed with authored keys. JSON remains canonical.

Layers are **Behind Body**, **Between Body and Front Arm/Weapon**, and **In Front of Body**, independently for each tail. The middle choice uses the front arm according to the current view's draw order; when there is no arm after the torso, it falls back to just before the front weapon/collar. These are whole-group layers, with no masks or wrapping within a single arm. Front-body tails remain behind an equipped front weapon. The collar remains a separate neck piece in its view's existing scarf layer.

The same renderer is used for poses, thumbnails, timeline/blend previews, VFX afterimages and sprite ZIP baking. Both tails, visibility and layer order are included in PNGs and bounds; no separate runtime scarf rig or sprite is needed. Compact controls can produce self-overlapping ribbons at extreme bends; refine those manually.

Manual test: create windup, strike, impact and recovery keys. Pose body, then Tail A/B; duplicate and adjust each to show lag/overshoot. Scrub with easing and Hold, switch all five views, move the head, mix behind/front tail layers, hide the scarf on one key, save/reload and export the sprite ZIP. Inspect the PNGs at gameplay scale for attachment, silhouette and layer readability.

## Workspace and quick navigation

The center canvas stays visible while authoring. The left **Library** contains saved poses and animation sequences; the right **Inspect** selector switches Body/selected point, Weapon, Scarf, Effects or Pose settings. Clicking a joint, weapon, scarf tail or effect opens the corresponding inspector. Selected joint/chain length and limb depth controls are together; selecting a limb also selects its depth controls. The selected handle draws above overlapping handles. **Show all pose angles** exposes the full rotation list when needed.

The header identifies the current pose, animation/key/time, default rig, view outlines or read-only preview. **Changes saved locally** indicates browser storage; **Save to Pose Library** writes a reusable named pose. **Library copy differs** means the local draft has diverged from that library entry. Use **Export → Export Project Backup** for a durable editable copy. If storage fails, the header requests a backup instead of claiming changes were saved.

**File** holds import and previous-project backups. **Setup** holds approved-view rig/reference loading and default-rig adoption/restoration. **Pose tools** contains duplicate/reset, swaps, bend flipping and limb clipboard actions; **Root options** contains view root locks/snapping. Undo/Redo, body view, Mirror and Depth/Extension remain accessible. Reference/ghost controls sit in the inspector; explanatory notes are expandable Help sections.

Choose/create an animation in the left library, then use the **Animation timeline** dock below the canvas for keys, timing and playback. The dock has a bounded height and its own scrolling. Select **Effects** in the inspector for VFX parameters; timing tracks remain in the timeline. **Compare two poses** is a separate optional bottom panel. **Export → Bake sprite frames…** opens baking settings in a dialog; Escape closes dialogs and menus. On narrow screens the canvas comes first, followed by scrollable/reachable library and inspector sections.

Manual check: select an elbow, shorten its chain, pose a scarf tail, duplicate a key and preview. Switch weapon/effect inspectors without losing the viewport, compare saved poses, edit a view outline, export project JSON and bake PNGs. Reopen the project and check that existing authored data remains intact.

In Rig geometry mode, head and scarf-root handles edit the selected view scaffold and the displayed artwork follows those anchors directly. Neutral authored offsets are retained through default-rig adoption and project reload. Pose mode continues to edit the individual pose/key.

## Front armor image parts

Choose **Body view → Front**. **Front body art → Armor PNG segments** uses 16 cropped parts from the supplied monochrome sheet: two upper arms, forearms, hands, thighs, shins, feet and knee plates, plus chest and combined waist/pelvis. The existing front head/hair and separate animated blue scarf stay in use; the sheet's head is excluded. Other views retain their current artwork. No existing pose or skeleton is replaced.

Images rotate around measured source pivots and stretch along current physical bone lengths. Limb width follows rig thickness, hands/feet keep their existing rotations, and current IK, Depth/Extension, gaps, weapon grip and view layers remain authoritative. Knee plates attach at knee joints. Chest and waist/pelvis follow existing torso/pelvis transforms. Front poses/keys, thumbnails, previews, VFX afterimages and baked sprites share this renderer. Embedded PNG data allows sprite baking without separate image requests.

For final alignment, choose **Rig geometry → Rig settings → Front armor alignment**. Select a part and adjust **offset X/Y** or **scale X/Y**. These alter artwork relative to its bone, without changing skeleton lengths. Optional rig JSON `front_armor` stores `enabled` and per-part `adjustments:{part:{offset:[x,y],scale:[x,y]}}`; source pivots and PNG assets are bundled with the editor. Offsets are local units, scales 0.1–3. Undo/reload/project export retain them. **Front body art → Editable outlines** restores the geometric renderer. Outlines mode always displays the editable vector contours, which do not deform the PNG artwork.

The original RGBA colors/transparency are retained. Cropping separates the body from the connected head/neck region; the connected waist/pelvis remain one image. Source SHA, crop boxes, pivots and reference widths/lengths are in `reference/front_armor/provenance.json`. The development helper `extract_front_armor.py SOURCE.png` regenerates crops and the embedded asset bundle from the original 1192×1320 sheet (Python/Pillow/NumPy).

Limitations: this is front-view artwork with affine segment scaling, without texture mesh deformation or 3D perspective. Pivots/proportions are an initial fit for your final adjustment. Existing weapon grip offsets are retained; refine hand image/grip alignment for individual poses if needed. Colors controls affect geometric art, not source PNG colors. Added custom bone segments retain their geometric artwork.

Manual check: front-view neutral pose, arm and leg bends, shortened/released limbs, mirrored pose, hand/weapon angles, independent scarf layers, animation keys and PNG sprite export. Switch profile/back views and return; inspect alignment at gameplay resolution before adopting final proportions.
