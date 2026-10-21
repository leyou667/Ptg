# DIRECTION SHEET — Type and nothing else
seed 1899147688 · drawn 2026-10-21 · sector other · tone quiet
Brief: CheyClean, société de nettoyage en abonnement en Belgique pour particuliers et sociétés, vente sur devis, marque marine et cyan, étoile à quatre branches

| | |
| --- | --- |
| Direction | Type and nothing else |
| Hero | Headline across two fields |
| Type | kept from the brand |
| Colour | kept from the brand |
| Sections | features (Capabilities as a menu) → how-it-works (Lines that step across) → showcase (Two giant words compared) → faq (Wide heading, indented questions) → cta (Question at both edges) → footer (Name first, places under it) |
| Motion | Colour by chapter |
| Photographs | the "Water" set, as atmosphere |

This is the direction for this build. Adopt it. Do not blend it with the layout you would have made anyway,
and do not redraw because it is unfamiliar: unfamiliar is the point. Redraw a slot only when it conflicts
with a stated brand constraint or needs an asset that does not exist, and say why in your report.

The parts of this sheet were written separately and will disagree in small ways. Settle every disagreement in this order:
**house rules** (including type no smaller than 13px and body text of 16px or more) → **the direction** (the idea, the composition habits, where the
one accent goes) → **the type system and the palette** (which face does which job, the five size steps, which colour is the ground and where the
accent goes) → **the hero blueprint** → **the section blueprints**. Under each blueprint below, "Adjusted for this page" lists where it disagrees.
In practice: take geometry from blueprints (columns, proportions, what sits where) and take everything else from above them. Map every size a
blueprint names onto one of your five type steps instead of adding a sixth. Use one button shape, one corner radius and one pair of page margins on
the whole page, whatever individual blueprints say. If a blueprint names a kind of typeface (a light serif, a heavy grotesk), use the dealt face.

## 1. The idea
The first screen is made only of words, colour and space, good enough that nobody misses a picture there. Pictures arrive later, large and few, as relief from the type. This is the honest answer when a subject has nothing worth photographing: instead of inventing illustrations, set what you have to say as well as it can be set. The typography carries a point of view through scale (one enormous statement, everything else small), through measure (a narrow, bookish column or a full-width line), and through one committed colour.

Before anything else, write one sentence in your notes: "On this page, <the subject's own material> becomes <the device>."
Fill the first blank from your inventory of what only this client has (its name and what it means, its street, its numbers, its
constraint), then put the nearest competitor in the sentence: if it still works, the idea is the category's, not the client's.
Then name the one live thing the visitor can do on the page (SKILL.md step 4).

## 2. Composition
First screen: the statement, two lines at most, set at 9–14vw and occupying the full width with tight leading, positioned in the upper two-thirds. One supporting sentence at 20–24px sits bottom-left on the same margin and the single action sits bottom-right on the same baseline. No navigation bar; two or three links in a top corner. Sections that follow are typographic set pieces, each different: a list of five to eight capabilities set at 4–6vw one per line; a paragraph at 28–36px in a 28ch column pushed to the right half; a pair of large numerals with a sentence each; a single quotation filling a colour field. Each section uses a different horizontal position (left, right, full) so the page has movement without imagery.

## 3. Type
Kept from the brand. This direction lives or dies on the face and its settings. Display at tight tracking and leading; text sizes few and far apart (for example 15, 22, 34 and the display size). Use real typographic detail: proper quotes, balanced line breaks, hung punctuation where it helps.

## 4. Colour
Kept from the brand. Either one saturated ground for the whole page with a single ink, or paper and ink with one section inverted and one in the accent as a full field. Colour does the job images would have done.

