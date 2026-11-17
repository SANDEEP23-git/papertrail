# PAPERTRAIL --- Creative Product Idea

**Tagline:** Every thought leaves a mark.\
**Platform:** Android-first mobile application\
**Product category:** Premium offline-first writing and journaling app\
**Working brand:** PAPERTRAIL

------------------------------------------------------------------------

## 1. Product vision

PAPERTRAIL is a calm, tactile writing space for people who want writing to
feel intentional again. It brings the charm and focus of a classic
mechanical typewriter into a carefully designed Android experience,
without sacrificing the speed, reliability, accessibility, and
convenience of a modern mobile app.

The product should feel like a crafted writing instrument---not a
generic notes app, AI chatbot, template gallery, or social network.

The central experience is simple:

1.  Open PAPERTRAIL.
2.  Start a fresh sheet of paper.
3.  Write without interruptions.
4.  Trust that every change is saved.
5.  Return to writings in a well-organized personal library.

The visual language is Platen-inspired in spirit, but PAPERTRAIL must have
its own original interface, interaction design, assets, copy, and brand
identity. Do not copy proprietary screens, illustrations, sounds, names,
or assets from another app.

## 2. Product principles

### Writing comes first

The editor is the heart of the app. Every screen and feature must
support the act of writing rather than compete for attention.

### Craft over decoration

Use restrained details: paper grain, ink-like typography, subtle
shadows, measured spacing, and purposeful motion. Avoid excessive
gradients, neon, glassmorphism, flashy transitions, and decorative
clutter.

### Real, finished functionality

Every visible control must perform its stated action. Do not ship fake
buttons, placeholder cards, sample notes, mock data, dead navigation,
"coming soon" alerts, simulated saving, or decorative controls that look
interactive.

### Offline-first trust

Users must be able to create, edit, search, organize, and delete their
writing without an internet connection. Saving must be durable and
verified.

### Privacy by default

Writing is personal. Do not collect, upload, analyze, or share note
contents unless a clearly explained feature explicitly requires it and
the user opts in. No AI-generated content features are part of the
initial product.

### Honest product language

Never imply that AI was used, that a human wrote something, or that a
feature exists when it does not. The interface should simply be a
polished product, with no AI-themed branding, AI-generated filler copy,
or fake testimonials.

## 3. Audience and use cases

Primary users: - People who enjoy journaling, personal writing, poetry,
reflections, and private notes. - Students who want a distraction-light
place for notes and ideas. - Writers who appreciate tactile interfaces
and a focused editor. - People who prefer offline access and ownership
of their writing.

Core use cases: - Capture a thought quickly. - Write a longer journal
entry. - Continue an unfinished draft. - Find a past note by title or
content. - Organize notes into collections. - Archive or permanently
delete a note. - Export a note for backup or sharing.

## 4. Brand direction

### Brand personality

Quiet, literary, warm, deliberate, confident, tactile, timeless.

### Visual identity

-   Base paper: warm ivory / parchment.
-   Main ink: deep espresso brown.
-   Secondary tones: muted walnut, aged taupe, soft graphite.
-   Accent: restrained brass or muted olive, used sparingly.
-   Typography: a readable editorial serif for titles and a highly
    legible sans-serif for controls and metadata.
-   Surfaces: subtle paper texture, fine borders, soft natural shadows.
-   Motion: short, quiet, physical-feeling transitions; never slow down
    typing.

### Suggested design tokens

These are starting tokens, not permission to apply colours
inconsistently.

  Token      Value       Use
  ---------- ----------- ----------------------
  `paper`    `#F4EEE3`   Main app background
  `sheet`    `#FBF7EF`   Editor paper surface
  `ink`      `#382D26`   Primary text
  `walnut`   `#705844`   Primary actions
  `muted`    `#8F7D6B`   Secondary text
  `rule`     `#DED3C3`   Dividers and borders
  `brass`    `#A88B5A`   Rare accent

Check contrast for every text/background pairing. Do not use colour
alone to communicate state.

## 5. Product experience and information architecture

### Primary navigation

Keep navigation compact and consistent: - **Write** --- create a new
note and continue recent writing. - **Library** --- browse and search
all active notes. - **Archive** --- view archived notes and restore
them. - **Settings** --- appearance, sound, haptics, privacy,
backup/export, and app information.

Do not show navigation items that do not lead to complete, implemented
screens.

### Home screen

The home screen should answer three questions immediately: - How do I
start writing? - Where can I continue my recent work? - Where can I find
all my writing?

