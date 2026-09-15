MindMesh --- Signup & Login Page

Design Reference

Use the provided reference image as the primary visual design
reference.

Reference image URL:

https://www.image2url.com/r2/default/images/1789220432179-49a56abf-2c75-483e-8700-7dbcb6664f90.jpg

The final page should closely reproduce the layout, spacing,
typography, colors, proportions, visual hierarchy, and overall premium
mental-wellbeing aesthetic shown in the reference.

1. Overall Layout

Create a responsive authentication experience with two major sections:

Left side: full-height visual/marketing panel.

Right side: login/signup authentication panel.

On desktop:

Use a roughly 50/50 split, matching the reference.

The left panel occupies approximately half of the viewport.

The right panel occupies the remaining half.

Both sections should fill the viewport height.

Avoid unnecessary page scrolling on normal desktop screens.

On mobile:

Stack the sections vertically.

Keep the authentication form easy to use.

The artwork may appear above the form or be reduced to a compact
hero section.

Maintain the same visual identity and color palette.

2. Left Marketing Panel

Background Image

Use the supplied mental-health artwork as the main visual.

Reference:

https://www.image2url.com/r2/default/images/1789220432179-49a56abf-2c75-483e-8700-7dbcb6664f90.jpg

The image should:

Cover the complete left panel.

Preserve the important facial/artistic details.

Use background-size: cover or an equivalent image implementation.

Avoid visible stretching.

Keep the composition close to the reference image.

If the image is used as a background, apply a subtle dark/teal overlay
only if necessary to keep the white text readable.

Do not replace the artwork with a generic stock image.

3. Left Panel Content

Place the content toward the lower-left portion of the artwork.

Small Label

Display:

MENTAL HEALTH SUPPORT

The label should include a short horizontal line before the text.

Example visual structure:

────  MENTAL HEALTH SUPPORT

Styling:

Uppercase.

Letter spacing around 0.15em.

Small font size.

Light/white text.

Elegant and minimal.

Main Heading

Display:

You are not
alone in this.

The heading should closely resemble the reference:

Large serif typography.

White/off-white color.

Strong visual hierarchy.

Two lines on desktop.

Comfortable line height.

Do not make it excessively bold.

Suggested font direction:

Serif: Playfair Display, Cormorant Garamond, Libre Baskerville, or a
similar elegant serif.

Use a clean sans-serif font for supporting text.

Supporting Text

Display:

MindMesh is here to support your mental
wellbeing with compassionate care,
real-time monitoring and the right help
when you need it.

Requirements:

White/light text.

Medium readable size.

Comfortable line height.

Maximum width similar to the reference.

Keep the text visually secondary to the heading.

4. Right Authentication Panel

The right side should use a very light:

White

Warm white

Extremely light blue/green

background.

The overall appearance should feel:

Calm

Safe

Professional

Minimal

Modern

Premium

Add very subtle decorative abstract leaf/organic shapes in the
upper-right and lower-right corners, similar to the reference.

These decorations must remain subtle and must never interfere with the
form.

5. MindMesh Branding

At the top-center of the authentication panel, create the MindMesh
brand.

Logo

Use a minimal abstract leaf/sprout symbol.

The symbol should contain two or three smooth leaf-like shapes.

Use a muted teal color.

Brand Name

Display:

MindMesh

Typography:

Elegant serif.

Dark teal.

Large enough to establish strong branding.

Below the brand name:

Support · Monitor · Heal

Use:

Small sans-serif typography.

Muted blue/gray/teal.

Increased spacing.

Center alignment.

6. Login Page

Heading

Display:

Welcome back

Use:

Elegant serif font.

Dark teal.

Large heading.

Left alignment within the form area.

Description

Display:

Log in to continue your journey towards
better mental wellbeing.

Use:

Muted blue-gray.

Comfortable line height.

Medium font size.

7. Login Form

The form should contain:

Email Field

Placeholder:

Email address

Use:

Email icon on the left.

Rounded rectangular container.

Thin light-gray/blue border.

White or very-light background.

Comfortable vertical padding.

Large enough click/touch area.

Password Field

Placeholder:

Password

Use:

Lock icon on the left.

Eye/visibility icon on the right.

Same styling as the email field.

The eye button should toggle:

Password hidden

Password visible

The button must be keyboard accessible.

8. Remember Me / Forgot Password

Place these on the same row.

Left:

Remember me

Right:

Forgot password?

Requirements:

Remember-me checkbox should use the MindMesh teal accent.

Forgot password should look like a clickable text link.

