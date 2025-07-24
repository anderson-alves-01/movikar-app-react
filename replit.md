# CarShare - Car Rental Platform

## Overview

CarShare is a full-stack car rental platform that connects car owners with renters. The platform allows users to list their vehicles for rent and book cars from other users. Built with a modern React frontend and Express.js backend, it features comprehensive user management, vehicle listings, booking system, and real-time messaging.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: Zustand for authentication state
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: JWT tokens with bcrypt for password hashing
- **API Design**: RESTful API with Express routes

### Database Design
The application uses PostgreSQL with the following main entities:
- **Users**: Stores user profiles, roles (owner/renter), and verification status
- **Vehicles**: Car listings with details, location, pricing, and images
- **Bookings**: Rental reservations with status tracking and payment info
- **Reviews**: Rating system for both users and vehicles
- **Messages**: In-app messaging system for user communication

## Key Components

### Authentication System
- JWT-based authentication with persistent storage
- Role-based access (renter, owner, or both)
- Password hashing with bcrypt
- Protected routes using middleware

### Vehicle Management
- Vehicle listing with comprehensive details (brand, model, year, features)
- Image gallery support for vehicle photos
- Location-based search with coordinates
- Pricing tiers (daily, weekly, monthly)
- Availability calendar system with manual and automatic blocking
- Waiting queue system for unavailable vehicles
- Automatic vehicle release after rental completion
- Notification system for queue management

### Booking System
- Real-time availability checking
- Status workflow (pending → approved/rejected → active → completed)
- Payment status tracking
- Booking history for both renters and owners
- Automatic date blocking when bookings are completed and contracts signed

### Search and Filtering
- Location-based vehicle search
- Multiple filter options (category, price range, features, transmission type)
- Date-based availability filtering
- Rating-based sorting

### Messaging System
- Real-time messaging between users
- Booking-specific conversation threads
- Message status tracking (read/unread)

## Data Flow

1. **User Registration/Login**: Frontend authentication → JWT token storage → Protected API access
2. **Vehicle Listing**: Owner creates listing → Backend validation → Database storage → Search index update
3. **Vehicle Search**: User filters → API query with parameters → Database search → Results display
4. **Booking Process**: Renter selects dates → Availability check → Booking creation → Owner notification
5. **Messaging**: User sends message → Real-time delivery → Database storage → Recipient notification

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation
- **Icons**: Lucide React icon library

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Authentication**: jsonwebtoken for JWT handling
- **Password Security**: bcrypt for hashing
- **File Upload**: Support for image handling (implementation pending)

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for running TypeScript backend in development
- Database migrations handled via Drizzle Kit

### Production Build
- Frontend: Vite build to static assets
- Backend: ESBuild compilation to single JavaScript file
- Database: PostgreSQL with connection pooling via Neon

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- JWT secret configuration for token signing
- Replit-specific optimizations for development

### File Structure
- **Client**: React frontend in `client/` directory
- **Server**: Express backend in `server/` directory  
- **Shared**: Common types and schemas in `shared/` directory
- **Database**: Migrations in `migrations/` directory

## Recent Changes (January 2025)

### Vehicle Model Validation System
- **Implementation Date**: January 24, 2025
- **Functionality**: Comprehensive validation system for vehicle model field to prevent invalid data entry
- **Key Features**:
  - Multi-layer validation with Zod schema
  - Brand-model cross-validation with extensive database
  - Rejection of test data, spam, and invalid entries
  - Automatic data normalization (trim spaces, format consistency)
  - Detailed validation error messages
  - Audit logging for security and debugging
- **Technical Details**:
  - Created `shared/vehicle-validation.ts` with comprehensive validation rules
  - Enhanced `insertVehicleSchema` with robust model validation
  - Added proper error handling in vehicle creation/update endpoints
  - Implemented validation for both create and update operations
- **Validation Rules**:
  - Length: 2-50 characters
  - Characters: Only letters, numbers, spaces, hyphens, dots
  - Prohibited: Test words, spam patterns, number-only models
  - Cross-validation: Model must be valid for selected brand
  - Auto-formatting: Normalizes spaces and formatting

### Automatic Date Blocking System
- **Implementation Date**: January 24, 2025
- **Functionality**: System automatically blocks vehicle dates when:
  - Booking status is marked as "completed" AND
  - Contract is digitally signed by both parties
- **Technical Details**:
  - Added `blockVehicleDatesForBooking()` method to storage layer
  - Added `checkAndBlockCompletedBooking()` helper function
  - Integrated blocking logic into booking and contract update endpoints
  - Prevents duplicate blocking for same dates/booking
- **Integration**: Works seamlessly with existing availability management system

### Waiting Queue System
- **Implementation Date**: January 24, 2025  
- **Functionality**: Users can join waiting queues for unavailable vehicles
- **Features**:
  - Queue management for specific date ranges
  - User notification system with automatic alerts
  - Queue removal capabilities
  - Integration with reservations page

### Automatic Vehicle Release System
- **Implementation Date**: January 24, 2025
- **Functionality**: System automatically releases vehicles after rental period ends
- **Key Features**:
  - Daily check for expired vehicle blocks
  - Automatic removal of calendar restrictions
  - Notification system for waiting queue users
  - First-come-first-served queue processing
- **Technical Details**:
  - Added `releaseExpiredVehicleBlocks()` method
  - Added `notifyWaitingQueueUsers()` for queue notifications
  - Created manual and automatic release endpoints
  - Integrated date overlap checking for relevant notifications

The architecture emphasizes type safety, modern development practices, and scalable design patterns suitable for a production car rental platform.