import { Link } from "react-router";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Compass className="mb-4 h-16 w-16 text-indigo-500" strokeWidth={1.5} />

      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
        Error 404
      </p>
      <h1 className="mt-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-gray-500 dark:text-gray-400">
        The page you are looking for doesn't exist or has been moved. Please
        check the URL or go back to the dashboard.
      </p>

      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
      >
        <Home className="h-4 w-4" />
        Go to Dashboard
      </Link>
    </div>
  );
}