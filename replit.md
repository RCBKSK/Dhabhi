# NSE Stock Monitor - SMC Dashboard

## Overview

A comprehensive stock market monitoring dashboard built with React, Express, and PostgreSQL that provides real-time Indian stock tracking with Smart Money Concept (SMC) analysis. The application features BOS/CHOCH detection, technical analysis, and advanced filtering capabilities for stock market professionals. Now integrated with Fyers API infrastructure for authentic Indian stock market data.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend concerns:

- **Frontend**: React SPA with TypeScript, built with Vite
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Structure**: Modular component design with UI components separated from business logic
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query handles all server state, local state managed with React hooks
- **TypeScript**: Full type safety across the application with shared types between frontend and backend
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **API Design**: RESTful API with Express.js following standard HTTP conventions
- **Database Layer**: Drizzle ORM provides type-safe database operations with PostgreSQL
- **Middleware**: Express middleware for JSON parsing, URL encoding, and request logging
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development Tools**: Hot reloading with tsx and comprehensive TypeScript support

### Database Schema
- **Stock Table**: Stores stock information including symbol, price, technical indicators (BOS levels, targets, risk levels), trend analysis, and user preferences
- **Columns**: id, symbol, price, change, changePercent, bosLevel, distance, target, risk, trend, signalType, timeframes, isFavorite
- **Relationships**: Currently single-table design with potential for future expansion

## Data Flow

1. **Client Requests**: Frontend components trigger API calls through TanStack Query
2. **API Processing**: Express routes handle requests and delegate to storage layer
3. **Database Operations**: Drizzle ORM executes type-safe SQL queries against PostgreSQL
4. **Response Processing**: Data flows back through the same chain with proper error handling
5. **UI Updates**: TanStack Query manages cache invalidation and UI updates automatically

The application supports real-time updates through automatic refresh intervals and manual refresh capabilities.

## External Dependencies

### Core Framework Dependencies
- **React 18**: Modern React with hooks and concurrent features
- **Express.js**: Fast, minimalist web framework for Node.js
- **PostgreSQL**: Robust relational database for stock data storage
- **Drizzle ORM**: Lightweight, type-safe ORM for database operations

### UI and Styling
- **shadcn/ui**: High-quality, accessible React components
- **Radix UI**: Primitive components for complex UI patterns
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Consistent icon library

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js development
- **Drizzle Kit**: Database migration and schema management

### External Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Fyers API**: Indian stock market data integration (credentials required for live data)
- **Replit Integration**: Development environment optimizations

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server for frontend, tsx for backend hot reloading
- **Database**: Neon serverless PostgreSQL for consistent development experience
- **Environment Variables**: DATABASE_URL for database connection configuration

### Production Build Process
1. **Frontend Build**: Vite builds optimized React application to `dist/public`
2. **Backend Build**: esbuild bundles Express server with external packages
3. **Static Serving**: Express serves built frontend assets in production
4. **Database Migrations**: Drizzle Kit manages schema changes and deployments

### Configuration Management
- **Environment-based**: Different configurations for development and production
- **Database Configuration**: Centralized in `drizzle.config.ts`
- **Build Scripts**: npm scripts handle development, building, and production startup

## Changelog

```
Changelog:
- June 29, 2025. Initial setup with mock data
- June 29, 2025. Added authentication system (kunjan/K9016078282D, kantidabhi/kantidabhi)
- June 29, 2025. Implemented real NSE stock data integration with SMC analysis
- June 29, 2025. Added Fair Value Gap detection and liquidity zone analysis
- June 29, 2025. Enhanced filtering: only shows stocks with BOS/CHOCH in 2+ timeframes
- June 29, 2025. Implemented auto-removal when price moves 5-6 points from BOS level
- June 29, 2025. Added enhanced SMC features: trend analysis matrix, proximity zones, swing targets, scan clock
- June 29, 2025. Phase 2: Implementing live notifications, deep trend panel, stock screener, and watchlists
- July 3, 2025. Migration from Replit Agent to Replit environment completed
- July 3, 2025. Integrated Fyers API infrastructure for Indian stock market data (50 major NSE stocks)
- July 3, 2025. Replaced US stock symbols with Indian stocks (RELIANCE, TCS, HDFC, etc.)
- July 8, 2025. Fixed distance calculation accuracy from 2-4% to 0.2-0.5% percentage-based
- July 8, 2025. Phase 3: Implementing backtest engine, watchlist scanner, chart capture, PWA, custom scan engine, export features, and sector heatmap
- July 8, 2025. Completed migration from Replit Agent to Replit environment with enhanced security and performance
- July 8, 2025. Fixed BOS/CHOCH line price accuracy - improved calculation logic for more precise support/resistance levels
- July 9, 2025. Built comprehensive Market Structure Analyzer module with swing point detection, BOS/CHOCH analysis, and Fair Value Gap identification
- July 9, 2025. Added API endpoints for real-time market structure analysis with configurable parameters (lookback window, FVG size threshold)
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```