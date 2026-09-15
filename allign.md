# Codex Prompt: Improve Only the Admin and Trusted Person Page Layouts

You are working on an existing mental-wellbeing support project. Your task is to improve **only the layout, alignment, spacing, sizing, stacking, responsiveness, and overflow handling** of the **Admin Portal** and **Trusted Person Portal**.

Do not redesign the application.

---

## 1. Inspect the Existing Project First

Before making any changes:

1. Inspect the complete repository structure.
2. Identify:

   * Admin Portal files
   * Trusted Person Portal files
   * Existing routing
   * Existing CSS files
   * Existing layout components
   * Existing cards, tables, panels, icons, badges, buttons, maps, and status components
   * Existing emergency-alert logic
   * Existing victim data-fetching logic
   * Existing live-location logic
   * Existing map integration
   * Existing real-time update or notification system
3. Understand how the current Admin and Trusted Person pages are implemented.
4. Identify layout problems before editing.
5. Reuse the existing architecture and components.
6. Do not rewrite the entire project unnecessarily.
7. Do not modify unrelated pages or features.
8. Do not change the authentication system.

---

# 2. Strictly Preserve the Existing Visual Style

The existing visual style must remain exactly the same.

Do not change or replace:

* Existing CSS framework
* Existing CSS files
* Existing color palette
* Existing fonts
* Existing typography system
* Existing buttons
* Existing cards
* Existing components
* Existing icons
* Existing icon library
* Existing borders
* Existing border radius
* Existing shadows
* Existing gradients
* Existing background colors
* Existing hover effects
* Existing branding
* Existing navigation style
* Existing design language

Do not introduce:

* A new UI theme
* A new design system
* A different color palette
* A new icon library
* New visual styling unrelated to the current project

Only improve:

* Spacing
* Alignment
* Width and height behavior
* Grid and flex arrangements
* Responsive stacking
* Content grouping
* Section ordering
* Card sizing
* Table responsiveness
* Overflow handling
* Mobile layout
* Tablet layout
* Laptop layout
* Desktop layout

The final result must look like the same application, only better organized and more responsive.

---

# 3. Implement One Clean, Unified Layout

Do not create layout variations or mockups.

Do not provide multiple design options.

Do not wait for the user to choose a variation.

Implement one clear, practical, production-ready layout directly in the existing project.

Use the existing visual style and arrange the pages as follows:

* Desktop and laptop: use a balanced, flexible multi-column layout where the content fits naturally.
* Tablet: reduce the number of columns when necessary.
* Mobile: stack all sections vertically in a logical order.
* Keep urgent information near the top.
* Keep maps and detail sections responsive.
* Avoid excessive empty space.
* Avoid narrow cards and cramped sections.
* Ensure all content fits naturally within the viewport.

---

# 4. Admin Portal Layout Requirements

Improve only the layout and alignment of the existing Admin Portal.

## Admin Header and Summary

Improve:

* Header alignment
* Spacing between header elements
* Summary-section alignment
* Consistent spacing between summary cards
* Wrapping of status information
* Alignment of statistics and main content
* Responsive behavior of the header and summary area

Do not change the existing styles.

## Victim List

The Admin Portal must display victims using the existing victim icon or existing user/victim icon component.

Each victim item should display:

* Victim icon
* Victim name
* Existing wellbeing status
* Relevant existing status information
* Emergency or moderate indicator where available
* Existing account or connection information where appropriate

Ensure that the icon, name, status, and actions are aligned correctly on all screen sizes.

Long victim names must wrap safely without breaking the layout.

## Victim Status Styling

If a victim has an active emergency:

* Use the project’s existing red status styling.
* Show a clear red emergency indicator.
* Keep the existing visual style.
* Do not introduce unrelated colors or styling.

If a victim has a moderate wellbeing state:

* Use the project’s existing orange status styling.
* Show a clear orange moderate-status indicator.

If a victim has a normal or safe status:

* Preserve the existing normal/safe styling.

Do not rely on color alone. Preserve or add readable status text, icons, or badges using the existing components.

## Clicking a Victim

When an admin clicks a victim item, card, row, icon, or name:

