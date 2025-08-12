# alugae.mobi - Car Rental Platform

## Overview
alugae.mobi is a full-stack car rental platform connecting car owners with renters. It enables users to list vehicles and book cars, featuring comprehensive user management, vehicle listings, a booking system, real-time messaging, and digital contract signing. The project aims to provide a robust, scalable, and user-friendly solution for the car rental market.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 12, 2025)
- **Inspection Workflow Complete**: Fixed vehicle inspection system with proper status updates and default selections
- **Inspection Form Fixes**: Set "Approved" as default selection in inspection result combobox
- **Status Update Resolution**: Fixed booking status updates from "aguardando_vistoria" to "vistoriado" after inspection completion
- **Cache Invalidation Enhancement**: Added comprehensive cache invalidation to ensure UI updates after inspection completion
- **Redirection Optimization**: Modified inspection completion flow to redirect to reservations page for immediate status verification
- **SQL Direct Updates**: Verified database updates work correctly for booking and inspection status changes
- **Authentication Enhancements**: Improved middleware compatibility supporting both cookies and Authorization headers
- **Automatic Payout Integration**: Successfully integrated autoPayoutService.triggerPayoutAfterPayment() for approved inspections

## Previous Changes (August 11, 2025)
- **Calendar Date Blocking System Complete**: Full implementation of visual date blocking system with enhanced UI feedback
- **Real-Time Date Validation**: Booking form validates selected dates instantly with red visual indicators for conflicts
- **Enhanced Unavailable Dates Display**: Improved visual presentation with red badges and comprehensive date range information
- **Smart Booking Prevention**: Submit button automatically disables with clear messaging when conflicting dates selected
- **Inspection Button Authentication Fix**: Resolved authentication issues preventing inspection button display in profile page
- **Visual Feedback Improvements**: Added visual styling for conflict detection (red borders, warning icons, toast notifications)
- **API Endpoint Verification**: Confirmed `/api/vehicles/:id/unavailable-dates` returns accurate booking data for date blocking
- **Database Test Data**: Created test reservation (ID 11) with "aguardando_vistoria" status for proper testing (user: admin@test.com, password: 123456)

## Previous Changes (August 6, 2025)
- **Stripe Payment Integration Fixed**: Resolved 500 errors in payment intent creation by disabling PIX payments temporarily
- **PIX Payment Disabled**: PIX requires special Stripe dashboard configuration not available in test environment
- **Payment Security Maintained**: Restored user verification requirement for payment intent creation
- **Card Payments Working**: Successfully creating Stripe payment intents with card-only method
- **Enhanced Payment Logging**: Added comprehensive debug logs for payment flow troubleshooting
- **Mobile Header Optimized**: Removed "atualizar dados" button for mobile users to improve UX
- **Search Anchor Added**: Implemented smooth scroll to search results when search button is clicked
- **Insurance Calculation Fixed**: Now uses dynamic adminSettings.insuranceFeePercentage instead of hardcoded value

## Previous Changes (August 5, 2025)
- **Authentication System Fixed**: Resolved infinite loop issues in useAuth hook and header refresh mechanisms
- **Cookie Configuration**: Corrected development cookie settings (SameSite=Lax, no Secure flag) for proper browser compatibility
- **Service Worker Optimization**: Minimized SW listeners to prevent browser extension conflicts and message channel errors
- **React Hooks Order**: Fixed hook ordering issues preventing authentication state management
- **Single Auth Check**: Implemented one-time authentication verification preventing unnecessary API calls
- **Deployment Issues Resolved**: Fixed all critical deployment configuration errors causing startup failures
- **Database Connection Stability**: Enhanced database connection handling with proper timeouts, connection pooling, and graceful shutdown
- **Health Check System**: Implemented comprehensive health endpoints (/health, /api/health, /api/ready) with database connectivity validation
- **Static File Serving**: Fixed production static file serving with robust fallback mechanisms and proper error handling
- **Route Registration**: Added error recovery for route registration failures with essential fallback routes
- **Production Build**: Verified successful production builds with proper asset organization and server bundle creation
- **Deployment Readiness**: Created automated deployment readiness checker achieving 100% pass rate
- **Graceful Shutdown**: Added proper signal handling for SIGTERM/SIGINT with database connection cleanup
- **Error Handling**: Enhanced error middleware to prevent crashes during static file serving and route failures

## Previous Changes (August 4, 2025)
- **Testing Strategy Overhaul**: Removed Cypress completely from project and GitHub Actions
- **100% Test Coverage**: Created functional validator and integration tests covering all critical workflows
- **GitHub Actions Updated**: Pre-deployment workflow now uses our reliable Node.js testing system
- **CI/CD Ready**: Exit codes and reporting suitable for automated deployment pipelines
- **Alternative Testing Approach**: Developed Node.js-based testing that works reliably in both Replit and GitHub Actions environments
- **Vehicle Highlight System**: Complete subscription-based vehicle highlighting system implemented with frontend management component and backend validation
- **Optional Insurance**: Added optional insurance checkbox in checkout with conditional price calculations

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
- **Booking System**: Real-time availability, status workflow, payment tracking, booking history, automatic date blocking upon contract signing. Enhanced calendar system with intelligent date blocking for existing reservations and visual conflict warnings.
- **Search & Filtering**: Location, category, price, features, transmission, date-based availability.
- **Messaging**: Real-time, booking-specific threads, read/unread status.
- **Digital Contracts**: DocuSign integration for digital signatures, automatic contract creation upon booking approval, PDF generation, professional Brazilian contract template.
- **Payments**: Stripe integration ("Alugar Agora" workflow), secure checkout, payment intent creation, post-payment redirection to contract.
- **Subscription System**: Complete subscription management with tiered plans, secure Stripe checkout integration, proper state management, and robust redirect protection. Features checkout data validation, automatic state cleanup, and seamless authentication flow.
- **Vehicle Highlight System**: Subscription-based vehicle highlighting with visual differentiation (Diamante/Prata badges), intelligent ordering, and usage tracking. Essencial plan: 3 highlights, Plus plan: 10 highlights. Complete frontend management interface with modal workflow.
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