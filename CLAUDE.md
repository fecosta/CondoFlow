# PROMPT — Claude Code: Condominium Management SaaS (Full MVP)

> Paste this entire prompt into Claude Code as the initial project instruction.
> It covers all 3 MVP phases with architecture, rules, schema, and detailed specifications.
> **IMPORTANT**: All user-facing interfaces, labels, menus, messages, toasts, e-mail templates, and domain terminology must be in Brazilian Portuguese (pt-BR). Code (variable names, comments, commit messages) should be in English.

---

## PROJECT CONTEXT

You will build a multi-tenant Condominium Management SaaS — a web platform that replaces WhatsApp groups and spreadsheets for residential building administration in Brazil. The product is developed in 3 incremental phases, but the architecture and database schema must be designed from day one to support the full scope.

The guiding principle is: **simplicity, speed to market, and maintainable code**. No over-engineering. Every technical decision should favor "it works and is easy to maintain" over "it's the most elegant/scalable solution".

### Domain glossary (keep these pt-BR terms in the UI)

| Term | Meaning |
|------|---------|
| Condomínio | Residential building / housing complex (tenant) |
| Síndico | Building manager / administrator |
| Porteiro | Doorman / concierge |
| Morador | Resident |
| Bloco / Torre | Building block / tower within a condomínio |
| Unidade | Unit / apartment |
| Comunicado | Announcement / notice |
| Encomenda | Package / delivery |
| Reserva | Booking / reservation (common areas) |
| Área Comum | Common area (party room, pool, gym, etc.) |
| Visitante | Visitor |
| Ocorrência | Issue / ticket / incident report |
| Chamado | Support ticket (synonym for Ocorrência) |

---

## TECH STACK (NON-NEGOTIABLE)

```
Frontend + Backend:  Next.js 14+ (App Router) — full-stack, single monorepo
Database:            MySQL 8+ with Prisma ORM
Authentication:      NextAuth.js (Auth.js v5)
Styling:             Tailwind CSS + shadcn/ui
Email:               React Email + Resend (or Nodemailer for local dev)
Validation:          Zod (shared between client and server)
State management:    React Server Components + SWR for client-side state
Deployment:          Vercel (or any Next.js-compatible platform)
```

### Architecture rules

1. **Single monorepo** — everything lives in one Next.js project. No microservices, no separate BFF.
2. **Server Components by default** — use `"use client"` only when interactivity is genuinely required.
3. **Route Handlers (API Routes)** for endpoints consumed by the frontend. Server Actions for simple form mutations.
4. **Prisma as the sole database access layer** — never write raw SQL except for custom migrations.
5. **Shared Zod schemas** — define in `/lib/validations/` and reuse on both server and client.
6. **No unnecessary dependencies** — before installing a package, try to solve it with what Next.js/React already provides.
7. **TypeScript strict mode** — no `any`, no `@ts-ignore`.

---

## FOLDER STRUCTURE

