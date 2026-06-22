# Listing Labels — Frontend Implementation Spec

> Scope: the **Listing Labels** feature as it lives in the side panel and tag-creation flow of the Booking Website editor (Listings section).
>
> **Out of scope for this doc:** the listings *table* itself (columns, the "Listing labels" column rendering, sticky first column, bulk-bar placement). That is already built. This doc only covers the **tag management slice + creation/edit flows** and the cross-cutting rules (save, banners, accessibility).

---

## 1. Terminology

| Term | Meaning |
|------|---------|
| **Listing label** | Guest-facing label shown as a colored badge on top of a listing photo on the published booking website (e.g. "Popular choice"). |
| **Internal tag** | Pre-existing operational label in the "Tags" column. **Different concept** — do not conflate. We always qualify ours as *Listing label* where the two could be confused. |
| **Slice / panel** | The right-hand "Listing labels" panel that slides in beside the listings table. |
| **Assigned listings** | The listings currently attached to a given listing label. |

Naming is deliberate and must stay consistent:
- **New label** = create. **Add to listing label** = assign listings. **Listing labels** = the panel/open toggle. Never reuse "Add" for creation.

---

## 2. Two entry flows

The same panel is reached two ways. Behavior differs only at the *start*.

### Flow A — From a bulk selection (assign-first)
1. User selects 1+ listings in the table → bulk bar appears.
2. User clicks **Add to listing label** → opens the Listing labels slice.
3. From the slice they can assign the selected listings to an existing tag (the `+` per row) or create a new tag (selected listings are pre-attached on create).
4. **The table selection persists after assigning or creating a tag.** Do *not* clear it — the user may want to assign the same listings to another tag immediately. The banner fires, but the checkboxes stay checked. Selection is only cleared by the user (clear button / deselect).

### Flow B — From the table header (manage-first)
1. Nothing selected. User clicks the **Listing labels** toggle in the table toolbar → opens the slice.
2. User creates / edits / deletes tags. No listings pre-attached.

Both flows land in the **same panel** with the **same list/empty/create/edit states** below.

---

## 3. Panel states (think of these as the routing table)

The panel has one of three `mode`s: `list` · `creating` · `editing`.

### 3.1 `list` — empty (zero tags)
- Centered empty state: concentric rings, title **"Help guests find the right stay"**, subtitle **"Group listings under labels like "Popular choice" or "Cancel anytime" so guests can browse with ease."**, primary **New label** button.
- (A website screenshot will replace the placeholder graphic later — leave room for it.)

### 3.2 `list` — populated
- Header: title **Listing labels** + **New label** button.
- One row per tag: color dot · name · "{n} listings" / "No listings yet".
- Row hover (no selection): edit + delete icon buttons.
- When the table has a bulk selection active, each row shows a `+` (assign selected) or `−` (remove selected, when all selected are already in that tag) affordance instead.

### 3.3 `creating` / `editing` — the tag form
Shared form component. Differences:
- `creating` header: **New listing label**. `editing` header: **Edit tag**.
- Fields: **Tag name** input + **color picker**.
- `editing` additionally shows the **Assigned listings** section (only when the tag has listings — see 3.4).

### 3.4 Assigned listings (edit mode only, only when count > 0)
- Section header **Assigned listings** + **Remove all** (tertiary, right-aligned).
- List of assigned listings: square thumbnail (rounded corners) · name · per-row **×** remove (hover).
- **Empty assigned state = render nothing.** When a tag has no listings, the whole section is hidden. There is no "+"/"No listings yet" block inside the edit form — assignment happens from the table selection, not here.

---

## 4. Tag form — fields & validation

### 4.1 Tag name
- Placeholder: `e.g. Popular choice, Best value, Guest favorite`
- Helper (default): **"Appears on top of the listing photo."**
- **Hard cap: 16 characters.** Enforce both with `maxLength={16}` and a `.slice(0,16)` guard (covers paste).
  - Rationale: the badge must fit one line on the website card even for long German/Russian words. 16 is the balance point.
  - At the limit, the helper swaps to an amber message: **"Tag names can be up to 16 characters."**

### 4.2 Color
- Color picker = preset swatches **+ custom hex/native picker**.
- Helper under picker: **"The tag text is always white, so pick a shade dark enough to stay readable."**

---

## 5. Color rules (accessibility — non-negotiable)

Badge text is **always white**. So every fill must have enough contrast with white.

- **Threshold: 3:1** (WCAG AA for *large/bold* text — the badge text qualifies). This is the deliberately looser bar agreed for customer flexibility. (Note: WCAG has *no* contrast minimum at Level A; 3:1 is the loosest *defined* bar.)
- **Preset palette:** two rows of 9 — a neutral/black ramp and a blue ramp — all pre-verified ≥ 3:1.
- **Custom color guard:** on any custom pick, compute white-on-fill contrast. If `< 3:1`:
  - Show error (in picker + under input): **"This color is too light for white text to read clearly. Pick a darker shade."**
  - **Disable Save** until a compliant color is chosen.
