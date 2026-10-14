# Fast neon stick action library

**Ready for review:** `exports/polished_stick_actions.json` contains **41 clips / 300 editable keys**. Choose **Polished · 41 clips** in Animations and click **Load action pack**. Loading asks before replacing the current workspace, creates a local backup and supports Undo. **Original · 28 clips** remains available; its 183-key export is unchanged.

## Actual source and method

Artwork and reference animation: **Raphael Gonçalves / RGS_Dev**, [Animated Stick Figure Character 2D](https://opengameart.org/content/animated-stick-figure-character-2d-free-cc0), [author page](https://rgsdev.itch.io/animated-stick-figure-character-2d-free-cc0). The user supplied the original ZIP. Its included [license](references/RGS_Dev_CC0_License.txt) explicitly permits commercial use under CC0.

Uploaded ZIP SHA-256: `d699cdfc343826738826a71082cf9cda713c15235dd04b6f68f0134d6d51bea5`.

The source PNG frame silhouettes were inspected and their motion hand-retargeted into full-length neon bone-angle recipes. This is an interpreted motion adaptation, not automated skeleton extraction or pixel-identical copying. The original chibi proportions, face drawings and sprite artwork are not used on the game rig. Exact source filenames and origin classifications are recorded per clip and per key. See [reference poses and credits](references/index.html) and [machine-readable provenance](references/action_provenance.json).

## Coverage

- **17 movement clips:** idle, run, takeoff, rise, apex, fall, landing, crouch, wall, corner_hang, slam, hurt, death, dash_right, dash_left, dash_up, roll.
- **12 normal attacks:** swing, upward, sweep and air_swing for sword, hammer and baton.
- **12 powered attacks:** overclock_ versions of those four actions for each weapon.

Movement and sword swing/air attack adapt the source’s poses. Direction-specific attacks, upward dash and hammer/baton choreography are derived additions. Slam and roll are original; the source has no equivalent clips. Clip provenance distinguishes these honestly.

The original action durations remain unchanged, including 0.14-second sword, 0.20-second hammer and 0.11-second baton attacks. New roll duration is 0.36 seconds. Idle/run/held poses loop; attacks, jumps, recoil and death play once by default. These are editor playback defaults, not new gameplay timing rules.

## Polish and editing

Sword uses a broad cutting arc, hammer a deeper load and impact hold, baton shorter anticipation and quick recoil. All four limbs keep connected full lengths. Hammer contact includes authored weapon foreshortening without shrinking the head. Overclock grows the entire weapon by 3× independently from projection. Trails reveal progressively along the authored strike and powered variants use a wider cyan trail.

Open **Motion workshop** for previous/next key ghosts, 0.25×/0.5×/1×/2× playback, **Jump to contact pose**, whole-clip retiming and independent editable **3× Overclock copies**. Key tooltips identify phases; pose notes name reference frames. Retiming scales keys and effect cues together. Preview and ghost overlays do not change the authored poses.

In the game repository, `tools/sol_pose_editor/scripts/build_polished_actions.cjs` reproducibly builds the authored library and provenance. It preserves the original pack. Full-length bones, attached grip/hand orientation, loop seams, direction, source labels and powered geometry are checked in model tests. Browser tests inspect all clips, safe load/Undo/autosave, phase focus and powered sprite export.

**Runtime boundary:** editor JSON does not automatically replace Godot’s procedural animation component. Local root poses are visual references; world locomotion, foot planting, wall/ledge constraints and collision remain runtime responsibilities. Powered clip artwork is separate from the captured 3× melee geometry implemented in the cloud game checkout.
