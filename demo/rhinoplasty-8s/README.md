# Rhinoplasty — 8 s shot study (9:16)

A single-page, real-time playback of an 8-second vertical shot: the anatomical
nasal framework from the supplied start plate resolves into the natural result in
the end plate. Everything is drawn on a canvas from the two provided stills — no
video file, no external libraries, no network requests beyond the two JPEGs.

`index.html` · `img/start.jpg` · `img/end.jpg`

## Beat sheet (as implemented)

| time | what happens | code hook |
| --- | --- | --- |
| 0.0–1.0 s | Hold the start plate; amber key glow breathes; the guide lines bloom in. | `P.overlay`, `intro` |
| 1.0–3.0 s | Dorsal refinement: the hump marker descends, the cyan silhouette closes inward to the amber working line, arrows show the bony pyramid narrowing. | `P.dorsal`, `narrowed()` |
| 3.0–5.0 s | Tip refinement: lower lateral cartilages tighten, a suture is traced across the domes, a tip graft and a columellar strut appear. | `P.suture`, `P.graft`, `P.strut` |
| 5.0–6.9 s | Skin redrapes: a warm light bloom reveals the end plate, the anatomical overlay dissolves, the contour line goes cyan → red-orange and fades. | `reveal`, `P.color`, `P.overlay` |
| 6.9–8.0 s | Camera settles on the end plate; the score resolves on a warm chord. | `camera(t)` |

Camera: one stabilized push-in (scale 1.000 → 1.048 by 6.35 s, back to 1.000 at
8 s). Because both supplied plates are full-frame stills, the push-in returns to
exactly 1.000 so the last frame matches the end image.

## Note on the two plates

The start plate is a macro frontal anatomy illustration; the end plate is a
three-quarter portrait in a different room. They cannot be geometrically morphed,
so the change is carried by a warm light bloom (5.0–6.9 s) plus a shaped reveal
mask rather than a cross-fade. If you later get two plates from the same camera
setup, set `reveal` to a plain crossfade and the rest of the shot still works.

## Score

`Score` in `index.html` builds the soundtrack live with WebAudio: three pad
chords (A minor → F add9 → C add9), a sub layer, eight bell partials swelling
through the tip work (3.0–5.0 s), filtered air, and a generated convolution
reverb. Nothing is sampled. First click starts the AudioContext (browser policy).

## Controls

`space` play / pause · `←` `→` step one frame (hold `shift` for 1 s) · `m` mute ·
`l` loop · scrubber for frame-accurate review · the download button saves the
current frame as a PNG.

## Production prompt

The copy-ready prompt for a video model (Veo-class) lives in the collapsible
"Production brief" panel on the page.

## Related

`_redirects` maps `/d/rhinoplasty-8s` to this folder.