- Contrast helper (reference implementation):
  ```ts
  // ratio of white (#fff) on a hex bg; AA large text = 3:1
  function whiteContrastRatio(hex: string): number {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
    if (!m) return 21;
    const n = parseInt(m[1], 16);
    const ch = [(n>>16)&255,(n>>8)&255,n&255].map(v => {
      const c = v/255; return c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4;
    });
    const L = 0.2126*ch[0] + 0.7152*ch[1] + 0.0722*ch[2];
    return 1.05 / (L + 0.05);
  }
  ```

### 5.1 ⚠️ Color source = customer brand settings (key requirement)
The preset palette in the prototype is hardcoded. **In production, the swatches must derive from the customer's two primary brand colors** (the ones configured in the Design settings), generating accessible shades from those — not a fixed blue/black palette. Treat the hardcoded ramp as a placeholder. Generating an on-brand, contrast-passing ramp from two seed colors is its own task — **flag for estimation.**

---

## 6. Save / publish / leave — the persistence model

This is the spine of the feature. **Nothing reaches the live website until the page is saved/published.**

- Any tag change (create, rename, recolor, assign, remove listing, delete) marks the **editor page dirty** → the top **Save** button enables.
- Editing tags is **not** auto-published. Copy must never imply instant live effect (e.g. the delete dialog says changes apply "once you save," not "instantly").
- **No per-action destructive confirms.** Removing listings from a tag, or deleting an empty tag, happens immediately (with a banner). The only confirmation is leaving with unsaved work.
- **Leave-without-saving guard (two places):**
  1. **Back arrow** out of a tag form **with unsaved listing-assignment changes** (added/removed listings) → **"Leave without saving?"** / *"Your changes to this tag haven't been saved yet and will be lost."* → [Keep editing] [Leave]. **Name/color-only edits are low-stakes → leave silently, no confirm.**
  2. **Switching editor sections** (left nav) while the page is dirty → equivalent "leave without saving" confirm.
- **Deleting a tag — two-case confirm dialog:**
  - **0 listings:** *"This tag will be removed. The change goes live on your website once you save."* → [Cancel] [Delete tag]
  - **With listings:** *"All {n} listing(s) will be untagged. This can't be undone. The change goes live on your website once you save."* → [Cancel] [Delete tag]
  - Both cases fire immediately on confirm (no second confirm). The explicit "can't be undone" + listing count is the full warning for the listings case.

---

## 7. Banners (toasts) — copy & behavior

Banners confirm every committed action. Behavior:
- Slide in from the bottom-right; auto-dismiss ~4s; manual dismiss (×).
- **Stack** when multiple actions fire: newest sits above the previous (use `flex-col-reverse`), each with its own timer.
- ⚠️ **Do not fire toasts from inside a state-updater callback** (React StrictMode double-invokes them → duplicate banners). Compute the message outside the `setState` updater.

### Copy (all qualify "listing label" — explicit by design)

| Action | Banner copy |
|--------|-------------|
| Create tag (no listings) | `Listing label "{name}" created` |
| Create tag (with selected listings) | `Listing label "{name}" created with {n} listing(s)` |
| Assign listings to tag | `{n} listing(s) added to listing label` |
| Assign — all selected already in tag | `Already in this listing label` |
| Remove listing(s) from tag | `{n} listing(s) removed from listing label` |
| Save page | `Changes saved` |

- **Math must reflect the actual selection.** When assigning, count only *newly* added listings (exclude ones already in the tag). E.g. selecting 3 where 2 are already tagged → "1 listing added," not "3."

---

## 8. The dot badge (table "Listing labels" column) — DS gap ⚠️

The website-tag chip shown in the table uses a **colored dot** matching the tag's custom color.

- **Our design system's Tag/chip component does not support an arbitrary custom dot color.** To render the customer's chosen color on the dot, we need a **new DS variant: tag with custom color selection.**
- **This is likely a separate scope of work** and is up for discussion:
  - **Option A (nice-to-have):** add the DS variant → dot reflects the exact custom color.
  - **Option B (fallback):** if too costly, **drop the dot** and show the tag name only.
- Decision needed from DS/eng before committing. Flagged for estimation.

---

## 9. Scope summary for estimation

| Item | Complexity note |
|------|-----------------|
| Panel states (list / empty / create / edit) | Standard. |
| Two entry flows (bulk-assign vs header-manage) | Shared panel; low extra cost. |
| Tag form + 16-char cap + counter/error | Standard. |
| Custom color contrast guard (3:1) | Small, self-contained util. |
| **Brand-color-derived palette** | **Needs design + algorithm — estimate separately.** |
| Save/dirty/leave-confirm model | Cross-cutting; touches editor page state. |
| Stacking banners + correct counts | Watch the StrictMode pitfall. |
| **Custom-color dot → new DS tag variant** | **Possible separate scope; fallback = no dot.** |

---

### Open questions
1. Brand-color palette generation — confirm we derive shades from the 2 primary colors; define the algorithm + accessibility fallback.
2. Custom-color dot — build the DS variant, or ship without the dot?
3. Final radius token for square listing thumbnails (currently `rounded-lg` 40px / `rounded-md` smaller — confirm against DS).
