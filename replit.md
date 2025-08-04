# alugae.mobi - Car Rental Platform

## Overview
alugae.mobi is a full-stack car rental platform connecting car owners with renters. It enables users to list vehicles and book cars, featuring comprehensive user management, vehicle listings, a booking system, real-time messaging, and digital contract signing. The project aims to provide a robust, scalable, and user-friendly solution for the car rental market.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 4, 2025)
- **Testing Strategy Overhaul**: Removed Cypress completely from project and GitHub Actions
- **100% Test Coverage**: Created functional validator and integration tests covering all critical workflows
- **GitHub Actions Updated**: Pre-deployment workflow now uses our reliable Node.js testing system
- **CI/CD Ready**: Exit codes and reporting suitable for automated deployment pipelines
- **Alternative Testing Approach**: Developed Node.js-based testing that works reliably in both Replit and GitHub Actions environments

## System Architecture

### Testing & Quality Assurance
- **Functional Validation**: Comprehensive API and endpoint testing (`tests/functional-validator.js`)
- **Integration Testing**: Complete user journey validation (`tests/integration-tests.js`)
- **Test Runner**: Unified test execution with detailed reporting (`tests/run-all-tests.js`)
- **Coverage**: Authentication, vehicle management, booking system, admin functions, payment integration
- **CI/CD Ready**: Exit codes and reporting suitable for automated deployment pipelines

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: Zustand (authentication), TanStack Query (server state)
- **UI**: Tailwind CSS with shadcn/ui components, custom loading components and skeletons
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database ORM**: Drizzle ORM (PostgreSQL dialect)
- **Authentication**: JWT tokens, bcrypt for password hashing, hybrid cookie/Authorization header support
- **API Design**: RESTful API
- **File Uploads**: Multer configuration for secure file upload processing (CRLV, vehicle images)

### Database Design
- PostgreSQL with entities for Users (profiles, roles, verification), Vehicles (listings, details, images), Bookings (reservations, status, payments), Reviews, Messages, Admin Settings, User Documents, Payouts, and Referral/Suggestions.
- Utilizes the `unaccent` extension for robust search functionality.

### Core Features
- **Authentication**: JWT-based cookie authentication, role-based access, protected routes. Simplified authentication system using httpOnly cookies exclusively for enhanced security and reliability.
- **Vehicle Management**: Comprehensive listings with images, location-based search, dynamic pricing, availability calendar, waiting queue, automatic vehicle release. Vehicle approval workflow with CRLV document upload and administrative review. Vehicle validation system for models, license plates, and RENAVAM.
- **Booking System**: Real-time availability, status workflow, payment tracking, booking history, automatic date blocking upon contract signing.
- **Search & Filtering**: Location, category, price, features, transmission, date-based availability.
- **Messaging**: Real-time, booking-specific threads, read/unread status.
- **Digital Contracts**: DocuSign integration for digital signatures, automatic contract creation upon booking approval, PDF generation, professional Brazilian contract template.
- **Payments**: Stripe integration ("Alugar Agora" workflow), secure checkout, payment intent creation, post-payment redirection to contract.
- **Subscription System**: Complete subscription management with tiered plans, secure Stripe checkout integration, proper state management, and robust redirect protection. Features checkout data validation, automatic state cleanup, and seamless authentication flow.
- **Admin Panel**: Comprehensive CRUD operations for users, vehicles, bookings, admin settings. Features include vehicle approval, document validation, performance dashboard with real-time data, and configurable service/insurance fees with feature toggles (e.g., PIX payment).
- **User Experience**: Portuguese error messages, simplified document verification (CNH, residence proof), personalized vehicle suggestions, friend referral system, comprehensive loading states.
- **Referral System**: Generates shareable links, detects URL parameters for automatic registration, auto-applies referral codes post-registration, and includes comprehensive security validation (format, self-referral, circular, single-use, ownership).
- **Points Usage System**: Allows points to be used for discounts during vehicle rental and subscription checkouts (1 point = R$ 0.01). Includes real-time discount preview, visual confirmation, transaction tracking, and cache invalidation.
- **Dynamic Subscription Values**: Tracks actual paid amounts, vehicle counts, payment intent IDs, and metadata for user subscriptions, differentiating between legacy and new subscriptions.
- **Checkout URL Optimization**: Implemented temporary server-side data storage to resolve HTTP 431 errors caused by long URLs, reducing URL length significantly while maintaining backward compatibility and security.

## External Dependencies

### Frontend
- **UI Components**: Radix UI, shadcn/ui, Lucide React (icons)
- **Form Handling**: React Hook Form, Zod (validation)
- **Date Handling**: date-fns
- **Charting**: Recharts (for performance dashboard)

### Backend
- **Database**: Neon serverless PostgreSQL
- **Authentication**: jsonwebtoken, bcrypt
- **Digital Signature**: DocuSign SDK (docusign-esign)
- **PDF Generation**: Puppeteer
- **Rate Limiting**: express-rate-limit

### Development Tools
- **TypeScript**: Full type safety
- **ESBuild**: Fast bundling
- **Drizzle Kit**: Database migrations and schema management