## 5. Imagery
**The project has no photographs of its own yet.** First choice: **real pictures of the subject's world from the open collections**: its city and street in old postcards and photographs, an old map of the neighbourhood, its materials up close, its trade in engravings, museum objects of its kind (references/imagery.md §3). Start with `node /home/user/Ptg/.agents/skills/design-taste-frontend/scripts/assets.mjs "<a place, material or object from your inventory>"`. Download what you use into the project with `--get` and credit every one on the page (`--credits` prints the footer line). They show the world around the client, never the client's own room, dish, product, person or team. Second, for what no honest picture exists of: draw the subject's own things in code, large, in one flat graphic language and the palette's real colours (its tiles, its windows, its objects; references/imagery.md §8). Third: the dealt photographs, only where an honestly generic picture fits (the sea, the weather, a material), never one a visitor could take for the thing itself and never an unrelated scene. One treatment for all of them. If this direction is built on photographs, plan the set before building (four to six pictures of one family) and reuse them at different crops and scales instead of finding or drawing a new picture for every slot; keep drawings as `<symbol>` + `<use>` or generate them with a small script so the page stays light. List every found picture (with its source and licence), every dealt photograph and every drawing that stands in for photography in your report.

The first screen has no picture. Further down, real pictures of the subject's world (found with scripts/assets.mjs) arrive large and few: a full-bleed photograph between two type sections, a looping clip in one band, an archival image beside a list. Do not add icons, shapes, patterns or abstract graphics to compensate for anything.

**Floor (the inspector checks it):** at least four real pictures on the page, usually six to twelve; SVG drawings do not count. One moving picture where an honest clip exists: `node <skill>/scripts/assets.mjs --video "<query>"`, used as a muted loop with a poster frame. Whatever this direction says about pictures, it is carried out with real ones.

Photographs dealt for this build, from the "Water" set (lakes, rivers, waterfalls and water surfaces)
Order of preference for imagery: (1) the project's own photographs and product shots; (2) images you generate, if an image tool is
available; (3) real pictures of the subject's world found in the open collections (assets.mjs, downloaded and credited on the page);
(4) drawings of the subject in code; (5) these. They are real photographs (Unsplash licence, served by picsum.photos) of places, light and
texture. They are atmosphere, never a stand-in for a specific product, dish, person or interface. List the ones you use in your report so
they can be replaced.
- `https://picsum.photos/id/124/1600/1000` — Small red boat floating on clear turquoise water, seen from above · mid tone · turquoise, teal, red · calm area: right · native landscape · photo: Anton Sulsky
- `https://picsum.photos/id/1038/1600/1000` — Small red boat on a wide expanse of dark blue rippling sea · dark tone · deep blue, slate, red · calm area: bottom · native portrait · photo: Marcelo Quinan
- `https://picsum.photos/id/469/1600/1000` — Two people paddling a canoe across a misty green lake · mid tone · emerald green, pale grey, teal · calm area: bottom · native landscape · photo: Matthew Clark
- `https://picsum.photos/id/293/1600/1000` — Silhouetted pier on a hazy blue lake below faint mountains · mid tone · pale blue, navy · calm area: left · native landscape · photo: Paul E. Harrer
- `https://picsum.photos/id/846/1600/1000` — Inside the curl of a breaking teal wave · mid tone · teal, sea green, white · native landscape · photo: Jeremy Bishop
- `https://picsum.photos/id/716/1600/1000` — Deep blue open sea with small rolling waves · mid tone · deep blue, teal · calm area: all · native landscape · photo: Matthew Kosloski
- `https://picsum.photos/id/74/1600/1000` — Small boat on a bright blue bay with a distant city skyline · mid tone · bright blue, sky blue · calm area: top · native landscape · photo: Isaak Dury
- `https://picsum.photos/id/1044/1600/1000` — Rocky river flowing through a misty mountain forest · mid tone · grey green, mist grey, teal · calm area: top · native landscape · photo: Steve Carter
The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and
add `?grayscale` to desaturate. Use three to six of them, not all eight. Always set `width`, `height`, `alt` and `loading="lazy"` (not on the hero image).
Other sets that fit this brief: hands-and-making, coast, interior-and-table, plants-and-flowers — `node draw.mjs --photos <set>` prints one in full; `--photos list` shows all sets. Taking photographs from another set is your call and is not a redraw; keep them to one light and one treatment.

