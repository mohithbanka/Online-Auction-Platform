import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import Notification from "./Notification";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // console.log("[Navbar] No token, skipping fetchNotifications");
          setNotifications([]);
          return;
        }
        const res = await axios.get(`${BACKEND_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const validNotifications = res.data
          .filter((n) => n && n._id && typeof n.read === "boolean")
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(validNotifications);
        // console.log("[Navbar] Notifications fetched:", validNotifications);
      } catch (err) {
        console.error("[Navbar] Error fetching notifications:", err.message);
        setNotifications([]);
      }
    };

    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification) => {
      // console.log("[Navbar] Received newNotification:", notification);
      if (
        !notification ||
        !notification._id ||
        typeof notification.read !== "boolean"
      ) {
        console.error("[Navbar] Invalid newNotification:", notification);
        return;
      }
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) {
          // console.log(
          //   "[Navbar] Duplicate notification ignored:",
          //   notification._id
          // );
          return prev;
        }
        return [notification, ...prev].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      });
    };

    const handleNotificationRead = ({ _id, read }) => {
      // console.log("[Navbar] Received notificationRead:", { _id, read });
      setNotifications((prev) =>
        prev.map((n) => (n._id === _id ? { ...n, read } : n))
      );
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationRead", handleNotificationRead);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationRead", handleNotificationRead);
    };
  }, [socket, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await axios.put(
        `${BACKEND_URL}/api/notifications/${id}/read`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      // console.log("[Navbar] Marked as read:", res.data);
    } catch (err) {
      console.error("[Navbar] Error marking as read:", err.message);
      throw err;
    }
  };

  const handleViewAllClick = (e) => {
    e.stopPropagation();
    // console.log("[Navbar] View all clicked");
    setShowNotifications(false);
    navigate("/notifications");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/95 backdrop-blur-sm shadow-md py-3"
          : "bg-black py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-cyan-400">Nex</span>
          <span className="text-2xl font-bold text-white">ora</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
          >
            Home
          </Link>
          <Link
            to="/auctions"
            className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
          >
            Auctions
          </Link>
          {user ? (
            <>
              {user.role === "seller" ? (
                <Link
                  to="/create-auction"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
                >
                  Create Auction
                </Link>
              ) : (
                <Link
                  to="/my-bids"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
                >
                  My Bids
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                to="/about"
                className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
              >
                Contact
              </Link>
            </>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-gray-300 hover:text-cyan-400 transition-colors duration-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label="Notifications"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-gray-900 rounded-lg shadow-xl z-50 border border-gray-700 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-700 bg-gray-800">
                      <p className="text-lg font-semibold text-gray-200">Notifications</p>
                    </div>
                    <div className="divide-y divide-gray-700">
                      {notifications.length > 0 ? (
                        notifications.map((notification) =>
                          notification ? (
                            <Notification
                              key={notification._id}
                              notification={notification}
                              onMarkAsRead={() => markAsRead(notification._id)}
                            />
                          ) : null
                        )
                      ) : (
                        <p className="p-4 text-gray-400 text-sm">No new notifications</p>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-700 text-center bg-gray-800">
                      <Link
                        to="/notifications"
                        className="text-cyan-400 hover:text-cyan-300 text-sm font-medium hover:underline"
                        onClick={handleViewAllClick}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart (for buyers) */}
              {user.role === "buyer" && (
                <Link
                  to="/cart"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label="Cart"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </Link>
              )}

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded-full p-1"
                  aria-label="User menu"
                >
                  <div className="w-9 h-9 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 font-semibold text-lg border border-cyan-400/30">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-gray-200 text-sm font-medium">
                    {user.name}
                  </span>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-56 bg-gray-900 rounded-lg shadow-xl py-2 z-50 border border-gray-700">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 transition-colors text-sm font-medium"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    {user.role === "buyer" && (
                      <Link
                        to="/cart"
                        className="block px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 transition-colors text-sm font-medium"
                        onClick={() => setShowDropdown(false)}
                      >
                        My Cart
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 transition-colors text-sm font-medium"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors duration-200 px-4 py-2 text-base font-medium rounded-md"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  mobileMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm px-6 py-4">
          <div className="flex flex-col space-y-3">
            <Link
              to="/"
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/auctions"
              className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Auctions
            </Link>
            {user ? (
              <>
                {user.role === "seller" ? (
                  <Link
                    to="/create-auction"
                    className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create Auction
                  </Link>
                ) : (
                  <Link
                    to="/my-bids"
                    className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Bids
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;