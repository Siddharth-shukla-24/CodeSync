# 💻 CodeSync — Real-Time Collaborative Code Editor

A real-time collaborative code editor where multiple users can write and edit code together in the same room — like Google Docs, but for code.

## 🌐 Live Demo
**[codesync-rosy-nine.vercel.app](https://codesync-rosy-nine.vercel.app)**

## ✨ Features
- Real-time code synchronization across multiple users
- Room-based collaboration — create or join rooms instantly
- Multiple language support — JavaScript, Python, C++, Java
- Language sync — when one user switches language, all users see it
- Code persistence — code is saved even after room refresh
- Connected users list with live updates
- Clean VS Code-like dark theme editor

## 🛠 Tech Stack
**Frontend:** React, Vite, Monaco Editor, Socket.io-client, React Router  
**Backend:** Node.js, Express, Socket.io  
**Database:** MongoDB Atlas  
**Deployment:** Vercel (frontend) + Railway (backend)

## 🚀 Local Setup

### Backend
```bash
cd Server
npm install
# Create .env file with MONGO_URI
npm run dev
```

### Frontend
```bash
cd Client
npm install
# Create .env file with VITE_SERVER_URL=http://localhost:3000
npm run dev
```

## 📁 Project Structure
```
CodeSync/
├── Client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Home & Editor pages
│   │   └── socket.js
└── Server/          # Node.js backend
    ├── controllers/
    ├── model/
    ├── routes/
    └── index.js
```