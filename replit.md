# Personal College Advisor

## Overview

Personal College Advisor is an AI-powered conversational application designed to help high school students make informed decisions about college selection, degree programs, scholarships, and career outcomes. The system provides unbiased guidance by analyzing student context (financial situation, academic interests, career goals) and delivering personalized recommendations with supporting data on costs, ROI, job placement rates, and post-graduation outcomes.

The application presents a ChatGPT-inspired conversational interface where students interact with an AI advisor through a clean, focused chat experience. Students can download their consultation sessions in multiple professional formats (Markdown, PDF, Word) for future reference. The system emphasizes clarity, trust, and utility over visual embellishment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Stack:**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI System:**
- Shadcn/ui component library (new-york style variant) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Design system follows a system-based approach inspired by ChatGPT and Linear
- Typography uses DM Sans/Inter with system UI fallback
- Consistent spacing scale (2, 4, 6, 8, 12, 16 Tailwind units)

**Layout Strategy:**
- Desktop: Two-column split with chat (2/3 width) and sidebar (1/3 width)
- Mobile: Single column with stacked layout
- Maximum content width: max-w-4xl for main layout, max-w-3xl for chat (optimal reading width)
- Persistent header (h-16, sticky positioning) with app title and download CTA

**State Management:**
- React Query handles all server state (messages, sessions)
- Local state managed with React hooks (useState, useRef)
- Session ID generated client-side using crypto.randomUUID()

### Backend Architecture

**Runtime & Server:**
- Node.js with Express.js framework
- TypeScript with ESNext module format
- Development mode uses tsx for TypeScript execution
- Production build bundles server code with esbuild

**API Design:**
- RESTful endpoints under `/api` prefix
- Primary endpoints:
  - `GET /api/messages/:sessionId` - Fetch conversation history
  - `POST /api/messages` - Send new message and receive AI response
- JSON request/response format with Zod validation
- Custom middleware for request logging with duration tracking

**AI Integration:**
- System uses a predefined college advisor prompt embedded in the application
- Prompt instructs AI to collect student context, provide links to resources, analyze costs/ROI, and deliver comprehensive guidance
- Greeting message automatically sent to new sessions

### Data Storage

**Database:**
- PostgreSQL database accessed via Neon serverless driver
- Drizzle ORM for type-safe database queries and schema management
- Schema-first approach with TypeScript inference

**Schema Design:**
```
messages table:
- id (UUID, primary key)
- role (text: 'user' | 'assistant' | 'system')
- content (text)
- timestamp (timestamp with default now())
- sessionId (varchar, groups messages into conversations)

sessions table:
- id (UUID, primary key)
- createdAt (timestamp)
- updatedAt (timestamp)

users table (legacy/compatibility):
- id (UUID, primary key)
- username (text, unique)
- password (text)
```

**Storage Layer:**
- `DbStorage` class implements `IStorage` interface for data operations
- Centralized database client in `db/index.ts` using Drizzle with Neon HTTP driver
- Migration files managed via drizzle-kit in `/migrations` directory

### Authentication and Authorization

Currently, the application does not implement authentication. Sessions are identified by client-generated UUIDs without user login requirements. The `users` table exists in the schema but is not actively used, suggesting future authentication may be planned.

### External Dependencies

**Core Infrastructure:**
- **Neon Database** (@neondatabase/serverless): Serverless PostgreSQL hosting
- **Drizzle ORM** (drizzle-orm): Type-safe database toolkit with PostgreSQL dialect
- **Drizzle Kit** (drizzle-kit): Schema migration and management tool

**UI Component Libraries:**
- **Radix UI**: Extensive set of unstyled, accessible component primitives
  - Dialog, Dropdown Menu, Select, Scroll Area, Avatar, Tooltip, Toast, and 20+ other components
- **Shadcn/ui**: Pre-styled component layer built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Class Variance Authority (CVA)**: Component variant management
- **Lucide React**: Icon library

**Document Generation:**
- **jsPDF**: Client-side PDF generation for downloadable transcripts
- **docx**: Microsoft Word document generation for editable session exports

**Form & Validation:**
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Zod integration for React Hook Form
- **zod-validation-error**: User-friendly error messages from Zod errors

**Client State & Data Fetching:**
- **TanStack Query** (@tanstack/react-query): Async state management with caching, refetching disabled by default
- **Date-fns**: Date formatting and manipulation

**Development Tools:**
- **Vite**: Fast build tool with HMR and optimized production builds
- **@replit/vite-plugin-***: Replit-specific development plugins (runtime error overlay, cartographer, dev banner)
- **PostCSS & Autoprefixer**: CSS processing pipeline

**Additional Features:**
- **Embla Carousel**: Carousel/slider component (imported but usage not apparent in main app)
- **CMDK**: Command menu component library
- **Vaul**: Drawer component for mobile interfaces

### Key Features

**Download Functionality:**
Students can export their complete conversation history in three professional formats:
- **Markdown (.md)**: Clean, readable plain text with formatting and metadata
- **PDF (.pdf)**: Professional document format suitable for printing and sharing
- **Word (.docx)**: Editable Microsoft Word document for further annotation

All formats include:
- Session metadata (generation timestamp, message count)
- Full conversation history with timestamps
- Proper role identification (Student vs. Advisor)
- Professional formatting for easy reading

Files are generated entirely client-side using jsPDF and docx libraries, ensuring privacy and instant download without server processing.

### Design Decisions

**Conversational Interface Choice:**
The application uses a chat-based interface rather than traditional forms because:
- More natural and engaging for students seeking personalized advice
- Allows AI to ask clarifying questions dynamically based on context
- Mirrors successful conversational AI patterns (ChatGPT, Claude)
- Reduces cognitive load compared to long multi-step forms

**Download Format Selection:**
Markdown, PDF, and Word formats chosen over JSON because:
- Students need human-readable documents for review and sharing with parents/counselors
- PDF provides professional format for printing and official documentation
- Word documents allow students to add notes and annotations
- Markdown offers lightweight, future-proof plain text with formatting
- JSON was too technical and not useful for the target audience (high school students)

**Session-Based Architecture:**
Sessions are client-generated UUIDs rather than server-assigned because:
- Eliminates need for immediate authentication/user accounts
- Enables instant conversation start without signup friction
- Simplifies architecture for MVP while preserving conversation history
- Maintains privacy by not requiring personal information upfront

**Shadcn/ui Component Strategy:**
Chosen over traditional component libraries (Material-UI, Ant Design) because:
- Copy-paste approach gives full control over components
- No runtime dependency, reduces bundle size
- Built on accessible Radix primitives with Tailwind styling
- Matches design goal of system-based, utility-focused interface

**TanStack Query with Disabled Refetching:**
Query configuration sets `refetchOnWindowFocus: false` and `staleTime: Infinity` because:
- Chat messages are immutable once created
- Prevents unnecessary network requests during conversation
- User-initiated actions (sending messages) explicitly invalidate queries
- Optimizes performance and reduces API calls

**Drizzle ORM over Prisma:**
Drizzle selected for database access because:
- Lightweight with minimal runtime overhead
- SQL-like query builder appeals to developers familiar with SQL
- Excellent TypeScript inference without code generation step
- Better suited for serverless/edge environments (Neon compatibility)