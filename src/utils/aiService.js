import { getApiUrl } from "./api";

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                reject(new Error("Failed to read image."));
                return;
            }

            const base64 = reader.result.split(",")[1];

            if (!base64) {
                reject(new Error("Failed to convert image."));
                return;
            }

            resolve(base64);
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
    const desktopImage = desktopFile
        ? {
            data: await fileToBase64(desktopFile),
            mime_type: desktopFile.type,
        }
        : null;

    const mobileImage = mobileFile
        ? {
            data: await fileToBase64(mobileFile),
            mime_type: mobileFile.type,
        }
        : null;

    const response = await fetch(getApiUrl("/api/generate"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            pageName,
            desktopImage,
            mobileImage,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(
            data?.error || "AI generation failed."
        );

        error.status = response.status;
        throw error;
    }

    if (!data?.code) {
        throw new Error("Backend returned empty JSX code.");
    }

    return data.code;
}
