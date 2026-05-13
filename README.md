# Baby Tracker

A comprehensive baby tracking application built with modern web and mobile technologies. Track feeding, diaper changes, medical activities, and more for your little one across multiple platforms.

## 🍼 Features

- **Feed Tracking**: Log different types of feeding (bottle, breastfeeding, solids) with volume and time
- **Diaper Change Logging**: Track wet, dirty, and mixed diaper changes
- **Medical Records**: Keep track of medical activities and health information
- **Activity Summary**: View feeding statistics and summaries
- **Cross-Platform**: Available as both mobile app (iOS/Android) and web application
- **Real-time Sync**: Data syncs across all devices using Convex backend

## 🏗️ Architecture

This is a monorepo built with Yarn workspaces containing:

```
├── apps/
│   ├── mobile/          # Expo/React Native mobile app
│   └── web/             # Next.js web application
├── services/
│   └── backend/         # Convex backend service
└── core/
    └── domain/          # Shared domain entities and types
```

### Tech Stack

- **Frontend**: React Native (Expo), Next.js, TypeScript, TailwindCSS
- **Backend**: Convex (serverless backend)
- **Mobile**: Expo Router, NativeWind, React Native Vector Icons
- **Web**: Next.js, TailwindCSS
- **State Management**: Zustand
- **Date/Time**: Luxon
- **Build Tools**: TypeScript, ESLint, Yarn workspaces

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or later)
- Yarn (v1.22 or later)
- For mobile development:
  - Expo CLI
  - iOS Simulator (macOS) or Android Studio
  - EAS CLI for building and deploying

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/conradkoh/baby-tracker.git
   cd baby-tracker
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   
   You'll need to configure Convex for the backend service. See the [Convex documentation](https://docs.convex.dev) for setup instructions.

### Development

#### Start all services in development mode:
```bash
yarn dev
```

This command will start:
- Backend (Convex dev server)
- Web app (Next.js on http://localhost:3000)
- Mobile app (Expo with iOS simulator)

#### Start individual services:

**Backend only:**
```bash
yarn workspace @workspace/backend dev
```

**Mobile app only:**
```bash
yarn workspace @workspace/mobile dev
# or for specific platform:
yarn workspace @workspace/mobile ios
yarn workspace @workspace/mobile android
```

## 📱 Mobile Development

The mobile app is built with Expo and includes:

- **Expo Router**: File-based routing
- **NativeWind**: Tailwind CSS for React Native
- **EAS Build**: For creating distribution builds

### Adding iOS devices for testing:
1. Add device to Apple Developer account
2. Run `yarn workspace @workspace/mobile device:add`
3. Rebuild with `yarn workspace @workspace/mobile build:preview:ios`

See `apps/mobile/readme.md` for detailed mobile development instructions.

## 🌐 Web Development

The web application is built with Next.js and shares the same backend and domain logic as the mobile app.

## 🔧 Available Scripts

### Root Level Commands:
- `yarn dev` - Start all services in development mode
- `yarn lint` - Run ESLint across all packages
- `yarn test` - Run tests (placeholder)
- `yarn typecheck` - Type check mobile app
- `yarn deploy` - Deploy backend and update mobile preview
- `yarn deploy:backend` - Deploy backend only
- `yarn update:frontend:preview` - Update mobile preview build

### Mobile App Commands:
- `yarn workspace @workspace/mobile start` - Start Expo development server
- `yarn workspace @workspace/mobile ios` - Run on iOS simulator
- `yarn workspace @workspace/mobile android` - Run on Android emulator
- `yarn workspace @workspace/mobile build:preview:ios` - Build preview for iOS
- `yarn workspace @workspace/mobile update:preview` - Update preview build

### Backend Commands:
- `yarn workspace @workspace/backend dev` - Start Convex development server
- `yarn workspace @workspace/backend deploy` - Deploy to production

## 🚀 Deployment

### Backend (Convex)
```bash
yarn deploy:backend
```

### Mobile App (Expo)
```bash
# Preview build
yarn workspace @workspace/mobile build:preview:ios

# Production build
yarn workspace @workspace/mobile build:production:ios

# Submit to App Store
yarn workspace @workspace/mobile submit:ios
```

### Web App
The web app can be deployed to any hosting platform that supports Next.js (Vercel, Netlify, etc.).

## 📂 Project Structure

```
baby-tracker/
├── apps/
│   ├── mobile/              # React Native mobile app
│   │   ├── app/            # Expo Router pages
│   │   ├── src/            # Source code
│   │   │   ├── components/ # UI components
│   │   │   ├── hooks/      # Custom hooks
│   │   │   ├── lib/        # Utility functions
│   │   │   └── services/   # API services
│   │   └── assets/         # Static assets
│   └── web/                 # Next.js web application
├── services/
│   └── backend/             # Convex backend
│       └── convex/         # Convex functions and schema
└── core/
    └── domain/              # Shared types and entities
        └── entities/       # Domain entities (Feed, DiaperChange, etc.)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and type checking: `yarn lint && yarn typecheck`
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🔗 Related Documentation

- [Mobile App README](./apps/mobile/readme.md) - Mobile-specific development notes
- [Expo Documentation](https://docs.expo.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)