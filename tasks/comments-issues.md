# Issues found during comments feature testing

## BUG: Broken avatar image — no fallback to initials
**Severity**: Medium
**Location**: `frontend/src/pages/PhotoDetailPage.vue` — comments avatar section

The avatar `<img>` tag renders when `comment.author.avatarUrl` is a truthy string (URL exists), but if the image **fails to load** (e.g. expired Google avatar, CORS, network error), a broken image icon is shown instead of the initials fallback. The `v-if="comment.author.avatarUrl"` check only verifies the URL string exists, not whether the image actually loaded.

**Fix**: Add an `@error` handler on the `<img>` to hide it and show initials on load failure. For example:
```html
<img v-if="comment.author.avatarUrl && !avatarFailed[comment.id]"
     :src="comment.author.avatarUrl"
     @error="avatarFailed[comment.id] = true" ... />
<span v-else class="comments__avatar-initials">{{ getInitials(...) }}</span>
```

---

## UX: Excessive vertical spacing above comments section
**Severity**: Low
**Location**: `frontend/src/pages/PhotoDetailPage.vue` — CSS `.detail__content` + `.comments`

The content grid has `margin-bottom: 96px` and the comments section has `padding-top: 48px`, creating a combined **144px gap** between the content and comments. This leaves a large empty white space that looks unintentional — especially on pages with short content.

**Fix**: Remove or reduce `padding-top` on `.comments` since the `margin-bottom: 96px` on `.detail__content` already provides sufficient spacing, or reduce both for a more balanced ~64px total gap.

---

## UX: Delete comment uses native `confirm()` dialog
**Severity**: Low
**Location**: `frontend/src/pages/PhotoDetailPage.vue` — `deleteComment()` function

The delete comment action uses the browser's native `confirm()` dialog, which is inconsistent with the rest of the app (photo delete uses a custom modal dialog `deleteDialogOpen`). Native confirm() also blocks the JS thread and looks out of place in a styled app.

**Fix**: Replace `confirm()` with a custom confirmation dialog matching the existing photo delete dialog pattern.

---

## COSMETIC: Comment textarea uses `box-sizing: content-box` by default
**Severity**: Low
**Location**: `frontend/src/pages/PhotoDetailPage.vue` — CSS `.comments__textarea`

The textarea has `width: 100%` and `padding: 16px`, but if the global `box-sizing` isn't set to `border-box`, the textarea may overflow its container. Not currently broken but fragile.

**Fix**: Add `box-sizing: border-box` to `.comments__textarea` and `.comments__edit-textarea`.

---

## STYLING: Comments section border-top nearly invisible in light mode
**Severity**: Low
**Location**: `frontend/src/pages/PhotoDetailPage.vue` — CSS `.comments`

The comments section `border-top` is `1px solid var(--outline-variant)` but with only 10% opacity (`rgba(190, 200, 201, 0.1)` in light mode). This makes the separator between the content grid and comments section completely invisible — there's no visual break between sections.

**Fix**: Increase the opacity or use `var(--outline-variant)` without extra alpha reduction. Something like `border-top: 1px solid var(--outline-variant)` at full opacity, or use a more visible separator.

---

## STYLING: Textarea blends into page background in light mode
**Severity**: Low
**Location**: `frontend/src/pages/PhotoDetailPage.vue` — CSS `.comments__textarea`

The textarea background (`rgb(246, 243, 235)`) is identical to the page background in light mode, and the border (`rgb(190, 200, 201)`) is very low contrast. The textarea is nearly invisible — it blends into the page.

**Fix**: Use `var(--surface-container-low)` or a slightly different shade for the textarea background. Alternatively, increase the border contrast by using `var(--outline)` instead of `var(--outline-variant)`.

---

## STYLING: Bright teal hover effects on comment action buttons in dark mode
**Severity**: Medium
**Location**: `frontend/src/pages/PhotoDetailPage.vue` — CSS `.comments__action-btn:hover`

When hovering over "Edytuj" or "Usun" buttons in dark mode, the text color jumps to `var(--primary)` (`#8ad3d7` — bright teal), which is a harsh, glaring contrast against the dark background (`#1c1c17`). The hover background (`var(--surface-container-high)`: `#2a2a24`) is barely different from the page background, making the bright text the only visual change.

**Fix**: Use a more subtle hover color. Instead of `color: var(--primary)`, use `color: var(--on-surface)` or a muted variant like `var(--on-surface-variant)`. Or pair the bright text with a more distinct background to balance the effect.

---

## STYLING: Textarea focus border + glow too bright in dark mode
**Severity**: Low
**Location**: `frontend/src/pages/PhotoDetailPage.vue` — CSS `.comments__textarea:focus`

When the textarea is focused in dark mode, it gets a bright teal border (`#8ad3d7`) plus a teal glow (`box-shadow: rgba(138, 211, 215, 0.4) 0px 0px 0px 3px`). This combination is visually loud and stands out aggressively against the dark page.

**Fix**: Use a subtler focus indicator — reduce the box-shadow spread or use `var(--outline)` for the border color instead of `var(--primary)`. For example: `border-color: var(--outline); box-shadow: 0 0 0 2px rgba(138, 211, 215, 0.15)`.