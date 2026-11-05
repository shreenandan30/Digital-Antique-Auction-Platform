# Antique Auction Management System

A DBMS Level 3 college mini project for managing antique catalogues, auctions, bidding activities, users, and transaction records.

## 1. Project Overview

The Antique Auction Management System is a database-driven web application designed to manage antique items and online auctions.

The system allows users to browse antiques, view auction details, place bids, and track their bidding and transaction history. Administrators can manage auction-related activities and monitor system information.

The project demonstrates relational database management concepts using MySQL and NoSQL database concepts using MongoDB.

## 2. Problem Statement

Managing antique records, auction schedules, bidder information, and transaction details requires an organized system.

Manual management can make it difficult to search for antiques, track auction activities, validate bids, and maintain transaction records.

This project provides a centralized application to manage these operations using a web interface and database integration.

## 3. Objectives

- Maintain antique item and auction records.
- Allow users to search and browse antiques.
- Display auction information and current bidding details.
- Validate and record bids.
- Maintain user accounts and access roles.
- Store transaction and auction activity information.
- Demonstrate SQL queries, joins, views, triggers, stored procedures, and database integration.
- Demonstrate MongoDB document storage and aggregation.

## 4. Features

### User Features
- User registration and login.
- Secure password hashing using bcrypt.
- HTTP-only signed session cookies.
- Browse antiques and view item details.
- Search antiques by name and filter by category.
- Browse auctions and filter by auction status.
- Place bids with server-side validation.
- View personal bidding history.
- View transaction history.
- View auction and antique details.

### Admin Features
- Admin role-based access.
- Admin dashboard.
- Auction and database activity summaries.
- Activity monitoring using MongoDB aggregation.

### Database Features
- MySQL for core business data.
- MongoDB for auction activity logs.
- SQL joins, aggregate queries, and nested queries.
- Views, triggers, stored procedures, and functions.
- Transaction-based bid placement.

## 5. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | Full-stack web application |
| React 18 | User interface |
| TypeScript | Application development |
| Next.js Route Handlers | Backend API endpoints |
| MySQL 8 | Relational database |
| MongoDB 9 | Activity logging and aggregation |
| bcryptjs | Password hashing |
| jose | Signed session handling |
| Zod | Request validation |
| Node.js | JavaScript runtime |

## 6. System Architecture

The application follows a client-server architecture.

1. Users interact with the application through the Next.js frontend.
2. Next.js Route Handlers process API requests.
3. MySQL stores core business information such as antiques, auctions, bids, users, and transactions.
4. MongoDB stores flexible activity log documents.
5. Server-side modules handle database access, authentication, and business logic.

**Database separation:**
- MySQL: Core relational business data.
- MongoDB: Auction and user activity logs.

For more information, see [Architecture Documentation](docs/architecture.md).

## 7. Database Design

### MySQL Database

Database name: `antique_auction_db`

The project uses the existing business tables:

- `antique_item`
- `owner`
- `auction`
- `bid`
- `bidder`
- `payment`
- `provenance`
- `transaction`
- `valuation`

The setup scripts also support the `user_account` table for application authentication.

Additional database objects include:

- `auction_details` view.
- `after_auction_insert` trigger.
- `GetAuctionDetails` stored procedure.
- `GetHighestBid` function.
- Database indexes.

The setup scripts are designed to preserve the existing business tables and their sample records rather than recreate them.

### MongoDB Database

Database name: `antique_auction_nosql`

MongoDB stores auction activity in the `auction_activity` collection.

Activity types include:

- `LOGIN`
- `LOGOUT`
- `VIEW_ANTIQUE`
- `VIEW_AUCTION`
- `PLACE_BID`
- `VIEW_TRANSACTION`

MongoDB aggregation examples are available in:

`database/mongodb/aggregation.js`

### Database Documentation

- [Database Design](docs/database-design.md)
- [ER Diagram](docs/ER_DIAGRAM.md)
- [ER to Relational Mapping](docs/ER_TO_RELATIONAL_MAPPING.md)
- [DBMS Features](docs/dbms-features.md)

## 8. Installation and Setup

### Prerequisites

Install the following:

- Node.js 18.17 or later.
- npm.
- MySQL 8.
- MongoDB 9.

Ensure both database services are running before starting the application.

### Step 1: Clone the Repository

