export function generateJSX(pageName, design) {

    return `
function ${pageName}() {

    return (

${generateNode(design, 2)}

    );

}

export default ${pageName};
`;

}

function generateNode(node, indentLevel = 0) {

    const indent = "    ".repeat(indentLevel);

    switch (node.type) {

        case "main":

            return `${indent}<main>

${node.children.map(child => generateNode(child, indentLevel + 1)).join("\n\n")}

${indent}</main>`;

        case "heading":

            return `${indent}<h1>${node.text}</h1>`;

        case "paragraph":

            return `${indent}<p>${node.text}</p>`;

        case "button":

            return `${indent}<button>${node.text}</button>`;

        default:

            return "";

    }

}