1. Open the existing victim details view, drawer, modal, or detail page.
2. Reuse the existing components and styling.
3. Display all information the admin is authorized to access about that victim.
4. Keep the details well aligned and readable.
5. Make the details view responsive on desktop, tablet, and mobile.

The details view may include, where available and authorized:

* Victim name
* Profile information
* Current wellbeing status
* Latest daily check-in
* Emergency status
* Help requests
* Alert history
* Connected trusted persons
* Relationship information
* Permission summary
* Live-location sharing status
* Current live location when actively shared
* Relevant account status
* Relevant activity information

Never display:

* Plaintext passwords
* Password hashes
* Session tokens
* Reset tokens
* OTP data
* Private credentials
* Unauthorized private conversations
* Data belonging to other victims
* Expired or revoked live location

Use backend authorization and ownership checks. Do not rely only on frontend filtering.

---

# 5. Admin Emergency Indicator

When a victim activates the Emergency button:

* The corresponding victim item in the Admin Portal must show the existing red emergency styling.
* The relevant admin emergency icon or indicator must show a red boundary/light effect.
* The boundary effect may blink while the emergency is active.
* Keep the effect consistent with the existing visual style.
* Add only the smallest possible scoped animation if an existing animation cannot be reused.
* Do not change other animations in the application.

The emergency indicator must:

* Work on desktop, tablet, and mobile.
* Include a readable emergency status.
* Not depend only on color or blinking.
* Respect `prefers-reduced-motion`.
* Use a static red boundary/status treatment when reduced motion is enabled.
* Stop when the emergency is resolved or no longer active according to the existing emergency logic.

Connect the indicator to the actual emergency event or real-time status system.

Do not create a fake emergency state in production.

If real-time updates are not currently available, inspect the existing architecture and implement the safest supported integration. Clearly report any limitation.

---

# 6. Admin Portal Victim Heatmap

Add or improve a heatmap in the Admin Portal showing authorized victim locations.

Use the existing map component or map provider if one is already present. Do not replace the map library unnecessarily.

## Heatmap Requirements

The heatmap must:

* Display only authorized victim locations.
* Fit naturally into the Admin Portal layout.
* Work on laptop, tablet, and mobile.
* Resize correctly with the viewport.
* Avoid horizontal scrolling.
* Have a suitable height on mobile.
* Avoid overlapping other sections.
* Reuse existing map controls and styling where possible.
* Include a clear title or accessible label.
* Handle loading, empty, and error states.

Do not expose:

* Unauthorized victim locations
* Expired live locations
* Revoked live locations
* Private location history that the admin is not authorized to view
* Excessively precise locations if privacy rules require aggregation or reduced precision

If the existing map provider supports a true heatmap layer, use it.

If the existing provider only supports markers, implement a heatmap only if technically supported by the current architecture. Do not claim that a true heatmap works if the provider does not support it.

The heatmap must handle:

* No available victim locations
* Invalid coordinates
* Duplicate coordinates
* Loading state
* Map-provider failure
* Permission restrictions
* Mobile resizing

Do not add fake victim locations to production.

---

# 7. Trusted Person Portal Layout Requirements

Improve only the layout and alignment of the existing Trusted Person Portal.

Preserve the existing:

* CSS
* Colors
* Fonts
* Cards
* Icons
* Buttons
* Borders
* Shadows
* Status indicators
* Map components
* Typography
* Navigation

Improve:

* Connected-victim section alignment
* Wellbeing-card spacing
* Emergency and help-request alignment
* Live-location action placement
* Alert-history layout
* Check-in layout
* Responsive card stacking
* Button alignment
* Text wrapping
* Section spacing
* Mobile readability
* Alignment of icons, labels, values, and actions

The page must remain visually consistent with the rest of the project.

## Trusted Person Information Order

Arrange the existing sections logically so the trusted person can easily understand:

1. Connected victim
2. Current wellbeing status
3. Emergency status
4. Latest daily check-in
5. Help requests
6. Live-location sharing status
7. Live-location action
8. Alert history
9. Permission or connection status

Keep urgent information near the top.

Do not expose information that the victim has not authorized.

---

# 8. Trusted Person Live-Location Map

When the trusted person clicks the existing **View Live Location** button or equivalent control:

