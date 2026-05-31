import React from 'react';
import { Navigate } from 'react-router-dom';
export function Settings() {
  return <Navigate to="/settings/appearance" replace />;
}