Keep the row compact.

On very small screens, allow wrapping if necessary.

9. Login Button

Create a full-width primary button:

Log in →

The button should closely resemble the reference.

Style:

Rounded/pill shape.

Teal background.

White text.

Medium/large height.

Subtle hover animation.

Smooth transition.

Hover:

Slightly darker or deeper teal.

Small upward/lift animation is acceptable.

Focus:

Clearly visible keyboard focus state.

Disabled/loading:

Show a loading indicator when authentication is processing.

Prevent duplicate submissions.

10. Divider

Below the login button:

──────────────  or  ──────────────

The divider should use:

Very light gray/blue lines.

Muted text.

Center alignment.

11. Create Account Button

Below the divider create an outlined button:

👤 Create a new account

Do not rely on the emoji for the actual UI icon if an icon library is
available.

Use a proper user/profile icon.

Button styling:

White/transparent background.

Teal border.

Teal text.

Rounded/pill shape.

Same approximate height as the login button.

Hover should lightly tint the background.

Clicking this button should navigate to the signup page.

12. Security Message

At the bottom of the authentication content:

Your information is safe and secure with us. Learn more

Requirements:

Small muted text.

Centered or visually aligned with the form.

Learn more should be an accessible link.

Keep the visual emphasis very low.

Do not make unsupported security claims elsewhere in the application.

13. Signup Page

The signup page should use the same exact visual system as the login
page.

Keep:

Same left artwork.

Same MindMesh branding.

Same background.

Same typography.

Same form width.

Same spacing system.

Same button styles.

Same decorative elements.

Only the authentication content should change.

Signup Heading

Display:

Create your account

Suggested supporting text:

Start your journey towards better mental wellbeing.

14. Signup Fields

Include:

Full Name

Placeholder:

Full name

Icon:

User/profile icon.

Email Address

Placeholder:

Email address

Icon:

Mail icon.

Password

Placeholder:

Password

Icon:

Lock icon.

Include a visibility toggle.

Confirm Password

Placeholder:

Confirm password

Icon:

Lock icon.

Include a visibility toggle.

15. Password Requirements

Show password requirements while the user is creating an account.

Recommended requirements:

At least 8 characters.

One uppercase letter.

One lowercase letter.

One number.

Display requirements in a subtle and readable manner.

Update the requirement indicators as the user types.

16. Signup Button

Primary button:

Create account →

Use the same teal pill-button style as the Login button.

Show a loading state during signup.

Prevent duplicate submissions.

17. Existing Account Link

At the bottom of the signup form:

Already have an account? Log in

The Log in text should navigate back to the login page.

18. Form Validation

Implement client-side validation and server-side validation.

Login

Validate:

Email is present.

Email format is valid.

Password is present.

Signup

Validate:

Full name is present.

Email is valid.

Password meets requirements.

Confirm password matches password.

Required fields are not empty.

Display errors directly below the relevant field.

Example:

Please enter a valid email address.

Do not use browser alert() for normal validation.

19. Accessibility

The authentication pages must be accessible.

Requirements:

Every input must have an associated label.

Placeholder text must not be the only accessible label.

Buttons must have accessible names.

Password visibility buttons need aria-label.

Keyboard navigation must work.

Visible focus states must be present.

Color contrast should be readable.

Error messages should be associated with their inputs.

Do not rely on color alone to communicate validation state.

20. Responsive Behavior

Desktop

Target:

>= 1024px

Use the two-column layout.

Approximate structure:

┌────────────────────────┬────────────────────────┐
│                        │                        │
│     Artwork            │       MindMesh         │
│                        │                        │
│  MENTAL HEALTH         │     Welcome back       │
│  SUPPORT               │                        │
│                        │     Email              │
│  You are not           │     Password           │
│  alone in this.        │                        │
│                        │     Remember / Forgot  │
│  Supporting text       │                        │
│                        │     Log in              │
│                        │                        │
│                        │     or                  │
│                        │                        │
│                        │     Create account      │
│                        │                        │
└────────────────────────┴────────────────────────┘

Tablet

Maintain two columns where there is enough horizontal space.

Reduce:

Heading size.

Form width.

Artwork text size.

Mobile

Use one column.

Recommended order:

Brand
Authentication form
Artwork/marketing section

or:

Compact artwork
Brand
Authentication form

Choose the option that provides the best usability while keeping the
visual identity.

The form must never require horizontal scrolling.

21. Visual Design Tokens

Use these as starting points and adjust visually to match the reference.

Colors

Primary Teal

#4FA7AE

Dark Teal

