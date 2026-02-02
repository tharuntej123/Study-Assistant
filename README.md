# Study-Assistant

An AI-powered learning platform that helps students study smarter with intelligent features like automated summaries, flashcards, and interactive quizzes.

## Features

- **Smart Document Upload**: Upload PDFs and images, automatically extract text
- **AI Summaries**: Get concise summaries of your study materials using Google Gemini AI
- **Flashcard Generation**: Automatically create flashcards from your documents
- **Interactive Quizzes**: Test your knowledge with AI-generated multiple-choice questions
- **Study Calendar**: Schedule and track study sessions with built-in reminders
- **AI Chat Assistant**: Ask questions about your materials and get instant answers
- **Google Authentication**: Secure login with your Google account

## Tech Stack

**Frontend**
- React + Vite
- TailwindCSS for styling
- React Query for data management
- React Router for navigation

**Backend**
- Node.js + Express
- MongoDB for data storage
- AWS S3 for file storage
- Google Gemini AI for content generation
- Passport.js for authentication

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB account
- AWS S3 bucket
- Google OAuth credentials
- Google Gemini API key

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd Study-Assistant
```

2. Install dependencies
```bash
# Install server dependencies
cd server
pnpm install

# Install client dependencies
cd ../client
pnpm install
```

3. Set up environment variables

Create `.env` files in both `server` and `client` directories (see `.env` files for required variables)

4. Run the application

```bash
# Start server (from server directory)
npm start

# Start client (from client directory)
pnpm run dev
```


## How to Use

1. **Sign In**: Log in with your Google account
3. **Upload Materials**: Add PDFs or images of your study materials
4. **Study Tools**:
   - View AI-generated summaries
   - Practice with flashcards
   - Take quizzes to test yourself
   - Chat with AI about your materials
5. **Schedule Sessions**: Plan your study time with the calendar feature
6. **Track Progress**: Monitor your study streak and completed sessions

## Key Libraries

- **pdf-parse**: Extract text from PDF files
- **@google/generative-ai**: Google Gemini integration
- **aws-sdk**: File storage on S3
- **passport-google-oauth20**: Google authentication
- **react-markdown**: Render formatted content