```
/
├── prisma/
│   ├── schema.prisma          # COMPLETE schema (all phases)
│   ├── seed.ts                # Seed with test data
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Public routes: login, forgot-password, reset-password
│   │   ├── (dashboard)/       # Protected routes (layout with sidebar)
│   │   │   ├── admin/         # Super Admin screens
│   │   │   ├── sindico/       # Síndico / building admin screens
│   │   │   ├── portaria/      # Porteiro screens
│   │   │   ├── morador/       # Morador screens
│   │   │   └── layout.tsx     # Shared layout: sidebar + header
│   │   ├── api/               # Route Handlers
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── condominios/
│   │   │   ├── moradores/
│   │   │   ├── comunicados/
│   │   │   ├── encomendas/
│   │   │   ├── reservas/      # Phase 2
│   │   │   ├── visitantes/    # Phase 2
│   │   │   ├── ocorrencias/   # Phase 3
│   │   │   └── notificacoes/  # Phase 3
│   │   ├── layout.tsx
│   │   └── page.tsx           # Redirect to login or dashboard
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── forms/             # Reusable form components
│   │   ├── tables/            # Tables with filters and pagination
│   │   └── layout/            # Sidebar, Header, etc.
│   ├── lib/
│   │   ├── prisma.ts          # Prisma Client singleton
│   │   ├── auth.ts            # NextAuth config
│   │   ├── email.ts           # Email sending service
│   │   ├── validations/       # Zod schemas
│   │   ├── permissions.ts     # Role-based access control middleware
│   │   └── utils.ts           # Generic helpers
│   ├── hooks/                 # Custom hooks
│   ├── types/                 # Global TypeScript types
│   └── middleware.ts          # Next.js middleware (auth + role-based redirect)
├── emails/                    # React Email templates (content in pt-BR)
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## DATABASE SCHEMA (PRISMA) — COMPLETE FROM DAY ONE

Model the entire schema below in `schema.prisma` from the start. Tables for future phases are created but remain empty. This prevents destructive migrations later.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION & MULTI-TENANCY
// ============================================

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String
  passwordHash   String
  role           Role      @default(MORADOR)
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  lastLoginAt    DateTime?

  condominioUsers  CondominioUser[]
  comunicadoReads  ComunicadoRead[]
  encomendas       Encomenda[]      @relation("EncomendaRecebidaPor")
  encomendasRet    Encomenda[]      @relation("EncomendaRetiradaPor")
  reservas         Reserva[]
  visitantes       Visitante[]
  ocorrencias      Ocorrencia[]
  comentarios      OcorrenciaComentario[]
  notificacoes     Notificacao[]
  auditLogs        AuditLog[]

  @@map("users")
}

enum Role {
  SUPER_ADMIN
  SINDICO
  PORTEIRO
  MORADOR
}

model Condominio {
  id          String   @id @default(cuid())
  name        String
  cnpj        String?
  address     String?
  city        String?
  state       String?
  zipCode     String?
  logoUrl     String?  // Phase 2
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  condominioUsers  CondominioUser[]
  blocos           Bloco[]
  comunicados      Comunicado[]
  areasComuns      AreaComum[]      // Phase 2

  @@map("condominios")
}

model CondominioUser {
  id            String   @id @default(cuid())
  userId        String
  condominioId  String
  role          Role     // User's role WITHIN this condomínio
  createdAt     DateTime @default(now())

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  condominio  Condominio @relation(fields: [condominioId], references: [id], onDelete: Cascade)

  @@unique([userId, condominioId])
  @@map("condominio_users")
}

// ============================================
// REGISTRATIONS (PHASE 1)
// ============================================

model Bloco {
  id            String   @id @default(cuid())
  name          String   // e.g. "Bloco A", "Torre 1"
  condominioId  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  condominio  Condominio @relation(fields: [condominioId], references: [id], onDelete: Cascade)
  unidades    Unidade[]

  @@map("blocos")
}

model Unidade {
  id               String           @id @default(cuid())
  number           String           // e.g. "101", "202"
  blocoId          String
  status           UnidadeStatus    @default(VAGA)
  statusFinanceiro FinanceiroStatus @default(EM_DIA) // Phase 3
  obsFinanceiro    String?          @db.Text          // Phase 3
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  bloco       Bloco       @relation(fields: [blocoId], references: [id], onDelete: Cascade)
  moradores   Morador[]
  encomendas  Encomenda[]
  veiculos    Veiculo[]   // Phase 2
  pets        Pet[]       // Phase 2
  visitantes  Visitante[] // Phase 2
  reservas    Reserva[]   // Phase 2
  ocorrencias Ocorrencia[] // Phase 3

  @@map("unidades")
}

enum UnidadeStatus {
  OCUPADA
  VAGA
  BLOQUEADA // Phase 3
}

enum FinanceiroStatus {
  EM_DIA
  PENDENTE
  INADIMPLENTE
}

model Morador {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  unidadeId   String
  vinculo     Vinculo  @default(PROPRIETARIO)
  userId      String?  // Linked to a User (if they have platform access)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  unidade     Unidade  @relation(fields: [unidadeId], references: [id], onDelete: Cascade)

  @@map("moradores")
}

enum Vinculo {
  PROPRIETARIO
  INQUILINO
  DEPENDENTE
}

// ============================================
// COMUNICADOS — ANNOUNCEMENTS (PHASE 1)
// ============================================

model Comunicado {
  id            String   @id @default(cuid())
  title         String
  content       String   @db.Text
  isPinned      Boolean  @default(false)
  condominioId  String
  authorId      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  condominio  Condominio       @relation(fields: [condominioId], references: [id], onDelete: Cascade)
  reads       ComunicadoRead[]

  @@map("comunicados")
}

model ComunicadoRead {
  id            String   @id @default(cuid())
  comunicadoId  String
  userId        String
  readAt        DateTime @default(now())

  comunicado  Comunicado @relation(fields: [comunicadoId], references: [id], onDelete: Cascade)
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([comunicadoId, userId])
  @@map("comunicado_reads")
}

// ============================================
// ENCOMENDAS — PACKAGES (PHASE 1)
// ============================================

model Encomenda {
  id            String          @id @default(cuid())
  description   String?
  unidadeId     String
  status        EncomendaStatus @default(PENDENTE)
  receivedById  String
  receivedAt    DateTime        @default(now())
  pickedUpById  String?
  pickedUpName  String?
  pickedUpAt    DateTime?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  unidade     Unidade @relation(fields: [unidadeId], references: [id], onDelete: Cascade)
  receivedBy  User    @relation("EncomendaRecebidaPor", fields: [receivedById], references: [id])
  pickedUpBy  User?   @relation("EncomendaRetiradaPor", fields: [pickedUpById], references: [id])

  @@map("encomendas")
}

enum EncomendaStatus {
  PENDENTE
  ENTREGUE
}

// ============================================
// RESERVAS — BOOKINGS (PHASE 2)
// ============================================

model AreaComum {
  id               String   @id @default(cuid())
  name             String
  description      String?  @db.Text
  capacity         Int?
  imageUrl         String?
  condominioId     String
  isActive         Boolean  @default(true)
  requiresApproval Boolean  @default(false)
  minAdvanceDays   Int      @default(1)
  maxAdvanceDays   Int      @default(30)
  maxDurationHours Int      @default(4)
  openTime         String   @default("08:00")
  closeTime        String   @default("22:00")
  availableDays    String   @default("0,1,2,3,4,5,6") // 0=Sun, 6=Sat
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  condominio  Condominio     @relation(fields: [condominioId], references: [id], onDelete: Cascade)
  reservas    Reserva[]
  bloqueios   AgendaBloqueio[]

  @@map("areas_comuns")
}

model Reserva {
  id           String        @id @default(cuid())
  areaComumId  String
  unidadeId    String
  userId       String
  date         DateTime      @db.Date
  startTime    String        // HH:mm
  endTime      String        // HH:mm
  status       ReservaStatus @default(PENDENTE)
  rejectReason String?
  cancelReason String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  areaComum   AreaComum @relation(fields: [areaComumId], references: [id], onDelete: Cascade)
  unidade     Unidade   @relation(fields: [unidadeId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])

  @@map("reservas")
}

enum ReservaStatus {
  PENDENTE
  APROVADA
  REJEITADA
  CANCELADA
}

model AgendaBloqueio {
  id          String   @id @default(cuid())
  areaComumId String
  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  reason      String?
  createdAt   DateTime @default(now())

  areaComum   AreaComum @relation(fields: [areaComumId], references: [id], onDelete: Cascade)

  @@map("agenda_bloqueios")
}

// ============================================
// VISITANTES — VISITORS (PHASE 2)
// ============================================

model Visitante {
  id           String     @id @default(cuid())
  name         String
  document     String?
  unidadeId    String
  userId       String
  type         VisitaType @default(PONTUAL)
  expectedDate DateTime?  @db.Date
  startDate    DateTime?  @db.Date
  endDate      DateTime?  @db.Date
  entryAt      DateTime?
  exitAt       DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  unidade     Unidade @relation(fields: [unidadeId], references: [id], onDelete: Cascade)
  user        User    @relation(fields: [userId], references: [id])

  @@map("visitantes")
}

enum VisitaType {
  PONTUAL
  RECORRENTE
}

// ============================================
// VEÍCULOS & PETS (PHASE 2)
// ============================================

model Veiculo {
  id          String   @id @default(cuid())
  plate       String
  model       String?
  color       String?
  parkingSpot String?
  unidadeId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  unidade     Unidade @relation(fields: [unidadeId], references: [id], onDelete: Cascade)

  @@map("veiculos")
}

model Pet {
  id        String   @id @default(cuid())
  name      String
  breed     String?
  size      PetSize  @default(MEDIO)
  unidadeId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  unidade   Unidade @relation(fields: [unidadeId], references: [id], onDelete: Cascade)

  @@map("pets")
}

enum PetSize {
  PEQUENO
  MEDIO
  GRANDE
}

// ============================================
// OCORRÊNCIAS — ISSUES / TICKETS (PHASE 3)
// ============================================

model Ocorrencia {
  id          String             @id @default(cuid())
  title       String
  description String             @db.Text
  category    OcorrenciaCategory @default(OUTROS)
  priority    OcorrenciaPriority @default(MEDIA)
  status      OcorrenciaStatus   @default(ABERTA)
  unidadeId   String
  userId      String
  resolution  String?            @db.Text
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  unidade     Unidade                @relation(fields: [unidadeId], references: [id], onDelete: Cascade)
  user        User                   @relation(fields: [userId], references: [id])
  comentarios OcorrenciaComentario[]
  imagens     OcorrenciaImagem[]

  @@map("ocorrencias")
}

enum OcorrenciaCategory {
  MANUTENCAO
  BARULHO
  SEGURANCA
  LIMPEZA
  AREAS_COMUNS
  OUTROS
}

enum OcorrenciaPriority {
  BAIXA
  MEDIA
  ALTA
  URGENTE
}

enum OcorrenciaStatus {
  ABERTA
  EM_ANDAMENTO
  RESOLVIDA
  FECHADA
}

model OcorrenciaComentario {
  id           String   @id @default(cuid())
  content      String   @db.Text
  isInternal   Boolean  @default(false) // Visible only to síndico
  ocorrenciaId String
  userId       String
  createdAt    DateTime @default(now())

  ocorrencia Ocorrencia @relation(fields: [ocorrenciaId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id])

  @@map("ocorrencia_comentarios")
}

model OcorrenciaImagem {
  id           String   @id @default(cuid())
  url          String
  ocorrenciaId String
  createdAt    DateTime @default(now())

  ocorrencia Ocorrencia @relation(fields: [ocorrenciaId], references: [id], onDelete: Cascade)

  @@map("ocorrencia_imagens")
}

// ============================================
// NOTIFICAÇÕES — NOTIFICATIONS (PHASE 3)
// ============================================

model Notificacao {
  id        String          @id @default(cuid())
  type      NotificacaoType
  title     String
  message   String
  link      String?
  isRead    Boolean         @default(false)
  userId    String
  createdAt DateTime        @default(now())

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@map("notificacoes")
}

enum NotificacaoType {
  COMUNICADO
  ENCOMENDA
  RESERVA
  OCORRENCIA
  VISITANTE
  SISTEMA
}

model NotificacaoPreferencia {
  id     String          @id @default(cuid())
  userId String
  type   NotificacaoType
  email  Boolean         @default(true)
  digest Boolean         @default(false)

  @@unique([userId, type])
  @@map("notificacao_preferencias")
}

// ============================================
// AUDIT LOG
// ============================================

model AuditLog {
  id        String   @id @default(cuid())
  action    String
  entity    String?
  entityId  String?
  details   String?  @db.Text
  userId    String
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entity, entityId])
  @@map("audit_logs")
}
```

