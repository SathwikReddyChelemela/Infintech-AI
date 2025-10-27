# Financial RBAC RAG React Client

This is the React frontend for the Financial RBAC RAG application.

## Features

- **Authentication**: Login and signup with role-based access control
- **Document Upload**: Admin users can upload PDF documents for specific roles
- **Chat Interface**: Ask financial questions and get AI-powered responses
- **Role-based Access**: Different features available based on user role

## Available Roles

- **Admin**: Can upload documents and access all features
- **Analyst**: Financial analysis and reporting
- **Ops**: Operations and compliance
- **Customer**: Customer service and support
- **Merchant**: Merchant services and transactions

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Prerequisites

Make sure the FastAPI backend server is running and reachable.
For local dev: `http://localhost:8000`.
For Render (or other hosting): set `REACT_APP_API_BASE_URL` to your backend URL.

Example `.env` for Render:

```
REACT_APP_API_BASE_URL=https://infintech-ai.onrender.com
```

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm run build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm run eject`: Ejects from Create React App (one-way operation)

## Technology Stack

- React 18
- Material-UI (MUI)
- React Router
- Axios for API calls
- Create React App
