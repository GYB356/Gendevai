# GenDevAI - AI-Powered Developer Platform

GenDevAI is a powerful platform that leverages artificial intelligence to enhance developer productivity. It provides code generation, task automation, and intelligent assistance features for software development teams.

## Features

- **AI-Powered Code Generation**: Generate code snippets and entire functions based on natural language descriptions
- **Automated Code Reviews**: Get instant feedback on your code quality and suggestions for improvements
- **Task Automation**: Automate repetitive development tasks
- **Smart Documentation**: Generate and maintain documentation automatically
- **Intelligent Assistance**: Get context-aware help and suggestions while coding

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenAI API
- **Authentication**: NextAuth.js
- **Queue Processing**: BullMQ with Redis
- **Containerization**: Docker

## Project Structure

This is a monorepo containing all GenDevAI services and packages:

- `apps/web`: Next.js web application for the main platform interface
- `apps/worker`: Background task processing worker
- `packages/ai-core`: Core AI services and utilities
- `packages/eslint-config`: Shared ESLint configuration
- `packages/tsconfig`: Shared TypeScript configuration
- `packages/database`: Prisma schema and database utilities

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker and Docker Compose (for local development)
- PostgreSQL (can use Docker)
- Redis (can use Docker)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/gendevai.git
cd gendevai
```

2. Run the setup script:

```bash
./setup.sh
```

This script will:
- Install dependencies
- Set up environment variables
- Start PostgreSQL and Redis containers
- Generate Prisma client
- Set up the database schema
- Seed the database with sample data

3. Start the development server:

```bash
pnpm dev
```

This will start both the Next.js web application and the worker service in development mode.

### Environment Variables

Copy the `.env.example` file to `.env` and update the variables:

```
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gendevai"

# Redis (for worker queue)
REDIS_HOST="localhost"
REDIS_PORT=6379

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# GitHub OAuth (optional)
GITHUB_ID=""
GITHUB_SECRET=""

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# OpenAI API Key
OPENAI_API_KEY="your-openai-api-key"
```

## Development

### Adding New Features

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:

```bash
git add .
git commit -m "feat: add your feature"
```

3. Push the branch and create a pull request:

```bash
git push origin feature/your-feature-name
```

### Running Tests

```bash
pnpm test
```

## Deployment

### Using Docker

Build and run the Docker containers:

```bash
# Build the web app image
docker build -f Dockerfile.web -t gendevai-web .

# Build the worker image
docker build -f Dockerfile.worker -t gendevai-worker .

# Run the containers
docker-compose up -d
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.