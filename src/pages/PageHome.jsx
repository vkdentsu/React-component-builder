import { useMemo } from "react";
import { PreviewRows } from "../components/PreviewModal";
import ThemeProvider from "../components/ThemeProvider";
import { buildGeneratedPreviewDocument } from "../utils/generatedPreview";

export default function PageHome({ page }) {
    const isGeneratedPage = page.contentJson?.type === "generated-jsx";

    const { previewDocument, previewError } = useMemo(() => {
        if (!isGeneratedPage) {
            return { previewDocument: "", previewError: "" };
        }

        try {
            return {
                previewDocument: buildGeneratedPreviewDocument(page.name, page.contentJson.jsx),
                previewError: "",
            };
        } catch (error) {
            console.error("Could not render the selected homepage:", error);
            return {
                previewDocument: "",
                previewError: error.message || "The selected page could not be rendered.",
            };
        }
    }, [isGeneratedPage, page.contentJson, page.name]);

    return (
        <div className="min-h-screen bg-white">
            {isGeneratedPage ? (
                previewError ? (
                    <p role="alert" className="m-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        {previewError}
                    </p>
                ) : (
                    <iframe
                        title={`${page.name} homepage`}
                        srcDoc={previewDocument}
                        sandbox="allow-scripts"
                        className="block min-h-screen w-full border-0"
                    />
                )
            ) : Array.isArray(page.contentJson?.rows) ? (
                <ThemeProvider
                    theme={page.theme}
                    className="min-h-[calc(100vh-53px)]"
                    style={{
                        backgroundColor: "var(--theme-bg, #ffffff)",
                        color: "var(--theme-text, #0f172a)",
                        fontFamily: page.contentJson.globalFont || undefined,
                    }}
                >
                    {page.contentJson.rows.length > 0 ? (
                        <main className="w-full">
                            <PreviewRows rows={page.contentJson.rows} device="desktop" />
                        </main>
                    ) : (
                        <p className="p-8 text-center text-sm opacity-70">This page has no content yet.</p>
                    )}
                </ThemeProvider>
            ) : (
                <p role="alert" className="m-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                    This page format cannot be displayed as a homepage.
                </p>
            )}
        </div>
    );
}
