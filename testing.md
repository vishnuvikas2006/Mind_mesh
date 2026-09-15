# MindMesh Portal – Complete Fix, New Game, Security, and Deployment

Update my existing MindMesh portal carefully. The current project contains games, Sahay AI voice support, Admin and Trusted Person pages, and other existing features.

**IMPORTANT: Do not break or redesign the existing project. Preserve all existing functionality and game rules unless a specific issue is being fixed.**

## 1. Fix the game layout – Full-screen experience

The attached screenshot shows the current Breathing Bubble game. It is displayed inside a small, rounded card with the browser page and extra navigation elements visible around it. I want the actual game experience to occupy the available screen naturally.

### Required changes

* Make every existing game use a full-screen game layout.
* On mobile, the game should fill the available browser screen below the browser's own address bar.
* On desktop and laptop, the game should use the available viewport space without unnecessary empty margins.
* Remove the appearance of a small, constrained game card when the game is active.
* Ensure the game canvas, game area, controls, score, timer, and instructions fit naturally within the available screen.
* Prevent the game content from being hidden behind the status bar, browser safe areas, or bottom navigation.
* Use responsive sizing for different screen sizes, including 320px, 360px, 390px, 430px, tablet, and desktop.
* Prevent unwanted horizontal scrolling.
* Keep the existing colors, fonts, icons, animations, borders, shadows, and overall design language.
* Do not add unnecessary browser-like headers, duplicate navigation bars, or extra decorative containers.
* Keep the Back, Sound, Start, Reset, and other existing controls functional and properly aligned.
* Ensure the game layout adjusts when the device is rotated.
* Keep the Start button accessible and visible without overlapping the game content.

### Important

Do not change the rules, mechanics, scoring, timing, or behavior of any existing game. Only fix the layout, sizing, positioning, responsiveness, and visual overflow.

## 2. Add a new game – Tap the Dog

Add a new interactive game called **Tap the Dog** to the existing games section. Integrate it into the current game navigation and follow the existing design system.

### Game concept

A friendly animated dog appears at different positions inside the game area. The player must tap or click the dog to earn points.

### Features

* Display a friendly, accessible dog character.
* Show a clear game title, instructions, score, timer, and progress.
* Add a Start button, Pause button, Restart button, and Sound/Mute button.
* Place the dog at random safe positions inside the game area.
* Make the dog move to a new position after a successful tap.
* Increase the score when the player taps the dog.
* Include a configurable time limit, such as 30 seconds.
* Show a final score and a Play Again option when the game ends.
* Add smooth, lightweight movement and feedback animations.
* Prevent the dog from appearing underneath buttons, text, or outside the visible game area.
* Make the dog large enough to tap easily on mobile devices.
* Support mouse, touch, and keyboard interaction where appropriate.
* Prevent accidental double scoring from one tap.
* Ensure the game works correctly after multiple restarts.
* Add appropriate sound effects for tapping the dog, starting the game, and completing the game.
* Ensure sounds do not overlap or continue playing after the game ends.
* Provide a mute/unmute control.
* Respect reduced-motion preferences.
* Keep the game relaxing, friendly, and suitable for the MindMesh portal.

### Game safety and accessibility

* Do not use flashing effects that could cause discomfort.
* Use clear contrast and readable text.
* Provide an accessible alternative to tapping for users who cannot use touch.
* Do not collect personal information through the game.
* Keep the game responsive on mobile, tablet, and desktop.

## 3. Admin – Delete victim account permission

Add a secure account-management feature to the existing Admin page.

### Requirements

* Give authorized administrators permission to delete a victim/user account.
* Add a clearly labeled Delete User or Delete Victim action in the Admin interface.
* Display a confirmation dialog before deletion.
* Show the user's name or non-sensitive account identifier in the confirmation dialog.
* Require the administrator to confirm the action explicitly.
* Do not allow ordinary users, victims, or Trusted Persons to delete other users.
* Enforce authorization on the backend, not only by hiding a frontend button.
* Verify the administrator's authenticated session and role for every deletion request.
* Prevent users from deleting themselves or other administrators unless a separate, explicitly authorized procedure exists.
* Validate the requested account ID on the backend.
* Return clear success and error messages.
* Handle nonexistent accounts and repeated deletion requests safely.
* Record an audit event for each successful deletion, including the administrator, target account, and timestamp, without storing unnecessary sensitive information.
* Use a safe deletion process that handles related data consistently.

### Privacy and recovery

* Before permanently deleting an account, provide a clear warning about the data that will be removed.
* If the application stores journals, conversations, voice transcripts, or other sensitive information, handle their deletion according to the project's privacy requirements.
* If recovery is needed, implement a secure soft-delete or approved recovery mechanism rather than creating an insecure backup.
* Do not expose private victim information in the Admin interface unnecessarily.

## 4. Render Free deployment optimization

Prepare the existing project for deployment on the **Render Free plan**, where the application's architecture and resource usage allow it.

### Backend

* Inspect the existing backend and ensure it starts correctly using the configured Render start command.
* Use the correct production server configuration for the backend framework.
* Bind the server to the `0.0.0.0` host and use the port provided by the `PORT` environment variable.
* Remove unnecessary development servers, debug modes, and development-only processes from production.
* Avoid starting duplicate backend processes.
* Optimize API endpoints and remove unnecessary repeated database queries.
* Add appropriate health checks.
* Handle application startup and shutdown gracefully.
* Ensure the application does not depend on localhost addresses in production.

