import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import Items from "@/pages/Items";
import ItemDetail from "@/pages/ItemDetail";
import Chat from "@/pages/Chat";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLogin from "@/pages/AdminLogin";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/items" element={<Items />} />
        <Route path="/item/:itemId" element={<ItemDetail />} />
        <Route path="/chat/:itemId" element={<Chat />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<Navigate to="/items" />} />
      </Routes>
    </Router>
  );
}

export default App;