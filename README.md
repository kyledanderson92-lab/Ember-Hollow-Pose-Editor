# Ember Hollow — Sol Pose Editor

Browser editor for geometric character proportions, Bézier outlines and saved poses.

[Open the editor](https://kyledanderson92-lab.github.io/Ember-Hollow-Pose-Editor/)

Use Pose mode for a working pose, Rig geometry for the default skeleton, and Outlines for shapes. The reference overlay, wheel zoom and pan help precise adjustments. Save Current Pose and Duplicate Current Pose act on the current draft. Use pose as rig makes the draft the New/Reset starting point. Blend interpolates angles and bone lengths; separate arm/leg swaps include attachment points.

Work stays in this browser. Export Project backs up the rig, current pose, saved library and reference setup. Import that JSON on another computer to continue; browser storage does not sync across computers or between local and online editor origins. Full backups download instead of blocking rig adoption when browser backup storage is full.

For offline use, download the repository ZIP, extract it and open index.html. No login, server or build is needed. Public distribution contains the standalone browser files, generated character preset and supplied reference image. Game code, development documents and development history are maintained separately.

Version 2026.10.13.5. Source distribution is copied from tools/sol_pose_editor in the development repository. Review .pose-editor-public-files.json before future updates; copy only its listed files.
