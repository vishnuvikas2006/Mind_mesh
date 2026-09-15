# Complete Codex Prompt: Update the Existing Mental-Wellbeing Support Platform

You are working on an **existing mental-wellbeing support project**. Your task is to inspect the repository, understand the current architecture, and implement the requirements below directly in the existing codebase.

Do not only explain what should be done. You must actually inspect, modify, integrate, and test the project.

---

## 1. First Inspect the Existing Repository

Before making any changes:

1. Inspect the complete project structure.
2. Identify:

   * Frontend framework and routing system
   * Backend framework and API structure
   * Database technology and schema/models
   * Current authentication system
   * Existing user roles
   * Existing victim, trusted-person, and admin features
   * Emergency alert implementation
   * Daily check-in implementation
   * Live-location implementation
   * Chatbot and voice features
   * Games and animation components
   * Existing tests and configuration files
3. Read the relevant source files before editing them.
4. Reuse the existing architecture, naming conventions, components, database setup, and styling wherever possible.
5. Do not rewrite the entire project unnecessarily.
6. Do not break unrelated existing functionality.

Create a short internal implementation plan before changing files.

---

# 2. Main Authentication Structure

The application must have three clearly separated login options on the main authentication page:

1. **Victim Login**
2. **Trusted Person Login**
3. **Admin Login**

Each role must have its own authentication flow and portal.

The frontend must not rely only on hidden buttons or route restrictions. All role permissions must be enforced by the backend.

---

# 3. Important: Remove OTP Authentication Completely

## Remove OTP From the Entire Project

Completely remove OTP-based authentication and verification from all parts of the application.

OTP must not be used for:

* Victim registration
* Victim login
* Trusted Person account creation
* Trusted Person login
* Admin login
* Password reset
* Email verification
* Mobile verification
* Emergency alerts
* Help requests
* Live-location sharing
* Any other authentication or authorization flow

Do not replace OTP with another fake verification process.

## Remove OTP Frontend Functionality

Remove all OTP-related frontend elements, including:

* OTP input fields
* OTP verification pages
* OTP modals
* “Send OTP” buttons
* “Verify OTP” buttons
* “Resend OTP” buttons
* OTP countdown timers
* OTP error messages
* OTP success messages
* OTP-related loading states
* OTP-related state variables
* OTP-related routes
* OTP-related navigation items
* OTP-related API calls
* OTP-related hooks
* OTP-related services
* OTP-related components
* OTP-related validation schemas

Search the entire frontend for terms such as:

* `otp`
* `OTP`
* `verifyOtp`
* `sendOtp`
* `resendOtp`
* `otpCode`
* `verificationCode`
* `otpToken`

Remove or refactor all obsolete references.

 
 


# 4. Victim Login and Portal

Victims must be able to log in using:

* Registered email or mobile number
* Password

Victim login must not require OTP.

After successful login, redirect the victim to the **Victim Portal**.

The Victim Portal should preserve and support existing features such as:

* Personal profile
* Wellbeing dashboard
* Daily check-ins
* Emergency button
* Help requests
* Support chatbot
* Stress-relief games
* Trusted-person management
* Live-location sharing
* Alert history
* Account settings
* Password change
* Secure logout

Ensure that victim routes cannot be accessed by trusted-person or admin accounts unless explicitly authorized by backend rules.

---

# 5. Trusted Person Account Creation

The trusted-person workflow must use victim-created credentials.

The flow must be:

1. Victim logs in to the Victim Portal.
2. Victim opens **Trusted Persons**.
3. Victim selects **Add Trusted Person**.
4. Victim enters:

   * Trusted person full name
   * Trusted person email
   * Trusted person mobile number
   * Relationship with the victim
   * Temporary password
   * Confirm temporary password
5. Backend validates the submitted information.
6. Backend creates a separate account with the role:

```text
trusted_person
```