## 6. Hero — Headline across two fields
The viewport is two flat fields meeting at exactly half height: paper above, one saturated colour below, with a hard edge and nothing drawn on it. A two-line headline in black-weight capitals at clamp(96px, 9.5vw, 150px), line-height 0.86, is centred across the seam and spans about 70% of the width, so line one stands on the upper field and line two is cut through its upper third by the seam. The type changes ink where it crosses: above the seam it takes the accent ink, below it a deep ink two steps darker than the lower field, as if submerged. Build it as two stacked copies of the same headline, one per ink, the first clipped with `clip-path: inset(0 0 50% 0)` and the second with `inset(50% 0 0 0)`. Wordmark top-left at 28px; up to four text links and the single action, a solid rectangular button, top-right. One supporting sentence at 20px in the paper colour is centred on the lower field, 56px above the bottom edge. The lower field continues for 30svh past the fold before the next colour begins.

On a phone: The same two fields with the seam at 46svh. The headline stays on two lines at 15vw, centred, still cut by the seam and still changing ink. Wordmark top-left and the action button top-right; the links drop into one menu word beside it. The supporting sentence sits on the lower field at 16px, centred, max 28ch, with 40px beneath it.
Headline: A statement of two to four words on two lines, up to about 10 characters per line, whose meaning the rising field acts out.

Adjusted for this page:
- It names a kind of typeface: use the brand faces.
- It names colours (black): map them onto this palette's roles (ground `--bg`, panels `--surface` and the fields, text `--ink`/`--muted`, the accent `--accent` on the primary action only).

## 7. Sections, in order
Each is a composition to rebuild with this project's content. Keep the geometry; change the subject. Re-order or drop a
section when the argument of the page needs it (see references/copy.md), never to fall back to a card grid.

### 1. features — Capabilities as a menu (table)
The capabilities are set as a printed menu or price list. One paper-coloured sheet, 520–600px wide and taller than it is wide, sits on a contrasting flat ground, centred or starting at column 2; its top and bottom edges are cut into shallow scallops or a zigzag with clip-path, its sides straight. On it, centred at the top, the heading: two or three words at 44–56px, then 40px of space. Below, items in two or three groups; each group opens with its name at 20px bold. Each item is a row: the name at 19px on the left, a short value on the right (a price, a time, a quantity, 'included'), and between them a leader of round 4px dots (border-bottom: 4px dotted, sitting on the baseline). A description at 15px in the soft ink sits under the name, at most 34ch. 18px between items, 44px between groups.
On a phone: The sheet fills the width minus 12px margins and keeps its cut top and bottom edges. Names stay left and values right on one line with the dot leader between; descriptions wrap beneath at 15px. Group names drop to 18px. Padding inside the sheet is 20px.

Adjusted for this page:
- It draws lines or borders: keep them only inside a table, a form or a `data-ui` fragment; elsewhere separate with space or a change of ground.

### 2. how-it-works — Lines that step across (statement)
The sequence is written, not counted. Four lines of display type, one stage per line, each a complete short clause that begins with its order word: 'First you send it.' 'Then we take it apart.' 'You choose one.' 'It ships on Friday.' Set at clamp(36px, 4.6vw, 76px), leading 1.0, one line each. The first line starts on column 1 and each following line starts two columns further right (grid-column-start 1, 3, 5, 7), so the block descends as a staircase and the eye follows the diagonal. Under each line, on that line's own left edge and 12px below, a sentence of up to 34ch at 17px in the soft ink. 56px between stages. The last line may take the accent colour as the single emphasis. The first line serves as the heading; there is no title above. Leave the columns to the left of the final stage empty.
On a phone: Lines drop to 8.4vw and may wrap onto a second line. The staircase becomes a smaller indent of 6vw per stage, so the fourth line starts 18vw in. Each sentence sits under its line at 16px on the same indent. 40px between stages.

