import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleState from './pages/VehicleState';
import Clients from './pages/Clients';
import Reservations from './pages/Reservations';
import ReservationsList from './pages/ReservationsList';
import Payments from './pages/Payments';
import Contracts from './pages/Contracts';
import Users from './pages/Users';
import Confirmations from './pages/Confirmations';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/reservations" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute adminOnly={true}>
          <Layout><Dashboard /></Layout>
        </PrivateRoute>
      } />
      <Route path="/vehicles" element={<PrivateRoute><Layout><Vehicles /></Layout></PrivateRoute>} />
      <Route path="/vehicles/:vehicleId/state" element={<PrivateRoute><Layout><VehicleState /></Layout></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><Layout><Clients /></Layout></PrivateRoute>} />
      <Route path="/reservations" element={<PrivateRoute><Layout><Reservations /></Layout></PrivateRoute>} />
      <Route path="/reservations-list" element={<PrivateRoute><Layout><ReservationsList /></Layout></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><Layout><Payments /></Layout></PrivateRoute>} />
      <Route path="/confirmations" element={
        <PrivateRoute>
          <Layout><Confirmations /></Layout>
        </PrivateRoute>
      } />
      <Route path="/contracts" element={<PrivateRoute><Layout><Contracts /></Layout></PrivateRoute>} />
      <Route path="/users" element={
        <PrivateRoute adminOnly={true}>
          <Layout><Users /></Layout>
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;