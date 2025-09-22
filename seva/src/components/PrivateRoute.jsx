import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const PrivateRoute = ({ children, userType }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.userType !== userType) {
    return <Navigate to="/login" replace />;
  }

  return <Layout userType={userType}>{children}</Layout>;
};

export default PrivateRoute;