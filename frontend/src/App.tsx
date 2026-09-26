import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Products } from './pages/Products';
import { Operations } from './pages/Operations';
import { StockLedger } from './pages/StockLedger';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="operations" element={<Operations />} />
          <Route path="history" element={<StockLedger />} />
          <Route path="settings" element={<div className="p-6">Settings Page</div>} />
          <Route path="profile" element={<div className="p-6">Profile Page</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
