# WhatsApp Delivery & Logistics Platform - Zimbabwe

A data-optimized delivery platform that connects WhatsApp API messages to a Supabase backend, tracking spatial coordinates for delivery logistics in Zimbabwe.

## Features

- WhatsApp Business API integration
- Real-time location tracking using PostGIS
- Order management system
- Driver availability tracking
- Spatial queries for efficient delivery routing

## Project Structure

```
├── src/
│   └── index.ts              # Main Express server
├── migrations/
│   └── 001_initial_schema.sql # Database schema
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Environment Setup

1. Copy the environment variables file:
```bash
cp .env.example .env
```

2. Fill in your environment variables in `.env`:
- `WHATSAPP_VERIFY_TOKEN`: Your WhatsApp webhook verification token
- `WHATSAPP_ACCESS_TOKEN`: Your WhatsApp API access token
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 2. Database Setup

1. Run the SQL migration in your Supabase project:
```sql
-- Execute the contents of migrations/001_initial_schema.sql
```

This will:
- Enable PostGIS extension
- Create merchants, drivers, and orders tables
- Set up spatial indexes for efficient location queries
- Configure RLS policies

### 3. Running the Application

Development mode:
```bash
npm run dev
```

Development with auto-restart:
```bash
npm run dev:watch
```

Production build and run:
```bash
npm run build
npm start
```

## API Endpoints

### WhatsApp Webhook
- **GET** `/api/whatsapp/webhook` - Hub verification challenge
- **POST** `/api/whatsapp/webhook` - Incoming WhatsApp messages

### Health Check
- **GET** `/health` - Service health status

## Database Schema

### Merchants Table
- `id`: UUID primary key
- `name`: Merchant name
- `contact_phone`: Contact phone number
- `active`: Active status

### Drivers Table
- `id`: UUID primary key
- `name`: Driver name
- `phone`: Driver phone number
- `current_location`: Spatial coordinates (PostGIS Point)
- `is_available`: Availability status

### Orders Table
- `id`: UUID primary key
- `customer_phone`: Customer phone number
- `status`: Order status (pending, assigned, out_for_delivery, delivered)
- `delivery_location`: Delivery coordinates (PostGIS Point)
- `merchant_id`: Foreign key to merchants
- `change_requested_usd`: Change amount in USD
- `assigned_driver_id`: Foreign key to drivers

## WhatsApp Message Types Supported

- **Text messages**: Order details, customer requests
- **Location messages**: Delivery coordinates
- **Media messages**: Images, documents (for future features)

## Development Notes

- Uses TypeScript for type safety
- Express.js for the web server
- PostGIS for spatial data handling
- RLS enabled for database security
- Comprehensive logging for debugging

## Next Steps

1. Implement Supabase client integration
2. Add order processing logic
3. Implement driver assignment algorithms
4. Add customer notification system
5. Create admin dashboard
6. Add delivery route optimization
