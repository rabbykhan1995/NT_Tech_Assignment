import { Request, Response, NextFunction } from "express";

import { ApiError } from "../utils/ApiError";
import { RequestContextStore } from "../utils/request-context";
import { OwnerService } from "../src/auth/owner.service";
import type { OwnerTokenPayload } from "../src/auth/owner.type";

interface AuthRequest extends Request {
  payload?: OwnerTokenPayload;
}

/**
 * Extracts the bearer token from the supported locations, in priority order:
 *   1. Authorization: Bearer <token>
 *   2. Token header (legacy clients)
 *   3. token cookie
 */
function extractToken(req: Request): string | undefined {
  const authorization = req.headers.authorization;

  if (authorization && authorization.startsWith("Bearer ")) {
    const bearer = authorization.slice("Bearer ".length).trim();
    if (bearer) return bearer;
  }

  const legacyHeader = req.headers.token;
  if (typeof legacyHeader === "string" && legacyHeader) {
    return legacyHeader;
  }

  const cookieToken = (req as Request & { cookies?: Record<string, string> })
    .cookies?.token;
  if (cookieToken) {
    return cookieToken;
  }

  return undefined;
}

/**
 * Lightweight authentication middleware. Verifies the owner JWT and attaches
 * the safe identity to the request context. Any missing, malformed, invalid or
 * expired token results in a consistent 401 response.
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.clearCookie("token");
      throw new ApiError(401, "Unauthorized request");
    }

    const decoded = OwnerService.verifyToken(token);

    if (!decoded || decoded.tokenType !== "owner" || !decoded.ownerID) {
      res.clearCookie("token");
      throw new ApiError(401, "Unauthorized request");
    }

    req.payload = decoded;

    RequestContextStore.run(
      { payload: decoded, requestId: crypto.randomUUID() },
      () => next(),
    );
  } catch (error) {
    res.clearCookie("token");

    // Configuration errors (e.g. missing JWT secret) should surface as 500s,
    // not masquerade as an authentication failure.
    if (error instanceof ApiError && error.statusCode >= 500) {
      return next(error);
    }

    next(new ApiError(401, "Unauthorized request"));
  }
};