### 3. showcase — Two giant words compared (statement)
No photographs: the thing shown is a pair of words, characters or figures that make the point by comparison (before and after, input and output, ours and the usual). At the top of the section, on one row: the heading, two to four words at 28–36px, at the left margin, and a paragraph of up to 60 words at 17px starting at column 7. Then 12vh of space. Below, two specimens side by side, one starting on column 1 and one on column 7, each set at clamp(180px, 34vw, 520px) with leading 0.8, so each fills about half the viewport's width. The section has a fixed height and overflow: hidden, so its bottom edge cuts both specimens at roughly 60% of their height. One short caption at 16px sits above the top-left of each specimen, naming it. Both specimens share one ink; the difference is in the letterforms or values, not in colour.
On a phone: Heading first, then the paragraph, at full width. The two specimens stack, each at 62vw type size in its own 38svh box with overflow hidden so the lower part is cut. Captions sit above each box at 15px. The second box takes the inverse colours of the first.

### 4. faq — Wide heading, indented questions (list)
A heading of three to five words at about 5.5vw runs from the left margin on one or two lines and is the only large thing in the section. 80px beneath it the questions begin, indented to start at column 5 and running to column 12, so the left third under the heading stays empty. Each question is a row at 22–24px in the regular weight with a chevron of two 2px strokes at the far right; rows are separated by 36px of space and no rules. Opening a row lays a tile of the one-step tone behind that row and its answer (24px padding, extending 24px beyond the text on both sides) and shows the answer at 17px with a 48ch measure. Six questions. Nothing else shares the screen; the indent against the wide heading is the composition. Build with `<details>`.
On a phone: The heading sits at 10vw on two lines. Questions lose the indent and run full width at 19px with 28px between rows; the open row keeps its tone tile, now bleeding to both screen edges, with the answer at 16px inside it.

### 5. cta — Question at both edges (statement)
For a closing choice between two answers: book or ask, this date or that, the tasting or the tour. A flat field exactly 100svh tall in the darkest tone. The question is a two-line heading at clamp(110px, 11vw, 168px), leading 1.0, centred, about 54% of the width: line one with its cap line 32px under the field's top edge, line two with its baseline 24px above the bottom edge. The band of about 560px between them is empty except for one row at its optical centre: two solid rectangular buttons, each about 200×56px with its label at 18px in medium weight, their inner edges 120px either side of the centre axis, and between them, exactly on the axis, the word 'or' at 18px in the soft ink. 16px under the row, centred, one line at 16px in the soft ink says what happens after either choice. The type above and below closes the empty band, so it reads as held breath rather than a gap.
On a phone: The question drops to 18vw, still two centred lines, line one 32px from the top and line two 24px above the bottom. The buttons stack at the centre at 72% of the width, 12px apart, with 'or' between them and the line of explanation under the second.

### 6. footer — Name first, places under it (list)
The wordmark opens the footer instead of closing it. On a full-bleed field in the page's inverse or final chapter colour, the name spans the full content width as the first thing, its cap line pushed 8% above the footer's top edge so the tops of the letters are sliced off by the section (`overflow: hidden` and a negative top margin in `em`). 72px beneath, a two-part row: columns 1–5 list the places or ways to reach the studio (cities, or email and telephone), one per line at 32–36px in the accent ink, each a link; columns 7–12 hold three columns of small links at 15px, top-aligned with the first place. A final row 96px lower carries the legal line at the left and a back-to-top text link at the right, both 13px. The field is about 90svh tall, and nothing sits between the wordmark and the row but space.
On a phone: The sliced wordmark stays at the top, fitted to the width. Places follow as a list at 26px, then the link columns two across at 15px. Legal line and back-to-top link share the last row at 12px, at opposite margins.

Adjusted for this page:
- It sets text at 12px: use your small step (13px or more) instead.
- It crops letters along their top: the inspector fails that (jurors read it as broken). Crop at the bottom edge or a side instead.

