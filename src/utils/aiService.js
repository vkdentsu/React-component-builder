import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});


// Convert File -> base64
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const result = reader.result;

                if (typeof result !== "string") {
                    reject(new Error("Failed to read image."));
                    return;
                }

                const base64 = result.split(",")[1];

                if (!base64) {
                    reject(new Error("Failed to convert image to base64."));
                    return;
                }

                resolve(base64);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read image file."));
        };

        reader.readAsDataURL(file);
    });
}


export async function convertDesignToJSX(
    pageName,
    desktopFile,
    mobileFile
) {

    try {

        const input = [];


        // -----------------------------------------
        // Desktop image
        // -----------------------------------------

        if (desktopFile) {

            const base64 = await fileToBase64(desktopFile);

            input.push({
                type: "image",
                data: base64,
                mime_type: desktopFile.type,
            });
        }


        // -----------------------------------------
        // Mobile image
        // -----------------------------------------

        if (mobileFile) {

            const base64 = await fileToBase64(mobileFile);

            input.push({
                type: "image",
                data: base64,
                mime_type: mobileFile.type,
            });
        }


        // -----------------------------------------
        // Prompt
        // -----------------------------------------

        input.push({
            type: "text",
            text: `
You are an expert React frontend developer.

Analyze the uploaded website design image(s).

Convert the design into a functional React JSX component.

The component name must be:

${pageName}

Requirements:

1. Return ONLY the complete JSX code.

2. Do NOT use markdown code fences.

3. Do NOT provide explanations.

4. Do NOT put anything before or after the JSX.

5. Recreate the uploaded design as accurately as possible.

6. Analyze carefully:
   - page structure
   - layout
   - spacing
   - margins
   - padding
   - typography
   - font sizes
   - font weights
   - colors
   - backgrounds
   - borders
   - border radius
   - shadows
   - buttons
   - cards
   - images
   - alignment
   - widths
   - heights

7. If a desktop and mobile design are provided, use both designs to determine responsive behavior.

8. The component must be responsive.

9. Use standard React JSX.

10. Use inline styles or CSS classes.

11. Do not use external UI libraries.

12. Do not use Tailwind unless absolutely necessary.

13. The component must be directly usable in a React application.

14. Component name must be exactly:
${pageName}

Return ONLY the JSX component.
            `,
        });


        // -----------------------------------------
        // Gemini Interactions API
        // -----------------------------------------

        console.log(
            "Calling Gemini model: gemini-3.6-flash"
        );

        const interaction = await ai.interactions.create({
            model: "gemini-3.6-flash",
            input: input,
        });


        // -----------------------------------------
        // Read response
        // -----------------------------------------

        let code = interaction.output_text;


        if (!code) {
            throw new Error(
                "Gemini returned an empty response."
            );
        }


        // -----------------------------------------
        // Remove markdown fences if Gemini adds them
        // -----------------------------------------

        code = code
            .replace(/^```(?:jsx|javascript|react)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();


        console.log(
            "Gemini JSX generation completed."
        );


        return code;

    } catch (error) {

        console.error(
            "Gemini API Error:",
            error
        );

        throw error;
    }
}