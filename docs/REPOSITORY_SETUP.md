# Creating the Betteh SaaS Repository

## 🎯 Quick Setup

### Option 1: Local Repository (Start Here)

```bash
# From your current project directory
./scripts/create-saas-repo.sh
```

The script will:
- Create a new directory for the SaaS version
- Copy all essential files and source code
- Initialize a new git repository
- Create an initial commit with clean migration history
- Update package.json for the SaaS version

### Option 2: GitHub Repository

After creating the local repository:

1. **Create GitHub Repository**
   ```bash
   # Navigate to GitHub and create new repository: betteh-saas
   # Don't initialize with README (we have our own)
   ```

2. **Connect Local to GitHub**
   ```bash
   cd /path/to/your/new/saas/directory
   git remote add origin https://github.com/SawyerSystems/betteh-saas.git
   git push -u origin main
   ```

## 📁 What Gets Migrated

### ✅ Essential Files Copied
- **Source Code**: `client/`, `server/`, `shared/`, `emails/`
- **Configuration**: `package.json`, `tsconfig.json`, `vite.config.ts`, etc.
- **Database**: `migrations/`, `attached_assets/` (schema reference)
- **Documentation**: Migration plan, README
- **Scripts**: Essential development and setup scripts

### ❌ Files Excluded (Cleanup)
- `node_modules/` (will reinstall)
- `.env` (create new with fresh credentials)
- Development artifacts and temporary files
- Legacy migration scripts specific to single-tenant version

## 🔧 Post-Setup Steps

1. **Environment Setup**
   ```bash
   cd /path/to/betteh-saas
   cp .env.example .env
   # Edit .env with your new Supabase/Stripe credentials
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Verify Setup**
   ```bash
   npm run check  # TypeScript validation
   npm run dev:clean  # Start development servers
   ```

4. **Database Setup**
   - Create new Supabase project for SaaS version
   - Run migration scripts to set up multi-tenant schema
   - Update .env with new database credentials

## 🎯 Benefits of Fresh Repository

### ✅ Clean Migration History
- Initial commit represents "SaaS v1.0" starting point
- No legacy single-tenant development history
- Clear progression from multi-tenant foundation

### ✅ Focused Development
- Remove single-tenant specific files and configs
- Clean package.json focused on SaaS features
- Fresh documentation and README

### ✅ Deployment Separation
- Independent CI/CD pipelines
- Separate environment variables and secrets
- Different domain and hosting setup

### ✅ Team Collaboration
- Clear repository purpose and scope
- Fresh issue tracking focused on SaaS features
- Independent branching strategy

## 📊 Current State

After repository creation, you'll have:

- ✅ **Database Foundation** (Complete)
- ✅ **Authentication System** (Complete) 
- 🔄 **Ready for Phase 3**: Branding System implementation
- 📚 **Complete Documentation**: Migration plan and API docs
- 🔧 **Development Environment**: Ready to run locally

## 🚀 Next Steps

1. Run the setup script
2. Create GitHub repository (optional)
3. Set up new environment credentials
4. Begin Phase 3: Branding System implementation

The new repository will be ready for immediate SaaS development!