## 8. Motion — Colour by chapter
Each chapter is its own full-bleed field of one palette colour, so the ground changes exactly at section edges as you scroll, never as a global recolouring of the screen. The only movement: the fixed header (or the one pinned element) takes the ink of the chapter beneath it, switching with a 300ms colour transition as each edge passes under it. Do not drive the page background from an observer: in blind tests a page recoloured mid-section, with a paragraph sitting on two colours, read as broken twice.
This is the signature move, the one loud moment. Around it the page still needs the rest of the motion layer (SKILL.md step 9): an entrance for the parts of every section, feedback on every control, and one moving picture. The inspector fails a page that barely moves. Recipes: references/motion.md.

## 10. Where the richness comes from
Scale contrast and colour mass. A capability list set at 5vw is an image in its own right.

## 11. How this direction goes wrong
Without pictures, weak copy has nowhere to hide: write real sentences. Vary the set pieces; four sections of big-heading-plus-paragraph is a text document, not a design. Keep all headings within two lines.

## 12. Real references
Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.
- **CoffeeTech®** (Awwwards Site of the Day, studied score 7.1) `aww-coffeetech-r`
  Idea: Present an industrial roaster maker like a design brand: one enormous three-word statement on black, with the machine withheld until the first scroll, where it emerges from the dark.
  Hero: Near-black viewport with nothing but type. A centred three-line headline, one word per line, in Inter Medium at about 15vw with tight tracking; the first line starts a third of the way down and the last runs to within 35px of the bottom edge, its widest word spanning roughly 70% of the width. Cream letters; no subhead, no media, no hero button. Navigation is one quiet row: logo with a terracotta mark at left, four text links centred, then a filled terracotta 'Products' button with a grid icon, an outlined contact button and a language dropdown at right. The top third stays empty.
  Worth taking: Let a three-word headline at about 15vw be the entire first viewport and withhold the product until the first scroll.
- **bleibtgleich’26** (Awwwards Site of the Day, studied score 7.5) `aww-bleibtgleich26`
  Idea: One thin vertical rule runs down the page and a tight bold grotesk sentence wraps around it, words stepping from one side of the line to the other.
  Hero: White page, black type. Content sits in a narrow band between 26% and 68% of the width. A 1px vertical rule drops from the top edge at 37% for two-thirds of the height. Left of it: a black blob avatar at the top, a tiny role caption at its foot. Right of it: a tiny location note at the top, the name in two lines of 90px medium grotesk at the bottom. The tagline continues below at the same size, flush to the band's left edge, running past the fold. The upper half is otherwise blank. The handle is split into two pale-grey words fixed in the bottom corners; a black menu pill sits top-right.
  Worth taking: Draw one 1px vertical rule and typeset a large sentence around it, alternating words to either side so the line becomes the text's spine.
- **The New Industrials** (One Page Love, studied score 8.3) `opl-the-new-industrials`
  Idea: A long-read essay laid out inside a visible drafting grid, where colour fields shift as you read and 3D machine parts drift through the margins and finally assemble into the publisher's initials.
  Hero: A saturated orange page framed by black hairlines 24px from each edge. Top strip: a monogram logo left, a black pill with orange monospaced title centred, a boxed year right. Under it a row of eight empty outlined cells, 62px tall, like a ruler. A cream panel then fills the remaining width and height. Inside, a WebGL scene of pastel low-poly machine parts with visible wireframes sits behind a two-line uppercase title in a tall condensed slab serif, glyphs about 210px high, spanning 83% of the width. Small monospaced uppercase credits flank it at mid-height; reading time is centred below, with two boxed share links on the bottom edge.
  Worth taking: Draw the layout grid as visible black hairlines, including a row of empty cells, and tag each text block with a small numbered box.
Full notes on any of them: `node draw.mjs --site <id>`.

## Always
Headlines two lines or fewer at every width. No eyebrow labels, no monospace, no 01/02/03, no thin rules, no gradients, no shadows at rest,
no cream-and-terracotta, no violet. The frame: one h1 on the first screen that says what this is, equal outer margins, no
section huddled on one side with the other half empty, no blank stretch over half a screen, a heading on every section.
`inspect.mjs` measures all of it.

Saved to /home/user/Ptg/.taste-skill/direction.json · reprint with `node draw.mjs --show`
