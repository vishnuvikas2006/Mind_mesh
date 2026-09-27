I have a performance issue in my project.

The application page loading is taking too long, and especially the **account creation / registration process is slow**. I want you to investigate the existing codebase and fix the performance issues without breaking any existing functionality.

### Project context

* Next.js 15+
* React 19+
* TypeScript
* App Router
* MongoDB Atlas
* Mongoose
* Next.js Route Handlers / Server Actions where applicable
* Zod validation
* Gemini AI is used for some AI functionality
* The application is a full-stack Next.js application

### IMPORTANT

Do NOT assume the cause of the slowness. First inspect the existing codebase and identify the actual bottlenecks.

### 1. Analyze initial page loading

Check:

* Server Components vs Client Components
* Unnecessary `"use client"` usage
* Large client-side JavaScript bundles
* Components that are unnecessarily loaded on the initial page
* Unnecessary API calls during page load
* Duplicate API/database requests
* Sequential requests that can run in parallel
* Slow Server Components
* Unnecessary database queries
* Large data being sent from server to client
* Images and other static assets
* Suspense/loading boundaries
* Middleware that runs unnecessarily
* Authentication/session checks that are unnecessarily repeated
* Any blocking operations during initial rendering

Use the existing architecture instead of rewriting the application.

### 2. Analyze account creation / registration

The registration process is currently taking too long.

Trace the complete registration flow:

Frontend form
→ validation
→ API/Server Action
→ password processing
→ MongoDB connection
→ database queries
→ user creation
→ any profile creation
→ authentication/session creation
→ redirects
→ notifications or other background operations

Find exactly which operations are causing the delay.

Pay particular attention to:

* MongoDB connection handling
* Creating a new database connection for every request
* Missing connection caching
* Multiple database queries that can be combined
* Duplicate user/email checks
* Mongoose model initialization
* Password hashing configuration and unnecessary repeated hashing
* AI/API calls accidentally being performed during registration
* Sending notifications synchronously when they do not need to block registration
* Unnecessary database population
* Unnecessary data returned from the registration API
* Slow redirects or session creation

### 3. MongoDB/Mongoose optimization

Inspect all queries involved in registration and initial dashboard loading.

Check whether appropriate indexes exist for frequently queried fields such as:

* email
* phone number if used
* user/citizen ID
* complaint-related lookup fields

Do NOT add indexes blindly. Add them only when they are actually useful.

Check for:

* `.find()` when `.findOne()` is sufficient
* fetching unnecessary fields
* unnecessary `.populate()`
* sequential queries that can be parallelized
* repeated queries for the same data
* inefficient aggregation
* connection initialization on every request

Make MongoDB connection handling efficient for Next.js development and production.

### 4. API and server-side optimization

Inspect all APIs involved in:

* registration
* login
* authentication
* dashboard loading
* profile loading

Reduce unnecessary network requests.

Where safe, combine related operations or execute independent operations concurrently using `Promise.all()`.

Do NOT use `Promise.all()` for operations that depend on each other's results.

### 5. Client-side optimization

Check whether the frontend is waiting for data that is not required for the first render.

Improve:

* lazy loading
* dynamic imports
* Suspense
* loading states
* code splitting
* image loading
* unnecessary re-renders
* unnecessary `useEffect()` calls
* duplicate fetches
* client-side state initialization

Do not convert everything to Client Components.

Prefer Server Components wherever possible.

### 6. Registration UX

Even after optimizing the backend, make the registration experience feel responsive.

The user should immediately see:

* button loading state
* disabled submit button while processing
* clear validation errors
* clear success/error feedback

Do not hide actual backend delays with fake timers or artificial loading.

### 7. IMPORTANT: Preserve functionality

Do NOT:

* rewrite the entire application
* change the database from MongoDB
* replace Mongoose
* remove authentication
* remove validation
* remove existing features
* remove security checks
* weaken password hashing/security
* hardcode user data
* introduce fake caching
* add arbitrary delays
* change the UI unnecessarily

### 8. Diagnose before modifying

Before making changes, inspect the relevant files and tell me:

1. What is causing the initial page load to be slow?
2. What is causing account creation to be slow?
3. Which database/API operations are the bottlenecks?
4. Which files need modification?
5. What optimizations you recommend?

Then implement the fixes.

### 9. Verify the changes

After making the changes:

* Run the project
* Check for TypeScript errors
* Check for lint/build errors
* Test registration
* Test login
* Test page navigation
* Test dashboard loading
* Verify MongoDB operations still work
* Verify existing authentication behavior
* Verify existing functionality is preserved

If possible, measure the before/after response times for the registration API and major page/API requests.

### Final output

After completing the optimization, give me a concise report containing:

* Root cause(s)
* Files changed
* Changes made
* Registration performance improvement
* Page-load improvements
* Any remaining bottlenecks
* Any recommended future optimizations

Start by analyzing the existing codebase. Do not make assumptions about the cause of the performance problem.