---

## MULTI-TENANCY — CRITICAL RULE

Every database query MUST filter by `condominioId`. Never rely on `userId` alone. Implement this as a helper:

```typescript
// lib/tenant.ts
export async function getTenantId(session: Session): Promise<string> {
  // Returns the active condominioId for the user's session
  // SUPER_ADMIN can switch between condomínios; other roles have a fixed one
}

// Usage in every query:
const comunicados = await prisma.comunicado.findMany({
  where: { condominioId: tenantId }, // ALWAYS present
  orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
});
```

---

## ACCESS CONTROL

Implement role-based permission middleware:

```
SUPER_ADMIN → full access, can switch between condomínios
SINDICO     → full management of THEIR condomínio
PORTEIRO    → encomendas, visitantes, portaria dashboard
MORADOR     → comunicados (read-only), own encomendas, own reservas, own ocorrências
```

Use Next.js middleware (`src/middleware.ts`) to:
1. Redirect unauthenticated users to `/login`
2. Redirect each role to its default dashboard
3. Block access to routes not permitted for the user's role

---

## PHASE 1 — MVP CORE (BUILD FIRST)

### Modules

**1. Authentication & Access**
- Login with email and password
- Password recovery via email (send link with expiring token)
- Password reset screen
- Persistent session (JWT via NextAuth)
- Logout
- Profile screen (view/edit name and password)
- UI labels: "Entrar", "Esqueci minha senha", "Redefinir senha", "Sair", "Meu Perfil"

