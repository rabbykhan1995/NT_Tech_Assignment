import express, { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware } from "../../middlewares/auth.middleware";
import axios from "axios";


const router = express.Router();

const N8N_WEBHOOK_URL =
  "http://localhost:5678/webhook/cf7329e4-80f0-42ff-a7bf-4f88cc6f50ac";

router.post(
  "/create-description",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // n8n Webhook-এ রিকোয়েস্ট পাঠানো
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, { title });
    const resData = n8nResponse.data;

    // ১. ডাটা কোথায় আছে তা ডায়নামিকভাবে খুঁজে বের করা
    let rawContent = "";

    if (Array.isArray(resData)) {
      rawContent = resData[0]?.content?.parts?.[0]?.text || resData[0]?.text || "";
    } else if (typeof resData === "object" && resData !== null) {
      rawContent = resData.content?.parts?.[0]?.text || resData.text || resData.markdown_description || "";
    }

    // যদি n8n থেকে কোনো ডাটা না আসে
    if (!rawContent) {
      console.log("Unexpected n8n Data Payload Structure:", resData);
      return res.status(500).json({
        success: false,
        message: "Failed to receive generated description from AI",
        receivedData: resData,
      });
    }

    // ২. Gemini-র জেনারেট করা Stringified JSON পার্স করা
    let parsedData;
    try {
      const cleanJsonString = rawContent
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      parsedData = JSON.parse(cleanJsonString);
    } catch (parseError) {
      console.error("JSON Parsing Error:", parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response into JSON",
        rawContent,
      });
    }

    // ৩. ফাইনাল রেসপন্স
    return res.status(200).json({
      success: true,
      message: "Description generated successfully",
      data: {
        shortDescription: parsedData.short_description || "",
        markdownDescription: parsedData.markdown_description || "",
      },
    });
  })
);


export default router;
