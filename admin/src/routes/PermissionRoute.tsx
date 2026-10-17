import { Navigate } from "react-router";
import Helper from "../utils/helper";


type PermissionRouteProps = {
  permission: string;
  children: React.ReactNode;
};

export default function PermissionRoute({
  permission,
  children,
}: PermissionRouteProps) {
  if (!Helper.isPermitter(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}