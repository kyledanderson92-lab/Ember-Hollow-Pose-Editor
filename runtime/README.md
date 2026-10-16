# Godot sticker playback

`effect_sticker_player.gd` extends Node2D and consumes **Export Godot effects** JSON. It uses Sprite2D nodes and `sticker_hue.gdshader`, preserving alpha, shading and white highlights. No particles, paths or generated arcs.

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

Native interpolation reproduces character-key easing/hold, shortest rotation, linear hue, independent scales, skew and opacity. Visibility, image and mirrors are discrete. Each sticker holds its selected `image_frame` for its full start/end interval; end is exclusive. Exact affine bases preserve group distortion even when members are rotated or mirrored. Negative Z goes behind the actor, zero/positive in front; same-Z insertion follows the sticker list.

Animation/project JSON remains the editable format. Version-4 runtime export is a compact companion clip with only used asset definitions and authored sticker keys; it does not need the editor's generated JavaScript image library. Baked sprite export is also available and includes stickers in the character frames.

No approved game attack is automatically changed by a browser save or by exporting. This component is ready to attach when integrating a chosen authored effect. Existing game dash, hit and procedural weapon presentation are outside this editor refactor.

Validation: `tests/sticker_runtime_fixture.cjs` generates clip/expected JSON for `tests/sticker_runtime.gd`. Copy runtime scripts, the test script and asset directory into a disposable Godot project root, generate the fixture there, import assets, then run the script headlessly. It compares native playback with editor sampling, including boundary cases. Model affine-corner and native basis checks cover group geometry, including skew and mirrors. Subjective visual review remains necessary.

Version-1 (v20) clips remain accepted but migrate to still images: their explicit held image, otherwise their start image. Flipbook playback is retired. No FPS/speed/loop configuration is needed for individual stickers. The player’s `loop` property repeats the entire companion clip only.

Version 3 includes shared set `pivot` and `content_size` metadata and a sticker `pivot_version`. Sprite2D.offset implements the same artwork pivot as the SVG renderer. Older clip versions remain accepted; missing pivot metadata uses the original canvas center. Recentered legacy objects adjust their local position once to preserve their placed artwork at authored keys.

Version 4 adds each sticker’s `anchor` (`grid` or `pelvis`). New editor stickers default to grid; legacy data without an anchor retains pelvis behavior. Attachment is shared across keys. Switching in the editor preserves each key’s grid-space placement, mirrored basis and skew. Earlier runtime versions remain readable.
