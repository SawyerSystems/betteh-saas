# Development Guide

Complete guide for setting up and running the CoachWillTumbles platform in development mode.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 18.0+ 
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### 1. Clone Repository
```bash
git clone https://github.com/SawyerSystems/coach-will-gymnastics.git
cd coach-will-gymnastics
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp setup/example.env .env

# Edit with your configuration
nano .env  # or use your preferred editor
```

### 4. Database Setup
Follow [02-DATABASE_SETUP.md](./02-DATABASE_SETUP.md) to configure Supabase database.

### 5. Start Development Server
```bash
# Clean start (recommended)
npm run dev:clean

# Or regular start
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5001

## 🛠️ Development Scripts

### Essential Commands
```bash
# Development
npm run dev              # Start both client and server
npm run dev:clean        # Kill ports and start fresh
npm run dev:client       # Start only frontend (Vite)
npm run dev:server       # Start only backend (Express)

# Building
npm run build           # Production build
npm run preview         # Preview production build

# Quality Assurance  
npm run check           # TypeScript validation
npm run lint            # Code linting
npm run test            # Run test suite

# Database
npm run db:push         # Apply schema changes
npm run db:generate     # Generate migrations
```

### Port Management
```bash
# Kill stuck processes on development ports
npm run kill-ports

# Check what's running on ports
lsof -i :5001  # Backend
lsof -i :5173  # Frontend
```

## 📁 Project Structure

```
coach-will-gymnastics/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── contexts/      # React contexts
│   └── public/            # Static assets
│
├── server/                # Express backend
│   ├── routes.ts          # API routes (5500+ lines)
│   ├── storage.ts         # Database abstraction layer
│   ├── auth.ts            # Authentication logic
│   ├── lib/               # Server utilities
│   └── types/             # TypeScript types
│
├── shared/                # Shared code between client/server
│   ├── schema.ts          # Database schema (Drizzle ORM)
│   └── timezone-utils.ts  # Timezone handling
│
├── emails/                # Email templates (React Email)
├── setup/                 # Setup and configuration guides
└── scripts/               # Build and utility scripts
```

## 🔧 Configuration Details

### Environment Variables
See [01-ENVIRONMENT_SETUP.md](./01-ENVIRONMENT_SETUP.md) for complete list.

Key development variables:
```bash
NODE_ENV=development
PORT=5001
BASE_URL=http://localhost:5173
DEBUG_EMAIL=true
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["client/src", "server", "shared"],
  "exclude": ["node_modules", "dist"]
}
```

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5001'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  }
});
```

## 🗃️ Database Development

### Schema Management
```bash
# Apply changes to database
npm run db:push

# Generate migration files
npm run db:generate

# View current schema
npx drizzle-kit introspect
```

### Local Database Access
```bash
# Connect to Supabase database
psql "postgresql://postgres:password@db.project-id.supabase.co:5432/postgres"

# Run SQL files
psql -f setup/site-content-schema.sql "connection-string"
```

## 🎨 Frontend Development

### Component Development
```typescript
// Example component structure
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function ExampleComponent() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAction = async () => {
    try {
      setLoading(true);
      // API call here
      toast({ title: "Success!" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleAction} disabled={loading}>
      {loading ? 'Loading...' : 'Click Me'}
    </Button>
  );
}
```

### Styling Guidelines
- **Tailwind CSS**: Primary styling framework
- **shadcn/ui**: Component library
- **Responsive Design**: Mobile-first approach
- **Color Scheme**: Brand colors defined in `tailwind.config.js`

### State Management
- **TanStack Query**: Server state management
- **React Context**: Global state (auth, booking flow)
- **Local State**: Component-level state with `useState`

## 🔙 Backend Development

### API Development
```typescript
// Example API endpoint
app.post("/api/example", isAdminAuthenticated, async (req, res) => {
  try {
    const { data } = req.body;
    
    // Validation
    if (!data) {
      return res.status(400).json({ error: "Data required" });
    }

    // Business logic
    const result = await processData(data);
    
    // Response
    res.json({ success: true, result });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Database Queries
```typescript
// Using storage abstraction layer
const booking = await storage.getBooking(id);
const athlete = await storage.createAthlete({
  name: "John Doe",
  experience: "beginner",
  dateOfBirth: new Date("2010-01-01")
});
```

### Authentication Middleware
```typescript
// Admin authentication
app.use('/api/admin/*', isAdminAuthenticated);

// Parent authentication  
app.use('/api/parent/*', isParentAuthenticated);
```

## 🧪 Testing

### Running Tests
```bash
# Full test suite
npm run test

# Verbose output
npm run test:verbose

# Specific test categories
npm run test -- --grep "booking"
npm run test -- --grep "auth"
```

### Manual Testing
```bash
# Test API endpoints
curl -X GET http://localhost:5001/api/lesson-types

# Test with authentication
curl -X GET http://localhost:5001/api/admin/bookings \
  -H "Cookie: session-cookie-here"
```

### Database Testing
```sql
-- Test data queries
SELECT * FROM bookings WHERE status = 'confirmed';
SELECT * FROM athletes WHERE experience = 'beginner';
```

## 🔍 Debugging

### Server Debugging
```bash
# Enable debug logging
DEBUG=true npm run dev:server

# View server logs
tail -f server-debug.log
```

### Client Debugging
```typescript
// Browser console logging
console.log('🔍 Debug:', { data, state, props });

// React Query DevTools (available in dev mode)
// Check Network tab for API calls
```

### Common Issues
```bash
# Port conflicts
npm run kill-ports

# Node modules issues
rm -rf node_modules package-lock.json
npm install

# TypeScript errors
npm run check

# Database connection issues
# Check SUPABASE_URL and keys in .env
```

## 📱 Mobile Development

### Responsive Testing
```bash
# Test on different screen sizes
# Use browser dev tools device emulation
# Test on actual devices when possible
```

### Mobile-First CSS
```css
/* Start with mobile styles */
.component {
  @apply flex flex-col p-4;
}

/* Then add desktop styles */
@screen md {
  .component {
    @apply flex-row p-6;
  }
}
```

## 🔄 Hot Reload & Live Updates

### Automatic Reloading
- **Frontend**: Vite hot module replacement
- **Backend**: tsx watch mode with auto-restart
- **Database**: Manual restart after schema changes
- **Email Templates**: Require server restart

### File Watching
```bash
# Watch specific files
npx nodemon --watch server --ext ts,js server/index.ts

# Watch with custom config
npx nodemon --config nodemon.json
```

## 🚀 Performance Optimization

### Development Performance
```bash
# Bundle analysis
npm run build
npm run preview

# Check bundle size
npx vite-bundle-analyzer dist

# Performance profiling
# Use React DevTools Profiler
# Monitor Network tab in browser
```

### Database Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC;

-- Add indexes for development
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_athletes_parent_id ON athletes(parent_id);
```

## 🤝 Contributing

### Code Style
```bash
# Follow existing patterns
# Use TypeScript strictly
# Add comments for complex logic
# Write tests for new features
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Before Committing
```bash
# Run quality checks
npm run check      # TypeScript
npm run lint       # Linting
npm run test       # Tests
npm run build      # Build verification
```

Need help? Check the [copilot-instructions.md](../.github/copilot-instructions.md) for detailed architecture information or reach out to the development team.
