# CogniCore - Adaptive Cognitive Training Portal

CogniCore is a cognitive assessment and training platform featuring multiple game modules powered by a closed-loop Dynamic Difficulty Adjustment (DDA) engine and Machine Learning (Random Forest) cognitive archetype classification.

---

## Project Structure

*   /client - Frontend React application using Vite and Phaser 3.
*   /server - Backend Flask server managing telemetry storage, OLS statistics, and ML archetype inference using SQLite.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher) & npm
*   [Python 3.12](https://www.python.org/)
*   **(Recommended) [Docker](https://www.docker.com/) & Docker Compose**

---

## Quick Start Guide (Docker - Recommended)

The easiest way to spin up the entire application stack is by using Docker Compose.

1. Ensure Docker Desktop is running on your machine.
2. Open your terminal at the root of the project and run:
   ``bash
   docker-compose up --build
   ``
3. Docker will automatically install all dependencies and boot both the backend and frontend servers.
4. Open your web browser and navigate to: **[http://localhost:5173/](http://localhost:5173/)**

---

## Quick Start Guide (Manual Setup)

If you prefer not to use Docker, you can run both the backend server and the frontend client simultaneously in separate terminal windows.

### 1. Start the Backend Server

1.  Open your terminal and navigate to the server directory:
    ``bash
    cd server
    ``
2.  Install the Python requirements:
    ``bash
    pip install -r requirements.txt
    ``
3.  Start the Flask backend:
    ``bash
    python app.py
    ``
    *The server will boot up and run locally on http://127.0.0.1:5000.*

### 2. Start the Frontend Client

1.  Open a new terminal window/tab and navigate to the client directory:
    ``bash
    cd client
    ``
2.  Install node packages:
    ``bash
    npm install
    ``
3.  Launch the development server:
    ``bash
    npm run dev
    ``
    *The client dev server will boot up locally on http://localhost:5173/.*

### 3. Open the Game

Once both servers are running:
*   Open your web browser and navigate to: **[http://localhost:5173/](http://localhost:5173/)**
*   Enter a player username, choose a module (such as **Memory Match** or **Speed Tap**), and click **Begin Training Session** to play!
