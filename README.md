# QuickFix — Quick Service Request Portal

A small full-stack service request website using HTML, CSS, JavaScript, Node.js and Express. Requests are saved in `data/requests.json`, so MongoDB is not required.

## Features
- Submit service requests with contact details, category, priority and location
- Auto-generated request ID
- Persistent storage in a JSON file
- Dashboard with live counts
- Search by request ID, name, category or location
- Filter by status
- Update status: Pending, In Progress, Resolved or Rejected
- Responsive layout for mobile and desktop

## Run in VS Code
1. Install Node.js (LTS) from https://nodejs.org/ and restart VS Code.
2. Extract this ZIP.
3. In VS Code choose **File → Open Folder** and open `quick-service-request-portal`.
4. Open **Terminal → New Terminal**.
5. Run `npm install`.
6. Run `npm start`.
7. Open `http://localhost:5000` in your browser.

Keep the terminal running while using the website. Press `Ctrl + C` in the terminal to stop the server.

## Notes
- Submitted requests remain saved in `data/requests.json` after restarting the server.
- The status dropdown is a demonstration admin control. This starter project does not include login/authentication or role-based access control.
- For a public production deployment, add authentication, authorization, input validation, rate limiting, HTTPS and a database such as MongoDB/PostgreSQL.
