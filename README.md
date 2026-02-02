# Coreysmaller.com - Personal Website

A modern personal website built with React, TypeScript, Vite, and Tailwind CSS on the frontend, and NestJS with TypeORM and MySQL on the backend.

## Features

- **Blog System**: Create, edit, and manage blog posts with rich text editing
- **Music Portfolio**: Showcase original music with audio playback
- **Video Integration**: Embed and manage YouTube videos
- **Audio Integration**: Embed and manage SoundCloud audio content
- **Admin Panel**: Secure content management interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **SEO Optimized**: Built-in SEO metadata and structured data

## Technology Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lexical** - Rich text editor

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - Object-relational mapping
- **MySQL** - Database
- **JWT** - Authentication
- **Passport** - Authentication middleware

## Project Structure

```
├── frontend/          # React frontend application
├── backend/           # NestJS backend API
├── content/           # Legacy content files
└── static/            # Static assets
```

## Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/coreysmaller/coreysmaller.git
cd coreysmaller
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up the database:
```bash
cd backend
cp .env.example .env.development
# Edit .env.development with your database credentials
npm run migration:run
```

### Running the Application

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Frontend (http://localhost:5173)
npm run dev:frontend

# Backend (http://localhost:3000)
npm run dev:backend
```

### Building for Production

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm run test

# Run frontend tests
npm run test:frontend

# Run backend tests
npm run test:backend
```

## API Documentation

The backend API provides RESTful endpoints for:
- `/auth` - Authentication
- `/blog` - Blog posts
- `/music` - Music tracks
- `/video` - Video content
- `/audio` - Audio content

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
