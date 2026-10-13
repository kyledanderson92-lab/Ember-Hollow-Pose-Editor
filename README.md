# Ember Hollow — Sol Pose Editor

Browser editor for geometric character proportions, Bézier outlines and saved poses.

[Open the editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/)

Use Pose mode for a working pose, Rig geometry for the default skeleton, and Outlines for shapes. The reference overlay, wheel zoom and pan help precise adjustments. Save Current Pose and Duplicate Current Pose act on the current draft. Use pose as rig makes the draft the New/Reset starting point. Blend interpolates angles and bone lengths; separate arm/leg swaps include attachment points.

Body view offers five categories (profile, 3/4 front, front, 3/4 back, back) with mirrored left/right variants. Changing view carries the current limb pose, lengths, added segments and weapon grip to the new shoulder/hip scaffold. Preset shoulders/hips can be locked independently or manually overridden; Snap roots restores the selected scaffold without resetting the pose. World pins are preserved; an incompatible switch leaves the previous pose/view intact. Rig geometry edits each view scaffold; Outlines edits its body contours independently. View art is geometric development art, and cross-view blend switches art at the midpoint rather than performing a 3D turn.

Connected segments can be extended from endpoints and safely removed. Pin any anchor, resize a pose bone explicitly, and restore selected/chain/all lengths from the separate rig baseline. Weapon attachment supports detached, position-only and hand-rotation modes with a captured grip offset.

Work stays in this browser. Export Project backs up the rig, current pose, saved library and reference setup. Import that JSON on another computer to continue; browser storage does not sync across computers or between local and online editor origins. Full backups download instead of blocking rig adoption when browser backup storage is full.

For offline use, download the repository ZIP, extract it and open index.html. No login, server or build is needed. Public distribution contains the standalone browser files, generated character preset and supplied reference image. Game code, development documents and development history are maintained separately.

Version 2026.10.13.8. Source distribution is copied from tools/sol_pose_editor in the development repository. Review .pose-editor-public-files.json before future updates; copy only its listed files.
