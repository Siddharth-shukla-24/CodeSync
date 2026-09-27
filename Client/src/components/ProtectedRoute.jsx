import { Navigate, useLocation } from 'react-router-dom';
import { isAuthed } from '../auth';

// Gate for authenticated-only routes. Redirects to /login and remembers where
// the user was headed so we can send them back after a successful login.
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
