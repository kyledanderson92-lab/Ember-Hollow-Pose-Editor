# Neon Stick Sol animator

[Open the editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/)

Source revision: **2026.10.15.manual-stickers.v21**. Refresh an open tab after updates.

Pose by dragging the character. Chain IK stays above the canvas; 2D, 3D, Free and Stretch movement control connected reach, foreshortening and extension. Common anchor pins are always visible. Select overlapping anchors through the anchor dropdown. Grip, Slide and Free hand modes control weapon contact; directly dragged Slide hands may cross the other hand, while weapon-driven sliding stops at overlap.

Head/torso selection offers Restore neck/torso length. Restore all lengths covers arms, legs, neck and torso. Shared proportions live in Character setup and save across poses and animation keys; body defaults correct overextension while preserving foreshortening. Reference images and character alignment can be dragged directly.

The animator supports timeline scrubbing, capture of interpolated poses as keys, onion skins, multiple ghosts, playback and transparent sprite exports. Effects are manually placed **still-image stickers**. Choose an Image set and an individual thumbnail. Drag the image to move it; side handles stretch, corner resizes and top handle rotates. Shift-click images or timeline rows to select a group. The same handles and hue/flip controls work on one image or the selection. Each labeled interval below the character keys has draggable start/end markers; drag the bar to move it, or move multiple selected intervals together. Whole animation preserves keyed motion; This key animates visual changes at a character key. There is no separate effect playback or FPS to synchronize. v20 projects keep their placement/timing, using their held image or former start image.

Use **File → Import JSON** to load projects or animations. Save with **Export Project Backup**; browser autosave stays on the current computer/browser and does not sync across devices. Make a backup before importing or moving computers.

Downloads: [original 28-action project](exports/neon_stick_actions.json), [sword benchmark](exports/sword_forward_benchmark.json), [user-authored hammer attack](exports/hammer_slam_animation.json). Existing [action references](references/) and run-review downloads remain available as earlier review material.

Open index.html in Edge or Chrome, or use the hosted link. No account, installation or paid service required. This repository distributes the standalone editor and example animations; game runtime and private development documents are maintained separately.

The ten CraftPix sequences have [asset provenance](assets/effects/SOURCE.md). [Godot effect playback](runtime/README.md) consumes Export Godot effects JSON.