Include: - Brand wordmark and understated settings access. - A clear
"New page" / "Start writing" primary action. - A continue-writing area
only when actual saved notes exist. - Recent notes populated from the
local database. - A genuine empty state for a first-time user. - No
fabricated dates, fake reading times, or sample notes.

### Editor

The editor is the signature experience: - A paper-like writing
surface. - Title and body editing. - Reliable keyboard handling and
cursor behaviour. - Optional typewriter sound and haptic feedback, both
off or conservatively configured by default. - A clear save state based
on actual persistence. - Word/character count where useful. - Undo/redo
where supported. - A deliberate, distraction-light layout. - Autosave
with debouncing plus a safe save on navigation/background events. - No
simulated typewriter mechanics that interfere with normal text input.

The typewriter aesthetic must never make the editor less usable. The
native text input remains the source of truth for text, selection,
accessibility, and input methods.

### Library

-   List or grid view with consistent sorting.
-   Search across title and body.
-   Empty, loading, and error states.
-   Stable note identity and timestamps.
-   Sorting by recently edited and title.
-   No fake note entries.

### Note actions

Support, with confirmation where destructive: - Rename. - Move to
collection (if collections are implemented). - Archive and restore. -
Delete to trash. - Permanently delete from trash. - Export/share plain
text.

### Settings

Only expose settings that work: - Paper/theme selection. - Typography
options, if fully implemented. - Typewriter sound toggle and volume, if
sound assets are licensed and integrated. - Haptics toggle. - Autosave
status/help. - Export and backup information. - Privacy policy and app
version.

## 6. Functional scope

### Version 1 --- essential release

1.  First-launch onboarding or a useful first-use empty state.
2.  Home screen driven by real local data.
3.  Create, edit, and rename notes.
4.  Reliable offline persistence with SQLite.
5.  Autosave and recovery after app restart.
6.  Library with search and sorting.
7.  Archive and restore.
8.  Trash and permanent deletion.
9.  Export/share a note as plain text.
10. Settings for sound, haptics, and appearance only where fully
    supported.
11. Accessibility labels, scalable text, and keyboard-safe layouts.
12. Error handling and a proper test suite.

### Later, only after Version 1 is stable

-   Multiple paper styles.
-   More typewriter sound profiles.
-   Optional collections/folders.
-   Rich export formats.
-   Encrypted backup or user-controlled cloud sync.
-   Additional accessibility and personalization options.

Do not start cloud sync until local data integrity, conflict behaviour,
authentication, privacy policy, and recovery are designed.

## 7. Technical direction

Recommended stack: - React Native with Expo and TypeScript. - Expo
Router for navigation. - `expo-sqlite` for persistent local storage. -
React Native Reanimated for restrained UI motion. - Expo Haptics for
optional tactile feedback. - Expo Audio or the currently recommended
Expo audio package for sound. - React Native Skia only when a genuine
custom visual effect requires it; do not add it just for decoration. -
Expo development builds for native capabilities and real-device testing.

Use current stable package versions compatible with the installed Expo
SDK. Install Expo-compatible packages with `npx expo install`. Do not
blindly copy package versions from old tutorials.

## 8. Data model

A note should have a stable ID and explicit lifecycle metadata.

Suggested `notes` fields: - `id`: UUID primary key. - `title`: non-null
text; empty title may be displayed as "Untitled" without inserting fake
content. - `body`: non-null text. - `created_at`: ISO-8601 timestamp. -
`updated_at`: ISO-8601 timestamp. - `archived_at`: nullable timestamp. -
`deleted_at`: nullable timestamp. - `word_count`: derived value or
safely maintained value; never trust stale counts.

If collections are implemented, use a separate `collections` table and a
foreign key. Define migrations and indexes. Use parameterized SQL
statements only. Never concatenate user text into SQL.

## 9. Quality bar

A release is not complete until: - No screen contains demo or sample
content. - Every visible action works. - Notes survive force-close and
device restart. - Editing while offline works. - Search returns correct
results. - Archive, restore, trash, and permanent deletion behave
consistently. - Keyboard does not hide important editor controls. - Back
navigation does not silently discard text. - Screen reader labels and
text scaling are considered. - No unhandled promise rejections or
avoidable console warnings remain. - Tested on a real Android device and
at more than one screen size. - Production build succeeds.

## 10. Product success

Measure quality through: - Successful note creation and recovery. -
Autosave reliability. - Search accuracy. - Crash-free sessions. - App
launch and editor responsiveness. - Accessibility and user-reported ease
of writing.

Do not optimize for time spent in the app. The goal is to help people
write and leave with confidence that their work is safe.