1. Open the map using the existing map component or map provider.
2. Show the victim’s current location only if:

   * The victim explicitly enabled live-location sharing.
   * The trusted person is authorized.
   * The sharing session is active.
   * The sharing duration has not expired.
   * The location is valid and available.
3. Display the victim’s location clearly.
4. Reuse the existing map marker or location icon.
5. Keep the map aligned with the existing page layout.
6. Make the map responsive on laptop, tablet, and mobile.
7. Prevent map overflow outside its container.
8. Provide loading, unavailable, expired, revoked, and error states.
9. Clearly explain when live location is unavailable.

When live-location sharing is expired, revoked, disabled, or unavailable:

* Do not display an old location as if it were live.
* Do not expose unauthorized location data.
* Do not claim real-time tracking unless the existing implementation actually provides it.

If the map opens inside a modal, drawer, expandable panel, or separate section, make that container responsive using the existing components and styles.

---

# 9. Trusted Person Emergency Boundary Effect

When the connected victim activates the Emergency button:

* The Trusted Person Portal must show the existing emergency styling.
* The portal boundary or relevant trusted-person page boundary should display a red emergency indication.
* The effect may blink while the emergency is active.
* Use the smallest possible scoped style change.
* Include a readable emergency label or status icon.
* Do not rely only on animation or color.
* Respect `prefers-reduced-motion`.
* Use a static red boundary/status treatment when reduced motion is enabled.
* Stop the effect when the emergency is resolved or no longer active.

Connect this behavior to the actual emergency event system.

Do not simulate emergency behavior in the production implementation.

---

# 10. Responsive Layout Requirements

Both portals must work correctly at:

* 320px
* 360px
* 375px
* 390px
* 412px
* 430px
* Tablet widths
* Laptop widths
* Desktop widths

## Mobile Requirements

At 320–430px:

* No horizontal scrolling.
* No clipped cards.
* No overflowing buttons.
* No text outside containers.
* No fixed-width panels that exceed the viewport.
* No overlapping icons or labels.
* No broken map containers.
* No oversized tables.
* No inaccessible dialogs.
* No content hidden behind other sections.
* Cards must stack naturally.
* Buttons must wrap or become full-width where appropriate.
* Long names and status messages must wrap safely.
* Victim icons and names must remain aligned.
* Status badges must remain visible.
* Heatmap and live-location maps must fit the available width.
* Details panels must become full-width.
* Modals and drawers must fit mobile screens.
* Touch targets must remain usable.
* Keyboard accessibility must be preserved.

## Tablet Requirements

* Use flexible grids.
* Reduce columns when content does not fit.
* Keep related sections together.
* Avoid forcing the desktop layout on smaller screens.
* Preserve consistent spacing.

## Laptop and Desktop Requirements

* Use available screen width efficiently.
* Avoid excessive empty space.
* Keep the main content aligned.
* Maintain consistent card and section widths.
* Avoid stretching narrow content unnecessarily.
* Keep map and details sections visually balanced.

Use the existing responsive utilities, CSS media queries, flexbox, and grid system.

Do not add a new CSS framework.

---

# 11. Overflow and Alignment Fixes

Inspect and fix:

* Fixed-width containers
* Hardcoded widths
* Excessive minimum widths
* Unnecessary absolute positioning
* Overflowing tables
* Long victim names
* Long status messages
* Buttons extending outside cards
* Map containers exceeding their parents
* Modals wider than the viewport
* Drawers that cannot close on mobile
* Misaligned icons
* Unequal card spacing
* Inconsistent vertical gaps
* Improper grid column counts
* Nested scrollbars
* Horizontal page scrolling

Use the smallest and cleanest layout changes possible.

Scope any new CSS to the Admin and Trusted Person pages only.

---

# 12. Accessibility Requirements

Preserve or improve accessibility.

Ensure:

* Victim cards and rows are keyboard accessible.
* Clickable victim items use appropriate semantic elements.
* Icons have accessible labels where necessary.
* Statuses are not communicated through color alone.
* Emergency status has readable text.
* Map controls are accessible.
* Modals and drawers have proper focus behavior.
* Close buttons are accessible.
* Loading and error states are announced appropriately.
* Reduced-motion preferences are respected.
* Buttons have visible focus states.
* Existing text contrast is preserved.
* Touch targets are usable on mobile.

