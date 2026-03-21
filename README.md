# School Nexus Web Application

The web frontend for School Nexus Academy built with Next.js 16 and React 19.

## 🚀 Features

- **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- **Component Library**: Radix UI components for accessibility
- **Animations**: Smooth transitions with Framer Motion
- **State Management**: Efficient state handling with Zustand
- **Type Safety**: Full TypeScript support
- **Electron Integration**: Desktop app capabilities

## 🛠️ Development

### Getting Started
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (dashboard)/  # Dashboard layouts and pages
│   │   ├── api/          # API routes
│   │   ├── login/        # Login page
│   │   ├── setup/        # Setup wizard
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   ├── setup-wizard/ # Setup wizard components
│   │   ├── ui/           # UI components
│   │   └── ...
│   ├── context/          # React context providers
│   ├── db/               # Database integration
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   └── types/            # TypeScript types
├── public/               # Static assets
├── tests/                # Test files
├── package.json          # Package configuration
└── tsconfig.json         # TypeScript configuration
```

## 🎨 UI Components

### Component Library
- **Button** - Primary and variant buttons
- **Card** - Content containers
- **Input** - Form inputs
- **Dialog** - Modal dialogs
- **Dropdown** - Dropdown menus
- **Table** - Data tables with sorting
- **Toast** - Notification system

### Design System
- **Colors**: Emerald-based color palette
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent spacing system
- **Breakpoints**: Responsive design breakpoints

## 🔧 Configuration

### Environment Variables
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
```

### Next.js Config
```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
}
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test:unit

# Run E2E tests
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage
```

## 🚀 Deployment

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Other Platforms
- Netlify
- AWS
- DigitalOcean
- Custom Node.js server

## 📱 Electron Desktop App

The web app can be packaged as a desktop application using Electron:

```bash
# Development
pnpm electron-dev

# Build
pnpm electron-build
```

## 🤝 Contributing

See the main project contributing guidelines.

## 📄 License

MIT License - see main project LICENSE file.
