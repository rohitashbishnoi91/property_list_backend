# Property Listing System API

A Node.js/Express backend for managing property listings, user authentication, favorites, recommendations, and caching with Redis.  
MongoDB Atlas is used for persistent storage.

# deployed on render
https://property-list-backend-4.onrender.com

---

## Features

- **User Authentication** (JWT-based)
- **Property CRUD** (Create, Read, Update, Delete)
- **Favorites** (users can favorite properties)
- **Recommendations** (send/receive property recommendations)
- **Caching** with Redis for improved performance
- **CSV Import** for bulk property data

---

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB Atlas (via Mongoose)
- Redis (Cloud or local)
- JWT for authentication
- Helmet & CORS for security

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/property_list_backend.git
cd property_list_backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```
PORT=3000
MONGODB_URI=your_mongodb_atlas_uri
REDIS_URL=your_redis_cloud_url
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

**Do not commit your `.env` file!**

### 4. Build and run the server

For development (with hot reload):

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

---

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create a property (auth required)
- `POST /api/favorites` - Add to favorites (auth required)
- `POST /api/recommendations` - Send a recommendation (auth required)
- ...and more!

---

## Import Property Data from CSV

Place your CSV file in the `data/` folder (e.g., `data/property_data.csv`), then run:

```bash
npm run import-data
```

---

## Deployment

This project is ready for deployment on [Render](https://render.com) 
Set your environment variables in the Render dashboard.

---

## License

MIT

---

## Author

Rohitash Bishnoi 