7. The trusted-person account is linked to the victim.
8. The victim securely shares the login credentials with the trusted person.
9. The trusted person logs in through the dedicated **Trusted Person Login** page.
10. The trusted person must change the temporary password during the first login.
11. Only after changing the temporary password can the trusted person access the Trusted Person Portal.

Do not use an invitation-link flow unless it is already required by the existing architecture and can be safely adapted. The primary required flow is victim-created credentials.

## Trusted Person Account Security

* Never store plaintext passwords.
* Hash passwords using the project’s secure password-hashing system.
* Never log temporary passwords.
* Never return passwords or password hashes in API responses.
* Validate email and mobile formats.
* Prevent duplicate or conflicting accounts.
* Ensure the victim can only create trusted-person accounts according to application rules.
* Ensure a trusted person cannot create arbitrary victim accounts.
* Ensure the trusted person cannot use victim credentials to access the Victim Portal.
* Ensure the trusted person cannot use admin credentials to access the Admin Portal.

---

# 6. Trusted Person First Login

When a trusted person logs in with a temporary password:

1. Authenticate the credentials.
2. Detect that the account requires a password change.
3. Set or check a field such as:

```text
must_change_password = true
```

4. Redirect the user to a mandatory **Change Temporary Password** page.
5. Prevent access to the Trusted Person Portal until the password is changed.
6. Require:

   * Current temporary password, if appropriate
   * New password
   * Confirm new password
7. Validate password strength.
8. Hash the new password.
9. Set:

```text
must_change_password = false
```

10. Invalidate the temporary password.
11. Create or refresh a secure authenticated session.
12. Redirect the trusted person to the Trusted Person Portal.

The first-login restriction must be enforced on the backend, not only in the frontend.

---

# 7. Trusted Person Portal Permissions

The Trusted Person Portal must display only information that the victim has explicitly authorized.

The portal may show:

* Connected victim’s name
* Connection status
* Relationship with the victim
* Wellbeing score, if permission is enabled
* Wellbeing status, if permission is enabled
* Latest daily check-in, if permission is enabled
* Emergency alerts
* Help requests
* Alert history
* Live location only while the victim is actively sharing it
* Live-location expiration time
* Permission status

The trusted person must never see:

* Private chatbot conversations
* Private journals
* Unshared check-ins
* Unshared wellbeing information
* Private notes
* Passwords
* Password hashes
* Session tokens
* OTPs
* Reset tokens
* Internal system data
* Data belonging to other victims
* Expired live location
* Revoked live location
* Any information outside the victim’s selected permissions

Implement permission checks in backend APIs and database queries.

Do not rely only on frontend filtering.

---

# 8. Victim Trusted-Person Management

The Victim Portal must allow the victim to:

* View connected trusted persons
* Add a trusted person
* Create trusted-person credentials
* View trusted-person account status
* Disable a trusted person
* Re-enable a trusted person
* Remove a trusted person
* Change the relationship
* Update trusted-person contact details where allowed
* Change trusted-person permissions
* Revoke access immediately
* View permission history
* View connection history

The victim must be able to choose which information is shared with each trusted person.

Available permission options may include:

* Wellbeing score
* Wellbeing status
* Daily check-ins
* Emergency alerts
* Help requests
* Alert history
* Live location

When a permission is revoked, the trusted person must lose access immediately or as soon as the current secure session is revalidated.

---

# 9. Password Reset Without OTP

Because OTP authentication is being removed, password reset must use a secure reset-token or reset-link flow.

## Password Reset Requirements

Implement:

1. “Forgot Password?” page.
2. User enters email or mobile number.
3. Return a generic response that does not reveal whether the account exists.
4. Generate a cryptographically secure, short-lived, single-use reset token.
5. Store only a secure hash of the reset token where possible.
6. Send the reset link through the configured email provider if available.
7. Do not use OTP.
8. Do not display the raw reset token in logs.
9. Do not expose the reset token through normal API responses.
10. Rate-limit reset requests.
11. Expire reset tokens after a short period.
12. Invalidate the token immediately after successful use.
13. Hash the new password securely.
14. Invalidate existing sessions after password reset.
15. Show a clear success or failure message.