Do not change the visual identity of the project to implement these improvements.

---

# 13. Data and Permission Safety

Layout changes must not weaken security.

Verify that:

* Admins can only view authorized victim information.
* Trusted persons can only view the connected victim’s authorized information.
* Trusted persons cannot view other victims.
* Trusted persons cannot view unshared information.
* Expired live location is not displayed.
* Revoked live location is not displayed.
* Frontend layout changes cannot bypass backend permissions.
* Victim details use authorized APIs.
* Emergency data is displayed only to authorized users.
* Heatmap data follows the project’s location-privacy rules.

Do not add mock victim data to production.

---

# 14. Implementation Process

Follow this process:

## Phase 1: Analyze

* Inspect the repository.
* Identify Admin Portal and Trusted Person Portal files.
* Identify current layout issues.
* Identify reusable existing components.
* Identify existing map, emergency, victim-status, and live-location logic.

## Phase 2: Implement

* Implement one unified production-ready layout.
* Do not create variations.
* Do not create mockup options.
* Do not wait for user selection.
* Preserve the existing visual style.
* Modify only relevant Admin and Trusted Person files.
* Fix spacing, alignment, sizing, stacking, and overflow.
* Add or improve victim status indicators.
* Add victim details interaction.
* Add the Admin Portal heatmap.
* Add the Trusted Person live-location map behavior.
* Add emergency boundary indications for Admin and Trusted Person pages.
* Preserve all existing functionality.

## Phase 3: Verify

* Run tests.
* Check responsive layouts.
* Check authorization and privacy behavior.
* Fix regressions.
* Report the actual implementation status.

---

# 15. Testing Requirements

Test both portals at:

* 320px
* 360px
* 390px
* 412px
* 430px
* Tablet width
* Laptop width
* Desktop width

Test:

* Admin header alignment
* Admin summary alignment
* Victim icon and name alignment
* Red emergency status
* Orange moderate status
* Victim click interaction
* Victim details display
* Admin heatmap rendering
* Empty heatmap state
* Heatmap loading state
* Heatmap mobile resizing
* Trusted Person page alignment
* Live-location button
* Live-location map opening
* Expired location handling
* Revoked location handling
* Unauthorized location handling
* Admin emergency boundary effect
* Trusted Person emergency boundary effect
* Reduced-motion behavior
* Long victim names
* Long status messages
* Small-screen behavior
* Keyboard navigation
* Modal and drawer behavior
* Existing authentication
* Existing emergency logic
* Existing check-in logic
* Existing permissions
* Existing logout
* Existing Admin functionality
* Existing Trusted Person functionality

Use the existing test, lint, and build commands.

Fix all regressions caused by the layout changes.

If tests cannot run, report the exact reason.

---

# 16. Final Implementation Report

After completing the work, provide a report containing:

1. Repository files inspected
2. Admin Portal files changed
3. Trusted Person Portal files changed
4. Existing components reused
5. Layout problems identified
6. Final layout implemented
7. Responsive changes made
8. Victim icon and name alignment changes
9. Emergency red-status behavior
10. Moderate orange-status behavior
11. Victim details interaction
12. Admin heatmap implementation
13. Trusted Person live-location map behavior
14. Admin emergency boundary indication
15. Trusted Person emergency boundary indication
16. Accessibility improvements
17. Permission and privacy checks
18. Tests executed
19. Tests passed
20. Tests failed and reasons
21. Known limitations
22. Required environment variables or map-provider configuration

## Final Restrictions

* Do not create layout variations.
* Do not create mockup options.
* Do not redesign the UI.
* Do not change existing colors.
* Do not change existing fonts.
* Do not replace existing components.
* Do not replace existing icons.
* Do not change borders or shadows.
* Do not introduce a new visual theme.
* Do not modify unrelated pages.
* Do not add fake victim data to production.
* Do not expose unauthorized victim information.
* Do not show expired or revoked live location.
* Do not claim that the heatmap, map, emergency indicator, or live location works unless it is actually integrated and tested.
