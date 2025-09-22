import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import Map from './components/Map';
import CommitteeDetail from './components/CommitteeDetail';
import VolunteerManagement from './components/VolunteerManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/volunteer/*"
              element={
                <PrivateRoute userType="volunteer">
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="map" element={<Map />} />
                  </Routes>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <PrivateRoute userType="admin">
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="map" element={<Map />} />
                    <Route path="committee/:id" element={<CommitteeDetail />} />
                    <Route path="volunteers/:committeeId" element={<VolunteerManagement />} />
                  </Routes>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;