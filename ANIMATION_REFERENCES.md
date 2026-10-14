# Fast stick animation references

Target style: fast, exaggerated action with clear silhouettes. Retarget the motion onto the neon stick rig, with stronger anticipation, readable contact poses, overshoot and recovery. Keep current gameplay timing unless the user explicitly changes it.

| Original author / source | Reuse terms | Useful coverage |
| --- | --- | --- |
| [RGS_Dev — Animated Stick Figure Character 2D](https://opengameart.org/content/animated-stick-figure-character-2d-free-cc0) ([author page](https://rgsdev.itch.io/animated-stick-figure-character-2d-free-cc0)) | CC0, stated by original author | Idle, walk/run, jump, slide/dash, climb, hurt/death, air attack and attack combos |
| [tbbk — Hero Swordsman](https://opengameart.org/content/hero-swordsman) | CC0 | Run/jump, sword and air attack, slide, hurt/death |
| [Segel — Samurai Character](https://opengameart.org/content/samurai-character) | CC0 | Anticipation/recovery, running/backing off, attacks, falling and death |

**Status:** sources and licenses discovered; asset downloads blocked by the cloud host policy. These assets have not been copied or retargeted yet. `exports/neon_stick_actions.json` remains the existing 28-action procedural snapshot, not a new reference-derived animation library.

Source adaptation should record the downloaded asset hash, inspected source frames, and clip-by-clip provenance. Game-specific wall/corner contacts, Slam, hammer and baton variants, and Overclock may need original motion; label those as original rather than claiming a source contains them.

The Motion workshop currently provides 0.25×/0.5×/1×/2× preview, whole-clip retiming, and independent editable 3× Overclock copies. Weapon size scales the whole weapon; foreshortening still preserves hammer-head proportions. Editor exports do not automatically change Godot runtime animations.