If an email provider is not configured, provide a development-only fallback that is clearly marked as development-only. Never expose a fake production success message.

Implement password reset for:

* Victim accounts
* Trusted Person accounts
* Admin accounts, if supported by the existing project

---

# 10. Admin Login and Admin Portal

Admin login must use configured admin credentials and password-based authentication only.

Admin login must not require OTP.

The Admin Portal should provide authorized administrative information such as:

* Registered victims
* Registered trusted persons
* Account status
* Verification or activation status, if applicable
* Trusted-person relationships
* Permission summaries
* Emergency alerts
* Help requests
* Check-in statuses
* Live-location sharing status
* Audit logs
* Account disablement status
* Security events

When an admin opens a victim record, show only authorized administrative information, such as:

* Victim profile
* Connected trusted persons
* Relationship information
* Account status
* Permission summary
* Alert history
* Help-request history
* Relevant wellbeing status

Never show:

* Plaintext passwords
* Password hashes
* Session tokens
* Reset tokens
* OTP data
* Private credentials
* Sensitive private content that the admin is not authorized to access

Protect every admin endpoint with backend role checks.

---

# 11. Authentication and Security Requirements

Implement secure authentication throughout the project.

Requirements:

* Secure password hashing
* Strong password validation
* Secure session handling
* Secure cookies or token storage according to the existing architecture
* Logout functionality
* Session invalidation
* Rate limiting for login attempts
* Protection against brute-force attacks
* Protection against IDOR vulnerabilities
* Backend role-based access control
* Backend ownership checks
* Permission checks on every sensitive endpoint
* Generic authentication error messages where appropriate
* No sensitive data in logs
* No passwords in frontend state after submission
* No passwords in URLs
* No tokens in URLs unless required for a short-lived reset link
* No secrets committed to the repository
* Proper CORS and CSRF protection where relevant
* Input validation on frontend and backend
* Secure database queries
* Audit logging for sensitive actions

Check for and prevent:

* Victim accessing another victim’s data
* Trusted person accessing another victim’s data
* Trusted person accessing unshared data
* Admin endpoints being accessed by normal users
* Role manipulation through frontend requests
* Account enumeration
* Session fixation
* Unauthorized permission changes
* Unauthorized live-location access

---

# 12. Daily Check-In System

Preserve or implement the following daily check-in options:

## “I’m Okay”

* Store the check-in.
* Do not create an unnecessary emergency alert.
* Share the result only with trusted persons who have the relevant permission.

## “Stressed”

Show supportive options such as:

* Try a stress-relief game
* Listen to calming music
* Talk to the support chatbot
* Take a short break
* Drink water
* Contact a trusted person
* Practice breathing

Share the status only according to the victim’s permissions.

## “Scared”

* Record the check-in.
* Show a moderate orange wellbeing status.
* Offer supportive actions.
* Suggest contacting a trusted person when appropriate.
* Share only with authorized trusted persons.

## “Need Help”

* Create a help request.
* Notify authorized trusted persons.
* Notify the admin if configured.
* Show clear delivery status.
* Trigger vibration or browser notification only where supported and permitted.
* Store an audit record.
* Allow the victim to view the request status.

Do not claim that an email, SMS, push notification, call, or vibration succeeded unless the provider or browser actually confirms it.

---

# 13. Emergency Button

Preserve the existing Emergency feature and make sure it:

1. Creates an emergency event.
2. Records the time and relevant event information.
3. Notifies authorized trusted persons.
4. Notifies the admin if configured.
5. Respects permission and account status.
6. Displays the notification delivery status.
7. Records an audit log.
8. Supports vibration where the browser/device allows it.
9. Does not expose private information to unauthorized users.
10. Prevents duplicate accidental submissions where possible.
11. Allows the victim to see the emergency event status.

