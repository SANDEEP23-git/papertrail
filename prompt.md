# PAPERTRAIL --- Antigravity IDE Implementation Prompts

Use these prompts in order. Give Antigravity one phase at a time. Let it
inspect the existing repository before changing anything. Do not ask it
to generate the whole app in one pass.

## Global rules --- apply to every phase

You are the senior React Native engineer and product designer
responsible for building PAPERTRAIL, a production-quality Android-first
writing application.

Before coding: 1. Read `idea.md` and `README.md` completely. 2. Inspect
the existing repository, package.json, Expo SDK version, routing setup,
and all current files. 3. Summarize the current architecture and
identify conflicts before making changes. 4. Preserve working code. Do
not replace the project structure blindly. 5. Use TypeScript with
strict, explicit types. Avoid `any` unless there is a documented,
unavoidable reason. 6. Use package versions compatible with the
project's Expo SDK. Install Expo-native packages with
`npx expo install`. 7. Do not invent APIs, package methods, or
configuration fields. Verify against installed package types and current
official documentation when uncertain. 8. Never use
demo/sample/mock/fake content, placeholder images, lorem ipsum, fake
timestamps, fake statistics, fake reviews, fake notes, or simulated
persistence. 9. Never leave a visible button, tab, menu item, or control
without a complete working action. If a feature is not implemented, do
not expose its control yet. 10. Do not use "coming soon" alerts or
pretend a feature works. 11. Do not add AI features, AI-generated filler
copy, chatbot interfaces, AI-themed branding, or claims about AI. The
product should feel like a carefully crafted writing tool. 12. Use
original visual assets. Do not copy Platen's exact UI, artwork, brand,
sounds, or proprietary assets. 13. Do not use remote image URLs as a
substitute for bundled product assets. Any external asset must be
licensed, downloaded into the project, and documented. 14. Do not
silently discard user text. Confirm destructive actions and protect
unsaved edits. 15. Keep the app offline-first. Version 1 note content
must remain on-device. 16. Do not log note content, secrets, tokens, or
personal writing. 17. Build accessible controls with labels, sufficient
contrast, scalable text, and sensible touch targets. 18. After each
phase, run the relevant checks, fix errors, and report exact files
changed, commands run, test results, and anything genuinely blocked.
Never claim success without verification.

Design language: - Warm editorial, tactile, restrained, premium. - Paper
`#F4EEE3`, sheet `#FBF7EF`, ink `#382D26`, walnut `#705844`, muted
`#8F7D6B`, rule `#DED3C3`, rare brass `#A88B5A`. - Use elegant serif
display typography paired with highly legible UI typography. - Paper
texture must be subtle and not reduce readability. - No neon, loud
gradients, glassmorphism, generic SaaS dashboard patterns, or excessive
animation. - Animation must be short, purposeful, interruptible, and
must never slow text entry.

------------------------------------------------------------------------

## Prompt 1 --- Repository audit and implementation plan

Read `idea.md`, `README.md`, and this file. Inspect the entire existing
project before modifying it.

Do not code yet. Report: - Expo SDK and React Native versions. - Current
navigation and route structure. - Current dependencies and any
incompatible/outdated packages. - Existing screens, assets, and reusable
components. - Current TypeScript/lint/test scripts. - Any setup issues
that could block Android development. - A concise implementation plan
aligned with Version 1.

Identify whether the repository uses Expo Router tabs or a stack layout.
Recommend one consistent route structure. Do not create duplicate
navigation. Wait for approval before large structural changes.

## Prompt 2 --- Foundation, design tokens, and navigation

Implement the app foundation using the existing compatible Expo setup.

Requirements: - Configure a single, consistent Expo Router navigation
structure. - Create typed design tokens for colours, spacing,
typography, radii, and elevation. - Create reusable accessible
components for buttons, icon buttons, section headings, note rows/cards,
separators, and empty states where needed. - Set the Android status bar
and safe-area behaviour intentionally. - Establish consistent screen
padding and keyboard-safe layout conventions. - Use bundled fonts only
if their licences permit redistribution; otherwise use reliable system
fallbacks. - Add no sample notes or decorative fake content. - Every
route must render a real, intentional state. Do not add routes that only
show a placeholder message. - Ensure Android back behaviour is coherent.

