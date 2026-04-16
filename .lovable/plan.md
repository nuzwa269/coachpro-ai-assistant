

# CoachPro AI — Frontend UI Plan

## Design System Setup
Update `tailwind.config.ts` and `src/index.css` with the brand colors (orange #FF8A00, purple #9333EA, dark #0A0A0A, light #FAFAFA), fonts (Poppins for headings, Inter for body), and gradient utilities. All Lucide icons, no emojis.

## Pages to Build (Frontend Only — Mock Data)

### 1. Landing Page (`/`)
- Hero with "Learn Tech. Build Systems. With AI." tagline, orange CTA button
- Features section (cards with Lucide icons)
- Pre-built assistants preview (Code Tutor, System Architect, Debug Helper, Tech Explainer)
- Pricing section (Free, Basic, Pro plans + credit packs)
- Payment methods note: JazzCash, Easypaisa, Bank Transfer, WhatsApp
- Footer with dark background

### 2. Auth Pages (`/login`, `/signup`)
- Clean forms with email/password fields
- No backend wiring yet — just UI

### 3. Dashboard (`/dashboard`)
- Header with logo, credit balance display, user avatar
- Project cards grid (create/edit/delete with mock data)
- Recent conversations sidebar
- "Create New Project" dialog

### 4. Project Workspace (`/project/:id`)
- Left sidebar: conversation list + assistant picker
- Center: chat interface with message bubbles
- Right panel: assistant info card
- Save response (bookmark) button on AI messages
- Credit cost indicator

### 5. Assistants Page (`/assistants`)
- Pre-built assistants grid (with icons, descriptions)
- "Create Custom Assistant" form (name, description, system prompt, icon picker)
- Edit/delete custom assistants

### 6. Saved Responses (`/saved`)
- List of bookmarked AI responses grouped by project
- Search/filter bar

### 7. Pricing/Credits Page (`/pricing`)
- Subscription plans comparison table
- One-time credit packs
- Payment method icons (JazzCash, Easypaisa, Bank, WhatsApp)

### 8. Settings (`/settings`)
- Profile edit form
- Subscription status card
- Credit history table

## File Structure
```text
src/
  components/
    layout/       — Header, Sidebar, Footer
    landing/      — Hero, Features, Pricing sections
    dashboard/    — ProjectCard, CreditBalance
    chat/         — ChatMessage, ChatInput, AssistantPicker
    assistants/   — AssistantCard, CreateAssistantForm
  pages/
    Index.tsx, Login.tsx, Signup.tsx, Dashboard.tsx,
    ProjectWorkspace.tsx, Assistants.tsx, SavedResponses.tsx,
    Pricing.tsx, Settings.tsx
  data/
    mock-data.ts  — mock projects, assistants, conversations, credits
```

## Technical Notes
- React Router for all pages
- All data is mock/static — no Supabase or API calls yet
- Responsive design (mobile-first)
- Dark footer, light main body per brand guidelines
- Google Fonts: Poppins + Inter loaded in `index.html`

## Implementation Order
1. Design system (colors, fonts, tailwind config)
2. Layout components (Header, Footer, Sidebar)
3. Landing page
4. Auth pages (UI only)
5. Dashboard with mock projects
6. Project workspace with mock chat
7. Assistants management page
8. Saved responses page
9. Pricing page with local payment methods
10. Settings page

