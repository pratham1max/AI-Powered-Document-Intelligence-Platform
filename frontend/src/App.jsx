import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import DocumentDetail from "./pages/DocumentDetail";
import Chat from "./pages/Chat";
import Analytics from "./pages/Analytics";
import Layout from "./components/Layout";
import { useAuthStore } from "./store/authStore";

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Private routes under layout */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<DocumentDetail />} />
        <Route path="chat" element={<Chat />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Redirect bare /library etc to /app/library for convenience */}
      <Route path="/library" element={<Navigate to="/app/library" replace />} />
      <Route path="/chat" element={<Navigate to="/app/chat" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
    </Routes>
  );
}
