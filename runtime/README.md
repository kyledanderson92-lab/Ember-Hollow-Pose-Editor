# Godot sticker playback

`effect_sticker_player.gd` extends Node2D and consumes **Export Godot effects** JSON. It uses Sprite2D nodes and `sticker_hue.gdshader`, preserving alpha and original colors at neutral settings. No particles, paths or generated arcs.

In Ember Hollow, the default asset root is `res://tools/sol_pose_editor/`. For another project, copy this runtime folder and `assets/effects/`, and pass the directory containing `assets` to `load_clip`. Ensure the JSON and PNGs are included in your Godot export. Example:

```gdscript
const StickerPlayer = preload("res://tools/sol_pose_editor/runtime/effect_sticker_player.gd")
var effects = StickerPlayer.new()
# Add to the actor's visual container, in the editor's coordinate basis.
add_child(effects)
effects.load_clip(JSON.parse_string(FileAccess.get_file_as_string("res://my_attack_effects.json")))
# Drive with the SAME animation clock as the authored character clip.
effects.seek(animation_time_seconds)
```

Alternatively call `play()` and let the component advance independently; `loop` is a clip loop option. `playing = false` pauses that automatic clock. Exported actor scale is applied on load. Grid stickers ignore authored root/facing, while Pelvis stickers inherit them: do not apply those a second time in the parent. Grid means the clip’s authoring coordinates; parenting this node to a moving actor still moves the whole clip in the game world. When an attack's character root is adapted by gameplay, place this node in the corresponding visual coordinate basis.

Native interpolation reproduces character-key easing/hold, shortest rotation, linear hue, saturation, brightness, RGB tint/strength, independent scales, skew and opacity. Visibility, image and mirrors are discrete. Single-image stickers hold their selected `image_frame` for their full start/end interval; end is exclusive. Exact affine bases preserve group distortion even when members are rotated or mirrored. Negative Z goes behind the actor, zero/positive in front; same-Z insertion follows the sticker list.

Animation/project JSON remains the editable format. Version-4 runtime export is a compact companion clip with only used asset definitions and authored sticker keys; it does not need the editor's generated JavaScript image library. Baked sprite export is also available and includes stickers in the character frames.

No approved game attack is automatically changed by a browser save or by exporting. This component is ready to attach when integrating a chosen authored effect. Existing game dash, hit and procedural weapon presentation are outside this editor refactor.

Validation: `tests/sticker_runtime_fixture.cjs` generates clip/expected JSON for `tests/sticker_runtime.gd`. Copy runtime scripts, the test script and asset directory into a disposable Godot project root, generate the fixture there, import assets, then run the script headlessly. It compares native playback with editor sampling, including boundary cases. Model affine-corner and native basis checks cover group geometry, including skew and mirrors. Subjective visual review remains necessary.

Version-1 (v20) clips remain accepted but migrate to still images: their explicit held image, otherwise their start image. Legacy FPS/loop flipbook settings remain retired; new explicit image sequences use version 7. No FPS/speed/loop configuration is needed for individual stickers. The player’s `loop` property repeats the entire companion clip only.

Version 3 includes shared set `pivot` and `content_size` metadata and a sticker `pivot_version`. Sprite2D.offset implements the same artwork pivot as the SVG renderer. Older clip versions remain accepted; missing pivot metadata uses the original canvas center. Recentered legacy objects adjust their local position once to preserve their placed artwork at authored keys.

Version 4 adds each sticker’s `anchor` (`grid` or `pelvis`). New editor stickers default to grid; legacy data without an anchor retains pelvis behavior. Attachment is shared across keys. Switching in the editor preserves each key’s grid-space placement, mirrored basis and skew. Earlier runtime versions remain readable.

Version 6 resolves advanced Follow Weapon motion at 120 Hz plus authored keys, interval and discontinuity boundaries. It also exports each enabled shoulder-ray history once in `sweep_tracks`. Each ray contains its actual shared shoulder/neck origin, normalized direction through the weapon tip, validity and discontinuity marker. The player uploads this history as a float texture; the shader unions adjacent swept-ray triangles, including a partial current ray. Root/hand movement and reversals are retained in grid coordinates. There is no forced full-image completion or independent angle/center configuration.

Ordinary still-image clips remain version 4. Versions 1–4 and nonsweeping experimental version-5 clips stay readable. Version-5 angular companion clips lack the character history needed for this replacement and report a clear re-export error. Editable v24 project JSON migrates to the new mode. Advanced exports reject over 200,000 sticker states, 80,000 sample times or 2,048 rays per reveal interval with a size error. Native playback interpolates solved motion between samples.

The mask is local to the companion node's authoring basis; parenting still moves the whole clip in the game world. The shared shoulder/neck ray extends beyond the actual tip to cover the artwork, and reveals only swept areas. Native guides are not rendered. Use `tests/sticker_motion_native_fixture.cjs` / `sticker_motion_native.gd` for solved-motion/history parity and `sticker_sweep_render.gd` for actual GL mask coverage in both directions. Companion export does not automatically integrate effects into approved attacks.

Effect color defaults: `saturation=1`, `brightness=1`, `tint=[1,1,1]`, `tint_strength=0`. Missing fields in legacy clips receive these neutral values. Color processing applies HSV hue/saturation, RGB tint blending, then brightness; opacity remains separate. Update both player and shader when exporting clips using these optional color fields.


Version 7 adds explicit `sequence: {frames, offsets}` to a sticker. `frames` is a nonempty, ascending subset of original asset indices; each included image gets an equal share of the sticker interval, ending exclusively. `offsets` has one [X,Y] pair per original image, in local artwork units before the shared transform. Removing images preserves corrections for restoration. Shared set pivot/canvas dimensions remain unchanged. Sequence definitions are shared across character keys and do not interpolate. The updated player samples the image from absolute clip time and adjusts Sprite2D.offset without moving the common transform origin.

Grid/pelvis sequence exports keep authored transforms; weapon-follow/ray sequences retain solved motion and shared sweep histories, sampled at 120 Hz plus image boundaries. Ray history is not reset on image changes. The player accepts earlier clip versions as before. `tests/effect_sequences_native_fixture.cjs` and `effect_sequences_native.gd` verify all ten asset sets, image boundaries, shared/corrected placement, visibility and weapon/ray transforms in an isolated project.


Version 8 adds optional `sequence.reverse: true`. The included indices remain ascending and offsets remain keyed by original image index; the sampled slot is reversed at playback time. Forward/missing-false sequences continue exporting as version 7, and older clip versions remain accepted. Use the updated player for v8 clips; previous players reject the unsupported version rather than silently playing forward. Ray history, solved weapon motion and interval boundaries keep their normal direction. Timeline endpoint crossing writes normalized lifetime values plus this direction flag. The native sequence fixture mixes forward/reverse clips across all ten assets, with omitted images and alignment offsets.


Version 9 adds optional `sequence.weights`, one positive finite relative duration (at most 1) per original asset image. Absent weights retain equal slots. Only included image weights contribute to the interval; playback order honors `reverse`. Image alignment remains indexed by original image. The player accumulates weighted durations against absolute clip time, with an exclusive final end. Editor per-image boundary edits normalize weights and share the result and lifetime across character keys; global duration scaling needs no weight changes. Sprite and baked native exports include custom transition boundaries. Use the updated player for custom timing; it still reads prior clip versions. Extending image timing beyond the animation adds a held final character key in the source project without slowing existing motion.