**2. Onboarding (Super Admin / Síndico)**
- Guided step-by-step wizard: condomínio data → blocos/torres → unidades → invite moradores
- Visual progress indicator (step bar)
- At the end, the condomínio is ready to use
- UI labels: "Configurar Condomínio", "Dados Básicos", "Blocos e Torres", "Unidades", "Convidar Moradores", "Concluir"

**3. Condomínio + Moradores + Unidades Registration**
- CRUD for condomínio (Super Admin)
- CRUD for blocos/torres
- CRUD for unidades (status: Ocupada / Vaga)
- CRUD for moradores linked to unidade (Proprietário, Inquilino, Dependente)
- List views with search and filters
- **CSV import for moradores** — file upload, validation, preview, confirmation
- UI labels: "Condomínios", "Novo Condomínio", "Blocos", "Unidades", "Moradores", "Importar CSV", "Proprietário", "Inquilino", "Dependente", "Ocupada", "Vaga"

**4. Comunicados (Announcements)**
- Create and edit comunicado (síndico)
- List comunicados sorted by: pinned first, then by date desc
- Pin/unpin comunicado
- Automatically register read when morador opens the comunicado
- Show read count to síndico (e.g., "Lido por 12 de 45 moradores")
- **Automatic email** to all moradores in the condomínio when published
- UI labels: "Comunicados", "Novo Comunicado", "Fixar", "Desafixar", "Lido por X de Y moradores"

