import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";

import { ApiError } from "../../utils/ApiError";
import { OwnerRepository } from "./owner.repo";
import type {
  Owner,
  OwnerLoginInput,
  OwnerTokenPayload,
  SafeOwner,
} from "./owner.type";

const BCRYPT_SECRET = process.env.BCRYPT_SECRET ?? "";
const SALT_ROUNDS = 10;
const DEFAULT_EXPIRES_IN = "1d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, "JWT secret is not configured");
  }
  return secret;
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_EXPIRES_IN;
}

export class OwnerService {
  /**
   * Normalises a login identifier so email is case-insensitive while mobile
   * numbers are used verbatim.
   */
  static normalizeIdentifier(identifier: string): string {
    const trimmed = identifier.trim();
    return trimmed.includes("@") ? trimmed.toLowerCase() : trimmed;
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password + BCRYPT_SECRET, SALT_ROUNDS);
  }

  static async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password + BCRYPT_SECRET, hashedPassword);
  }

  static generateToken(
    payload: OwnerTokenPayload,
    expiresIn: string = getExpiresIn(),
  ): string {
    return jwt.sign(payload, getJwtSecret(), {
      expiresIn,
    } as SignOptions);
  }

  static verifyToken(token: string): OwnerTokenPayload | null {
    try {
      return jwt.verify(token, getJwtSecret()) as OwnerTokenPayload;
    } catch {
      return null;
    }
  }

  static toSafeOwner(owner: Owner): SafeOwner {
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      mobile: owner.mobile,
    };
  }

  static async login(input: OwnerLoginInput): Promise<{
    token: string;
    owner: SafeOwner;
  }> {
    const identifier = this.normalizeIdentifier(input.identifier);

    const owner = await OwnerRepository.findByIdentifier(identifier);

    const passwordMatched = owner
      ? await this.verifyPassword(input.password, owner.password)
      : false;

    // Same generic error whether the account is missing or the password is
    // wrong — never reveal which part of the credentials failed.
    if (!owner || !passwordMatched) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = this.generateToken({
      ownerID: owner.id,
      tokenType: "owner",
    });

    return { token, owner: this.toSafeOwner(owner) };
  }

  static async getCurrentOwner(ownerID: string): Promise<SafeOwner> {
    const owner = await OwnerRepository.findById(ownerID);

    if (!owner) {
      throw new ApiError(404, "Account not found");
    }

    return this.toSafeOwner(owner);
  }

  /**
   * Idempotently creates the predefined business-owner account from the
   * ADMIN_* environment variables. If an account already exists for the
   * configured email or mobile, it is left untouched (including its
   * password). Safe to run on every deployment/restart.
   */
  static async seedOwner(): Promise<{
    created: boolean;
    owner: SafeOwner;
  }> {
    const name = process.env.ADMIN_NAME?.trim() || "Business Owner";
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;
    const mobile = process.env.ADMIN_MOBILE?.trim() || null;
    const password = process.env.ADMIN_PASSWORD;

    if (!email && !mobile) {
      throw new ApiError(
        500,
        "ADMIN_EMAIL or ADMIN_MOBILE must be set to seed the owner account",
      );
    }

    if (!password) {
      throw new ApiError(
        500,
        "ADMIN_PASSWORD must be set to seed the owner account",
      );
    }

    let existing: Owner | null = null;

    if (email) {
      existing = await OwnerRepository.findByIdentifier(email);
    }

    if (!existing && mobile) {
      existing = await OwnerRepository.findByIdentifier(mobile);
    }

    if (existing) {
      return { created: false, owner: this.toSafeOwner(existing) };
    }

    const hashedPassword = await this.hashPassword(password);

    const created = await OwnerRepository.createOwner({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

    if (!created) {
      throw new ApiError(500, "Failed to create the owner account");
    }

    return { created: true, owner: this.toSafeOwner(created) };
  }
}