Automatic phone calls must only be implemented through a configured backend telephony provider.

Do not claim that calls, SMS messages, emails, push notifications, or vibrations succeeded without real confirmation.

---

# 14. Live-Location Sharing

Live-location sharing must require explicit victim consent.

The victim must be able to:

* Select a trusted person
* Select a sharing duration
* Start sharing
* Stop sharing immediately
* View active sharing sessions
* Revoke access
* View expiration time

Available durations may include:

* 15 minutes
* 30 minutes
* 1 hour
* 4 hours
* Until manually stopped

Requirements:

* Backend must enforce sharing permissions.
* Location sharing must expire automatically.
* Revocation must take effect immediately.
* Expired locations must not be visible.
* Trusted persons must not access location without active permission.
* Location must not be stored longer than necessary.
* Do not collect location in the background unless the user has explicitly consented and the platform supports it.
* Clearly explain browser and device limitations.
* Do not claim real-time tracking if the implementation only provides periodic updates.

---

# 15. Support Chatbot and Voice-to-Voice Support

Preserve the support chatbot and improve it where necessary.

The chatbot should:

* Use an available free-tier or local AI model where practical.
* Keep API keys on the backend only.
* Never expose provider keys in frontend code.
* Avoid unlimited quota claims.
* Avoid endless retries when a provider quota is exhausted.
* Provide a safe fallback response when the AI provider is unavailable.
* Clearly communicate provider limitations.
* Use empathetic and supportive language.
* Avoid pretending to be a licensed mental-health professional.
* Encourage the user to contact a trusted person or emergency service when there is immediate danger.
* Avoid diagnosing the user.
* Avoid making unsafe mental-health claims.
* Support multiple languages only if those languages are actually tested.
* Do not assume the user’s religion.
* Do not fabricate religious quotations or scripture.
* Make religious or spiritual support optional.

If voice-to-voice support already exists or is requested, implement the following flow where technically supported:

```text
Microphone input
      ↓
Speech-to-text
      ↓
Support AI response
      ↓
Text-to-speech
      ↓
Robot or animated character output
```

Use a local or free provider where practical.

Clearly show whether each provider is:

* Configured
* Not configured
* Working
* Unavailable
* Development-only

Do not claim voice-to-voice functionality works unless it has been tested successfully.

---

# 16. Stress-Relief Games

Preserve the existing stress-relief games.

The game interface must remain focused on the selected game and should not contain unrelated dashboard elements.

Requirements:

* Support touch, mouse, and keyboard interaction where practical.
* Support swipe left and right navigation between games.
* Ensure navigation works on mobile and desktop.
* Respect reduced-motion preferences.
* Do not autoplay sound.
* Provide accessible labels and instructions.
* Avoid accidental page scrolling during game interaction.
* Ensure buttons and controls are keyboard accessible.

## Calm Garden

Ensure the Calm Garden interaction works correctly:

* Dragging must work with mouse and touch/pointer events.
* Prevent accidental page scrolling while dragging.
* Provide a keyboard-accessible alternative.
* Provide clear visual feedback.
* Ensure objects cannot become permanently stuck.
* Test on mobile and desktop.

## Remove Grounding Game

Completely remove the Grounding Game and all related functionality, including:

* Grounding Game component
* Grounding Game route
* Navigation item
* Imports
* Assets
* Styles
* Tests
* State variables
* Dead code
* Documentation references

Search the entire repository to confirm that no obsolete Grounding Game references remain.

---

# 17. Responsive Design and Accessibility

Test and improve the following pages at:

* 320px width
* 360px width
* 390px width
* 412px width
* Tablet sizes
* Desktop sizes

Check:

* Victim Login
* Trusted Person Login
* Admin Login
* Victim registration
* Trusted-person account creation
* First-login password change
* Forgot-password page
* Password-reset page
* Victim Portal
* Trusted Person Portal
* Admin Portal
* Trusted-person management
* Emergency page
* Daily check-in page
* Live-location page
* Chatbot page
* Voice-support page
* Game pages

