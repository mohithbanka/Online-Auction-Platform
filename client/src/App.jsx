import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RequireAuth from './components/RequireAuth';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateAuction from './pages/CreateAuction';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import AuctionList from './pages/AuctionList';
import BidPage from './pages/BidPage';
import Notifications from './pages/Notifications';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen bg-black text-white">
              <Navbar />
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auctions" element={<AuctionList />} />
                  <Route path="/auctions/:id" element={<BidPage />} />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth>
                        <Profile />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <RequireAuth roles={['buyer']}>
                        <Cart />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/create-auction"
                    element={
                      <RequireAuth roles={['seller']}>
                        <CreateAuction />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <RequireAuth>
                        <Notifications />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <div className="text-center text-gray-400 text-lg pt-10">
                        404 Not Found
                      </div>
                    }
                  />
                </Routes>
              </main>
              <ToastContainer
                position="top-right"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;