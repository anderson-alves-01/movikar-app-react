# alugae.mobi - Car Rental Platform

## Overview
alugae.mobi is a full-stack car rental platform connecting car owners with renters. It enables users to list vehicles and book cars, featuring comprehensive user management, vehicle listings, a booking system, real-time messaging, and digital contract signing. The project aims to provide a robust, scalable, and user-friendly solution for the car rental market, driving market potential through efficiency and user satisfaction.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Testing & Quality Assurance
- **Functional Validation**: Comprehensive API and endpoint testing.
- **Integration Testing**: Complete user journey validation.
- **Test Runner**: Unified test execution with detailed reporting.
- **Coverage**: Authentication, vehicle management, booking system, admin functions, payment integration.

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
- **File Uploads**: Multer configuration for secure file upload processing.

### Database Design
- PostgreSQL with entities for Users, Vehicles, Bookings, Reviews, Messages, Admin Settings, User Documents, Payouts, and Referral/Suggestions.
- Utilizes the `unaccent` extension for robust search functionality.

### Core Features
- **Authentication**: JWT-based cookie authentication, role-based access, protected routes, using httpOnly cookies.
- **Vehicle Management**: Comprehensive listings with images, location-based search, dynamic pricing, availability calendar, waiting queue, automatic vehicle release, vehicle approval workflow with CRLV document upload and administrative review, vehicle validation for models, license plates, and RENAVAM.
- **Booking System**: Real-time availability, status workflow, payment tracking, booking history, automatic date blocking upon contract signing, intelligent date blocking, visual conflict warnings, dual inspection system for renters and owners.
- **Search & Filtering**: Location, category, price, features, transmission, date-based availability.
- **Messaging**: Real-time, booking-specific threads, read/unread status.
- **Digital Contracts**: DocuSign integration for digital signatures (real API and mock fallback), automatic contract creation, PDF generation, professional Brazilian contract template, multi-platform support (Autentique, D4Sign, ClickSign).
- **Payments**: Stripe integration ("Alugar Agora" workflow), secure checkout, payment intent creation, post-payment redirection to contract, security deposit management.
- **Subscription System**: Complete subscription management with tiered plans, secure Stripe checkout, and robust redirect protection.
- **Vehicle Highlight System**: Subscription-based vehicle highlighting with visual differentiation (Diamante/Prata badges), intelligent ordering, and usage tracking.
- **Admin Panel**: Comprehensive CRUD operations for users, vehicles, bookings, admin settings. Features include vehicle approval, document validation, performance dashboard, and configurable service/insurance fees with feature toggles.
- **User Experience**: Portuguese error messages, simplified document verification, personalized vehicle suggestions, friend referral system, comprehensive loading states.
- **Referral System**: Generates shareable links, detects URL parameters for automatic registration, auto-applies referral codes post-registration, and includes comprehensive security validation.
- **Points Usage System**: Allows points to be used for discounts during vehicle rental and subscription checkouts (1 point = R$ 0.01). Includes real-time discount preview, visual confirmation, transaction tracking, and cache invalidation.
- **Dynamic Subscription Values**: Tracks actual paid amounts, vehicle counts, payment intent IDs, and metadata for user subscriptions.
- **Checkout URL Optimization**: Implemented temporary server-side data storage to resolve HTTP 431 errors caused by long URLs, reducing URL length significantly.

## Recent Changes

### August 18, 2025 - Deployment Fixes
- **Fixed TypeScript deployment errors**: Corrected undefined import reference `cnhValidationRecords` to `cnhValidation` in storage.ts
- **Updated table references**: Changed `createCNHValidation` method to use the correct table name `cnhValidation`
- **Removed invalid import**: Removed non-existent `vehicleReviews` table import from storage.ts
- **Build verification**: Confirmed successful build and application startup after fixes

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