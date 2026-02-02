# User Flow Diagrams

## Authentication Flow

```
User → Client → Server → Google → MongoDB
  |       |        |        |         |
  |    Click    OAuth    Auth      Store/
  |    Login   Request  Prompt    Update
  |       ↓        ↓        ↓         ↓
  |    Redirect  Request  Approve  User Data
  ↓       ↓        ↓        ↓         ↓
Login → Auth → Exchange → Profile → JWT
Page   Request  Tokens   + Tokens  Token
  ↓       ↓        ↓        ↓         ↓
Store → Redirect to Dashboard
Token    (Authenticated)
```

## Document Upload & Processing Flow

```
User Upload
    |
    v
File Type?
    |
    +----> PDF -----> Extract Text
    |                      |
    +----> Image -----> OCR Text
                           |
                           v
                    Upload to S3
                           |
                           v
                  Save to MongoDB
                           |
                           v
            +-------- AI Processing --------+
            |              |                |
            v              v                v
        Summary       Flashcards         Quiz
       (Gemini)        (Gemini)        (Gemini)
            |              |                |
            v              v                v
       Update DB      Save Sets       Save Quiz
            |              |                |
            +-------> Display to User <-----+
```

## Study Session Flow

```
                Select Material
                       |
        +--------------+---------------+
        |              |               |
        v              v               v
   View Summary   Flashcards       Take Quiz
        |              |               |
        |         +----+----+          |
        |         |         |          |
        |    Next Card   Flip Card     |
        |         |         |          |
        |         v         v          v
        |    Study More  Complete   Submit
        |                               |
        v                               v
   AI Chat <------------------------> Results
        |                               |
        v                               v
   Ask Questions                   Show Score
        |                               |
        +-------> Study Complete <------+
                       |
                       v
                Update Progress
```

## Workspace Creation Flow

```
Click Create → Enter Details → Validate?
                                  |
                                  +--> Invalid → Back
                                  |
                                  +--> Valid
                                         |
                                         v
                                  POST /api/workspaces
                                         |
                                         v
                                  Check Auth?
                                         |
                                         +--> No → 401 Error
                                         |
                                         +--> Yes
                                                |
                                                v
                                          Create in DB
                                                |
                                                v
                                         Return Data
                                                |
                                                v
                                        Update Client
                                                |
                                                v
                                       Navigate to Workspace
```

## AI Chat Interaction Flow

```
User → Client → Server → MongoDB → Gemini
  |       |        |         |         |
 Type  POST     Fetch    Material  Question
  Q    /chat   Materials  Content  +Context
  |       |        |         |         |
  |       |        |<--------+         |
  |       |        |                   |
  |       |        +------------------>|
  |       |        |                   |
  |       |        |<------------------+
  |       |        |    (AI Response)  |
  |       |        v                   |
  |       |    Save Message            |
  |       |        |                   |
  |       |<-------+                   |
  |       |   Stream Response          |
  |<------+                            |
Display                                |
Answer                                 |
```

## Quiz Taking Flow

```
Open Quiz
    |
    v
Load Questions
    |
    v
Display Question  <----+
    |                   |
    v                   |
User Selects Answer    |
    |                   |
    v                   |
Check Answer           |
    |                   |
    +---> Correct → ✓   |
    |                   |
    +---> Wrong → ✗     |
          + Explanation |
    |                   |
    v                   |
More Questions? -------+
    |               (Yes)
    v (No)
Calculate Score
    |
    v
Show Results
    |
    v
Update Progress
    |
    v
Return to Material
```
