import { afterEach, describe, expect, spyOn, test } from "bun:test";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import { ApiError } from "../../utils/ApiError";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { OwnerRepository } from "./owner.repo";
import { OwnerService } from "./owner.service";
import ownerRoute from "./owner.route";
import type { Owner } from "./owner.type";

process.env.JWT_SECRET = "test-secret";
process.env.BCRYPT_SECRET = "test-pepper";

afterEach(() => {
  (
    OwnerRepository.findByIdentifier as unknown as { mockRestore?: () => void }
  ).mockRestore?.();
  (
    OwnerRepository.findById as unknown as { mockRestore?: () => void }
  ).mockRestore?.();
  (
    OwnerRepository.createOwner as unknown as { mockRestore?: () => void }
  ).mockRestore?.();
});

function buildOwner(overrides: Partial<Owner> = {}): Owner {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Business Owner",
    email: "owner@example.com",
    mobile: "01712345678",
    password: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Owner;
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", ownerRoute);
  app.get("/api/protected", authMiddleware, (_req, res) =>
    res.status(200).json({ success: true }),
  );
  return app;
}

describe("owner password hashing", () => {
  test("verifies a correct password and rejects a wrong one", async () => {
    const hash = await OwnerService.hashPassword("ChangeMe@123");

    expect(hash).not.toContain("ChangeMe@123");
    expect(await OwnerService.verifyPassword("ChangeMe@123", hash)).toBe(true);
    expect(await OwnerService.verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("owner tokens", () => {
  test("round-trips a token", () => {
    const token = OwnerService.generateToken({
      ownerID: "abc",
      tokenType: "owner",
    });

    const decoded = OwnerService.verifyToken(token);
    expect(decoded?.ownerID).toBe("abc");
    expect(decoded?.tokenType).toBe("owner");
  });

  test("rejects an invalid token", () => {
    expect(OwnerService.verifyToken("not-a-token")).toBeNull();
  });

  test("rejects an expired token", () => {
    const expired = jwt.sign(
      { ownerID: "abc", tokenType: "owner" },
      "test-secret",
      { expiresIn: -10 },
    );

    expect(OwnerService.verifyToken(expired)).toBeNull();
  });

  test("rejects a token signed with a different secret", () => {
    const forged = jwt.sign(
      { ownerID: "abc", tokenType: "owner" },
      "other-secret",
    );

    expect(OwnerService.verifyToken(forged)).toBeNull();
  });
});

describe("owner login", () => {
  test("returns a token and safe owner for valid credentials", async () => {
    const password = await OwnerService.hashPassword("ChangeMe@123");
    spyOn(OwnerRepository, "findByIdentifier").mockResolvedValue(
      buildOwner({ password }),
    );

    const result = await OwnerService.login({
      identifier: "Owner@Example.com",
      password: "ChangeMe@123",
    });

    expect(result.token).toBeTruthy();
    expect(result.owner.email).toBe("owner@example.com");
    expect(result.owner).not.toHaveProperty("password");
  });

  test("rejects a wrong password with a generic 401", async () => {
    const password = await OwnerService.hashPassword("ChangeMe@123");
    spyOn(OwnerRepository, "findByIdentifier").mockResolvedValue(
      buildOwner({ password }),
    );

    await expect(
      OwnerService.login({ identifier: "owner@example.com", password: "nope" }),
    ).rejects.toMatchObject({ statusCode: 401, message: "Invalid credentials" });
  });

  test("rejects an unknown account with the same generic 401", async () => {
    spyOn(OwnerRepository, "findByIdentifier").mockResolvedValue(null as any);

    await expect(
      OwnerService.login({ identifier: "nobody@example.com", password: "x" }),
    ).rejects.toMatchObject({ statusCode: 401, message: "Invalid credentials" });
  });
});

describe("owner seed", () => {
  test("creates the account when none exists", async () => {
    process.env.ADMIN_EMAIL = "owner@example.com";
    process.env.ADMIN_MOBILE = "01712345678";
    process.env.ADMIN_PASSWORD = "ChangeMe@123";
    process.env.ADMIN_NAME = "Business Owner";

    spyOn(OwnerRepository, "findByIdentifier").mockResolvedValue(null as any);
    spyOn(OwnerRepository, "createOwner").mockResolvedValue(buildOwner());

    const result = await OwnerService.seedOwner();

    expect(result.created).toBe(true);
    expect(result.owner.email).toBe("owner@example.com");
  });

  test("is idempotent and never overwrites an existing account", async () => {
    process.env.ADMIN_EMAIL = "owner@example.com";
    process.env.ADMIN_PASSWORD = "ChangeMe@123";

    const findSpy = spyOn(OwnerRepository, "findByIdentifier").mockResolvedValue(
      buildOwner(),
    );
    const createSpy = spyOn(OwnerRepository, "createOwner");
    createSpy.mockClear();

    const result = await OwnerService.seedOwner();

    expect(result.created).toBe(false);
    expect(findSpy).toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe("auth middleware", () => {
  test("rejects a request with no token", () => {
    let captured: unknown;
    const req = { headers: {}, cookies: {} } as any;
    const res = { clearCookie: () => {} } as any;

    authMiddleware(req, res, (error?: unknown) => {
      captured = error;
    });

    expect(captured).toBeInstanceOf(ApiError);
    expect((captured as ApiError).statusCode).toBe(401);
  });

  test("rejects an invalid token", () => {
    let captured: unknown;
    const req = {
      headers: { authorization: "Bearer invalid.token.here" },
      cookies: {},
    } as any;
    const res = { clearCookie: () => {} } as any;

    authMiddleware(req, res, (error?: unknown) => {
      captured = error;
    });

    expect((captured as ApiError).statusCode).toBe(401);
  });

  test("accepts a valid token and attaches the identity", () => {
    const token = OwnerService.generateToken({
      ownerID: "owner-1",
      tokenType: "owner",
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    } as any;
    const res = { clearCookie: () => {} } as any;

    let calledWith: unknown = "not-called";
    authMiddleware(req, res, (error?: unknown) => {
      calledWith = error;
    });

    expect(calledWith).toBeUndefined();
    expect(req.payload.ownerID).toBe("owner-1");
  });
});

describe("owner HTTP routes", () => {
  const app = buildApp();

  test("exposes no public registration endpoint", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ identifier: "x", password: "y" });

    expect(res.status).toBe(404);
  });

  test("rejects login without a body", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  test("protected endpoint rejects requests without a token", async () => {
    const res = await request(app).get("/api/protected");
    expect(res.status).toBe(401);
  });

  test("protected endpoint accepts a valid token", async () => {
    spyOn(OwnerRepository, "findById").mockResolvedValue(buildOwner());
    const token = OwnerService.generateToken({
      ownerID: "owner-1",
      tokenType: "owner",
    });

    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
