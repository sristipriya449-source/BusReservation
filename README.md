# CityLink — Bus Ticket Reservation System
*Jisko jana hai woh jake rahega*

A full-stack bus ticket booking platform with a live, interactive seat map, couple-seat booking validation, anti-double booking seat locks, httpOnly cookie auth, and GST-style PDF e-tickets.

## Stack
- Frontend: React, React Router, Axios
- Backend: Node.js, Express, Cookie-Parser
- Database: MongoDB (Mongoose)
- Auth: JWT + bcrypt (httpOnly cookies)
- Tickets: PDFKit

## Setup

### Server
```bash
cd server
npm install
npm run seed   # Populates database with sample buses & routes
npm run dev
```
Fill in `.env` with your own `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` before running.

### Client
```bash
cd client
npm install
npm start
```

Create a `.env` file in `client/` if needed:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Creating the first admin
Register a normal user through the app, then manually update that user's `role` to `admin` in MongoDB to unlock the Admin Dashboard.
