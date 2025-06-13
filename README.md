
# Online Auction Platform 🚀

A full-stack web application for real‑time auctions: users can register as sellers or buyers, list auction items, place bids, and track auctions in a secure, responsive environment.

## 🔍 Features

- **User authentication**: Registration, login (with hashed passwords), session management.  
- **Role-based accounts**: Sellers can create auctions; buyers can place bids.  
- **Auction listings**: Sellers list items with title, description, starting bid, end time, and images.  
- **Live bidding**: Buyers place bids that update in real time (via WebSockets or polling).  
- **Bid history**: Every bid is stored—buyers can view item-specific bid history.  
- **Auction engine**: Automatically ends auctions; determines winner and handles notifications/payment.  
- **Responsive UI**: Optimized for both desktop and mobile users.  

## 🧭 Tech Stack

| Layer         | Technology            |
|---------------|------------------------|
| Backend       | Node.js, Express       |
| Frontend      | React (or Angular/Vue) |
| Real-time     | socket.io (or SSE)     |
| Database      | MongoDB (or MySQL)     |
| Authentication| JWT (or sessions + bcrypt) |
| Storage       | AWS S3 or Cloudinary (for item images) |

## 🏁 Quick Start

1. **Clone the repo**

    ```bash
    git clone https://github.com/mohithbanka/Online-Auction-Platform.git
    cd Online-Auction-Platform
    ```

2. **Backend setup**

    ```bash
    cd server
    npm install
    cp .env.example .env
    # Update .env with DB credentials, JWT_SECRET, etc.
    npm run dev
    ```

3. **Frontend setup**

    ```bash
    cd ../client
    npm install
    cp .env.example .env
    # Update .env variables (e.g., REACT_APP_API_BASE_URL)
    npm start
    ```

4. **Visit the app**

    Open your browser and go to [http://localhost:3000](http://localhost:3000) (or whichever port your client runs on).

## ✅ Folder Structure

```
/
├── server/         # Express backend
│   ├── controllers/    # Route handlers
│   ├── models/         # DB schemas
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic, notifications
│   └── app.js          # Main server
└── client/         # Frontend React app
    ├── public/
    └── src/
        ├── components/ # Reusable UI components
        ├── pages/      # Screens (Home, Auction, Login)
        ├── store/      # Redux or Context
        └── App.js      # Entry point
```

## ⚙️ Environment Variables

### Server `.env`

```
PORT=4000
MONGO_URI=<your_mongo_uri>
JWT_SECRET=<some_secret>
S3_BUCKET=<...>            # If using AWS S3
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

### Client `.env`

```
REACT_APP_API_BASE_URL=http://localhost:4000/api
```

## 🚀 Running the App

- Start the **backend**:  
  `cd server && npm run dev`

- Start the **frontend**:  
  `cd client && npm start`

- Navigate to `http://localhost:3000` to explore!

## 🎯 Usage

1. **Sign up** as seller or buyer.  
2. **Sellers** can create an auction by uploading images, setting starting bid, and end date.  
3. **Buyers** browse listings, place bids, and view the bidding history on each item.  
4. When the auction ends, the highest bidder wins—notification/payment logic can be implemented.  

## 🧪 Testing

- **Backend tests**:  
  `cd server && npm test`

- **Frontend tests** (if available):  
  `cd client && npm test`

## 🤝 Contributing

1. Fork the repo  
2. Create a feature branch: `git checkout -b feature/awesome-stuff`  
3. Commit your changes: `git commit -m 'Add awesome feature'`  
4. Push and open a PR  
5. Fill out the PR template, link issues


## 🙌 Acknowledgements

- Inspired by popular platforms like eBay, Auctionity  
- StackOverflow contributors  
- Any design assets or libraries you’ve used (e.g. Bootstrap, Tailwind, FontAwesome)  
