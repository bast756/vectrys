# VECTRYS — Project Context for Claude

## Architecture Overview

**Monorepo** (npm workspaces) with two main apps:

```
apps/
├── server/     # Express.js + Prisma + PostgreSQL + Socket.IO
├── client/     # React + Vite + TypeScript + Zustand
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Express.js (ESM), Node 20+ |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (access 15min + refresh 7d), bcrypt |
| Email | SendGrid transactional emails |
| Real-time | Socket.IO (call assistant, notifications) |
| Speech | Deepgram live transcription (16kHz PCM) |
| AI | OpenAI/Claude for suggestions, FATE framework |
| Frontend | React 18, TypeScript, Vite |
| State | Zustand (2 stores: guest portal + employee dashboard) |
| Styling | Inline CSS with DIVINE LUMINANCE v5.3 dark theme |
| Push | Firebase Cloud Messaging |
| Cron | node-cron (hourly checks + 30min schedule monitoring) |

## Design System — DIVINE LUMINANCE v5.3

```
void: '#05080d'      obsidian: '#0d1220'    surface: '#121828'
elevated: '#171e34'   gold400: '#d4a853'     gold300: '#fcd34d'
text.primary: '#f1f5f9'  text.secondary: '#94a3b8'  text.muted: '#64748b'
gradient.gold: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)'
glassBorder: 'rgba(255,255,255,0.055)'
```

All employee pages use this dark theme. Font: DM Sans.

## Key Modules

### 1. Employee Dashboard & CRM
- **Auth**: 2FA login (matricule + password → email OTP → tokens)
- **Roles**: `ceo`, `manager`, `employee` with RBAC middleware
- **Features**: CRM prospects, notes, tasks/gantt, team management
- **Security**: NDA acceptance, screenshot detection, connection logs, schedule alerts
- **Profile**: Avatar upload (multer), matricule display, password management
- **Invitation**: CEO creates employee → auto-generated matricule (VEC-XXX) + temp password → SendGrid email

### 2. Call Assistant ("Souffleur Intelligent")
- Real-time speech-to-text via Deepgram WebSocket
- AI suggestion generation when questions detected
- FATE persuasion framework integration
- Interlocutor auto-detection
- CEO overlay mode (compact floating panel)

### 3. Guest Portal (Separate from employee)
- Magic link + Google/Apple + booking code auth
- Reservation management, checkout checklist
- Services marketplace, messaging, ratings
- Multi-language support

### 4. Housekeeping Platform
- Housekeeper management, missions, incidents
- Language learning quizzes (A1-C2), hero quest journey
- Gamification: XP, badges, marketplace, P2P trading
- Agent de terrain: field work, SOS, pointage

### 5. Data Engine v3.0
- Internal data asset classification
- RBAC + IP whitelist protection
- Compliance checks, monetization scoring

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | All database models (~2200 lines) |
| `server/index.js` | Express app + Socket.IO + cron jobs |
| `services/employee-auth.service.js` | 2FA, OTP, matricule gen, JWT |
| `services/sendgrid.service.js` | Transactional emails (invitation, OTP) |
| `routes/employee-auth.routes.js` | Login, verify-otp, register, password mgmt |
| `routes/employee-dashboard.routes.js` | Notes, tasks, team, sessions, avatar |
| `middleware/employee-auth.js` | JWT validation, requireRole, requireCEO |
| `client/src/store/index.ts` | Zustand stores (guest + employee) |
| `client/src/api/employeeApi.ts` | Axios client with auto-refresh |
| `client/src/main.tsx` | React router with protected routes |
| `client/src/pages/employee/*` | All employee dashboard pages |

## Database Key Models

- **Employee**: matricule, 2FA, avatar, work_schedule, NDA
- **EmployeeOtp**: 6-digit codes, 10min expiry, 3 attempts max
- **EmployeeSession**: Login/logout tracking, outside_schedule flag
- **EmployeeScreenshotAlert**: Screenshot captures with context
- **Prospect/ProspectCall**: CRM with call linking
- **CallSession/CallTranscript/CallSuggestion**: Real-time call data

## Employee Auth Flow

1. CEO creates employee: `POST /register` (name + email + role)
2. System generates `VEC-XXX` matricule + temp password
3. Invitation email sent via SendGrid
4. Employee logs in: `POST /login` → validates credentials → sends OTP email
5. Employee enters OTP: `POST /verify-otp` → returns JWT tokens
6. If `temp_password=true` → forced to `/employee/change-password`
7. If `nda_accepted_at=null` → forced to `/employee/nda`
8. Session created with schedule check → flagged if outside hours

## Deployment

- **Production**: Hostinger VPS Paris (Docker + Nginx)
- **CI/CD**: GitHub Actions → targets `principal` branch (commits on `main`)
- **N8N**: Self-hosted at `n8n.vectrys.fr` for automations
- **Domain**: `api.vectrys.fr` (backend), `app.vectrys.fr` (frontend)

## Important Notes

- All imports use ESM (`import/export`)
- Backend uses `.js` extensions even for source files
- Client uses `@/` path alias (maps to `src/`)
- Employee and guest portals are completely separate auth systems
- Rate limiting: 100 req/15min on `/api/*`
- Body limit: 50MB (for base64 screenshots)
- CORS: localhost:5173/4173 + FRONTEND_URL env var
