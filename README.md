# Car Expense and Mileage Tracker

A full-stack web application for tracking vehicle expenses, fuel refills, and trips with mileage visualization.

## Features

- 🔐 **Password-protected authentication** with session management
- 💰 **Expense tracking** - Record and manage vehicle-related expenses
- ⛽ **Fuel refill tracking** - Track fuel purchases with automatic efficiency calculations
- 🚗 **Trip logging** - Record individual trips with distance tracking
- 📊 **Mileage visualization** - Interactive charts showing cumulative distance over time
- 📱 **Responsive design** - Works seamlessly on desktop and mobile devices
- ✅ **Comprehensive validation** - Client-side and server-side error handling

## Tech Stack

- **Frontend**: Next.js 15+ with React 19, TypeScript, Bootstrap 5
- **Backend**: Next.js API Routes
- **Database**: SQLite3 with better-sqlite3 driver
- **Charts**: Chart.js with react-chartjs-2
- **Testing**: Jest with React Testing Library
- **Authentication**: JWT-based with session management
- **Deployment**: Docker support with configurable base path

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository and navigate to the project directory:

```bash
cd car-expense-tracker
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Configure environment variables:

Create a `.env.local` file in the project root:

```env
# Application Password for Authentication
APP_PASSWORD=your-secure-password-here

# JWT Configuration
JWT_SECRET=your-very-secure-random-secret-key
JWT_EXPIRES_IN=24h

# Database Configuration
DB_PATH=car-expense-tracker.db

# Optional: Base Path for Subpath Deployment
# NEXT_PUBLIC_BASE_PATH=/car-tracker
```

**Environment Variables:**
- `APP_PASSWORD` - Password required to access the application (required)
- `JWT_SECRET` - Secret key for JWT token signing (required)
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 24h)
- `DB_PATH` - Path to SQLite database file (default: `car-expense-tracker.db`)
- `NEXT_PUBLIC_BASE_PATH` - Base path for subpath deployment (optional, see [BASE_PATH.md](BASE_PATH.md))

### Running the Application

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You'll be redirected to the login page. Enter the password you configured in `.env.local` to access the application.

### Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

The application includes full Docker support for easy deployment.

### Quick Start with Docker Compose

```bash
# Create environment file
cp .env.example .env

# Edit .env with your configuration
# Then start the application
docker-compose up -d
```

Access the application at `http://localhost:3000`

### Docker Environment Variables

All standard environment variables are supported, plus:
- `NEXT_PUBLIC_BASE_PATH` - Deploy under a subpath (e.g., `/car-tracker`)

### Data Persistence

The SQLite database is stored in a Docker volume (`car-expense-data`) for persistence across container restarts.

For detailed Docker deployment instructions, including:
- Manual Docker build and run
- Production deployment best practices
- Reverse proxy configuration (nginx, Traefik, Apache)
- Database backup and restore
- Subpath deployment

See the complete [Docker Deployment Guide](DOCKER.md)

### Deploying Under a Subpath

To deploy the application under a subpath (e.g., `https://example.com/car-tracker`):

1. Set `NEXT_PUBLIC_BASE_PATH=/car-tracker` in your `.env` file
2. Rebuild the application
3. Configure your reverse proxy

See [BASE_PATH.md](BASE_PATH.md) for detailed configuration instructions.

## Running Tests

The project includes comprehensive test coverage with Jest and React Testing Library.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

Test coverage includes:
- API route handlers
- React components
- Service layer logic
- Authentication middleware
- Database operations

## Project Structure

```
car-expense-tracker/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── expenses/       # Expense CRUD endpoints
│   │   ├── refills/        # Refill CRUD endpoints
│   │   └── trips/          # Trip CRUD endpoints
│   ├── dashboard/          # Main dashboard page
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout with navigation
│   ├── Navigation.tsx      # Navigation component
│   └── error.tsx           # Error boundaries
├── src/
│   ├── components/         # React components
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseList.tsx
│   │   ├── RefillForm.tsx
│   │   ├── RefillList.tsx
│   │   ├── TripForm.tsx
│   │   ├── TripList.tsx
│   │   └── MileageChart.tsx
│   ├── lib/
│   │   ├── db.ts          # Database initialization
│   │   ├── services/      # Business logic layer
│   │   │   ├── authService.ts
│   │   │   ├── expenseService.ts
│   │   │   ├── refillService.ts
│   │   │   └── tripService.ts
│   │   └── types.ts       # TypeScript interfaces
│   └── middleware.ts      # Authentication middleware
└── .env.local             # Environment configuration (create this)
```

## Database

The application uses SQLite3 for data persistence. The database file location is configurable via the `DB_PATH` environment variable.

### Database Schema

- **expenses** - Vehicle expenses (type, amount, date, description)
- **refills** - Fuel refills (amount spent, distance traveled, efficiency)
- **trips** - Individual trips (distance, date, purpose, notes)
- **sessions** - User sessions for authentication

All tables include automatic timestamps and appropriate indexes for performance.

## Usage

### Dashboard

The dashboard is organized into four tabs:

1. **Expenses** - Add, edit, and delete vehicle expenses
2. **Refills** - Track fuel purchases and view efficiency metrics
3. **Trips** - Log individual trips and view total distance
4. **Charts** - Visualize mileage trends over time

### Adding Data

Each tab has a form at the top for adding new entries. All forms include:
- Client-side validation with immediate feedback
- Required field indicators
- Helpful placeholder text and hints

### Editing and Deleting

Each entry in the list has Edit and Delete buttons:
- **Edit** - Opens an inline form to modify the entry
- **Delete** - Prompts for confirmation before removing the entry

## Development

This project uses:
- TypeScript for type safety
- ESLint for code quality
- Jest for testing
- Bootstrap for styling

### Key Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run lint             # Run ESLint
```

## Additional Documentation

- [Docker Deployment Guide](DOCKER.md) - Complete Docker deployment instructions
- [Base Path Configuration](BASE_PATH.md) - Deploy under a subpath with reverse proxy
- [Component Documentation](src/components/README.md) - Component usage and props

## License

This project was created as part of a specification-driven development workflow.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Bootstrap Documentation](https://getbootstrap.com/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
