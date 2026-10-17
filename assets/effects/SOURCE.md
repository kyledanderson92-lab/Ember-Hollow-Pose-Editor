# CraftPix slash stickers

User-supplied `craftpix-net-501088-free-slash-sprite-cartoon-effects.zip`. Original PNG bytes are preserved, including each full 496×496 transparent frame; no per-frame trimming or pivot drift. Ten sequences, 87 frames. AI/EPS originals remain in the supplied archive rather than the runtime distribution.

License link supplied in TXT/license.txt: https://craftpix.net/file-licenses/
Source: https://craftpix.net/freebies/free-slash-sprite-cartoon-effects/
No license grant beyond the supplied publisher terms is implied.

Archive SHA-256: 68a2e8eed031718e55bf229a42fe91920ad82b28060d6d5c46e7a210e27d0573

## Shared artwork pivots

All 87 alpha channels were reviewed as ten set contact sheets. Each set uses the center of its alpha-union bounds as a common normalized pivot; `content_size` records that union width/height. Original pixels, canvas dimensions and frame-to-frame alignment remain unchanged. This centers rotation/handles on the set artwork instead of its uneven transparent padding.

## Sequence alignment review

The v31 sequence implementation preserves these original shared coordinates. All ten ordered sets were rechecked for natural progression; no clear isolated source-placement error justified changing the original frames. See [ALIGNMENT.md](ALIGNMENT.md). Per-effect, per-image corrections are saved as reversible sequence metadata, without modifying PNGs, set pivots or older stickers.
