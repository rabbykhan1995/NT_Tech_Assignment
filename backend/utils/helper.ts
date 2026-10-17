import slugify from "slugify";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import crypto from "crypto";
import dayjs from "dayjs";

const BCRYPT_SECRET = process.env.BCRYPT_SECRET;

export default class Helper {
  static randomSuffix(): string {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const l1 = letters[Math.floor(Math.random() * letters.length)];
    const l2 = letters[Math.floor(Math.random() * letters.length)];
    const number = Math.floor(1 + Math.random() * 1000);

    return `${l1}${number}${l2}`;
  }

  static generateSlug(title: string): string {
    return slugify(title, {
      lower: true,
      strict: true,
    });
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // security factor
    const hashed = await bcrypt.hash(password + BCRYPT_SECRET, saltRounds);
    return hashed;
  }

  // 2️⃣ Compare Password
  static async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password + BCRYPT_SECRET, hashedPassword);
  }

  static getPublicIdFromUrl(url: string) {
    const parts = url.split("/");
    const fileName = parts[parts.length - 1]; // abc123.jpg
    const folder = parts[parts.length - 2]; // trainings or blogs
    return `${folder}/${fileName.split(".")[0]}`;
  }
  static generateRandomID(): string {
    const uniqueId: string = crypto.randomUUID();
    return uniqueId;
  }

  static generateOTP(): number {
    // 100000–999999 random 6 digit number
    return Math.floor(100000 + Math.random() * 900000);
  }

  static getWeekNumber(date: Date) {

    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;

    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  }

  static roundQty(n: number): number {
    return Number(n.toFixed(6))
  }

  static formatDate(date: Date): string {
    if (!date) return "";

    const d = new Date(date); // ISO string handle
    const day = String(d.getDate()).padStart(2, "0"); // 1 -> 01
    const month = String(d.getMonth() + 1).padStart(2, "0"); // 0-indexed
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }

  static getWarrantyExpireDate(saleDate: Date, warrantyDay: number): Date {
    return dayjs(saleDate).add(warrantyDay, "day").toDate()
  }



}
