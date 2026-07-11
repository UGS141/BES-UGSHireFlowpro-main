# UGS HireFlow / BES Consultancy - Deployment Guide

This guide provides instructions on how to build, containerize, and deploy the **UGS HireFlow** (internal portal) and **BES Consultancy** (public landing page) application to live staging and production environments.

---

## 📋 Required Environment Variables

Before deploying, ensure you have the following secrets and values ready:

### Backend Environments (`backend/.env`)
- `MONGO_URL`: MongoDB connection string (e.g., MongoDB Atlas URI or local `mongodb://mongodb:27017`).
- `DB_NAME`: The database name (e.g., `ugs_hireflow` or `bes_consultancy`).
- `JWT_SECRET`: A secure random secret key (e.g. generated via `openssl rand -hex 32`) to sign session tokens.
- `JWT_ALGORITHM`: (Optional, defaults to `HS256`).
- `JWT_EXPIRATION_MINUTES`: (Optional, defaults to `1440`).
- `CORS_ORIGINS`: Comma-separated list of allowed frontend URLs (e.g., `https://your-frontend.vercel.app,http://localhost:3000`).

### Frontend Environments (`frontend/.env`)
- `REACT_APP_BACKEND_URL`: The fully qualified public URL of your deployed backend service (e.g., `https://ugs-backend.onrender.com`).

---

## 🚀 Option 1: Live Staging Deployment (Free / Low Cost)

This is the recommended path for staging, client demonstrations, and testing. It uses **Vercel** for the frontend, **Render** for the backend, and **MongoDB Atlas** for the database.

### Step 1: Set up MongoDB Atlas (Free M0 Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Deploy a free cluster (choose **M0 Shared** tier).
3. Under **Network Access**, add IP `0.0.0.0/0` (allows connections from Render backend) or obtain the specific IP ranges of your Render web service.
4. Under **Database Access**, create a user with read/write permissions.
5. Copy the connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`).

### Step 2: Deploy Backend to Render
1. Go to [Render](https://render.com) and create/log in to your dashboard.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following details:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3` (or choose `Docker` since we have provided a `Dockerfile` inside `/backend`!)
     - *If choosing Docker*: Render will automatically build the container from `backend/Dockerfile`.
     - *If choosing Python*: Set build command to `pip install -r requirements.txt` and start command to `uvicorn server:app --host 0.0.0.0 --port $PORT`.
5. Under **Environment Variables**, add:
   - `MONGO_URL` = (Your MongoDB Atlas connection URI)
   - `DB_NAME` = (e.g., `ugs_hireflow`)
   - `JWT_SECRET` = (A secure random string)
   - `CORS_ORIGINS` = `*` (or your Vercel frontend URL once deployed)
6. Click **Deploy Web Service** and copy the generated service URL (e.g., `https://ugs-backend.onrender.com`).

### Step 3: Deploy Frontend to Vercel
1. Go to [Vercel](https://vercel.com) and connect your GitHub repository.
2. Import the project.
3. In the project setup panel, set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Create React App`
4. Under **Environment Variables**, add:
   - Name: `REACT_APP_BACKEND_URL`
   - Value: `https://ugs-backend.onrender.com` (Your Render backend URL from Step 2)
5. Click **Deploy**. Vercel will automatically build and assign a free subdomain (`https://<project-name>.vercel.app`).
6. *(Optional)* Go back to your Render backend environment variables and change `CORS_ORIGINS` from `*` to your exact Vercel URL to secure the backend.

---

## 🐳 Option 2: Docker Compose Deployment (Local / Single VPS Server)

Docker Compose builds the frontend, backend, and database into unified, isolated containers and spins them up simultaneously.

### Requirements
- Docker and Docker Compose installed on the hosting machine.

### Run the Stack Locally
From the project root directory, run:
```bash
docker compose up --build -d
```

This starts:
- MongoDB on port `27017`
- FastAPI backend on `http://localhost:8000`
- React frontend on `http://localhost` (Port 80)

To stop the containers:
```bash
docker compose down
```

---

## 🖥️ Option 3: VPS Host Deployment (Self-Hosted on DigitalOcean, AWS, etc.)

For full production control under a custom domain (e.g., `https://yourdomain.com`).

1. **Spin up a Ubuntu VPS** (e.g., DigitalOcean Droplet, 2GB RAM minimum).
2. **Install Docker & Docker Compose**:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-v2
   sudo systemctl enable --now docker
   ```
3. **Clone your code**:
   ```bash
   git clone https://github.com/your-org/BES-UGSHireFlowpro.git
   cd BES-UGSHireFlowpro
   ```
4. **Update `docker-compose.yml` variables** with your production domain, strong JWT secrets, and SSL configurations.
5. **Set up Nginx reverse proxy** or use Traefik/Caddy to handle SSL certificates (Let's Encrypt) and route traffic:
   - Port `80` / `443` -> routed to `frontend` container (port `80`).
   - `/api` path -> routed directly to `backend` container (port `8000`).
6. **Launch in background**:
   ```bash
   docker compose -f docker-compose.yml up --build -d
   ```
