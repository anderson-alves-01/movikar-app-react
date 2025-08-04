# alugae.mobi - Car Rental Platform

## Overview

alugae.mobi is a full-stack car rental platform connecting car owners with renters. It enables users to list vehicles and book cars, featuring comprehensive user management, vehicle listings, a booking system, real-time messaging, and digital contract signing. The project aims to provide a robust, scalable, and user-friendly solution for the car rental market.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Aug 2025)

### Comprehensive Cypress Test Suite Implementation (Aug 4, 2025)
- **Complete Test Coverage**: Created comprehensive automated test suite with 10 test files covering all application functionalities
- **Authentication Tests**: Complete login/logout, registration, session management, and referral system testing
- **Vehicle Management**: Full vehicle listing, search, filtering, creation, and approval workflow testing
- **Booking System**: End-to-end booking flow, payment processing, points usage, and booking management testing
- **Rewards System**: Comprehensive testing of points earning, referral tracking, points usage, and transaction history
- **Subscription System**: Complete subscription flow testing including plan selection, payment, management, and feature enforcement
- **Admin Panel**: Full administrative functionality testing including user management, vehicle approval, settings, and dashboard
- **Messaging System**: Complete message center, threading, vehicle-specific messaging, and real-time features testing
- **Integration Tests**: Full user journey testing from registration to booking completion, including error handling and edge cases
- **Performance Tests**: Page load times, API response times, database query performance, and concurrent user simulation
- **Accessibility Tests**: Keyboard navigation, screen reader support, ARIA attributes, focus management, and mobile accessibility
- **Test Infrastructure**: Custom commands, database helpers, API helpers, fixtures, and comprehensive documentation
- **Configuration Files**: Complete Cypress configuration, environment variables, and CI/CD ready setup
- **Pre-Deployment Process**: Automated testing pipeline that aborts deployment if any tests fail, including health checks and rollback capabilities
- **CI/CD Integration**: GitHub Actions workflow for automated testing and deployment validation
- **Test Scripts**: Flexible test runner with multiple test suites (smoke, critical, full, performance, accessibility)
- **Health Monitoring**: Health check endpoints and monitoring system for deployment verification

### Cookie Authentication System Fixes (Aug 1, 2025)
- **Cookie Naming Standardization**: Fixed all inconsistent cookie naming from "refreshToken" to "refresh_token" across the entire system for consistency
- **Authentication System Unified**: Completely standardized authentication to use httpOnly cookies exclusively with consistent naming
- **Middleware Synchronization**: Updated all authentication middleware to use standardized "refresh_token" cookie names
- **Login/Registration Fix**: Both login and registration endpoints now use consistent cookie naming conventions
- **Admin Authentication**: Fixed admin authentication system with proper cookie handling and standardized naming

### Subscription System Fixes
- **Authentication Simplified**: Completely refactored authentication to use httpOnly cookies exclusively, removing complex Authorization header handling for improved reliability
- **Subscription Flow**: Fixed subscription-plans to subscription-checkout redirect issues with comprehensive state management
- **Checkout Protection**: Implemented robust checkout data validation with timestamp-based expiration and integrity checks
- **State Management**: Added proper cleanup of checkout state when navigating between pages to prevent unwanted redirects
- **Error Handling**: Enhanced error handling with proper user feedback and automatic retry mechanisms
- **Session Management**: Comprehensive logout functionality that clears server cookies, client storage, and query cache with forced page reload for clean state

### Referral Link System Implementation (Aug 3, 2025)
- **Enhanced Referral System**: Modified referral system to generate shareable links instead of just codes
- **Automatic Registration Flow**: URL parameter detection (`?ref=CODE`) automatically switches to registration mode
- **Visual Feedback**: Added referral banner showing the invitation code during registration
- **Link Generation**: API endpoint now returns both `referralCode` and `referralLink` for easy sharing
- **Auto-Application**: Referral codes are automatically applied after successful registration
- **Simplified Interface**: Rewards page shows only link field with copy button (code field removed)
- **Authentication Protection**: Page redirects to login if user not authenticated
- **Cookie-Only Authentication**: System uses exclusively httpOnly cookies for security
- **Security Validation**: Comprehensive validation system with multiple security layers:
  - Format validation (8-character alphanumeric)
  - Self-referral prevention with logging
  - Circular referral detection
  - Single-use enforcement
  - User ownership verification

### Points Usage System Implementation (Aug 3, 2025)
- **Integrated Checkout Discounts**: Points can now be used for discounts during vehicle rental checkout (1 point = R$ 0.01)
- **Subscription Discounts**: Points integration added to subscription checkout system with real-time discount calculation
- **User Interface**: Added intuitive points usage interface with:
  - Available points display
  - Real-time discount preview
  - Visual confirmation of applied discounts
  - Updated price totals showing original and discounted amounts
- **Backend Integration**: Enhanced `/api/rewards/use-points` endpoint integration with both checkout flows
- **Transaction Tracking**: All point usage creates proper transaction records for audit trail
- **Query Cache Management**: Automatic cache invalidation after point usage to ensure real-time balance updates
- **Error Handling**: Comprehensive validation for insufficient points and proper user feedback

### Dynamic Subscription Values System (Aug 1, 2025)
- **Database Schema Enhancement**: Added new fields to user_subscriptions table for tracking real payment values:
  - `paid_amount`: Stores the actual amount paid by the user (e.g., R$ 89.87 for 5 vehicles)
  - `vehicle_count`: Number of vehicles included in the subscription
  - `payment_intent_id`: Stripe payment intent ID for tracking
  - `payment_metadata`: JSON metadata with calculation details
- **Payment Value Tracking**: Modified subscription confirmation to extract and save real payment amounts from Stripe payment intents
- **API Enhancement**: Created `/api/user/subscription/details` endpoint to display complete subscription information with actual paid values
- **Legacy Support**: System differentiates between legacy subscriptions (pre-enhancement) and new subscriptions with full payment tracking
- **Dynamic Pricing Preservation**: System now correctly saves dynamic pricing calculations instead of just base plan prices

### Vehicle Checkout System Fix (Aug 1, 2025)
- **URL Length Issue Resolution**: Fixed HTTP 431 "Request Header Fields Too Large" error caused by base64 images in checkout URLs
- **Server-Side Data Storage**: Implemented temporary checkout data storage system with 30-minute expiration
- **New API Endpoints**: Added `/api/store-checkout-data` and `/api/checkout-data/:checkoutId` for secure data handling
- **URL Optimization**: Reduced checkout URLs from 8000+ characters to ~60 characters using checkoutId system
- **Backward Compatibility**: Maintained support for legacy URL-based data while transitioning to new system
- **Security Enhancement**: Added user ownership verification and automatic cleanup of expired checkout data
- **User Experience**: Eliminated checkout failures caused by overly long URLs containing vehicle images

## System Architecture

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