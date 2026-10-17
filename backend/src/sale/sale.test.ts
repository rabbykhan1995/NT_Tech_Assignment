// // @ts-ignore
// import { describe, it, expect, beforeAll, afterAll } from "bun:test";
// import mongoose from "mongoose";
// import Product from "./product.model";
// import { connectDB } from "../../config/db.config";

// beforeAll(async () => {
//   await connectDB();
// });

// afterAll(async () => {
//   await mongoose.connection.close();
// });

// describe("Product Model Unit Test", () => {
//   it("should create a product", async () => {
//     const product = await Product.create({
//       title: "Test Product",
//       slug: "test-product",
//       rating: 5,
//       images: [],
//       price: 100,
//       stock: 10,
//       reviewers: 0,
//       averageReview: 0,
//     });

//     expect(product.title).toBe("Test Product");
//     expect(product.slug).toBe("test-product");

//     // Cleanup
//     await Product.deleteOne({ _id: product._id });
//   });

//   it("should fail if required field missing", async () => {
//     let errorOccurred = false;
//     try {
//       await Product.create({ slug: "missing-title" } as any);
//     } catch (err) {
//       errorOccurred = true;
//     }
//     expect(errorOccurred).toBe(true);
//   });
// });
