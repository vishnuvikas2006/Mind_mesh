# MindMesh Mobile Dashboard UI Prompt

Design and build a beautiful, modern, mobile-first dashboard for **MindMesh**, an AI-powered mental-health monitoring and support platform for victims of atrocities.

Use the attached healthcare mobile app screenshot as the **visual design reference**. Recreate its overall design language, spacing, layout structure, softness, and usability, but do not copy its branding, text, icons, or exact content.

## Overall Design Direction

Create a calm, trustworthy, human-centered healthcare interface.

The design should feel:

* Warm
* Safe
* Supportive
* Minimal
* Professional
* Easy to understand
* Designed by a real healthcare product designer
* Suitable for users experiencing stress or emotional difficulty

Avoid making the interface look like an AI-generated template.

Do not use:

* Emojis
* Neon colors
* Excessive gradients
* Glassmorphism
* Dark backgrounds
* Overly complex charts
* Excessive animations
* Unnecessary decorative elements
* Generic AI sparkle icons
* Crowded dashboards
* Aggressive warning colors

## Technology Requirements

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Lucide React icons
* Responsive CSS
* Reusable components
* Accessible semantic HTML

The page must work smoothly on mobile devices, tablets, and desktop screens.

Support screen widths starting from approximately **320px** without horizontal scrolling.

## Color Palette

Use a soft and calming color system inspired by the reference image.

Suggested colors:

* Page background: warm white or very pale mint
* Primary color: muted teal
* Secondary color: soft blue-green
* Card background: white
* Main text: deep blue-gray
* Secondary text: muted gray
* Success: soft green
* Warning: muted amber
* Critical alert: restrained red, used only when necessary
* Borders: very light gray
* Buttons: muted teal with dark readable text

Suggested palette:

```text
Background:       #F4FBF9
Soft Mint:        #DDF3EE
Primary Teal:     #56B9AD
Dark Teal:        #1F5960
Heading Text:     #173E48
Body Text:        #52656A
Card White:       #FFFFFF
Soft Blue:        #E6F2F5
Soft Yellow:      #FFF4D6
Soft Red:         #FCE8E8
Border:           #E4EEEE
```

Use colors consistently throughout the application. Maintain strong contrast and readable typography.

## Mobile Dashboard Layout

Create a dashboard similar in structure to the reference screenshot.

### 1. Mobile Header

At the top of the page, display:

* A friendly greeting
* The user's first name or “Member”
* A short supportive subtitle
* A small profile button or avatar on the right

Example:

```text
Good afternoon,
Member
```

Below the greeting, add a subtle subtitle:

```text
Take a moment to check in with yourself.
```

The greeting should use a large, elegant, dark teal heading. Use generous spacing and a calm visual hierarchy.

Do not use emojis in the greeting.

### 2. Daily Check-In Banner

Below the header, create a large horizontal rounded card.

The card should contain:

* A simple line icon representing reflection or wellbeing
* Heading: “Continue your daily check-in”
* Supporting text: “A few minutes to reflect on how you feel”
* Right-facing arrow icon
* Entire card should be clickable

Use:

* White background
* Large rounded corners
* Very subtle shadow or border
* Comfortable padding
* Clear touch target
* Teal accent icon

When clicked, navigate to the daily check-in page.

### 3. Four Main Action Cards

Create a responsive two-column grid on mobile.

Each card should be large, rounded, white, and easy to tap.

Use four main actions:

#### Card 1: Daily Check-In

Title:

```text
Daily Check-In
```

Subtitle:

```text
Share how you feel
```

Icon:

* Calendar-check
* Heart-pulse
* Clipboard-check
* Or another suitable Lucide icon

#### Card 2: Talk to Support

Title:

```text
Talk to Support
```

Subtitle:

```text
Connect with someone
```

Icon:

* Message-circle
* Messages-square
* Headset

#### Card 3: My Wellbeing

Title:

```text
My Wellbeing
```

Subtitle:

```text
View your progress
```

Icon:

* Activity
* Chart-line
* Heart-pulse

#### Card 4: Get Help

Title:

```text
Get Help
```

Subtitle:

```text
Explore support options
```

Icon:

* Hand-heart
* Life-buoy
* Shield-check

Each card should include:

* A soft colored icon container
* Large title text
* Smaller supporting text
* Consistent card height
* Rounded corners around 24px
* Comfortable internal spacing
* A subtle hover and pressed state
* Keyboard focus state

Do not overload cards with too much information.

### 4. Wellbeing Summary Section

Below the four action cards, add a section titled:

```text
Your wellbeing
```

Include a simple white card showing:

* Current wellbeing status
* A short supportive message
* A small progress indicator
* Optional recent check-in information

Example content:

