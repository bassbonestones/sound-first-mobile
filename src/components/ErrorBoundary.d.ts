/**
 * ErrorBoundary component type declarations
 */
import React from "react";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

declare const ErrorBoundary: React.FC<ErrorBoundaryProps>;
export default ErrorBoundary;