#124B5A

Secondary Text

#6F8C99

Border

#D6E2E5

Background

#F7FCFC

White

#FFFFFF

These are approximate design tokens. The final implementation should
prioritize visual similarity to the reference image.

22. Typography

Use two font families.

Display / Heading Font

Recommended:

Playfair Display

Cormorant Garamond

Libre Baskerville

Use for:

MindMesh

Welcome back

Create your account

You are not alone in this.

UI Font

Recommended:

Inter

Manrope

DM Sans

Use for:

Inputs

Buttons

Labels

Supporting text

Navigation

Error messages

Do not use too many different fonts.

23. Spacing

Use a consistent spacing system.

Suggested:

4px
8px
12px
16px
20px
24px
32px
40px
48px
64px

The form should feel spacious rather than crowded.

The reference image has generous whitespace, so avoid compressing all
fields together.

24. Form Width

Desktop authentication form:

max-width: 500px

The exact width should visually match the reference.

Do not allow the form to become excessively wide on large monitors.

25. Border Radius

Use soft rounded corners.

Inputs:

border-radius: 14px

Primary buttons:

border-radius: 9999px

Secondary button:

border-radius: 9999px

The exact values may be adjusted to match the reference.

26. Icons

Use a consistent outline icon set.

If the project already uses lucide-react, use it.

Recommended icons:

Email: Mail

Password: Lock

Show password: Eye

Hide password: EyeOff

User: User

Arrow: ArrowRight

Check: Check

Icons should be:

Thin/medium stroke.

Teal or muted teal.

Consistent sizing.

27. Animations

Animations should be subtle.

Recommended:

Form fade-in on page load.

Slight slide-up for authentication content.

Button hover transition.

Password visibility transition.

Input focus transition.

Avoid:

Large bouncing animations.

Excessive motion.

Distracting background animations.

Respect prefers-reduced-motion.

28. Authentication Behavior

The UI is only the presentation layer.

Connect the forms to the project's existing authentication system if one
already exists.

Login Flow

User enters email
        ↓
User enters password
        ↓
Client validation
        ↓
Authentication API
        ↓
Success → redirect to dashboard
Failure → show useful error

Signup Flow

User enters details
        ↓
Client validation
        ↓
Signup API
        ↓
Account created
        ↓
Login/dashboard/verification flow

Do not hard-code fake successful authentication in production.

29. Error States

Use clear, human-readable errors.

Examples:

Incorrect email or password.

An account with this email already exists.

Passwords do not match.

Password must contain at least 8 characters.

Something went wrong. Please try again.

Avoid exposing sensitive backend details.

30. Loading States

During authentication:

Primary button:

Logging in...

or

Creating account...

Disable the button while the request is in progress.

Show a small spinner if appropriate.

Do not allow multiple simultaneous submissions.

31. Final Visual Requirement

The implementation should look like a real polished production
authentication page, not a generic login template.

The reference image should guide:

Overall composition

50/50 layout

Artwork placement

Typography hierarchy

Teal color palette

White/light authentication panel

Rounded form controls

Button proportions

Spacing

Branding

Decorative shapes

Overall calm mental-health aesthetic

Do not replace the design with a generic centered login card.

The final result should feel visually very close to the supplied
reference while remaining responsive and accessible.

32. Important Implementation Rule

Before modifying or creating components, inspect the existing project
structure and reuse existing:

Authentication components

Layout components

CSS variables

Theme system

Icon library

Routing

API/authentication utilities

Do not unnecessarily introduce a new framework or authentication library
if the project already has one.

Keep the implementation modular and maintainable.

33. Acceptance Checklist

The page is complete only when all of the following are true:

Desktop layout closely matches the reference.

Left artwork fills the left panel.

Right panel has a clean light background.

MindMesh logo and branding are present.

Serif headings visually match the reference style.

Login form contains email and password.

Password visibility toggle works.

Remember-me checkbox works.

Forgot-password link is present.

Login button works.

Create-account button navigates to signup.

Signup page uses the same visual design.

Signup validates all required fields.

Password confirmation works.

Password requirements are displayed.

Login/signup loading states work.

Errors are displayed clearly.

Keyboard navigation works.

Inputs have accessible labels.

Mobile layout is responsive.

No horizontal scrolling occurs.

Artwork is not distorted.

Decorative elements remain subtle.

Animations are subtle.

Reduced-motion preferences are respected.

Existing project authentication is reused where applicable.

No fake production authentication is hard-coded.

34. Reference Image



Use this image as the primary visual reference throughout