```text
Your wellbeing
You have completed 4 check-ins this week.
Keep taking small steps toward your wellbeing.
```

Use a calm, non-judgmental tone.

Do not display a medical diagnosis or make the user feel judged.

If a distress score is shown, label it carefully and explain that it is an assistive monitoring signal, not a clinical diagnosis.

### 5. Upcoming Support Section

Add a section titled:

```text
Upcoming support
```

Create a white appointment or support card containing:

* Support type
* Date and time
* Status badge
* Small icon
* Right arrow

Example:

```text
Counselling session
Tomorrow, 10:30 AM
Scheduled
```

Use a soft amber or teal status badge.

If there are no upcoming sessions, show a friendly empty state:

```text
No upcoming support sessions
You can explore available support whenever you are ready.
```

Include a button:

```text
Explore support
```

### 6. Bottom Navigation

Create a fixed or sticky mobile bottom navigation bar similar to the reference image.

Use four navigation items:

1. Home
2. Check-ins
3. Support
4. Profile

The active item should use the muted teal color.

The navigation bar should:

* Have a white background
* Have a subtle top border
* Include simple Lucide icons
* Include short text labels
* Have large touch targets
* Respect safe-area spacing on mobile devices
* Remain accessible using keyboard navigation
* Avoid excessive floating effects

Do not use emojis as navigation icons.

## Interaction Requirements

Implement the following interactions:

* Clicking “Continue your daily check-in” opens the check-in page.
* Clicking “Daily Check-In” opens the check-in workflow.
* Clicking “Talk to Support” opens the support conversation page.
* Clicking “My Wellbeing” opens the wellbeing history page.
* Clicking “Get Help” opens support resources.
* Clicking the appointment card opens appointment details.
* Bottom navigation changes the active section.
* Cards should have hover, focus, and pressed states.
* Buttons must work and must not be decorative.
* Use accessible labels for icon-only buttons.

Use mock data only. Clearly structure the code so real API data can be connected later.

## Typography

Use a clean, friendly sans-serif font.

Typography should include:

* Large, elegant heading
* Medium-weight section headings
* Clear card titles
* Smaller muted descriptions
* Comfortable line height
* No excessive uppercase text

Avoid overly futuristic fonts.

The design should feel suitable for a trusted public-service healthcare platform.

## Component Structure

Create reusable components such as:

```text
MindMeshDashboard
DashboardHeader
DailyCheckInBanner
ActionCard
WellbeingSummaryCard
UpcomingSupportCard
BottomNavigation
StatusBadge
SectionHeader
```

Suggested file structure:

```text
components/
  mindmesh/
    DashboardHeader.tsx
    DailyCheckInBanner.tsx
    ActionCard.tsx
    WellbeingSummaryCard.tsx
    UpcomingSupportCard.tsx
    BottomNavigation.tsx
    SectionHeader.tsx

app/
  dashboard/
    page.tsx
```

## Accessibility Requirements

Ensure that:

* All interactive elements are keyboard accessible.
* Text has sufficient color contrast.
* Icons have accessible labels when needed.
* Buttons have clear names.
* Touch targets are at least approximately 44px.
* Focus indicators are visible.
* The layout works with larger text sizes.
* The interface does not rely only on color to communicate status.
* Supportive language is used throughout the experience.

## Responsive Behavior

### Mobile

* Use a two-column grid for the four action cards.
* Stack sections vertically.
* Keep the greeting large but responsive.
* Keep bottom navigation visible.
* Use comfortable spacing and large touch targets.

### Tablet

* Increase card spacing.
* Center the dashboard within a readable max-width.
* Preserve the two-column layout.

### Desktop

* Use a centered dashboard container.
* Keep content width limited for readability.
* Use a wider grid where appropriate.
* Do not stretch cards across the entire screen.
* Maintain the same calm visual style.

## Content and Tone

Use compassionate, respectful, and non-judgmental language.

Prefer:

* “How are you feeling today?”
* “You can take your time.”
* “Support is available when you need it.”
* “Your responses help us understand how to support you.”
* “You are in control of your information.”

Avoid:

* “Your mental health is bad.”
* “You are high risk.”
* “The AI has diagnosed you.”
* Blaming language
* Fear-based messaging
* Overly clinical terminology

## Final Quality Requirements

The final UI should look like a polished healthcare product, not a basic dashboard.

Pay special attention to:

* Pixel-level spacing consistency
* Rounded card design
* Soft mint background areas
* White elevated cards
* Muted teal accents
* Clear visual hierarchy
* Mobile usability
* Calm typography
* Consistent icon sizes
* Professional empty states
* Smooth but subtle transitions
* No emojis
* No unnecessary visual noise

Use the attached screenshot as the main visual reference for the composition and design style, while adapting the content and branding specifically for MindMesh.
