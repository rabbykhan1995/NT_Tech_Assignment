import { Request, Response } from "express";

import { ApiError } from "../../utils/ApiError";
import { OwnerService } from "./owner.service";
import type { OwnerTokenPayload } from "./owner.type";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

export class OwnerController {
  static async login(req: Request, res: Response) {
    const { token, owner } = await OwnerService.login(req.body);

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      msg: "Login successful",
      data: owner,
      token,
    });
  }

  static async me(req: Request, res: Response) {
    const payload = req.payload as OwnerTokenPayload | undefined;

    if (!payload?.ownerID) {
      throw new ApiError(401, "Unauthorized request");
    }

    const owner = await OwnerService.getCurrentOwner(payload.ownerID);

    return res.status(200).json({
      success: true,
      msg: "Current user fetched successfully",
      data: owner,
    });
  }

  static async logout(_req: Request, res: Response) {
    // JWT is stateless: this only clears the cookie. Clients that store the
    // token themselves should simply discard it.
    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
      success: true,
      msg: "Logged out successfully",
    });
  }
}
