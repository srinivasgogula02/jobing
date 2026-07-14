const RUNTIME_CLIENT = '<script src="/_jobing/forms-client.js" defer></script>';

export function renderPageDocument(source: string): string {
  const html = source
    .trim()
    .replaceAll("https://jobing.site/f/", "https://forms.jobing.site/forms/f/");

  if (/<\/body\s*>/i.test(html)) {
    return html.replace(/<\/body\s*>/i, `${RUNTIME_CLIENT}</body>`);
  }

  if (/<html(?:\s|>)/i.test(html)) return `${html}${RUNTIME_CLIENT}`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}${RUNTIME_CLIENT}</body></html>`;
}

export function renderErrorDocument(title: string, message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body><main><h1>${title}</h1><p>${message}</p></main></body></html>`;
}
