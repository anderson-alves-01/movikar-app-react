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

### August 18, 2025 - Authentication & UI Fixes
- **Email validation fix**: Removed automatic dot removal from email addresses - emails now preserve all characters including periods
- **Phone number system overhaul**: Replaced automatic formatting with separate DDI field (+55 Brazil default) and clean phone number input
- **Database schema update**: Extended phone field length to accommodate international numbers with country codes
- **Form validation improvements**: Simplified phone validation to require minimum 10 digits without complex formatting rules
- **User experience enhancement**: DDI field auto-formats with + prefix, phone field accepts only numbers for cleaner data storage

### August 18, 2025 - Micro-Interactions & Dynamic Onboarding Implementation
- **Comprehensive micro-interactions system**: Implemented AnimatedButton, AnimatedCard, AnimatedNav, and AnimatedInput components with hover effects, scaling, and ripple animations
- **Dynamic onboarding tutorial**: Created InteractiveTooltip system with automatic step progression, spotlight highlighting, and viewport boundary detection
- **OnboardingFlow component**: Developed guided tutorial for new users covering search, login, features, and navigation
- **Tooltip positioning fixes**: Resolved issue where onboarding tooltips appeared outside screen layout by implementing viewport boundary detection and responsive positioning
- **CSS animation library**: Added custom keyframes for slideIn, fadeIn, scaleIn, shimmer, and pulse effects
- **Page transitions**: Implemented smooth navigation transitions between pages
- **User experience enhancements**: Loading states, focus animations, and interactive feedback throughout the platform

### August 19, 2025 - Enhanced Search Modal & On-Demand Loading Implementation
- **Complete search modal redesign**: Implemented modern search interface based on user-provided design reference with tabs for "Recentes" and "Buscas Salvas"
- **Real search history**: Removed fake data, implemented functional search history that saves actual user searches to localStorage with applied filters
- **Advanced filters integration**: Connected search modal filters with existing backend filter system including category, price, fuel type, transmission
- **Date picker functionality**: Added retirada (pickup) and devolução (return) date fields to advanced filters
- **Search button implementation**: Added search buttons in text field (magnifying glass icon) and main "Buscar" button for advanced filters
- **Platform color scheme**: Updated security banner to use official red gradient (from-red-500 to-red-600) matching platform branding
- **Responsive design**: Mobile-optimized modal with proper scrolling, viewport detection, and touch-friendly interface
- **Real-time filtering**: Filters apply automatically as users select options, with proper state management through SearchContext
- **On-demand loading performance**: Implemented infinite scroll pagination with 12 vehicles per page, automatic loading 200px from bottom, visual indicators
- **Search history with filters**: History now captures and restores both text searches and applied advanced filters (dates, category, price, etc.)
- **Performance optimization**: Added loading states, skeleton placeholders, and smart pagination to improve user experience with large result sets

### August 19, 2025 - Brand-Consistent Animated Loading Skeletons & Micro-Interactions
- **Advanced skeleton animations**: Implemented brand-consistent shimmer, wave, and pulse effects with alugae.mobi color scheme
- **Staggered loading animations**: Vehicle cards load with progressive delays creating smooth visual flow
- **Micro-interactions library**: Created AnimatedButton, AnimatedCard, FloatingActionButton, and PulsingDot components
- **Brand-specific effects**: Custom gradient shifts using primary/red colors, hover acceleration, and ripple effects
- **Enhanced skeleton components**: SearchModalSkeleton, HeaderSkeleton, FormSkeleton, StatCardSkeleton with realistic placeholders
- **Performance-focused animations**: CSS-based animations for better performance, hover state optimizations
- **Interactive feedback**: Loading dots, progress bars, toast notifications with brand-consistent styling

### August 19, 2025 - Critical API & TypeScript Fixes
- **Fixed 500 errors in booking API**: Resolved TypeScript compilation errors related to ownerInspection property access
- **Updated BookingWithDetails type**: Added optional ownerInspection and inspection properties to prevent type mismatches
- **Enhanced error handling**: Added type guards and conditional checks for optional inspection data
- **Authentication flow working**: Users need to log in first before accessing booking endpoints (403/401 errors are expected when not authenticated)
- **Server stability**: All TypeScript errors resolved, application running without compilation issues
- **Type safety improvements**: Added proper type annotations and fallbacks for dynamic properties

### August 20, 2025 - Complete Review System Rebuild & Production Fix
- **Complete system rebuild**: Removed all existing review code causing persistent production errors and rebuilt from scratch
- **New database schema**: Created clean reviews table with proper relations to bookings, users, and vehicles
- **Modern React interface**: Built star rating system with modal dialogs for review submission
- **Comprehensive API endpoints**: Created /api/reviews/completed-bookings, POST /api/reviews, and review retrieval endpoints
- **Multiple review types**: Support for renter-to-owner, owner-to-renter, and renter-to-vehicle reviews
- **Smart filtering**: Automatically filters out already-reviewed bookings and shows only pending reviews
- **Production fix**: Updated booking status validation to allow reviews for both 'completed' AND 'approved' bookings
- **Expanded booking eligibility**: Modified getCompletedBookingsForReviews to include approved bookings alongside completed ones
- **Development tested**: System working correctly with authentication, data validation, and error handling
- **Review modal**: Interactive modal with star ratings, comment fields, and review type selection for renters

### August 18, 2025 - Registration Flow & Modal Improvements  
- **Fixed "Star is not defined" production error**: Added missing Star import to header.tsx component that was causing crashes after user registration
- **Enhanced modal scrolling**: Added proper scroll bars to Terms of Use and Privacy Policy modals with max-height constraints
- **Fixed TypeScript errors**: Corrected checkbox type handling in privacy policy modal
- **Registration flow validation**: Comprehensive testing of user registration, authentication, and redirect flows
- **Build verification**: Confirmed successful production build without any Star reference errors

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