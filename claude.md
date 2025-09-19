# Card Rewards Optimizer - Development Guide

## 🚨 CRITICAL CODE QUALITY RULES

### **NEVER USE `any` TYPES**
- ❌ **FORBIDDEN**: `Promise<any>`, `useState<any>`, `(param: any)`, etc.
- ✅ **REQUIRED**: Always use proper TypeScript interfaces
- 🚨 **BREAKS PRODUCTION**: `any` types cause Vercel build failures

**Examples:**
```typescript
// ❌ NEVER DO THIS
const [data, setData] = useState<any>(null);
function process(item: any) { }

// ✅ ALWAYS DO THIS
const [data, setData] = useState<UserData | null>(null);
function process(item: UserCard) { }
```

### **ESCAPE JSX APOSTROPHES**
- ❌ **FORBIDDEN**: `don't`, `won't`, `can't` in JSX
- ✅ **REQUIRED**: `don&apos;t`, `won&apos;t`, `can&apos;t`

## 🎯 DEVELOPMENT WORKFLOW

### **Running Locally**

**Backend:**
```bash
cd backend
node index.js  # Runs on http://localhost:4000
```

**Frontend:**
```bash
cd frontend
npm run dev    # Runs on http://localhost:3000
```

### **Key Development Commands**
```bash
# Backend
cd backend && node index.js

# Frontend
cd frontend && npm run dev

# Database (if needed)
psql $DATABASE_URL < backend/scripts/schema.sql
```

## 📁 PROJECT STRUCTURE

```
card-rewards-optimizer/
├── backend/               # Express.js API server
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── middleware/       # Auth & validation
│   └── lib/             # Database & utilities
├── frontend/             # Next.js React app
│   ├── src/app/         # Next.js app directory
│   ├── src/components/  # React components
│   └── src/types/       # TypeScript definitions
└── docs/                # Documentation
```

## 🔧 TECHNICAL ARCHITECTURE

### **Backend Stack**
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL via Vercel Postgres
- **Authentication**: JWT tokens with bcryptjs
- **Deployment**: Vercel serverless functions

### **Frontend Stack**
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **UI Components**: Custom components with dnd-kit

### **Key Features Implemented**
1. **Smart Purchase Recommendations**: AI-powered categorization with reward optimization
2. **Portfolio Analysis**: Gap detection and smart card suggestions
3. **User Card Management**: CRUD operations with drag & drop reordering
4. **Authentication System**: Secure JWT-based auth with protected routes

## 🚀 DEPLOYMENT NOTES

### **Vercel Configuration**
- Backend: Separate deployment with `backend/vercel.json`
- Frontend: Standard Next.js deployment
- Environment variables configured in Vercel dashboard

### **Database Schema**
- Cards and rewards tables with complex reward structures
- User management with card ownership tracking
- Optimized indexes for fast category queries

## 📚 API DOCUMENTATION

### **Core Endpoints**
- `POST /api/recommend-card` - Purchase recommendations
- `POST /api/cards/analyze-portfolio` - Portfolio analysis
- `GET/POST/DELETE /api/user-cards` - Card management
- `POST /api/login` - Authentication

For detailed API documentation, see `/backend/README.md`

## 🧪 TESTING

### **Manual Testing Checklist**
- [ ] Purchase recommendations work across categories
- [ ] Portfolio analysis modes (auto/category) function
- [ ] Card CRUD operations complete successfully
- [ ] Authentication flow works end-to-end
- [ ] Responsive design on mobile/desktop

### **Common Test Commands**
```bash
# Test backend endpoints
curl -X POST localhost:4000/api/recommend-card -d '{"description":"dinner"}'

# Test database connection
cd backend && node -e "require('./lib/db').query('SELECT 1')"
```

## 🔒 IMPORTANT REMINDERS

1. **Never commit API keys** - Use environment variables
2. **Always use TypeScript interfaces** - No `any` types
3. **Test on mobile** - Responsive design is crucial
4. **Validate user inputs** - Security and UX
5. **Handle errors gracefully** - User-friendly error messages

---

*This guide contains essential development information. For complete architecture details and setup instructions, see the README files in `/backend` and `/frontend` directories.*