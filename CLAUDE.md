# CLAUDE.md
必ず日本語で回答してください
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BeautyFood App is a React Native + Expo application that analyzes food photos using AI to provide beauty-focused nutritional advice. The app features food photo capture, AI-powered analysis with beauty scoring, meal history tracking, and premium features.

## Development Environment & Commands

### Core Commands
```bash
# Start development server
npm run dev
# Alternative: EXPO_NO_TELEMETRY=1 expo start

# Build for web
npm run build:web

# Linting
npm run lint
# Alternative: expo lint

# Run on devices
npm run android    # Android device/emulator
npm run ios        # iOS device/simulator
```

### Setup
```bash
npm install
npx expo start
```

## Architecture Overview

### Core Technology Stack
- **Frontend**: React Native with Expo SDK 53
- **Router**: expo-router with file-based routing
- **Backend**: Supabase (auth, database, storage)
- **AI**: OpenAI API (GPT-4o/GPT-4o-mini for food analysis)
- **UI**: Custom components with React Native core + some Expo components
- **State**: React Context (AuthContext) + local state
- **Fonts**: Poppins (English) + Noto Sans JP (Japanese)
- **Notifications**: Slack webhook integration

### Project Structure
```
app/                    # Expo Router pages
├── (tabs)/            # Tab navigation screens
├── onboarding/        # User onboarding flow
├── _layout.tsx        # Root layout with providers
└── *.tsx              # Individual screens

components/            # Reusable UI components
├── EditNameModal.tsx
└── PremiumModal.tsx

contexts/              # React Context providers
└── AuthContext.tsx    # Authentication & user state

lib/                   # Core business logic
├── supabase.ts        # Database client config
├── openai.ts          # AI analysis prompts & client
├── food-analysis.ts   # Main food analysis logic
├── meal-service.ts    # Meal data operations
└── slack-service.ts   # Slack webhook integration

hooks/                 # Custom React hooks
└── useFrameworkReady.ts
```

### Key Architecture Patterns

#### Authentication Flow
- AuthContext provides session, user, premium status
- Supports guest mode (no signup required initially)
- Apple Sign-In integration (stub implementation)
- First launch detection with AsyncStorage

#### AI Analysis Pipeline
1. **Food Detection**: GPT-4o-mini determines if image contains food
2. **Non-food Handling**: Humorous responses for non-food images (person, animal, electronics, etc.)
3. **Food Analysis**: Detailed nutritional analysis with beauty scoring
4. **Personalization**: Analysis adapted to user's beauty categories & experience level
5. **Quality Tiers**: Premium users get higher quality analysis (GPT-4o vs GPT-4o-mini)

#### Beauty Categorization System
- **Categories**: skin_care, anti_aging, detox, circulation, hair_nails
- **Experience Levels**: beginner, intermediate, advanced (affects explanation depth)
- **Scoring**: 0-100 scores for each beauty category plus overall score

#### Data Flow
- Meal records stored in Supabase
- Guest users use temporary IDs (prefix: 'guest_')
- Premium/free tier differentiation in analysis quality
- Slack integration for support requests

### Database Schema (Supabase)
- `meal_records`: Photo storage & basic meal data
- `ai_analysis_results`: Detailed AI analysis output
- `advice_records`: Immediate & next-meal suggestions
- User profiles with beauty preferences

### Environment Variables Required
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

### Code Style Notes (from .cursor/rules)
- TypeScript strict mode
- Interface preferred over type alias (except utility types)
- Named exports preferred
- enum prohibited (use const objects with as const)
- Function components only, no class components
- expo-secure-store for sensitive data storage

### Testing Strategy
- Target: >60% line coverage with Jest
- React Native Testing Library for component tests
- E2E testing with Detox planned
- Snapshot testing for design system components

### Deployment
- **Mobile**: EAS Build for iOS/Android app store distribution  
- **Updates**: EAS Update for OTA JavaScript/asset updates
- **Web**: expo export --platform web for web deployment

## Premium/Freemium Model
- Free users: GPT-4o-mini, lower resolution analysis, basic features
- Premium users: GPT-4o, high resolution analysis, detailed reports, priority support
- Quality differences designed to encourage upgrades while maintaining good free experience