# Data Flow Documentation

## Request/Response Flow

```
1. Browser → React (User action)
           |
2. React → React Query (Trigger query/mutation)
           |
3. React Query → API (HTTP request)
           |
4. API → Express (Route match)
           |
5. Express → Auth Middleware
           |
6. Express → Workspace Middleware
           |
7. Express → Controller (Handler function)
           |
8. Controller → Service (Business logic)
           |
9. Service → Database (DB operation)
           |
10. Database → Service (Data)
           |
11. Service → Controller (Processed data)
           |
12. Controller → Express (JSON response)
           |
13. Express → API (HTTP response)
           |
14. API → React Query (Update cache)
           |
15. React Query → React (Update state)
           |
16. React → Browser (Re-render UI)
```

## File Upload Data Flow

```
CLIENT                SERVER              STORAGE

File Input              |                    |
    |                   |                    |
    v                   |                    |
Create FormData        |                    |
    |                   |                    |
    v                   |                    |
Upload Request ──────> Multer              |
                        Middleware          |
                            |               |
                            v               |
                        File Buffer         |
                            |               |
                   +────────+────────+  |
                   |                 |       |
                   v                 v       |
            Extract Text      Upload S3 ────>
                   |                         S3 Bucket
                   v                             |
            Save Metadata <────────────────+
                   |
                   v
              MongoDB
```

## AI Content Generation Flow

```
INPUT            PROCESSING          OUTPUT

Study Material ───>
                  Build Context
Content Type ───>      |
                       v
                Generate Prompt
                       |
                       v
                 Gemini API Call
                       |
                       v
                 Parse Response
                       |
                       v
                Validate Content
                       |
                       v
                  Store in DB
```

## Authentication Data Flow

```
LOGIN FLOW:
Google OAuth → Callback Handler → Find/Create User → Generate JWT

REQUEST FLOW:
Client Request → Extract Token → Verify JWT → Attach User

ACCESS CONTROL:
Protected Route
       |
       v
Authenticated?
       |
       +────> Yes ──> Process Request
       |
       +────> No ───> Return 401
```

## State Management Flow

```
COMPONENTS           REACT QUERY         CONTEXT

Page Component ────> useQuery ───────>
     |                    |           Query Cache
     |                    |                |
     +────> useMutation ───────────+
     |                    |                |
     +────> Auth Context ─────────────────>
     |                                  User State
     v
Child Component ───> useQuery
     |
     +────> Auth Context


API Endpoints <──── Query Cache
       ^
       |
useMutation ──────+
```

## Workspace Context Flow

```
User → Client: Select workspace
        |
        v
     Store workspace ID
        |
        v
     Request with workspace ID
        |
        v
Server: Workspace middleware
        |
        v
     Verify workspace access (DB)
        |
        v
     Receive workspace data
        |
        v
     Attach to req.workspace
        |
        v
     Controller logic
        |
        v
     Filtered response
        |
        v
Client: Display workspace data
```

## Progress Tracking Flow

```
User Action
     |
     v
Event Type?
     |
     +────> Complete Material
     |            |
     +────> Finish Quiz
     |            |
     +────> Study Session
     |            |
     +────> Login (Update Streak)
                  |
                  v
          Update UserProgress
                  |
                  v
              MongoDB
                  |
                  v
          Calculate Stats
                  |
                  v
          Update Dashboard
```

## Chat Message Flow

```
CLIENT          SERVER              STORAGE

User Input ────> Receive Message
                    |
                    v
              Build Context <──── Study Materials
                    |              |
                    |              v
                    +────────> Chat History
                    |
                    v
              Gemini API
                    |
                    +────────> Chat History
                    |
                    v
Message Display <────+
```