### Database

* Use the existing MongoDB setup correctly.
* Store the MongoDB connection string in environment variables.
* Do not hardcode database credentials.
* Reuse database connections instead of creating a new connection for every request.
* Add appropriate indexes for frequently queried fields.
* Set reasonable connection timeouts and handle database failures gracefully.
* Do not expose MongoDB credentials or allow unrestricted public database access.
* Make sure the database configuration works from Render.

### Frontend

* Optimize the production build.
* Remove unnecessary dependencies and unused assets.
* Reduce large JavaScript bundles where practical.
* Avoid excessive animations, polling, and unnecessary re-renders.
* Ensure the frontend uses the correct production backend URL.
* Do not depend on a local IP address such as 192.168.x.x after deployment.
* Configure the correct CORS origins for the deployed frontend and backend.

### Render Free limitations

* Do not claim that the free plan provides guaranteed 24/7 uptime or zero latency.
* Do not add paid-only infrastructure or features as mandatory requirements.
* Reduce unnecessary memory and CPU usage.
* Handle slow startup and service inactivity gracefully.
* Make sure the application remains functional when the service starts again after inactivity.
* Document any limitations that cannot be solved by code alone.

## 5. Remove vulnerabilities and improve security

Perform a security audit of the entire project. Fix actual vulnerabilities rather than hiding warnings.

### Authentication and authorization

* Enforce authentication on all protected routes.
* Enforce role-based access control on the backend.
* Ensure Admin, Trusted Person, and victim permissions are separated correctly.
* Prevent unauthorized access to private user data.
* Validate all user input on the backend.
* Use secure password hashing if passwords are managed by the application.
* Configure secure session or token handling.
* Avoid exposing secrets, tokens, or private user data in frontend code.

### API and database security

* Validate and sanitize request data.
* Use safe database queries and prevent injection vulnerabilities.
* Restrict database access to authorized users.
* Add appropriate request size limits and rate limits where needed.
* Configure secure CORS rules.
* Avoid overly detailed error messages in production.
* Remove debug logs that expose sensitive information.
* Keep dependencies updated where compatible and fix known vulnerabilities.
* Review file uploads, if present, for unsafe file types and excessive file sizes.

### Voice chatbot security

* Keep all AI API keys and speech-service credentials on the backend.
* Do not expose API keys in frontend JavaScript or public environment variables.
* Validate audio uploads and enforce file-size limits.
* Avoid storing voice recordings or transcripts unless required and consented to.
* Protect private Sahay conversations.
* Handle microphone permissions and API failures gracefully.

## 6. Make the entire project smooth and fast

* Inspect the whole codebase before making changes.
* Identify duplicate components, conflicting CSS rules, duplicate event listeners, and unnecessary dependencies.
* Fix JavaScript errors and React warnings.
* Resolve CSS conflicts and z-index problems.
* Ensure each game has isolated state and cleanup logic.
* Prevent timers, audio, and animations from continuing after leaving or restarting a game.
* Fix overlapping sounds and duplicate game events.
* Avoid race conditions during API requests and game transitions.
* Optimize database requests and API response times.
* Use lazy loading for heavy game assets where useful.
* Avoid unnecessary global CSS changes.
* Preserve the current design and functionality.
* Do not replace working features with mockups or placeholders.

## 7. Testing and conflict prevention

Before completing the work:

### Existing games

* Open and test every existing game.
* Verify the game is full-screen and responsive.
* Test Start, Pause, Reset, Back, Sound, and other controls.
* Test all game rules and scoring.
* Test mobile touch and desktop mouse interactions.
* Verify no text overlaps or controls become hidden.
* Verify audio starts, stops, and mutes correctly.

### Tap the Dog

* Test the game from start to finish.
* Verify scoring, timer, random positioning, and restart behavior.
* Test repeated taps, rapid clicks, touch interactions, and audio.
* Ensure the dog never appears outside the playable area.

### Admin

* Test authorized account deletion.
* Test unauthorized deletion attempts.
* Verify confirmation dialogs and backend authorization.
* Test invalid and repeated deletion requests.
* Verify audit logging and privacy handling.

### Deployment

* Run the frontend production build.
* Run backend tests and linting where configured.
* Check for dependency vulnerabilities using the project's package manager.
* Test all configured environment variables.
* Test the Render production start command.
* Verify frontend-to-backend communication after deployment.
* Check browser console errors and network failures.
* Test on mobile and desktop.
* Ensure no new feature breaks existing features.

## Final deliverables

* Provide the complete updated source code for all modified files.
* List the files changed and explain the reason for each change.
* Explain how to run the project locally.
* Provide the exact Render deployment configuration and start commands for the existing framework.
* List the required environment variables without revealing secret values.
* Explain how to configure MongoDB securely.
* Explain how to test the Admin deletion feature.
* Report any remaining issues or limitations honestly.

**Do not make unnecessary redesigns. Do not remove existing games. Do not change existing game rules. Do not introduce conflicting dependencies or duplicate implementations. Make the project stable, secure, responsive, and ready for deployment.**
