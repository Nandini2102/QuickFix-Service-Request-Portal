QuickFix – Quick Service Request Portal

A full-stack Service Request Management System developed using HTML, CSS, JavaScript, Node.js and Express.

Live Website: https://quickfix-service-request-portal.onrender.com/

Features

User Module

- User registration and login
- Secure password hashing
- Submit service requests
- Automatically generated request ID
- View personal service requests
- Track request status
- Responsive user interface

Admin Module

- Separate Admin Login
- View all customer service requests
- Manage service requests
- Update request status:
  - Pending
  - In Progress
  - Resolved
  - Rejected
- Delete service requests

General Features

- JSON-based data storage
- Dashboard with request statistics
- Search requests by ID, name, category or location
- Filter requests by status
- Mobile and desktop responsive design

Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Authentication: Express Session, bcryptjs
- Storage: JSON files
- Deployment: Render
- Version Control: GitHub

Project Structure

QuickFix-Service-Request-Portal/
│
├── public/
│   ├── index.html
│   ├── login.html
│   ├── login.js
│   ├── app.js
│   └── style.css
│
├── data/
│   ├── requests.json
│   └── users.json
│
├── server.js
├── package.json
├── package-lock.json
└── README.md

Run Locally

1. Install Node.js.
2. Clone or download this repository.
3. Open the project folder in VS Code.
4. Open the terminal.
5. Run:

npm install
npm start

6. Open http://localhost:5000 in your browser.

Deployment

The application is deployed using Render.

Live URL:
https://quickfix-service-request-portal.onrender.com/

Project Objective

The main objective of QuickFix is to simplify service request submission and management through a centralized web application. Users can submit and track requests, while administrators can monitor and manage requests efficiently.
