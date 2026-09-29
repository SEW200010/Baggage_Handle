# Baggage Handle

Baggage Handle is a baggage and equipment tracking / issue-reporting application for airport-style operations. It combines a React frontend with an Express + MongoDB backend to support user authentication, equipment viewing, and bug / issue submission with photo attachments.

https://baggage-handle-g6i4.vercel.app

## Project Structure

- `frontend/` - React + Vite web application
- `backend/` - Express API and MongoDB models
- `backend/uploads/` - uploaded images and documents

## Features

- User registration and login
- Equipment lookup and filtering
- Issue / bug reporting for baggage handling operations
- Photo upload support for reported problems
- Admin dashboard for reviewing and updating bug reports
- Responsive UI built with React and Tailwind CSS

## Tech Stack

Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios

Backend
- Node.js
- Express
- MongoDB / Mongoose
- Multer for file uploads
- Sharp for image conversion

## Prerequisites

- Node.js 18 or later
- npm
- MongoDB instance (local or cloud)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/SEW200010/Baggage_Handle.git
cd Baggage_Handle
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

### 4. Configure environment variables

Create a `.env` file in the `backend` directory:

```env
MONGO_URI=mongodb://127.0.0.1:27017/baggage_db
DB_NAME=test
PORT=5000
```

If you are using MongoDB Atlas or another hosted MongoDB service, replace `MONGO_URI` with your connection string.

### 5. Run the backend

```bash
cd backend
node server.js
```

The backend API will run on:

```text
http://localhost:5000
```

### 6. Run the frontend

Open a new terminal window:

```bash
cd frontend
npm run dev
```

Then open the local Vite URL shown in the terminal, typically:

```text
http://localhost:5173
```

## Main API Endpoints

### Authentication
- `POST /api/register`
- `POST /api/login`

### Equipment
- `GET /api/equipment`

### Bugs / Issue Reporting
- `POST /api/bugs`
- `GET /api/bugs`
- `PUT /api/bugs/:id`
- `DELETE /api/bugs/:id`

### Photo Handling
- `GET /api/view-photo`

## Notes

- Uploaded files are stored in `backend/uploads`.
- The backend includes image handling for TIFF/TIFF files by converting them to PNG for safe viewing.
- The project is set up for local development and also includes Vercel configuration files for deployment.

## License

This project does not currently include a license file. Add one if you want to define formal usage or distribution terms.

## Contributing

Pull requests and improvements are welcome. If you are working on a new feature or bug fix, create a branch and submit your changes for review.
