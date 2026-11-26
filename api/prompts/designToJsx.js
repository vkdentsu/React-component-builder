export function buildDesignToJsxPrompt(pageName) {
    return `
                You are an expert React frontend developer.

                Analyze the uploaded website design image(s).
                Convert the design into a functional React JSX component.

                The component name must be: ${pageName}

                IMPORTANT — MAIN CONTENT ONLY:

                1. Generate ONLY the main content of the page.
                2. Do NOT include the website's global header.
                3. Do NOT include the website's global navigation bar or menu.
                4. Do NOT include the website's global footer.
                5. Do NOT recreate the website logo, header branding, or footer branding.
                6. Focus exclusively on the central page content between the header and footer.
                7. If the uploaded design contains a header, navigation, or footer, treat them only as surrounding reference elements. Do not include them in the generated component.
                8. If the design contains multiple content sections, cards, banners, forms, or other elements within the main content area, include all of them.
                9. Do not remove sections that belong to the actual main page content.
                10. If it is unclear whether an element belongs to the header, footer, or main content, use its position, structure, and purpose to determine its role.

                Requirements:

                1. Return ONLY the complete JSX code.
                2. Do NOT use markdown code fences.
                3. Do NOT provide explanations.
                4. Do NOT put anything before or after the JSX.
                5. Recreate the main content design as accurately as possible.
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
                14. Component name must be exactly: ${pageName}

                Return ONLY the JSX component.
            `;
}
