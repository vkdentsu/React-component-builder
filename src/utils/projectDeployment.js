import { authenticatedFetch } from './api';
import { generateJSX } from './codeGen';

function componentNameFromPage(pageName) {
  const safeName = String(pageName || 'Page')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') || 'Page';
  return /^\d/.test(safeName) ? `Page${safeName}` : safeName;
}

export function prepareProjectPagesForDeployment(pages, currentPage) {
  return pages.map((page) => {
    const source = page.id === currentPage?.id
      ? {
          ...page,
          contentJson: {
            ...(page.contentJson || {}),
            rows: currentPage.rows,
            globalFont: currentPage.globalFont,
          },
        }
      : page;
    const content = source.contentJson || {};
    let jsx = content.type === 'generated-jsx'
      ? content.jsx
      : generateJSX(
          Array.isArray(content.rows) ? content.rows : [],
          componentNameFromPage(source.name),
          content.globalFont,
        );
    if (typeof jsx !== 'string' || !jsx.trim()) {
      throw new Error(`Page "${source.name}" has no saved content to deploy.`);
    }
    if (content.type !== 'generated-jsx' && (!Array.isArray(content.rows) || content.rows.length === 0)) {
      throw new Error(`Add and save content on "${source.name}" before deploying the project.`);
    }
    return { pageId: source.id, jsx };
  });
}

export async function deployProjectToVercel(projectId, pages, currentPage) {
  const deploymentPages = prepareProjectPagesForDeployment(pages, currentPage);
  const response = await authenticatedFetch('/api/integrations/vercel/deploy-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, pages: deploymentPages }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || 'Could not deploy the project to Vercel.');
  }
  return result.data;
}
