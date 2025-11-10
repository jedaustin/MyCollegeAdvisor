# Personal College Advisor - Design Guidelines

## Design Approach
**System-Based Approach** inspired by ChatGPT, Linear, and modern conversational AI interfaces. This utility-focused application prioritizes clarity, trust, and conversational flow over visual flair. The design emphasizes information hierarchy, readability, and intuitive interaction patterns that students expect from educational tools.

## Typography System

**Primary Font:** Inter or DM Sans (Google Fonts)
**Secondary Font:** System UI fallback

**Hierarchy:**
- Hero/Welcome: 3xl to 4xl (48-60px), font-bold
- Section Headers: xl to 2xl (24-32px), font-semibold
- Chat Messages: base to lg (16-18px), font-normal
- Labels/Metadata: sm (14px), font-medium
- Buttons/CTAs: base (16px), font-semibold

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, and 16
- Component padding: p-4 to p-6
- Section spacing: py-8 to py-12
- Chat message gaps: gap-4
- Input fields: p-3 to p-4

**Container Strategy:**
- Main layout: max-w-4xl mx-auto (centered, focused width)
- Chat area: max-w-3xl (optimal reading width)
- Full-width header/footer with inner max-w-6xl

## Core Layout Structure

**Header (Persistent):**
- Top navigation bar with app title "Personal College Advisor"
- Session info indicator (conversation length, timestamp)
- Download button (primary CTA, top-right)
- Height: h-16, sticky positioning

**Main Content Area (Two-Column Split on Desktop):**

Left Panel (2/3 width on lg+):
- Chat conversation area with scrollable message thread
- Messages alternate: Student (right-aligned) vs AI Advisor (left-aligned)
- Each message includes avatar, timestamp, and content
- Auto-scroll to latest message

Right Panel (1/3 width on lg+, below chat on mobile):
- Conversation sidebar with quick actions
- Download options (PDF, TXT formats)
- Session statistics (messages sent, topics covered)
- Quick tips card for using the advisor

**Input Area (Fixed Bottom):**
- Multi-line text input (min-h-24, expandable to max-h-40)
- Dual-action buttons: "Send" (primary) and "Speak" (secondary with mic icon)
- Character counter and submit on Enter (Shift+Enter for new line)
- Subtle elevation/shadow to separate from chat

## Component Library

**Chat Messages:**
- Student messages: Rounded containers (rounded-2xl), right-aligned, max-w-2xl
- AI messages: Rounded containers (rounded-2xl), left-aligned, max-w-2xl, subtle border
- Avatar circles: w-10 h-10, positioned at message start
- Timestamp: text-sm, positioned below message content
- Link styling within messages: underline, font-medium

**Welcome Screen (First Visit):**
- Centered card with max-w-2xl
- App logo/icon at top (w-20 h-20)
- Welcome headline with the greeting from the prompt
- Brief value proposition (3-4 bullet points in grid-cols-1 md:grid-cols-2)
- Primary CTA: "Start Your Advisor Session"
- No hero image needed - focus on clarity

**Input Controls:**
- Text area: Border, rounded-xl, focus ring treatment
- Send button: Rounded-lg, px-6 py-3
- Speak button: Square aspect-ratio with rounded-full icon container
- Active microphone state: Pulsing animation indicator

**Download Modal/Dropdown:**
- Triggered from header download button
- Options list: PDF (formatted), TXT (plain text), JSON (data export)
- Preview option before download
- File naming with timestamp

**Session Statistics Card:**
- Grid layout: 2 columns on desktop
- Metrics: Messages count, topics discussed, session duration
- Icons from Heroicons library
- Compact spacing: p-4, gap-2

## Accessibility & Interaction

- Focus states: Ring offset, visible keyboard navigation
- ARIA labels for all interactive elements
- Skip to main content link
- Screen reader announcements for new messages
- High contrast text (meeting WCAG AA standards)
- Keyboard shortcuts: Enter to send, Esc to close modals

## Responsive Behavior

**Mobile (base to md):**
- Single column layout, full width
- Sidebar becomes bottom drawer or separate view
- Input area: Full width, slightly reduced padding (p-3)
- Messages: Full width minus standard margins

**Tablet (md to lg):**
- Chat takes 60% width, sidebar 40%
- Maintain core layout structure

**Desktop (lg+):**
- Full two-column layout as described
- Generous whitespace, max-w-6xl outer container

## Images

**No hero image required.** This is a utility application focused on conversation. Any imagery should be functional:
- Avatar placeholders for student and AI advisor (simple illustrated icons)
- Optional: Small educational icons in welcome screen bullet points
- Decorative elements kept minimal to maintain focus on content

## Key Design Principles

1. **Conversation First:** Every design decision prioritizes readability and conversational flow
2. **Trust Signals:** Professional typography, consistent spacing, and clear information hierarchy build credibility
3. **Minimal Distraction:** No animations except microphone pulse and smooth scroll behaviors
4. **Instant Clarity:** Students immediately understand how to start, continue, and save conversations
5. **Accessibility:** Full keyboard navigation, screen reader support, and high contrast throughout