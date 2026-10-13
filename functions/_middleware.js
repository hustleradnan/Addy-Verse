const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'WhatsApp',
  'TelegramBot',
  'LinkedInBot',
  'Slackbot',
  'Discordbot',
  'Pinterest',
  'redditbot',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some((bot) => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml({ title, description, url, image, type }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="${type}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${url}" />
${image ? `<meta property="og:image" content="${image}" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${image}" />` : ''}
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  if (!isBot(userAgent)) {
    return next();
  }

  const SITE_URL = 'https://addyverse.pages.dev';
  const path = url.pathname;

  try {
    const ebookMatch = path.match(/^\/ebooks\/([^/]+)\/?$/);
    const articleMatch = path.match(/^\/articles\/([^/]+)\/?$/);

    if (ebookMatch) {
      const slug = ebookMatch[1];
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/ebooks?select=title,author,description,cover_image,slug&slug=eq.${slug}&is_published=eq.true`,
        {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      const data = await res.json();
      const ebook = Array.isArray(data) ? data[0] : null;

      if (ebook) {
        const html = buildHtml({
          title: `${ebook.title} by ${ebook.author} - BookVault`,
          description: ebook.description ? ebook.description.slice(0, 160) : `Get ${ebook.title} on BookVault.`,
          url: `${SITE_URL}/ebooks/${ebook.slug}`,
          image: ebook.cover_image,
          type: 'book',
        });
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      }
    }

    if (articleMatch) {
      const slug = articleMatch[1];
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/articles?select=title,seo_title,seo_description,featured_image,slug&slug=eq.${slug}&is_published=eq.true`,
        {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      const data = await res.json();
      const article = Array.isArray(data) ? data[0] : null;

      if (article) {
        const html = buildHtml({
          title: article.seo_title || `${article.title} - BookVault`,
          description: article.seo_description || article.title,
          url: `${SITE_URL}/articles/${article.slug}`,
          image: article.featured_image,
          type: 'article',
        });
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      }
    }
  } catch (err) {
    // Agar kuch error aaye, normal site dikha do
  }

  return next();
}
