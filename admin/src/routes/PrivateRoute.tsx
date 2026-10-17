import { useEffect } from "react";
import { Navigate } from "react-router";
import Helper from "../utils/helper";
import { userStore } from "../stores/user.store";

export default function PrivateRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = Helper.getToken();

  const { user, isLoading, isInitialized, fetchUser } = userStore();

  useEffect(() => {
    if (!token) return;
    fetchUser();
  }, [token]);

  // No token → login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Still fetching → loading
  if (!isInitialized || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Fetch finished but no user → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