**5. Encomendas (Packages)**
- Porteiro registers encomenda: select unidade, optional description
- List with filters: status (Pendente / Entregue), unidade
- Visual highlight (red badge) for pending ones
- Pickup registration: name of who picked up + automatic timestamp
- Morador sees only encomendas for their unidade
- **Automatic email** to morador when encomenda is registered
- UI labels: "Encomendas", "Nova Encomenda", "Pendente", "Entregue", "Registrar Retirada", "Retirado por"

**6. Simple Dashboard**
- Síndico: total unidades, recent comunicados, pending encomendas
- Porteiro: pending encomendas with quick action
- Morador: unread comunicados, pending encomendas
- UI label: "Painel"

### Phase 1 Screens (~18-20 screens)

```
(auth)/login
(auth)/forgot-password
(auth)/reset-password
(dashboard)/profile
(dashboard)/admin/condominios
(dashboard)/admin/condominios/new
(dashboard)/admin/condominios/[id]
(dashboard)/sindico/dashboard
(dashboard)/sindico/unidades
(dashboard)/sindico/unidades/[id]
(dashboard)/sindico/moradores
(dashboard)/sindico/moradores/import
(dashboard)/sindico/comunicados
(dashboard)/sindico/comunicados/new
(dashboard)/sindico/comunicados/[id]
(dashboard)/sindico/encomendas
(dashboard)/sindico/settings
(dashboard)/portaria/dashboard
(dashboard)/morador/dashboard
(dashboard)/morador/comunicados
(dashboard)/morador/encomendas
```

---

## PHASE 2 — OPERATIONS (BUILD AFTER PHASE 1 IS VALIDATED)

### Modules

**1. Reservas de Áreas Comuns (Common Area Bookings)**
- CRUD for áreas comuns (síndico): name, capacity, hours, rules, approval toggle
- Visual calendar (week/month view) with availability
- Morador requests reserva: select área, date, time slot
- Automatic conflict blocking (prevent double-booking on the same slot)
- Optional approval flow (síndico approves/rejects)
- Status: Pendente, Aprovada, Rejeitada, Cancelada
- Morador can cancel own reserva within allowed timeframe
- Síndico can cancel any reserva with justification
- Síndico can block agenda periods (maintenance, events)
- Email to morador on status change
- Reservation history per unidade
- UI labels: "Áreas Comuns", "Nova Área", "Calendário", "Reservas", "Nova Reserva", "Aprovar", "Rejeitar", "Cancelar", "Bloquear Agenda", "Pendente", "Aprovada", "Rejeitada", "Cancelada"