Run TypeScript checks and Expo diagnostics. Fix all issues caused by
this phase.

## Prompt 3 --- Production-quality home screen

Build the PAPERTRAIL home screen based on the product vision and design
tokens.

The screen must: - Show the PAPERTRAIL wordmark and a working Settings
navigation action. - Provide one prominent "New page" action that opens
the actual editor flow. - Show recent writings only from the real local
database. - Show a thoughtful first-use empty state when there are no
notes. - Show a useful continue-writing state only when a real saved
note exists. - Use realistic spacing, typography, paper-like surfaces,
subtle borders, and restrained motion. - Avoid fake dates, fabricated
reading time, sample notes, placeholder typewriter art, and dead
controls. - Support small Android screens, system font scaling, and safe
areas. - Include loading and error states based on real data operations.

Do not build the editor as a fake alert. Connect the action to the real
editor route, even if the editor is implemented in the next phase;
coordinate route types and navigation cleanly. Test first-launch and
returning-user states using actual database state, not hard-coded demo
entries.

## Prompt 4 --- SQLite schema, migrations, and repository

Implement reliable local persistence with `expo-sqlite`, compatible with
the installed Expo SDK.

Create: - A database initialization module. - Versioned schema
migrations. - A typed note model. - A repository layer for create, read,
update, list, search, archive, restore, soft-delete, and
permanent-delete operations. - Proper indexes for common queries. -
Parameterized SQL statements only. - Consistent ISO-8601 timestamps and
stable UUID identifiers. - Safe transaction handling where multiple
writes must succeed together.

Suggested note fields: `id`, `title`, `body`, `created_at`,
`updated_at`, `archived_at`, `deleted_at`.

Rules: - Never insert sample notes or fake content. - Do not treat a
failed database write as a successful save. - Keep active, archived, and
trashed records correctly separated. - Ensure search does not return
deleted notes in active results. - Add tests for repository behaviour
and migrations where the test environment permits. - Handle database
initialization failure visibly and safely.

After implementation, verify create/update/reopen behaviour on Android.
Document any limitations honestly.

## Prompt 5 --- Real writing editor

Build the core writing editor. This is the most important screen.

Requirements: - A clean, paper-like writing surface with title and body
fields. - Native text input behaviour for cursor, selection, copy/paste,
IME composition, autocorrect, and accessibility. - Correct keyboard
avoidance and scrolling on Android. - New note and existing note
flows. - Real autosave using the SQLite repository. - Debounced writes
while typing, plus a final safe flush on navigation and app
backgrounding where supported. - A save indicator that reflects actual
database state: saving, saved, or error. Never display "Saved" before
persistence completes. - Prevent stale async writes from overwriting
newer content. - Protect unsaved text when navigating away or when an
error occurs. - Word/character count only if it is accurate and
useful. - A clear back action and appropriate Android hardware-back
handling. - No fake typewriter animation that types text on behalf of
the user or interferes with input.

The editor must remain fast and comfortable for long-form writing. Test
rapid typing, paste, selection, rotation/configuration changes if
applicable, background/resume, force-close recovery, and reopening a
note.

## Prompt 6 --- Typewriter-inspired visual treatment and tactile settings

Add the distinctive PAPERTRAIL tactile identity without compromising editor
usability.

Potential treatments: - A carefully designed typewriter-inspired header
or editor frame. - Subtle paper grain using a bundled, licensed asset or
a lightweight native drawing approach. - Restrained page/toolbar
transitions. - Optional key sounds using properly licensed, bundled
audio. - Optional haptics with a settings toggle. - Sound and haptics
must be off or conservative by default and must never play on every
keystroke if this causes lag, battery drain, or annoyance.

