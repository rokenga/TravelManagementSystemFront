import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import UserContext from '../contexts/UserContext';
import { UserRole } from '../types/User';

interface Props {
  requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<Props> = ({ requiredRoles = [] }) => {
  const User = useContext(UserContext);

  if (!User) {
    return <Navigate to="/login" replace />;
  }
  if (User.role && requiredRoles.length > 0 && !requiredRoles.includes(User.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