**2. Visitantes (Visitors)**
- Morador pre-registers visitante: name, document, date/period, type (Pontual / Recorrente)
- Portaria view: visitors expected today, search by name or unidade
- Entry and exit registration with timestamps
- Visual alert for non-pre-registered visitors
- Visit history with filters
- UI labels: "Visitantes", "Pré-cadastrar Visitante", "Esperados Hoje", "Registrar Entrada", "Registrar Saída", "Histórico de Visitas", "Pontual", "Recorrente"

**3. Complete Dashboards**
- Síndico dashboard: occupied/vacant unidades, comunicados + read rate, pending encomendas, week's reservas, today's visitantes
- Portaria dashboard: pending encomendas, expected visitantes, quick actions
- Morador dashboard: unread comunicados, pending encomendas, upcoming reservas, pre-registered visitantes

**4. Registration Improvements**
- Veículos per unidade (plate, model, color, parking spot)
- Pets per unidade (name, breed, size)
- Condomínio logo upload
- "Bloqueada" status for unidade
- UI labels: "Veículos", "Pets", "Placa", "Modelo", "Cor", "Vaga", "Nome", "Raça", "Porte", "Pequeno", "Médio", "Grande"

### Phase 2 Additional Screens (~12-15 screens)

```
(dashboard)/sindico/areas-comuns
(dashboard)/sindico/areas-comuns/new
(dashboard)/sindico/areas-comuns/[id]
(dashboard)/sindico/reservas
(dashboard)/morador/reservas
(dashboard)/morador/reservas/new
(dashboard)/morador/visitantes
(dashboard)/morador/visitantes/new
(dashboard)/portaria/visitantes
(dashboard)/portaria/visitantes/historico
```

---

## PHASE 3 — MANAGEMENT (BUILD LAST)

### Modules

**1. Ocorrências / Chamados (Issues / Tickets)**
- Morador opens ocorrência: title, description, category, priority, up to 3 photos
- Categories: Manutenção, Barulho, Segurança, Limpeza, Áreas Comuns, Outros
- Priorities: Baixa, Média, Alta, Urgente
- Status: Aberta, Em Andamento, Resolvida, Fechada
- Update timeline visible to morador and síndico
- Comment thread between morador and síndico
- Internal comments (visible only to síndico)
- Síndico management view: filters by status/category/priority/unidade
- Consolidated view: count by status and category
- Email on every status change
- UI labels: "Ocorrências", "Nova Ocorrência", "Manutenção", "Barulho", "Segurança", "Limpeza", "Outros", "Baixa", "Média", "Alta", "Urgente", "Aberta", "Em Andamento", "Resolvida", "Fechada", "Comentários", "Comentário Interno"

**2. Notificações Expandidas (Expanded Notifications)**
- In-app notification center (bell icon in header with unread badge)
- Chronological list with read/unread status
- Direct link to the related item
- Mark as read individually or all at once
- Per-type preferences: which notifications to receive via email
- Daily digest option
- UI labels: "Notificações", "Marcar como lida", "Marcar todas como lidas", "Preferências de Notificação", "Resumo Diário"

**3. Controle Financeiro Básico (Basic Financial Control)**
- Manual financial status per unidade: Em Dia, Pendente, Inadimplente
- Observation field per record
- Consolidated view: percentage Em Dia / Pendente / Inadimplente
- Filter by financial status
- Visible only to Super Admin and Síndico (never to Morador or Porteiro)
- Full audit trail for all changes
- **This module does NOT generate boletos, does NOT integrate with banks, does NOT perform automatic billing. It is strictly informational.**
- UI labels: "Financeiro", "Em Dia", "Pendente", "Inadimplente", "Observações", "Visão Consolidada"

**4. Métricas de Uso (Usage Analytics)**
- Logins by role over time
- Most accessed modules
- Comunicado read rate (trend over time)
- Average encomenda pickup time
- Ocorrências opened vs. resolved per period
- Active moradores (last 7 and 30 days)
- Simple charts with Recharts (bar and line)
- Visible only to Super Admin and Síndico
- UI labels: "Métricas", "Logins por Perfil", "Módulos Mais Acessados", "Taxa de Leitura", "Tempo Médio de Retirada", "Moradores Ativos"

