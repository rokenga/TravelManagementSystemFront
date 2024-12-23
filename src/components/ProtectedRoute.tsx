import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import UserContext from '../contexts/UserContext';
import { UserRole } from '../types/User';

interface Props {
  requiredRoles?: UserRole[]; // Optional array of roles that can access the route
}

const ProtectedRoute: React.FC<Props> = ({ requiredRoles = [] }) => {
  const User = useContext(UserContext);

  if (!User) {
    // User is not authenticated
    return <Navigate to="/login" replace />;
  }
  if (User.role && requiredRoles.length > 0 && !requiredRoles.includes(User.role)) {
    // User does not have the required role
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has the required role
  return <Outlet />;
};

export default ProtectedRoute;