Requirements:

* No horizontal page scrolling.
* No clipped content.
* Responsive forms.
* Proper spacing.
* Accessible labels.
* Keyboard navigation.
* Visible focus states.
* Clear loading states.
* Clear error states.
* Accessible color contrast.
* Mobile-friendly buttons.
* Proper semantic HTML.
* Screen-reader-friendly status messages.

---

# 18. Environment Variables and Provider Configuration

Review all environment variables and update `.env.example`.

Document configuration for:

* Database
* Session or authentication secrets
* Email provider
* SMS provider, if used for non-OTP notifications
* Push notifications
* Telephony provider
* AI provider
* Speech-to-text provider
* Text-to-speech provider
* Live-location functionality
* Any other external service

Do not commit real secrets.

Do not include OTP configuration after OTP removal.

For every external provider, show its actual status:

* Configured and tested
* Configured but not tested
* Not configured
* Development fallback only
* Unsupported

Never create fake provider success responses in production.

---

# 19. Database and Migration Requirements

Inspect the existing database models and migrations.

Remove obsolete OTP-related fields, collections, indexes, and records where safe.

Before destructive database changes:

1. Review existing data structures.
2. Add a safe migration where needed.
3. Avoid deleting unrelated production data.
4. Document the migration.
5. Ensure existing user accounts remain usable.
6. Preserve victim-trusted-person relationships.
7. Preserve existing alert, check-in, permission, and audit data.

Ensure account models support the necessary fields, such as:

* Role
* Password hash
* Temporary-password status
* First-login password-change status
* Account status
* Victim-trusted-person relationship
* Permission settings
* Created date
* Updated date
* Last login
* Session invalidation information

Use the project’s existing naming conventions.

---

# 20. Testing Requirements

Add or update tests for all important flows.

 
 
## Authorization Tests

Test:

* Victim cannot access another victim’s data.
* Trusted person cannot access another victim’s data.
* Trusted person cannot access unshared data.
* Trusted person cannot access expired live location.
* Revoked trusted-person access takes effect immediately.
* Admin-only routes reject normal users.
* Frontend role manipulation does not bypass backend checks.
* IDOR vulnerabilities are prevented.

## Feature Tests

Test:

* Daily check-ins
* Emergency alerts
* Help requests
* Trusted-person permissions
* Live-location sharing and expiry
* Live-location revocation
* Alert history
* Chatbot fallback
* Voice-support status
* Calm Garden interaction
* Removal of Grounding Game
* Responsive layouts
* Existing victim and admin functionality

Run the existing test suite and fix regressions.

If tests cannot run, clearly report the exact reason.

---

# 21. Final Implementation Report

After completing the work, provide a detailed report containing:

1. Repository architecture discovered
2. Framework and database used
3. Authentication system reviewed
4. Files changed
5. Files removed
6. OTP functionality removed
7. Updated Victim Login flow
8. Updated Trusted Person Login flow
9. Trusted-person account creation flow
10. First-login password-change flow
11. Password-reset implementation
12. Admin authentication flow
13. Security improvements
14. Database changes and migrations
15. Permission and authorization changes
16. Emergency and check-in behavior
17. Live-location behavior
18. Chatbot and voice-support status
19. Games changed
20. Grounding Game removal details
21. Responsive-design changes
22. Tests executed
23. Tests passed
24. Tests failed and reasons
25. Provider configuration status
26. Environment variables required
27. Deployment instructions
28. Known limitations
29. Recommended future improvements

## Final Constraints

* Inspect the repository before editing.
* Make actual code changes.
* Do not merely provide a theoretical plan.
* Do not introduce OTP authentication anywhere.
* Do not store plaintext passwords.
* Do not expose secrets, password hashes, reset tokens, or session tokens.
* Do not claim an integration works unless it has been tested.
* Do not break existing working features.
* Keep the implementation secure, responsive, accessible, and maintainable.
