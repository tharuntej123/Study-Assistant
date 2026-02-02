# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│                  (React + Vite)                         │
│                                                         │
│  UI → Router → React Query → Auth Context              │
│         │          │             │                      │
└─────────┼──────────┼─────────────┼──────────────────────┘
          │          │             │
          v          v             v
┌─────────────────────────────────────────────────────────┐
│                    SERVER LAYER                         │
│                (Node.js + Express)                      │
│                                                         │
│  REST API → Auth Middleware → Workspace Middleware     │
│      │              │                    │              │
│      v              v                    v              │
│  Controllers → Services                                │
└──────┼────────────┼─────────────────────────────────────┘
       │            │
       v            v
┌──────────────────────────────────────┐
│       EXTERNAL SERVICES              │
│                                      │
│  • MongoDB (Database)                │
│  • AWS S3 (File Storage)             │
│  • Google Gemini AI                  │
│  • Google OAuth (Authentication)     │
└──────────────────────────────────────┘
```

## Component Architecture

```
FRONTEND                    BACKEND

Pages -------+              Routes
  |          |                 |
  v          v                 v
Components  Layouts        Middleware
  |          |                 |
  v          v                 v
Context    API Client      Controllers
             |                 |
             +--------+--------+
                      |
                      v
                  Services
                      |
                      v
                   Models
```

## Technology Stack

```
              STUDY ASSISTANT
                    |
      +-------------+-------------+
      |             |             |
  FRONTEND      BACKEND       SERVICES
      |             |             |
  +---+---+     +---+---+     +---+---+
  |   |   |     |   |   |     |   |   |
 React |  TW   Node | Mon   S3  | OAuth
      |  CSS   .js  | goose     |  JWT
  Vite |       |   |       Gemini |
  Query|    Express|         AI   |
  Router|  Passport |             |
```

## Data Layer

```
User (1) ────┬──── (*) Workspace
     │       │            |
     │       └──── (*) StudyMaterial ──┬──── (*) Quiz
     │                    |             │
     ├──── (*) StudySession             └──── (*) FlashcardSet
     │
     └──── (*) UserProgress

KEY ENTITIES:

User:
  - googleId, email, name, picture
  - createdAt

Workspace:
  - name, description, userId
  - createdAt

StudyMaterial:
  - title, content, summary
  - fileUrl, workspaceId

FlashcardSet:
  - title, flashcards[]
  - workspaceId

Quiz:
  - title, questions[]
  - workspaceId
```