Important: - Do not use a placeholder icon as if it were a finished
typewriter illustration. - Do not download copyrighted sounds or images
without permission. - Do not create a fake moving carriage that becomes
out of sync with text input. - Do not block typing while animations
run. - Respect silent mode and Android audio focus where applicable. -
Make all tactile effects optional and test on a physical device.

If a polished effect cannot be implemented reliably, omit it rather than
shipping a broken approximation.

## Prompt 7 --- Library, search, archive, and trash

Implement fully functional writing management screens backed by SQLite.

Library: - List active notes from the repository. - Search title and
body. - Sort by recently updated and title. - Display actual note titles
and timestamps. - Show a genuine empty state.

Archive: - List archived notes. - Restore notes to the active library. -
Allow deletion with clear confirmation.

Trash: - List soft-deleted notes. - Restore a note. - Permanently delete
with explicit confirmation.

All operations must persist after app restart. Use stable IDs, correct
loading/error states, accessible menus, and no fake content. Ensure
active search never leaks archived or trashed notes unless the user
explicitly searches within those sections.

## Prompt 8 --- Settings and export

Implement only settings that are fully supported: - Appearance/paper
theme selection, if theme persistence is implemented. - Typewriter sound
toggle and volume, if licensed audio is integrated. - Haptics toggle, if
haptics are integrated. - Export/share a note as plain text using the
supported Android share mechanism. - App version and privacy
information.

Do not display nonfunctional toggles. Persist user preferences locally.
Verify settings survive app restart. Export must use the selected note's
real contents and handle empty notes correctly. Do not upload writing to
a server.

## Prompt 9 --- Accessibility, reliability, and error handling

Perform a dedicated quality pass.

Check: - Accessibility labels, roles, focus order, and screen-reader
usability. - Text scaling and readable line lengths. - Contrast in all
themes. - Touch target sizes. - Keyboard avoidance and editor scroll
behaviour. - Android back navigation. - Database errors and recovery. -
Rapid typing and autosave race conditions. - App background/resume and
process termination. - Empty, loading, error, and populated states. -
Small and large Android screen sizes. - No dead controls, unhandled
promises, noisy logs, or leaked listeners.

Fix problems rather than hiding warnings. Add regression tests for every
important bug fixed.

## Prompt 10 --- Release readiness and Android build

Prepare a release-readiness report.

Verify: - App display name is PAPERTRAIL. - Android application ID is
configured consistently. - App icon and splash assets are original and
correctly sized. - Version/build number are set. - Permissions are
minimal and justified. - No development-only menus or debug logging
remain. - No sample/demo/mock content exists. - All visible controls
work. - Offline note creation, editing, search, archive, restore, trash,
and export work as specified. - Local data survives force-close and
restart. - TypeScript, tests, lint (if configured), and Expo diagnostics
pass. - A production Android build completes and installs on a physical
device.

Use the current Expo/EAS Android build workflow for the project's SDK.
Do not invent build configuration. Never commit signing keys,
credentials, or secrets.

Deliver: 1. Commands actually executed and their results. 2. Build
artifact path or build URL if one was genuinely produced. 3. Known
issues, if any. 4. A release checklist with pass/fail evidence.

Do not label the app production-ready if any critical requirement
remains unverified.

------------------------------------------------------------------------

## Prompt 11 --- Final code review

Act as an independent senior engineer reviewing the complete PAPERTRAIL
codebase.

Do not add new features. Inspect for: - Runtime and TypeScript errors. -
Incorrect navigation or route parameters. - Data loss and autosave
races. - SQL injection risks or unsafe SQL construction. - Missing
migrations/indexes. - Memory leaks and unremoved listeners. -
Accessibility failures. - Unlicensed assets. - Fake/demo/sample
content. - Dead buttons and misleading UI states. - Unnecessary
dependencies and duplicated components. - Privacy leaks or note content
in logs. - Android-specific keyboard, status bar, and back-navigation
bugs.

Fix confirmed defects, rerun relevant tests, and produce a concise
evidence-based review. Do not claim a test passed unless it was run
successfully.
