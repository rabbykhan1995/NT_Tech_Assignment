import { userStore } from "../stores/user.store";
import { toBengaliNum, languageStore } from "../stores/language.store";

class Helper {
  constructor() { }
  private static localKey = "token";
  // ✅ Get Token
  static setToken(token: string) {
    // LocalStorage
    localStorage.setItem(this.localKey, token);

    // Cookie (7 days)
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7};`;
  }

  // ✅ Get token (localStorage first, then cookie)
  static getToken(): string | null {
    // Try localStorage first
    const localToken = localStorage.getItem(this.localKey);
    if (localToken) return localToken;

    // Fallback to cookie
    const match = document.cookie.match(new RegExp(`(^| )${this.localKey}=([^;]+)`));
    return match ? match[2] : null;
  }

  // ✅ Clear token from both localStorage and cookie
  static clearToken() {
    // LocalStorage
    localStorage.removeItem(this.localKey);

    // Cookie
    document.cookie = `${this.localKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  }

  // ✅ Decode JWT payload (falls back to empty object when invalid)
  static decodeToken<T = Record<string, unknown>>(): T | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      );
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  }

  // ✅ Determine the type of the current admin token
  static getTokenType(): "user" | "super_admin" | "location" | "staff" | null {
    const decoded = this.decodeToken<{
      tokenType?: "user" | "super_admin" | "location" | "staff";
    }>();
    return decoded?.tokenType ?? null;
  }

  static stripMarkDown(text: string) {
    return text
      .replace(/[#_*>\-`]/g, "")
      .replace(/\n/g, " ")
      .slice(0, 150);
  }
  static getImage(image: string | null | ""): string {
    if (
      !image ||
      typeof image !== "string" ||
      image.trim() === "" ||
      image.includes("undefined") ||
      image.includes("null")
    ) {
      return "/no-image.png";
    }

    const trimmed = image.trim();
    const lower = trimmed.toLowerCase();

    // ✅ If it's a full HTTP(S) URL, accept it directly (ImageKit, S3, Cloudinary, etc. don't always have extensions)
    if (lower.startsWith("http://") || lower.startsWith("https://")) {
      return encodeURI(trimmed);
    }

    // ✅ For local/relative paths, check valid image extensions
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const pathname = lower.split("?")[0];

    const hasValidExtension = validExtensions.some((ext) =>
      pathname.endsWith(ext),
    );

    if (!hasValidExtension) {
      return "/no-image.png";
    }

    return encodeURI(trimmed);
  }
  
  static formatDate(date: Date | string | number | null | undefined): string {
    if (!date) return "";

    const d = new Date(date); // ISO string handle
    const day = String(d.getDate()).padStart(2, "0"); // 1 -> 01
    const month = String(d.getMonth() + 1).padStart(2, "0"); // 0-indexed
    const year = d.getFullYear();

    const isBn = languageStore.getState().language === "bn";
    const formatted = `${day}-${month}-${year}`;
    return isBn ? toBengaliNum(formatted) : formatted;
  }

  static formatIndianNumber(num: number): string {
    const str = num.toString();
    const len = str.length;
    
    if (len <= 3) return str;
    
    // ✅ Last 3 digits
    let result = str.slice(-3);
    let remaining = str.slice(0, -3);
    
    // ✅ Add commas every 2 digits for remaining
    while (remaining.length > 0) {
        if (remaining.length <= 2) {
            result = remaining + ',' + result;
            break;
        }
        result = remaining.slice(-2) + ',' + result;
        remaining = remaining.slice(0, -2);
    }
    
    return result;
}

static formatLongNumber(n: number | null | undefined): string {
    if (!n || isNaN(n)) return "0";
    
    // ✅ Round to 2 decimal places
    const rounded = Math.round(n * 100) / 100;
    
    // ✅ Split into integer and decimal parts
    const [integerPart, decimalPart] = rounded.toString().split('.');
    
// ✅ Format integer part with commas (Indian format: lakhs, thousands)
    const formattedInteger = this.formatIndianNumber(parseInt(integerPart));
    
    // ✅ Combine with decimal part if exists
    let result = decimalPart
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;

    // ✅ Localize digits (Bengali numerals) when language is bn
    if (languageStore.getState().language === "bn") {
      result = toBengaliNum(result);
    }

    return result;
  }

  static isPermitter(permission: string): boolean {
    // Single-owner system: any authenticated owner has access to everything.
    return permission.length >= 0 && Boolean(userStore.getState().user);
  }
}

export default Helper;
