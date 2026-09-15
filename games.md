# Codex Prompt: Add Only the Stress-Relief Games

Modify my existing project and add **only the stress-relief games**. Do not add explanations, descriptions, chatbot text, headings, instructions, dashboards, or other extra content around the games.

## Main UI Requirement

The screen should display only the game experience.

* No long paragraphs
* No game descriptions
* No wellness articles
* No chatbot conversation panel
* No unnecessary menus
* No extra cards
* No additional dashboard content
* No visible technical information

The user should swipe left to see the next game and swipe right to see the previous game.

## Games to Include

Implement these games:

1. Breathing Bubble
2. Pop the Stress Bubbles
3. Calm Garden
4. Memory Match
5. Mood Garden
6. Catch the Stars
7. Slow Drawing

## Carousel Behavior

Create a full-screen or near-full-screen swipeable game carousel.

Requirements:

* Swipe left → show the next game
* Swipe right → show the previous game
* Mouse dragging on desktop
* Touch swiping on mobile
* Previous and next controls may be small icons only
* Use small pagination dots if needed
* Do not display lengthy text
* Show only one game at a time on small screens
* Use smooth transitions
* Prevent page-level horizontal scrolling
* Keep the current game centered
* Preserve the existing project’s theme and layout
* Do not create a separate standalone project

The carousel should feel like a relaxing mobile game application.

## Text Requirement

Text should be minimal.

Only show short text when necessary, such as:

* “Breathe in”
* “Breathe out”
* “Start”
* “Pause”
* “Resume”
* “Restart”
* “Exit”
* “5”
* “4”
* “3”
* “2”
* “1”
* Short positive messages such as:

  * “Take your time”
  * “You are doing well”
  * “One step at a time”

Do not show long explanations or descriptions.

Avoid displaying the game names unless they are required for accessibility. If a label is needed, use a very small, unobtrusive label.

## Sound Requirement

Add soft, calming sounds to the games.

Use sounds such as:

* Soft bubble pop
* Gentle wind
* Light water movement
* Soft chime
* Quiet nature ambience
* Gentle success sound
* Calm breathing sound

Sound rules:

* Keep the volume low.
* Never use loud or sudden sounds.
* Never use frightening sounds.
* Never autoplay sound without user permission.
* Provide a small sound on/off icon.
* Start audio only after the user interacts with the page.
* Respect the user’s mute setting.
* Stop all game sounds when the game is exited.
* Do not use copyrighted music unless it is properly licensed.
* Prefer locally stored royalty-free audio files or Web Audio API-generated simple tones.
* If audio files are unavailable, create simple soft sounds using the Web Audio API.
* The games must still work if audio is blocked by the browser.

## Game Requirements

### 1. Breathing Bubble

Display only:

* A large animated bubble
* A small breathing instruction
* A Start/Pause button
* A sound toggle

Behavior:

* Bubble expands slowly while inhaling.
* Bubble contracts slowly while exhaling.
* Use a calm breathing cycle.
* Allow pause, resume, restart, and exit.
* Do not show a stressful countdown.

### 2. Pop the Stress Bubbles

Display only:

* Floating bubbles
* Very short words inside some bubbles, or no words
* Soft pop animation
* Optional soft pop sound
* Restart and exit icons

Behavior:

* Tap or click a bubble to pop it.
* Create new bubbles gradually.
* No score is required.
* No failure state.
* No timer.
* No loud effects.

### 3. Calm Garden

Display only:

* A peaceful garden scene
* Flowers
* Stones
* Trees
* Water
* Butterflies
* Small interaction icons

Behavior:

* Tap to plant flowers.
* Tap to add stones.
* Tap to add trees.
* Tap to add water.
* Tap to add butterflies.
* Use gentle nature sounds.
* Allow the garden to be cleared or restarted.
* No long text.

### 4. Memory Match

Display only:

* A clean grid of cards
* Simple nature-themed symbols
* Small restart icon
* Small sound toggle

Behavior:

* Tap two cards to reveal them.
* Matching cards stay visible.
* Non-matching cards close gently.
* No countdown.
* No negative sound.
* Use a soft chime for a match.
* Include an accessible exit control.

### 5. Mood Garden

Display only:

* Simple mood icons
* Calm visual effects
* A small garden or weather scene
* Optional short labels

Mood options:

* Calm
* Happy
* Sad
* Angry
* Tired
* Worried
* Confused
* Stressed

Behavior:

* Tapping a mood changes the garden scene.
* Use gentle colors and animations.
* Do not diagnose the user.
* Do not show long emotional-support messages.
* Include a small “Talk” button only if it is already supported by the existing chatbot.
* Include an exit icon.

### 6. Catch the Stars

Display only:

* A calm night-sky background
* Slowly moving stars
* Optional short positive words
* Small restart and exit icons

Behavior:

* Tap stars to collect them.
* Use soft chimes.
* No competitive scoring.
* No countdown.
* No failure state.
* Keep movement slow and relaxing.

### 7. Slow Drawing

Display only:

* A simple drawing canvas
* Pencil
* Eraser
* Brush-size control
* Undo
* Redo
* Clear
* Exit
* Sound toggle

Behavior:

* Support mouse and touch drawing.
* Do not evaluate the drawing.
* Do not show prompts unless the user explicitly requests them.
* Do not add unnecessary text.

## Visual Design

Use a peaceful, minimal, immersive style:

* Soft blue
* Lavender
* Mint
* Cream
* Dark calming backgrounds where appropriate
* Rounded controls
* Gentle gradients
* Minimal icons
* Soft animations
* No flashing effects
* No clutter
* No large text blocks
* No unnecessary borders or panels

The game should be visually understandable without reading instructions.

## Integration Rules

Before coding:

1. Inspect the existing project.
2. Find the current frontend structure.
3. Find the existing humanoid robot and voice-to-voice chatbot.
4. Add the games inside the existing project.
5. Reuse existing styles and components.
6. Do not remove existing chatbot functionality.
7. Do not create an unrelated app.
8. Do not add a backend unless absolutely necessary.
9. Do not store mood information or personal responses.
10. Do not expose API keys.

The game view may temporarily hide other UI elements while a game is active, but the existing project must remain intact.

## Accessibility and Safety

* Every game must have an accessible exit button.
* Every game must be usable without sound.
* Provide sound on/off control.
* Support keyboard controls.
* Respect reduced-motion settings.
* Do not force breathing exercises.
* Do not claim that the games treat or cure a medical condition.
* Do not use stressful scores, penalties, timers, or failure messages.

## Cleanup Requirements

When changing or exiting games:

* Stop timers.
* Stop animations where necessary.
* Stop audio.
* Remove event listeners.
* Cancel animation frames.
* Prevent multiple game instances from running at once.
* Reset game state correctly when restarting.

## Testing Requirements

Test that:

* Swiping left shows the next game.
* Swiping right shows the previous game.
* All games open correctly.
* All games can be exited.
* All games work on mobile and desktop.
* Sounds can be muted and unmuted.
* Games work when the browser blocks audio.
* No loud or automatic audio plays.
* No horizontal page scrolling occurs.
* Existing voice-to-voice chatbot functionality still works.
* No console errors are introduced.

## Final Result

The final interface should feel like a **minimal calming game zone**.

Only the games, simple controls, minimal necessary text, and soft sounds should be visible. Do not add extra explanations or unrelated content.
