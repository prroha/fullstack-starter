import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  resetPasswordSchema,
  contactSchema,
  getZodErrorMessages,
  validateWithSchema,
} from "../validations";
import { z } from "zod";

describe("loginSchema", () => {
  it("should pass with valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should fail with empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validData = {
    name: "John Doe",
    email: "test@example.com",
    password: "Password1",
    confirmPassword: "Password1",
  };

  it("should pass with valid data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail when passwords do not match", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain("Passwords do not match");
    }
  });

  it("should fail with weak password (no uppercase)", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with weak password (no number)", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Passwordd",
      confirmPassword: "Passwordd",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid email", () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: "bad-email",
    });
    expect(result.success).toBe(false);
  });

  it("should pass with empty name (optional)", () => {
    const result = registerSchema.safeParse({
      ...validData,
      name: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  const validData = {
    currentPassword: "OldPass1",
    newPassword: "NewPass1",
    confirmNewPassword: "NewPass1",
  };

  it("should pass with valid data", () => {
    const result = changePasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail when confirm does not match", () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      confirmNewPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when new password equals current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "SamePass1",
      newPassword: "SamePass1",
      confirmNewPassword: "SamePass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain("New password must be different from current password");
    }
  });
});

describe("resetPasswordSchema", () => {
  it("should pass with valid matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NewPass1",
      confirmPassword: "NewPass1",
    });
    expect(result.success).toBe(true);
  });

  it("should fail when passwords do not match", () => {
    const result = resetPasswordSchema.safeParse({
      password: "NewPass1",
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });
});

describe("contactSchema", () => {
  const validData = {
    name: "John Doe",
    email: "john@example.com",
    subject: "Hello there",
    message: "This is a test message with enough chars.",
  };

  it("should pass with valid data", () => {
    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail with message too short", () => {
    const result = contactSchema.safeParse({
      ...validData,
      message: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("should fail with empty subject", () => {
    const result = contactSchema.safeParse({
      ...validData,
      subject: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("getZodErrorMessages", () => {
  it("should extract field-message map from ZodError", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = getZodErrorMessages(result.error);
      expect(messages).toHaveProperty("email");
      expect(messages).toHaveProperty("password");
      expect(typeof messages.email).toBe("string");
    }
  });

  it("should only keep first error per field", () => {
    // Email with multiple violations
    const schema = z.object({
      email: z.string().min(1, "Required").email("Invalid"),
    });
    const result = schema.safeParse({ email: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = getZodErrorMessages(result.error);
      expect(messages.email).toBe("Required");
    }
  });
});

describe("validateWithSchema", () => {
  it("should return success with parsed data for valid input", () => {
    const result = validateWithSchema(loginSchema, {
      email: "test@example.com",
      password: "pass123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("should return errors for invalid input", () => {
    const result = validateWithSchema(loginSchema, {
      email: "",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveProperty("email");
      expect(result.errors).toHaveProperty("password");
    }
  });
});