### Phase 3 Additional Screens (~10-13 screens)

```
(dashboard)/morador/ocorrencias
(dashboard)/morador/ocorrencias/new
(dashboard)/morador/ocorrencias/[id]
(dashboard)/sindico/ocorrencias
(dashboard)/sindico/ocorrencias/[id]
(dashboard)/sindico/financeiro
(dashboard)/sindico/metricas
(dashboard)/notificacoes
(dashboard)/notificacoes/preferencias
```

---

## IMPLEMENTATION RULES

### UI/UX
- **Mobile-first**: porteiros and moradores primarily use mobile phones. Every screen must work well at 375px.
- **shadcn/ui as the foundation**: use ready-made components. Don't reinvent buttons, modals, or toasts.
- **Immediate visual feedback**: loading states, skeleton loaders, success/error toasts.
- **Server-side paginated tables**: never load more than 50 records at once.
- **Collapsible sidebar**: becomes a drawer on mobile; stays fixed on desktop.
- **Breadcrumbs**: for navigation within nested entities (Condomínio > Bloco > Unidade).
- **All UI text in pt-BR**: buttons, labels, placeholders, error messages, toasts, empty states, tooltips.
- **Date format**: DD/MM/YYYY (Brazilian standard).
- **Currency format**: R$ 1.234,56 (if applicable in Phase 3).

### Backend
- **Every mutation must have Zod validation on the server**: never trust client data.
- **Every query filters by condominioId**: multi-tenancy is non-negotiable.
- **Every important action writes to AuditLog**: login, entity CRUD, status changes.
- **Emails are async**: use fire-and-forget pattern so they don't block the response.
- **Errors return standardized JSON**: `{ error: string, details?: Record<string, string> }`.
- **Default pagination**: `?page=1&limit=20` on every list endpoint.
- **Error messages in pt-BR**: e.g., `"E-mail ou senha inválidos"`, `"Comunicado não encontrado"`, `"Você não tem permissão para esta ação"`.

### Security
- Passwords hashed with bcrypt (minimum 10 rounds)
- Reset tokens expire after 1 hour
- Rate limiting on login (5 attempts / 15 min)
- Security headers via next.config.js
- CSRF protection via NextAuth
- Input sanitization with Zod

### Email
- Use React Email for beautiful, consistent templates
- All email content in pt-BR
- Required templates: Boas-vindas, Convite, Redefinição de Senha, Novo Comunicado, Encomenda Recebida, Reserva Aprovada/Rejeitada, Ocorrência Atualizada
- Environment variables to configure SMTP in dev and Resend in prod

---

## DEVELOPMENT SEED

Create a `prisma/seed.ts` that populates:
- 1 Super Admin (admin@teste.com / senha123)
- 2 condomínios with blocos and unidades
- 1 Síndico per condomínio
- 1 Porteiro per condomínio
- 5 Moradores per condomínio (linked to unidades)
- 3 Comunicados (1 pinned)
- 5 Encomendas (3 pending, 2 delivered)

---

## EXECUTION ORDER

1. **Setup**: initialize Next.js project, install dependencies, configure Prisma + MySQL, run migrations, run seed
2. **Phase 1**: authentication → role middleware → layout (sidebar/header) → registrations → comunicados → encomendas → simple dashboards → emails
3. **Phase 2**: áreas comuns → reservas (with calendar) → visitantes → complete dashboards → registration improvements
4. **Phase 3**: ocorrências → in-app notifications → basic financial control → usage analytics → notification preferences

After each module is complete: manually test all roles, verify data isolation between condomínios, confirm mobile responsiveness.

---

## FINAL NOTES

- **Don't install dependencies you won't use.** Start lean.
- **Don't create premature abstractions.** If a function is only used in one place, keep it inline.
- **Frequent commits** with descriptive messages in English.
- **`.env.example` file** always up to date with every required variable.
- **`README.md`** with clear setup instructions, seed commands, and environment variables.
- The goal is a working product, not an engineering showcase.
- **Remember**: all user-facing content (UI labels, messages, emails, toasts, placeholders, empty states) must be in Brazilian Portuguese. Only code internals (variable names, comments, commits) are in English.