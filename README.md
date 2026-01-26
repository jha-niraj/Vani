# PrepSathi - Loksewa Exam Preparation Platform

<div align="center">
  <img src="apps/main/public/logo.png" alt="PrepSathi Logo" width="120" />
  
  **Your Ultimate Companion for Loksewa Exam Success**
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
  [![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
  [![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
  [![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://prisma.io)
</div>

---

## 📖 Overview

**PrepSathi** (प्रेपसाथी - "Preparation Companion") is a comprehensive exam preparation platform designed specifically for Nepal's Loksewa (Public Service Commission) examinations. The platform provides a mobile app for candidates to practice MCQ questions, take mock tests, track progress, and receive AI-powered explanations.

### Key Features

- 📱 **Mobile App** - Native iOS & Android app built with React Native + Expo
- 🔐 **Phone Auth** - Secure OTP-based authentication via Twilio
- 📚 **Question Bank** - 1000+ Loksewa Kharidar exam questions
- 🤖 **AI Explanations** - OpenAI-powered question explanations and clarifications
- 🌐 **Bilingual** - Full support for English and Nepali (नेपाली)
- 📊 **Progress Tracking** - Daily goals, streaks, and performance analytics
- 🎯 **Mock Tests** - Timed tests with negative marking simulation
- 📑 **Admin Dashboard** - Manage questions, users, and analytics

---

## 🏗️ Architecture

PrepSathi is built as a **Turborepo monorepo** with the following structure:

```
prepsathi/
├── apps/
│   ├── prep-sathi/      # React Native + Expo mobile app
│   ├── main/            # Next.js 15 web app (landing page)
│   ├── admin/           # Next.js 15 admin dashboard
│   └── api-server/      # Express.js REST API
├── packages/
│   ├── prisma/          # Shared Prisma ORM + Database schemas
│   ├── auth/            # Authentication package (Twilio OTP + JWT)
│   ├── ui/              # Shared UI components (shadcn/ui)
│   ├── eslint-config/   # Shared ESLint configurations
│   └── typescript-config/ # Shared TypeScript configs
└── docs/                # Product and technical documentation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile App** | React Native 0.81, Expo SDK 54, Zustand, Reanimated 3 |
| **Web Apps** | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| **API Server** | Express.js 5.1, TypeScript, Zod validation |
| **Database** | PostgreSQL, Prisma ORM |
| **Authentication** | JWT, Twilio OTP, expo-secure-store |
| **AI** | OpenAI GPT-4o for explanations & translations |
| **Build** | Turborepo, pnpm workspaces |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL 15+
- Expo Go app (for mobile development)
- Twilio account (for OTP)
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/shunyatech/prepsathi.git
cd prepsathi

# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @repo/prisma db:generate
```

### Environment Variables

Create `.env` files in the following locations:

**`apps/main/.env`** (used by Prisma and Next.js):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/prepsathi"
```

**`apps/api-server/.env`**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/prepsathi"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_VERIFY_SERVICE_SID="your-twilio-verify-service-sid"
OPENAI_API_KEY="sk-your-openai-api-key"
PORT=3001
NODE_ENV=development
```

**`apps/prep-sathi/.env`** (Expo):
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

### Database Setup

```bash
# Push schema to database (development)
pnpm --filter @repo/prisma db:push

# Run migrations (production)
pnpm --filter @repo/prisma db:migrate

# Seed the database with questions
pnpm --filter @repo/prisma db:seed

# Open Prisma Studio
pnpm --filter @repo/prisma db:studio
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Or run specific apps:
pnpm --filter prep-sathi dev     # Mobile app (Expo)
pnpm --filter main dev           # Web app
pnpm --filter admin dev          # Admin dashboard
pnpm --filter api-server dev     # API server
```

### Building

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter api-server build
pnpm --filter main build
pnpm --filter admin build
```

---

## 📱 Mobile App (prep-sathi)

The mobile app is built with **Expo SDK 54** and **React Native 0.81**.

### Running on Device

```bash
cd apps/prep-sathi

# Start Expo dev server
pnpm start

# Or run on specific platform
pnpm ios        # iOS simulator
pnpm android    # Android emulator
```

### Project Structure

```
apps/prep-sathi/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (onboarding)/      # Onboarding flow
│   ├── (tabs)/            # Main tab navigator
│   └── (practice)/        # Quiz and practice screens
├── components/            # Reusable components
│   ├── ui/               # Design system components
│   └── shared/           # Feature components
├── lib/                  # Utilities and services
│   ├── api/             # API client
│   └── store/           # Zustand stores
├── hooks/               # Custom React hooks
└── constants/           # Theme, colors, fonts
```

### Key Features

- **Authentication**: Phone + OTP via Twilio
- **Exam Selection**: Choose exam type (Loksewa) and level (Kharidar, Na.Su., etc.)
- **Practice Mode**: Subject-based MCQ practice with explanations
- **Mock Tests**: Timed tests with real exam conditions
- **Progress Tracking**: Daily goals, streaks, accuracy stats
- **Bookmarks**: Save questions for later review
- **AI Assistant**: Get explanations and ask follow-up questions
- **Nepali Translation**: Translate questions to Nepali using AI

---

## 🖥️ Admin Dashboard

The admin dashboard provides full management capabilities.

### Features

- **Dashboard**: Overview with key metrics and charts
- **Users**: View, search, and manage app users with pagination
- **Questions**: CRUD operations for question bank
- **Analytics**: User engagement, question performance stats
- **Admin Management**: Role-based access control

### Running Locally

```bash
pnpm --filter admin dev
# Open http://localhost:3000
```

---

## 🔌 API Server

RESTful API built with Express.js 5.1.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** |||
| POST | `/api/v1/auth/otp/send` | Send OTP to phone |
| POST | `/api/v1/auth/otp/verify` | Verify OTP and login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| **Users** |||
| GET | `/api/v1/users/profile` | Get current user profile |
| PUT | `/api/v1/users/profile` | Update user profile |
| PUT | `/api/v1/users/preferences` | Update preferences |
| **Exams** |||
| GET | `/api/v1/exams/types` | Get all exam types |
| GET | `/api/v1/exams/types/:id/levels` | Get levels for exam type |
| GET | `/api/v1/exams/levels/:id/subjects` | Get subjects for level |
| **Practice** |||
| GET | `/api/v1/practice/subjects/:id/topics` | Get topics for subject |
| GET | `/api/v1/practice/topics/:id/questions` | Get questions for topic |
| POST | `/api/v1/practice/attempts` | Submit question attempt |
| **Progress** |||
| GET | `/api/v1/progress/daily` | Get daily progress |
| GET | `/api/v1/progress/stats` | Get overall statistics |
| **AI** |||
| POST | `/api/v1/ai/explain` | Get AI explanation for question |
| POST | `/api/v1/ai/translate` | Translate question to Nepali |

### Running Locally

```bash
pnpm --filter api-server dev
# API available at http://localhost:3001
```

---

## 📊 Database Schema

The database uses PostgreSQL with Prisma ORM. Key models:

- **PrepUser**: App users with profile and preferences
- **ExamType** → **ExamLevel** → **Subject** → **Topic** → **Question**
- **UserProgress**: Overall and daily progress tracking
- **QuestionAttempt**: Individual question attempt records
- **MockTest** & **MockTestResult**: Timed test data
- **AdminAccess**: Admin users with role-based permissions

See `/packages/prisma/schema/` for full schema definitions.

---

## 🤖 AI Integration

PrepSathi uses **OpenAI GPT-4o** for:

1. **Question Explanations**: Detailed explanations for MCQ answers
2. **Follow-up Q&A**: Users can ask clarifying questions
3. **Nepali Translation**: Translate questions and options to Nepali

### Configuration

Set `OPENAI_API_KEY` in your environment variables.

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter api-server test
pnpm --filter prep-sathi test
```

---

## 📦 Deployment

### Mobile App

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### API Server

The API server can be deployed to any Node.js hosting:
- Vercel (with serverless functions)
- Railway
- Fly.io
- AWS EC2/ECS

### Web Apps

Next.js apps can be deployed to:
- Vercel (recommended)
- Netlify
- AWS Amplify

---

## 📚 Documentation

Additional documentation is available in the `/docs` folder:

- `/docs/product/` - Product requirements and specifications
- `/docs/react-native-expo/` - React Native + Expo learning guides

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software owned by Shunya Tech Pvt. Ltd.

---

## 📞 Support

- **Email**: support@prepsathi.com
- **Discord**: [Join our community](https://discord.gg/prepsathi)
- **Documentation**: [docs.prepsathi.com](https://docs.prepsathi.com)

---

<div align="center">
  Made with ❤️ in Nepal 🇳🇵
  
  **PrepSathi** - Your Path to Loksewa Success
</div>
