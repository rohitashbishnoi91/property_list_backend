# Property Listing System API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints except public ones require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Properties

#### Get All Properties
```
GET /properties
```
Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sort` (optional): Sort field (e.g., "price", "-price" for descending)

#### Get Property by ID
```
GET /properties/:id
```

#### Create Property
```
POST /properties
```
Required fields:
- title
- price
- location
- propertyType
- bedrooms
- bathrooms
- area

#### Update Property
```
PUT /properties/:id
```

#### Delete Property
```
DELETE /properties/:id
```

### Search

#### Search Properties
```
GET /properties/search
```
Query Parameters:
- `location` (optional): Location to search in
- `priceRange` (optional): Price range (e.g., "100000-500000")
- `propertyType` (optional): Type of property
- `bedrooms` (optional): Number of bedrooms
- `bathrooms` (optional): Number of bathrooms
- `features` (optional): Comma-separated list of features

### Recommendations

#### Get Property Recommendations
```
GET /properties/recommendations
```
Query Parameters:
- `userId` (required): User ID to get personalized recommendations
- `limit` (optional): Number of recommendations (default: 5)

### Favorites

#### Get User Favorites
```
GET /favorites
```
Requires authentication

#### Add to Favorites
```
POST /favorites/:propertyId
```
Requires authentication

#### Remove from Favorites
```
DELETE /favorites/:propertyId
```
Requires authentication

## Response Format

### Success Response
```json
{
    "success": true,
    "data": {
        // Response data
    }
}
```

### Error Response
```json
{
    "success": false,
    "error": {
        "message": "Error message",
        "code": "ERROR_CODE"
    }
}
```

## Environment Variables
Required environment variables:
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env` file

3. Import sample data:
```bash
npm run import-data
```

4. Start the server:
```bash
npm run dev
```

## Technologies Used
- Node.js
- TypeScript
- Express.js
- MongoDB
- Redis
- JWT Authentication 