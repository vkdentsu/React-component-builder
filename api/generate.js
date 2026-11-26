import { GoogleGenAI } from "@google/genai";
import { buildDesignToJsxPrompt } from "./prompts/designToJsx.js";

export default async function handler(req, res) {
    
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed.",
        });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing.");

            return res.status(500).json({
                error: "Server API key is not configured.",
            });
        }

        const {
            pageName,
            desktopImage,
            mobileImage,
        } = req.body || {};

        if (!pageName?.trim()) {
            return res.status(400).json({
                error: "Page name is required.",
            });
        }

        if (!desktopImage?.data || !desktopImage?.mime_type) {
            return res.status(400).json({
                error: "Desktop image is required.",
            });
        }

        const ai = new GoogleGenAI({
            apiKey,
        });

        const input = [];

        // Desktop image
        input.push({
            type: "image",
            data: desktopImage.data,
            mime_type: desktopImage.mime_type,
        });

        // Mobile image
        if (mobileImage?.data && mobileImage?.mime_type) {
            input.push({
                type: "image",
                data: mobileImage.data,
                mime_type: mobileImage.mime_type,
            });
        }

        input.push({
            type: "text",
            text: buildDesignToJsxPrompt(pageName),
        });

        // Gemini Interactions API
        console.log(
            "Calling Gemini model: gemini-3.6-flash"
        );

        const interaction = await ai.interactions.create({
            model: "gemini-3.6-flash",
            input,
        });

        // Read response
        let code = interaction.output_text;

        if (!code) {
            throw new Error(
                "Gemini returned an empty response."
            );
        }

        // Remove Markdown code fences if present
        code = code
            .replace(/^```(?:jsx|javascript|react)?\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();

        console.log(
            "Gemini JSX generation completed."
        );

        return res.status(200).json({
            success: true,
            code,
        });
    } catch (error) {
        console.error(
            "Gemini API error:",
            error?.status || "",
            error?.message || "Unknown error"
        );

        const status = Number(error?.status) || 500;

        return res.status(status).json({
            error: status === 429
                ? "Gemini quota reached. Please try again later."
                : "Gemini generation failed. Check the backend logs.",
        });
    }
}
