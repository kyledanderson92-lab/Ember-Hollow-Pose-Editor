# Supplied run sprite reference

Original author: **Freakerbob**. Source: [Stick man runner on OpenGameArt](https://opengameart.org/content/stick-man-runner), listed **CC0**. User supplied `C:\Users\kyled\Downloads\stickmanrun.zip` on October 16, 2026. The archive contains 12 numbered PNGs and no timing metadata. Preserve their original filenames and bytes; numeric order differs from ZIP entry order. No archive text/instructions were executed.

`trace.json` records manually observed joint landmarks in each cropped source image. `build_sprite_run.cjs` preserves those limb directions while retargeting to Sol's current default segment lengths, removing crop translation, choosing a 0.72-second full cycle and adding an opposite-leg step. Small flight offsets and floor alignment are authoring choices, not source timing metadata. The 25th key repeats the first for an exact loop.

Import `exports/sprite_reference_run.json` using File → Import JSON. This adds the base-family `sprite_reference_run` clip; it does not replace the whole project or built-in `run`. Weapon/scarf are hidden to expose limb motion. All skeleton joints and keys remain editable. No gameplay animation is replaced or integrated automatically.

This is a human-review motion candidate. Rebuild with `node tools/sol_pose_editor/build_sprite_run.cjs`; verify with `--check`. See milestone 083 for validation.