```bash
git clone https://github.com/shreenandan30/Digital-Antique-Auction-Platform.git
cd Digital-Antique-Auction-Platform
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Copy the example environment file.

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

CMD:

```cmd
copy .env.example .env.local
```

Update `.env.local` with your local database credentials and a secure authentication secret.

Required configuration:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=antique_auction_db

MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=antique_auction_nosql

AUTH_SECRET=your_random_secret_at_least_32_characters
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

**Important:** Never upload `.env.local` or actual database credentials to GitHub.

### Step 4: Configure the Databases

Make sure the existing MySQL database `antique_auction_db` is available and contains the required business tables.

Run MongoDB setup:

```bash
npm run db:mongo:setup
```

Run MySQL setup:

```bash
npm run db
```

The MySQL setup script validates the existing schema and prepares the additional database objects required by the application. It is not intended to import the original SQL dump automatically.

**Important:** Review `database/antique_auction_db.sql` before importing it into an existing database because the dump contains destructive `DROP` statements.

### Step 5: Configure an Admin Account

Register a normal account through the application.

To grant that account administrator access, execute the following query in MySQL, replacing the email with the registered account's email:

```sql
UPDATE user_account
SET role = 'admin'
WHERE email = 'you@example.com';
```

The public registration endpoint does not allow users to assign themselves the admin role.

### Step 6: Configure Bidder Information

To place bids, the registered account's email must be associated with an existing bidder record in the `bidder` table.

The application does not automatically create bidder records.

### Step 7: Start the Application

```bash
npm run dev
```

Open the application at:

`http://localhost:3000`

## 9. Application Pages

| Page | Description |
|---|---|
| `/` | Home page |
| `/antiques` | Browse antique items |
| `/antiques/[id]` | View antique details |
| `/auctions` | Browse auctions |
| `/auctions/[id]` | View auction details |
| `/auctions/[id]/bid` | Place a bid |
| `/login` | User login |
| `/register` | User registration |
| `/my-bids` | View personal bids |
| `/my-transactions` | View transactions |
| `/admin` | Admin dashboard |

## 10. API Documentation

The application uses Next.js Route Handlers for backend API operations.

Main API modules include:

- Authentication.
- Antique management.
- Auction management.
- Bid management.
- User activity.
- Transaction history.
- Admin dashboard.
- Feedback management.

For endpoint details and access rules, see [API Documentation](docs/api.md).

## 11. DBMS Concepts Implemented

The project demonstrates the following database concepts:

- Relational database design.
- Primary keys and foreign keys.
- SQL joins.
- Aggregate functions.
- Nested and correlated queries.
- Database views.
- Stored procedures.
- User-defined functions.
- Database triggers.
- Indexing.
- Transactions and row locking.
- MongoDB document storage.
- MongoDB aggregation pipelines.

See [DBMS Features](docs/dbms-features.md) and `database/queries/dbms_demo_queries.sql` for examples.

## 12. Testing and Validation

The project includes tests for API handlers and request validation.

Run the available checks:

```bash
npm test
npm run lint
npm run build
```

Database-dependent validation requires the configured MySQL and MongoDB services.

For testing details, see [Testing Documentation](docs/testing.md).

## 13. Project Structure

```text
Digital-Antique-Auction-Platform/
│
├── app/
│   ├── api/
│   ├── admin/
│   ├── antiques/
│   ├── auctions/
│   ├── feedback/
│   ├── login/
│   ├── register/
│   ├── my-bids/
│   └── my-transactions/
│
├── components/
│
├── lib/
│   ├── antique.ts
│   ├── auction.ts
│   ├── auth.ts
│   ├── bid.ts
│   ├── http.ts
│   ├── mongodb.ts
│   └── mysql.ts
│
├── database/
│   ├── functions/
│   ├── indexes/
│   ├── mongodb/
│   ├── procedures/
│   ├── queries/
│   ├── schema/
│   ├── triggers/
│   └── views/
│
├── docs/
├── scripts/
├── tests/
│
├── middleware.ts
├── package.json
├── package-lock.json
└── README.md
```

## 14. Future Enhancements

- Antique image upload functionality.
- Improved antique provenance history.
- Payment gateway integration.
- More detailed auction analytics.
- Database-backed integration tests.
- Improved bidder account management.

## 15. Conclusion

The Antique Auction Management System demonstrates how relational and NoSQL databases can be integrated into a full-stack web application.

It provides functionality for antique cataloguing, auction management, bidding, user authentication, and transaction tracking while demonstrating important DBMS concepts through practical implementation.

---

**Project:** Antique Auction Management System
**Project Type:** DBMS Level 3 Mini Project
**Frontend:** Next.js, React, TypeScript
**Backend:** Next.js Route Handlers
**Databases:** MySQL and MongoDB