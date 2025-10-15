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

### Current Status (October 15, 2025)
- **Backend**: ✅ Fully operational with clean LSP diagnostics
- **100% Discount Coupons**: ✅ Automatic subscription activation working
- **Vehicle Inspection System**: ✅ Fixed schema alignment and query issues
- **Stripe Integration**: ✅ Configured and functional
- **Auto Pricing System**: ✅ Automated price optimization with midnight cron jobs
- **Mobile App Complete**: ✅ **MAJOR MILESTONE** - Full React Native implementation with real functionality (v1.0.10)
- **Mobile Services**: ✅ All 8 core services implemented with actual React Native packages
- **Mobile Authentication**: ✅ Real biometric authentication using Expo Local Authentication
- **Mobile Chat**: ✅ Real-time messaging with Socket.IO integration
- **Mobile Payments**: ✅ Stripe React Native integration for mobile payments
- **Mobile Location**: ✅ GPS tracking and location services using Expo Location
- **Mobile Notifications**: ✅ Push notifications with Expo Notifications - **Android initialization crash FIXED (v2 - namespace correto)**
- **Mobile Rating**: ✅ Complete rating and review system
- **Mobile App Initialization**: ✅ **FIXED (v3)** - Android crashes resolved: (1) "No icon provided for notification" fixed with expo.modules.notifications.* namespace, (2) "AppRegistryBinding::startSurface failed" fixed by correcting JSC/Hermes engine conflict, (3) Complete cache cleanup automation with fix-cache.sh
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
- **File Uploads**: Multer configuration for secure file upload processing
- **Email Service**: Resend API integration for automated email notifications with professional HTML templates

### Database Design
- PostgreSQL with entities for Users, Vehicles, Bookings, Reviews, Messages, Admin Settings, User Documents, Payouts, and Referral/Suggestions.
- Utilizes the `unaccent` extension for robust search functionality.

### Core Features
- **Authentication**: JWT-based cookie authentication, role-based access, protected routes, using httpOnly cookies.
- **Vehicle Management**: Comprehensive listings with images, location-based search, dynamic pricing, availability calendar, waiting queue, automatic vehicle release, vehicle approval workflow with CRLV document upload and administrative review, vehicle validation for models, license plates, and RENAVAM. **Automated price optimization** with competitive market analysis, scheduled batch updates at midnight (00:00), and manual admin trigger endpoint.
- **Auto Pricing System**: Market-based competitive pricing with automatic daily updates for vehicles with autoPricingEnabled flag, location-aware price adjustments, category mapping to market standards, configurable competition percentage (-50% to +50%), parallel processing for performance optimization, admin endpoint for manual batch execution (POST /api/admin/auto-pricing/run-batch).
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
- **Email Notification System**: Comprehensive automated email notifications using Resend API with professional HTML templates. Vehicle owners receive instant email notifications for ALL renter interactions: contact information unlock, chat initiation, waiting queue joins, and booking requests. All notifications include relevant details (vehicle info, renter info, dates, prices) and are sent asynchronously to prevent blocking API responses.
- **Mobile App (React Native)**: **COMPLETE IMPLEMENTATION** - Full React Native application with Expo SDK 53, 6 main screens (Home, Search, Bookings, Profile, VehicleDetail, Login), React Navigation 6, full TypeScript support, real API integration, JWT token management with secure storage and automatic token refresh, custom API service architecture, custom storage abstraction, EAS Build setup.
- **Mobile Observability**: ✅ **Google Cloud Logging** - Complete logging system with error boundaries, automatic API logging, centralized Google Cloud Logging via backend proxy. 50GB/month free tier with local JSONL fallback.
- **Mobile App Troubleshooting**: ✅ Comprehensive documentation created (TROUBLESHOOTING.md, INICIO-RAPIDO.md, SOLUCAO-FINAL-SIMPLIFICADA.md, SOLUCAO-DEFINITIVA.md, ERRO-APPREGISTRY.md, ERRO-BUILD-GRADLE.md) with complete solutions for Android initialization issues including notification icon errors, AppRegistryBinding failures, and Gradle build errors. Includes automated scripts: fix-cache.sh (Linux/Mac) and fix-build-windows.bat (Windows).

### Mobile Services Architecture (Real Implementations)
- **Authentication Service**: Real biometric authentication with Expo Local Authentication, secure token storage with AsyncStorage, automatic token refresh, fingerprint/face recognition support
- **API Service**: Centralized HTTP client with JWT token management, automatic retries, error handling, real backend integration with alugae.mobi API
- **Biometric Service**: Hardware biometric authentication using Expo Local Authentication, support for fingerprint/face recognition, enrollment detection, fallback mechanisms
- **Chat Service**: Real-time messaging with Socket.IO, WebSocket connections, message persistence, room management, typing indicators, read receipts
- **Payment Service**: Stripe React Native integration, real payment processing, payment method management, subscription handling, PIX payment support
- **Location Service**: GPS tracking with Expo Location, real-time positioning, geocoding/reverse geocoding, distance calculations, nearby vehicle search
- **Notification Service**: Push notifications with Expo Notifications, local notifications, scheduling, badge management, notification channels, deep linking
- **Rating Service**: Complete rating and review system, CRUD operations, statistics calculation, validation, reporting functionality

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
- **Email Service**: Resend
- **Rate Limiting**: express-rate-limit