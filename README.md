# Retail ERP — Inventory Management System

A simple Retail ERP application designed to help businesses manage products, purchases, sales, inventory, and business insights from one place.

The project includes a React-based admin panel and a REST API backend, with an optional AI-powered assistant for inventory analysis.



## Business Workflow

This project is a simplified Retail ERP prototype built to demonstrate basic inventory management and AI-assisted stock analysis.

- **Products:** Create and manage products.
- **Suppliers:** Manage supplier contacts and purchase products from them.
- **Purchases:** Create purchase records. Purchased quantities are added to product stock.
- **Sales:** Create and delete sales records. Sold quantities are deducted from product stock. Sales are currently recorded without assigning them to specific customers.
- **Dashboard:** Provides a minimal overview of business and inventory information.
- **AI Assistant:** Supports chat-based interaction and selected tasks, focusing on inventory information and stock-related analysis.

### Scope and Limitations

The system intentionally keeps the business logic simple. It does not include batch-wise inventory tracking, customer-specific sales, supplier balances, or accounting features.

The main goal is to demonstrate basic purchase and sales workflows, accurate stock updates, and how an AI assistant can interpret inventory data and support stock-related decisions. The AI assistant is included as an experimental feature to evaluate its usefulness for inventory analysis.


## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Bun

**Backend**
- Bun
- TypeScript
- Express.js
- PostgreSQL (Neon)
- Drizzle ORM
- Zod
- JWT authentication
- Vercel AI SDK with OpenRouter-compatible provider configuration

## Project Structure

```text
retail-erp/
├── admin/       # Frontend application
├── backend/     # Backend API
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Bun](https://bun.sh/)
- Git
- A PostgreSQL database (Neon can be used)

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
```

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
bun install
```

Create a `.env` file inside the `backend/` directory. Use the environment-variable example below and provide your own credentials.

Start the development server:

```bash
bun --watch index.ts
```

To run the backend without watch mode:

```bash
bun index.ts
```

The backend uses port `5000` by default, unless configured otherwise.

### 3. Set Up the Frontend

Open a new terminal and navigate to the `admin/` directory:

```bash
cd admin
bun install
```

Create a `.env` file inside `admin/`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
bun run dev
```

### 4. Build the Frontend

From the `admin/` directory, run:

```bash
bun run build
```

Vite will generate the production build in the configured output directory.

## Environment Variables

### Backend — `backend/.env`

Create this file locally. Do not commit it to Git.

```env
PORT=5000
NODE_ENV=development

# PostgreSQL
DATABASE_URL=your_postgresql_connection_string

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
BCRYPT_SECRET=your_bcrypt_secret

# Initial business owner (if the seed script is configured)
ADMIN_NAME=Business Owner
ADMIN_EMAIL=your_admin_email
ADMIN_MOBILE=your_admin_mobile
ADMIN_PASSWORD=your_strong_admin_password

# Optional AI integration
AI_PROVIDER=openai-compatible
AI_MODEL=openrouter/free
AI_BASE_URL=
AI_API_KEY=your_openrouter_api_key
```

The AI integration is optional. Configure a supported model and a valid API key if you want to use the AI features. Free models may have usage limits and availability restrictions.

### Frontend — `admin/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Only public frontend configuration should be placed in the frontend environment file. Never expose database credentials, JWT secrets, or AI API keys through frontend environment variables.

## Authentication

The application uses single-owner authentication. The backend protects business-related API routes and uses JWT-based authentication.

Configure the initial owner credentials securely before using the application.

## AI Integration

The optional AI feature can help interpret inventory information and explain business insights.

Business calculations should be performed and validated by the backend. AI-generated explanations should not replace the application's actual inventory or financial calculations.

AI access requires a supported provider configuration and may depend on the provider's pricing, usage limits, and availability.

## Testing and Verification

Run the backend tests from the `backend/` directory:

```bash
bun test
```

Run the backend build/check command if configured:

```bash
bun run build
```

Before submitting, verify that the database connection, authentication, API endpoints, frontend build, and core purchase and sales workflows work correctly.

