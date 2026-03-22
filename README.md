# Palm IQ - Secure Contactless Payments

Palm IQ is a biometric payment application using palm vein authentication technology for secure, contactless transactions.

## Features

- **Palm Vein Authentication** - Secure biometric verification using palm vein patterns
- **Digital Wallet** - Send/receive money, bill payments, recharges
- **Merchant Mode** - Terminal for accepting palm-authenticated payments
- **Health Dashboard** - Biometric health insights

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Capacitor for native Android
- Firebase Authentication & Firestore

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Android Build

See [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md) for full instructions.

```bash
# Quick start
npm install
npm run build
npx cap add android
npx cap sync android

# Apply SDK patch
node scripts/android/patch-android.mjs
npx cap sync android
npx cap open android
```

## Hardware Integration

The app supports real palm vein scanning hardware via USB-C OTG connection. See:
- [PALM_SDK_INTEGRATION_GUIDE.md](./PALM_SDK_INTEGRATION_GUIDE.md)
- [ANDROID_NATIVE_AUTOFIX.md](./ANDROID_NATIVE_AUTOFIX.md)
##
APP 
SING UP BY USEING UR EMAIL ID AND PASSWARD
SIGN IN WITH SAME EMAIL ID AND PASSWARD
## License

Proprietary - All rights reserved.
