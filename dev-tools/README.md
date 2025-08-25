# Development Tools

This directory contains development utilities, test scripts, and debugging tools.

## Files

### Python Database Tools
- `fix_function.py` - Fix PostgreSQL functions with parameter conflicts
- `fix_view.py` - Database view repair utilities
- `investigate_view.py` - Database investigation and analysis

### Test Scripts
- `test-*.js` - Various test files for different components
- `check-waiver-column.js` - Waiver column validation script

### Development Files
- `cookies.txt` - Browser cookies for testing
- `prodenv.txt` - Production environment notes

## Usage

### Python Tools
Make sure the virtual environment is activated:
```bash
source .venv/bin/activate
python dev-tools/investigate_view.py
```

### Test Scripts
```bash
node dev-tools/test-athlete-creation.js
```

## Requirements

- Python 3.12+ with psycopg2-binary
- Node.js for JavaScript test files
- Database connection configured in .env
