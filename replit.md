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

### Current Status (August 21, 2025)
- **Backend**: ✅ Fully operational with clean LSP diagnostics
- **100% Discount Coupons**: ✅ Automatic subscription activation working
- **Vehicle Inspection System**: ✅ Fixed schema alignment and query issues
- **Stripe Integration**: ✅ Configured and functional
- **Mobile App Enhanced**: ✅ Advanced services implemented (biometric, chat, payment, image handling)
- **Mobile Dependencies**: ⚠️ Installation blocked by React version conflicts (using placeholder implementations)
- **Business Logic**: ✅ Free plan allows 1 vehicle listing, enforced correctly
- **Database**: ✅ PostgreSQL with clean schema and relations

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: Zustand (authentication), TanStack Query (server state)
- **UI**: Tailwind CSS with shadcn/ui components, custom loading components and skeletons
- **Build Tool**: Vite
- **UI/UX Decisions**: Custom components (AnimatedButton, AnimatedCard, AnimatedNav, AnimatedInput, FloatingActionButton, PulsingDot), InteractiveTooltip system for onboarding, brand-consistent animated loading skeletons (shimmer, wave, pulse effects with alugae.mobi color scheme), smooth page transitions.

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
- **Search & Filtering**: Location, category, price, features, transmission, date-based availability, advanced search modal with history and filters, infinite scroll pagination.
- **Messaging**: Real-time, booking-specific threads, read/unread status.
- **Digital Contracts**: DocuSign integration for digital signatures (real API and mock fallback), automatic contract creation, PDF generation, professional Brazilian contract template, multi-platform support (Autentique, D4Sign, ClickSign).
- **Payments**: Stripe integration ("Alugar Agora" workflow), secure checkout, payment intent creation, post-payment redirection to contract, security deposit management.
- **Subscription System**: Complete subscription management with tiered plans, secure Stripe checkout, robust redirect protection, dynamic values tracking actual paid amounts, vehicle counts, payment intent IDs, and metadata.
- **Vehicle Highlight System**: Subscription-based vehicle highlighting with visual differentiation (Diamante/Prata badges), intelligent ordering, and usage tracking.
- **Admin Panel**: Comprehensive CRUD operations for users, vehicles, bookings, admin settings. Features include vehicle approval, document validation, performance dashboard, and configurable service/insurance fees with feature toggles.
- **User Experience**: Portuguese error messages, simplified document verification, personalized vehicle suggestions, friend referral system, comprehensive loading states, enhanced modal scrolling.
- **Referral System**: Generates shareable links, detects URL parameters for automatic registration, auto-applies referral codes post-registration, and includes comprehensive security validation.
- **Points Usage System**: Allows points to be used for discounts during vehicle rental and subscription checkouts (1 point = R$ 0.01). Includes real-time discount preview, visual confirmation, transaction tracking, and cache invalidation.
- **Checkout URL Optimization**: Implemented temporary server-side data storage to resolve HTTP 431 errors caused by long URLs, reducing URL length significantly.
- **Coupon System**: Integration into subscription plans page with real-time validation and discount application. **100% discount coupons automatically activate subscriptions without payment processing** - fully implemented and working.
- **Mobile App (React Native)**: Full React Native application with Expo SDK 50, 6 main screens (Home, Search, Bookings, Profile, VehicleDetail, Login), React Navigation 6, full TypeScript support, real API integration, JWT token management with secure storage and automatic token refresh, custom API service architecture, custom storage abstraction, EAS Build setup. *Note: Dependencies installation blocked by React version conflicts between web and mobile packages.*

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