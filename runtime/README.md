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

Alternatively call `play()` and let the component advance independently; `loop` is a clip loop option. `playing = false` pauses that automatic clock. Exported actor scale is applied on load. The data includes authored root/facing: do not apply those a second time in the parent. When an attack's character root is adapted by gameplay, place this node in the corresponding visual coordinate basis.

Native interpolation reproduces the editor's easing/hold, shortest rotation, linear hue, independent scales and opacity. Visibility, mirrors, playback configuration and frame overrides hold until the next pose key. Automatic flipbooks use floor((time-start)*FPS*speed)+start_frame, looping only when requested. End is exclusive. A one-shot disappears after its final frame. Negative Z goes behind the actor, zero/positive in front; same-Z insertion follows the sticker list.

Animation/project JSON remains the editable format. Runtime export is a compact companion clip with only used asset definitions and authored sticker keys; it does not need the editor's generated JavaScript image library. Baked sprite export is also available and includes stickers in the character frames.

No approved game attack is automatically changed by a browser save or by exporting. This component is ready to attach when integrating a chosen authored effect. Existing game dash, hit and procedural weapon presentation are outside this editor refactor.

Validation: `tests/sticker_runtime_fixture.cjs` generates clip/expected JSON for `tests/sticker_runtime.gd`. Copy runtime scripts, the test script and asset directory into a disposable Godot project root, generate the fixture there, import assets, then run the script headlessly. It compares native playback with editor sampling, including boundary cases. Browser hue pixel checks cover white/black/alpha preservation; subjective visual review remains necessary.
