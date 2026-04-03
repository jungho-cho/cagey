#!/usr/bin/env node
/**
 * Cagey — Static Site Generator for SEO
 *
 * Generates locale-prefixed pages for daily puzzles, practice puzzles,
 * how-to-play, archive, and 404. Each page is a standalone HTML file
 * with unique meta tags, hreflang, and puzzle config.
 *
 * Usage: node scripts/build-pages.js [--days 365] [--practice 200]
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const LOCALES_DIR = path.join(ROOT, 'locales');
const SITE_URL = 'https://playcagey.com';
const LOCALES = ['en', 'ko', 'ja', 'de', 'es', 'pt'];
const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const LAUNCH_DATE = new Date('2026-04-01T00:00:00Z');

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1]) : def;
};
const DAILY_DAYS = getArg('days', 365);
const PRACTICE_PER_DIFF = getArg('practice', 200);

// ── Helpers ─────────────────────────────────────────────────
function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadFileOrEmpty(filePath) {
  try { return fs.readFileSync(filePath, 'utf-8'); } catch { return ''; }
}

// mulberry32 PRNG (matches game logic)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Daily challenge info (matches getDailyInfo in index.html)
function getDailyInfo(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayIndex = Math.floor((date.getTime() - LAUNCH_DATE.getTime()) / 86400000);
  const puzzleNum = Math.max(1, dayIndex + 1);
  const diffs = ['easy', 'medium', 'hard', 'expert'];
  const diff = diffs[((dayIndex % 4) + 4) % 4];
  const numDate = parseInt(dateStr.replace(/-/g, ''));
  const rng = mulberry32(numDate);
  const seed = (rng() * 0xFFFFFFFF) >>> 0;
  return { puzzleNum, diff, seed, dateStr };
}

// Practice puzzle seed (deterministic)
function getPracticeSeed(diffIndex, puzzleNum) {
  return diffIndex * 1000 + puzzleNum;
}

// Format date for display
function formatDate(dateStr, locale) {
  const date = new Date(dateStr + 'T00:00:00Z');
  const opts = { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' };
  try { return date.toLocaleDateString(locale, opts); } catch { return dateStr; }
}

// ── Template Processing ─────────────────────────────────────
function readTemplate() {
  return fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
}

function buildHreflangTags(pagePath) {
  return LOCALES.map(l =>
    `<link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}${pagePath}">`
  ).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}/en${pagePath}">`;
}

function buildJsonLd(type, locale, meta, extra = {}) {
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "name": "Cagey",
      "url": `${SITE_URL}/`,
      "description": meta.homeDesc,
      "inLanguage": locale,
      "publisher": { "@id": `${SITE_URL}/#creator` }
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#creator`,
      "name": "Jungho Cho"
    }
  ];

  if (type === 'game') {
    graph.push({
      "@type": ["WebApplication", "Game"],
      "@id": `${SITE_URL}/#game`,
      "name": "Cagey",
      "url": extra.canonicalUrl || `${SITE_URL}/${locale}/`,
      "description": extra.description || meta.homeDesc,
      "inLanguage": locale,
      "applicationCategory": "GameApplication",
      "genre": "Puzzle",
      "operatingSystem": "Web Browser",
      "browserRequirements": "Requires JavaScript",
      "playMode": "SinglePlayer",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "image": `${SITE_URL}/og-image.png`,
      "author": { "@id": `${SITE_URL}/#creator` },
      ...extra.jsonLdExtra || {}
    });
  } else if (type === 'faq') {
    // FAQ schema added by how-to-play page content
  } else if (type === 'collection') {
    graph.push({
      "@type": "CollectionPage",
      "name": extra.title,
      "url": extra.canonicalUrl,
      "description": extra.description,
      "inLanguage": locale
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

/**
 * Transform index.html into a page with specific config.
 */
function buildGamePage(template, locale, strings, meta, pageConfig) {
  const { title, description, canonicalUrl, pagePath, pageType, pageData } = pageConfig;
  let html = template;

  // Replace lang attribute
  html = html.replace(/<html lang="en">/, `<html lang="${locale}">`);

  // Replace title
  html = html.replace(/<title>[^<]+<\/title>/, `<title>${escHtml(title)}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escAttr(description)}">`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${canonicalUrl}">`
  );

  // Replace OG tags
  html = html.replace(/(<meta property="og:title" content=")[^"]*"/, `$1${escAttr(title)}"`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*"/, `$1${escAttr(description)}"`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*"/, `$1${canonicalUrl}"`);

  // Replace Twitter tags
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${escAttr(title)}"`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${escAttr(description)}"`);

  // Replace JSON-LD
  const jsonLd = buildJsonLd('game', locale, meta, { canonicalUrl, description });
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${jsonLd}\n</script>`
  );

  // Add hreflang tags after canonical
  const hreflang = buildHreflangTags(pagePath);
  html = html.replace(
    /(<link rel="canonical"[^>]*>)/,
    `$1\n${hreflang}`
  );

  // Inject page config before the main script
  const pageConfigScript = `<script>
window.CAGEY_PAGE = ${JSON.stringify(pageData)};
window.CAGEY_LOCALE = ${JSON.stringify(locale)};
window.CAGEY_STRINGS = ${JSON.stringify(strings)};
</script>`;
  html = html.replace('<script>\n\'use strict\';', `${pageConfigScript}\n<script>\n'use strict';`);

  // Fix asset paths (go from /en/daily/2026-04-03/ back to root)
  const depth = pagePath.split('/').filter(Boolean).length;
  const prefix = '../'.repeat(depth + 1); // +1 for locale prefix
  html = html.replace(/href="\/favicon\.svg"/g, `href="${prefix}favicon.svg"`);
  html = html.replace(/src="\.\/src\//g, `src="${prefix}src/`);
  html = html.replace(/href="\/og-image\.png"/g, `href="${SITE_URL}/og-image.png"`);
  html = html.replace(
    /src="https:\/\/cdn\.jsdelivr\.net/g,
    `src="https://cdn.jsdelivr.net`
  );

  // Update translatable UI strings in HTML body
  html = replaceUIStrings(html, strings, locale);

  return html;
}

function replaceUIStrings(html, s, locale) {
  // Header
  html = html.replace('>↩ Undo<', `>↩ ${escHtml(s.undo)}<`);

  // Difficulty chips
  html = html.replace('>🔥 Daily<', `>🔥 ${escHtml(s.daily)}<`);
  html = html.replace(/ data-diff="easy">Easy</, ` data-diff="easy">${escHtml(s.easy)}<`);
  html = html.replace(/ data-diff="medium">Medium</, ` data-diff="medium">${escHtml(s.medium)}<`);
  html = html.replace(/ data-diff="hard">Hard</, ` data-diff="hard">${escHtml(s.hard)}<`);
  html = html.replace(/ data-diff="expert">Expert</, ` data-diff="expert">${escHtml(s.expert)}<`);

  // Hint button
  html = html.replace(
    />💡 Hint <span/,
    `>💡 ${escHtml(s.hint)} <span`
  );

  // Modal
  html = html.replace('>SOLVED!<', `>${escHtml(s.solved)}<`);
  html = html.replace('>📤 Share Result<', `>📤 ${escHtml(s.shareResult)}<`);
  html = html.replace('>Next Puzzle →<', `>${escHtml(s.nextPuzzle)}<`);

  // Leaderboard
  html = html.replace('>🏆 Leaderboard<', `>🏆 ${escHtml(s.leaderboard)}<`);
  html = html.replace('>🔥 데일리 도전<', `>🔥 ${escHtml(s.dailyChallenge)}<`);
  html = html.replace('>📊 난이도별<', `>📊 ${escHtml(s.byDifficulty)}<`);
  html = html.replace('>오늘<', `>${escHtml(s.today)}<`);
  html = html.replace('>이번주<', `>${escHtml(s.thisWeek)}<`);
  html = html.replace('>이번달<', `>${escHtml(s.thisMonth)}<`);
  html = html.replace('>전체<', `>${escHtml(s.allTime)}<`);
  html = html.replace('>Your name:<', `>${escHtml(s.yourName)}<`);
  html = html.replace('>Close<', `>${escHtml(s.close)}<`);

  // Default difficulty description
  html = html.replace(
    />Fill each cage so the numbers add up to the target\. Use numbers 1-4\. No row or column rules [^<]*</,
    `>${escHtml(s.easyDesc)}<`
  );

  // Welcome screen
  html = html.replace(
    />A daily cage math puzzle with<br>progressive KenKen-style rules\.<\/div>/,
    `>${escHtml(s.tagline || 'Free Daily Cage Puzzle Game')}</div>`
  );

  return html;
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ── Archive Page Builder ────────────────────────────────────
function buildArchivePage(template, locale, strings, meta, dailyInfos) {
  const title = meta.archiveTitle;
  const desc = meta.archiveDesc;
  const canonicalUrl = `${SITE_URL}/${locale}/archive`;

  let html = template;
  html = html.replace(/<html lang="en">/, `<html lang="${locale}">`);
  html = html.replace(/<title>[^<]+<\/title>/, `<title>${escHtml(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escAttr(desc)}">`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${canonicalUrl}">\n${buildHreflangTags('/archive')}`
  );

  // Replace everything between <body> and </body>
  const archiveBody = buildArchiveBody(locale, strings, meta, dailyInfos);
  html = html.replace(
    /<body>[\s\S]*<\/body>/,
    `<body>\n${archiveBody}\n</body>`
  );

  return html;
}

function buildArchiveBody(locale, strings, meta, dailyInfos) {
  const diffLabels = { easy: strings.easy, medium: strings.medium, hard: strings.hard, expert: strings.expert };
  const rows = dailyInfos.map(d => {
    const diffLabel = diffLabels[d.diff] || d.diff;
    const dateDisplay = formatDate(d.dateStr, locale);
    return `<a href="/${locale}/daily/${d.dateStr}" class="archive-row">
      <span class="archive-num">#${d.puzzleNum}</span>
      <span class="archive-date">${dateDisplay}</span>
      <span class="archive-diff">${escHtml(diffLabel)}</span>
    </a>`;
  }).reverse().join('\n');

  const practiceLinks = DIFFICULTIES.map(d => {
    const label = diffLabels[d] || d;
    return `<a href="/${locale}/practice/${d}/001" class="archive-practice-link">${escHtml(label)}</a>`;
  }).join('\n');

  return `
<style>
  .archive-wrap { max-width: 600px; margin: 0 auto; padding: 20px 16px; }
  .archive-h1 { font-size: 28px; font-weight: 800; letter-spacing: 3px; margin-bottom: 8px; }
  .archive-subtitle { font-size: 14px; color: #888; margin-bottom: 24px; }
  .archive-section { margin-bottom: 32px; }
  .archive-section-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; }
  .archive-row { display: flex; gap: 12px; padding: 10px 8px; border-bottom: 1px solid #f0f0ee; text-decoration: none; color: inherit; }
  .archive-row:hover { background: #f5f5f0; }
  .archive-num { width: 50px; font-weight: 700; color: #2563eb; }
  .archive-date { flex: 1; }
  .archive-diff { width: 80px; text-align: right; font-size: 13px; color: #888; }
  .archive-practice-link { display: inline-block; padding: 8px 20px; border: 1.5px solid #d0d0cc; border-radius: 20px; text-decoration: none; color: #1a1a1a; font-size: 14px; margin: 4px; }
  .archive-practice-link:hover { border-color: #2563eb; color: #2563eb; }
  .archive-nav { margin-top: 24px; text-align: center; }
  .archive-nav a { color: #2563eb; text-decoration: none; font-size: 14px; }
</style>
<div class="archive-wrap">
  <div class="archive-h1">CAGEY</div>
  <div class="archive-subtitle">${escHtml(strings.archive || 'Archive')}</div>

  <div class="archive-section">
    <div class="archive-section-title">${escHtml(strings.practice || 'Practice')}</div>
    <div>${practiceLinks}</div>
  </div>

  <div class="archive-section">
    <div class="archive-section-title">${escHtml(strings.dailyChallenge || 'Daily Challenge')}</div>
    ${rows}
  </div>

  <div class="archive-nav">
    <a href="/${locale}/">← ${escHtml(strings.goToTodaysPuzzle || "Today's Puzzle")}</a>
  </div>
</div>`;
}

// ── How-to-Play Page Builder ────────────────────────────────
function buildHowToPlayPage(template, locale, strings, meta) {
  const title = meta.howToPlayTitle;
  const desc = meta.howToPlayDesc;
  const canonicalUrl = `${SITE_URL}/${locale}/how-to-play`;
  const content = loadFileOrEmpty(path.join(LOCALES_DIR, locale, 'how-to-play.html'));

  let html = template;
  html = html.replace(/<html lang="en">/, `<html lang="${locale}">`);
  html = html.replace(/<title>[^<]+<\/title>/, `<title>${escHtml(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escAttr(desc)}">`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${canonicalUrl}">\n${buildHreflangTags('/how-to-play')}`
  );

  // Build FAQ schema from content
  const faqSchema = extractFaqSchema(content, locale);
  const jsonLd = buildJsonLd('game', locale, meta, { canonicalUrl, description: desc });
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${jsonLd}\n</script>${faqSchema ? '\n<script type="application/ld+json">\n' + faqSchema + '\n</script>' : ''}`
  );

  html = html.replace(
    /<body>[\s\S]*<\/body>/,
    `<body>
<style>
  .htp-wrap { max-width: 680px; margin: 0 auto; padding: 20px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.7; }
  .htp-wrap h1 { font-size: 28px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px; }
  .htp-wrap h2 { font-size: 20px; font-weight: 700; margin: 28px 0 12px; }
  .htp-wrap p { margin: 0 0 14px; }
  .htp-wrap ul, .htp-wrap ol { margin: 0 0 14px; padding-left: 24px; }
  .htp-wrap li { margin-bottom: 6px; }
  .how-to-example { background: #f9f9f7; border: 1px solid #e0e0dc; border-radius: 8px; padding: 16px; font-family: monospace; white-space: pre; margin: 12px 0; overflow-x: auto; }
  .faq-item { margin-bottom: 20px; }
  .faq-q { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
  .faq-a { font-size: 14px; color: #444; }
  .htp-nav { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0dc; text-align: center; }
  .htp-nav a { color: #2563eb; text-decoration: none; font-size: 14px; margin: 0 12px; }
  .htp-cta { display: inline-block; margin-top: 20px; padding: 12px 32px; background: #2563eb; color: white; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px; }
  .htp-cta:hover { background: #1d4ed8; }
</style>
<div class="htp-wrap">
${content || '<h1>How to Play Cagey</h1><p>Content loading...</p>'}
<div class="htp-nav">
  <a href="/${locale}/" class="htp-cta">${escHtml(strings.play || 'Play')} Cagey</a>
  <br><br>
  <a href="/${locale}/archive">${escHtml(strings.archive || 'Archive')}</a>
</div>
</div>
</body>`
  );

  return html;
}

function extractFaqSchema(htmlContent, locale) {
  const faqItems = [];
  const regex = /<div class="faq-item"[^>]*>[\s\S]*?<div class="faq-q"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<div class="faq-a"[^>]*>([\s\S]*?)<\/div>/g;
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    faqItems.push({
      "@type": "Question",
      "name": match[1].replace(/<[^>]+>/g, '').trim(),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": match[2].replace(/<[^>]+>/g, '').trim()
      }
    });
  }
  if (faqItems.length === 0) return null;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems
  });
}

// ── 404 Page Builder ────────────────────────────────────────
function build404Page(template, locale, strings, meta) {
  let html = template;
  html = html.replace(/<html lang="en">/, `<html lang="${locale}">`);
  html = html.replace(/<title>[^<]+<\/title>/, `<title>${escHtml(meta['404Title'] || 'Not Found')}</title>`);

  html = html.replace(
    /<body>[\s\S]*<\/body>/,
    `<body>
<div style="max-width:480px;margin:80px auto;text-align:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="font-size:52px;font-weight:800;letter-spacing:6px;margin-bottom:16px;">CAGEY</div>
  <div style="font-size:48px;margin-bottom:16px;">🔍</div>
  <h1 style="font-size:20px;font-weight:700;margin-bottom:8px;">${escHtml(strings.puzzleNotFound || 'Puzzle not found')}</h1>
  <p style="color:#888;font-size:14px;margin-bottom:24px;">${escHtml(meta['404Desc'] || '')}</p>
  <a href="/${locale}/" style="display:inline-block;padding:12px 28px;background:#2563eb;color:white;border-radius:10px;text-decoration:none;font-weight:600;">${escHtml(strings.goToTodaysPuzzle || "Today's Puzzle")}</a>
  <br><br>
  <a href="/${locale}/archive" style="color:#2563eb;text-decoration:none;font-size:14px;">${escHtml(strings.goToArchive || 'Archive')}</a>
</div>
</body>`
  );

  return html;
}

// ── Sitemap Generator ───────────────────────────────────────
function generateSitemap(dailyInfos) {
  const urls = [];

  function addUrl(path, changefreq, priority) {
    const hreflangs = LOCALES.map(l =>
      `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}${path}"/>`
    ).join('\n') +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/en${path}"/>`;

    // Use first locale as the canonical for sitemap grouping
    for (const locale of LOCALES) {
      urls.push(`  <url>
    <loc>${SITE_URL}/${locale}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${hreflangs}
  </url>`);
    }
  }

  // Homepage
  addUrl('/', 'daily', '1.0');

  // Daily puzzles
  for (const d of dailyInfos) {
    addUrl(`/daily/${d.dateStr}`, 'never', '0.7');
  }

  // Practice puzzles
  for (let di = 0; di < DIFFICULTIES.length; di++) {
    const diff = DIFFICULTIES[di];
    for (let n = 1; n <= PRACTICE_PER_DIFF; n++) {
      const num = String(n).padStart(3, '0');
      addUrl(`/practice/${diff}/${num}`, 'never', '0.5');
    }
  }

  // Static pages
  addUrl('/how-to-play', 'monthly', '0.8');
  addUrl('/archive', 'daily', '0.6');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
}

// ── Root redirect page ──────────────────────────────────────
function buildRootRedirect() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Cagey — Redirecting...</title>
<script>
  // Detect browser language and redirect
  const lang = (navigator.language || navigator.userLanguage || 'en').slice(0, 2).toLowerCase();
  const supported = ['en','ko','ja','de','es','pt'];
  const target = supported.includes(lang) ? lang : 'en';
  window.location.replace('/' + target + '/');
</script>
<meta http-equiv="refresh" content="0;url=/en/">
</head>
<body>
<p>Redirecting to <a href="/en/">Cagey</a>...</p>
</body>
</html>`;
}

// ── Main Build ──────────────────────────────────────────────
function build() {
  const start = Date.now();
  console.log('Building Cagey static site...');
  console.log(`  Locales: ${LOCALES.join(', ')}`);
  console.log(`  Daily puzzles: ${DAILY_DAYS} days`);
  console.log(`  Practice puzzles: ${PRACTICE_PER_DIFF} per difficulty × ${DIFFICULTIES.length} = ${PRACTICE_PER_DIFF * DIFFICULTIES.length}`);

  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }
  mkdirp(DIST);

  const template = readTemplate();

  // Generate daily infos
  const dailyInfos = [];
  const today = new Date();
  for (let d = 0; d < DAILY_DAYS; d++) {
    const date = new Date(LAUNCH_DATE.getTime() + d * 86400000);
    if (date > today) break; // don't generate future puzzles
    const dateStr = date.toISOString().slice(0, 10);
    dailyInfos.push(getDailyInfo(dateStr));
  }
  console.log(`  Actual daily puzzles (up to today): ${dailyInfos.length}`);

  let pageCount = 0;

  for (const locale of LOCALES) {
    const strings = loadJSON(path.join(LOCALES_DIR, locale, 'strings.json'));
    const meta = loadJSON(path.join(LOCALES_DIR, locale, 'meta.json'));

    // ── Homepage (today's daily) ──
    const todayStr = today.toISOString().slice(0, 10);
    const todayInfo = getDailyInfo(todayStr);
    const homePath = `/${locale}/index.html`;
    const homeHtml = buildGamePage(template, locale, strings, meta, {
      title: meta.homeTitle,
      description: meta.homeDesc,
      canonicalUrl: `${SITE_URL}/${locale}/`,
      pagePath: '/',
      pageType: 'home',
      pageData: { type: 'home', locale }
    });
    mkdirp(path.join(DIST, locale));
    fs.writeFileSync(path.join(DIST, locale, 'index.html'), homeHtml);
    pageCount++;

    // ── Daily puzzle pages ──
    for (const d of dailyInfos) {
      const title = meta.dailyTitle.replace('{num}', d.puzzleNum).replace('{date}', formatDate(d.dateStr, locale));
      const desc = meta.dailyDesc.replace('{num}', d.puzzleNum);
      const pagePath = `/daily/${d.dateStr}`;
      const html = buildGamePage(template, locale, strings, meta, {
        title,
        description: desc,
        canonicalUrl: `${SITE_URL}/${locale}${pagePath}`,
        pagePath,
        pageType: 'daily',
        pageData: { type: 'daily', seed: d.seed, diff: d.diff, puzzleNum: d.puzzleNum, date: d.dateStr, locale }
      });
      mkdirp(path.join(DIST, locale, 'daily', d.dateStr));
      fs.writeFileSync(path.join(DIST, locale, 'daily', d.dateStr, 'index.html'), html);
      pageCount++;
    }

    // ── Practice puzzle pages ──
    for (let di = 0; di < DIFFICULTIES.length; di++) {
      const diff = DIFFICULTIES[di];
      const diffLabel = strings[diff] || diff;
      for (let n = 1; n <= PRACTICE_PER_DIFF; n++) {
        const num = String(n).padStart(3, '0');
        const seed = getPracticeSeed(di, n);
        const title = meta.practiceTitle.replace('{difficulty}', diffLabel).replace('{num}', num);
        const desc = meta.practiceDesc.replace('{difficulty}', diffLabel).replace('{num}', num);
        const pagePath = `/practice/${diff}/${num}`;
        const html = buildGamePage(template, locale, strings, meta, {
          title,
          description: desc,
          canonicalUrl: `${SITE_URL}/${locale}${pagePath}`,
          pagePath,
          pageType: 'practice',
          pageData: { type: 'practice', seed, diff, puzzleNum: n, locale }
        });
        mkdirp(path.join(DIST, locale, 'practice', diff, num));
        fs.writeFileSync(path.join(DIST, locale, 'practice', diff, num, 'index.html'), html);
        pageCount++;
      }
    }

    // ── Archive page ──
    const archiveHtml = buildArchivePage(template, locale, strings, meta, dailyInfos);
    mkdirp(path.join(DIST, locale, 'archive'));
    fs.writeFileSync(path.join(DIST, locale, 'archive', 'index.html'), archiveHtml);
    pageCount++;

    // ── How-to-play page ──
    const htpHtml = buildHowToPlayPage(template, locale, strings, meta);
    mkdirp(path.join(DIST, locale, 'how-to-play'));
    fs.writeFileSync(path.join(DIST, locale, 'how-to-play', 'index.html'), htpHtml);
    pageCount++;

    // ── 404 page ──
    const notFoundHtml = build404Page(template, locale, strings, meta);
    fs.writeFileSync(path.join(DIST, locale, '404.html'), notFoundHtml);
    pageCount++;
  }

  // ── Root redirect ──
  fs.writeFileSync(path.join(DIST, 'index.html'), buildRootRedirect());

  // ── Global 404 (English) ──
  const enStrings = loadJSON(path.join(LOCALES_DIR, 'en', 'strings.json'));
  const enMeta = loadJSON(path.join(LOCALES_DIR, 'en', 'meta.json'));
  fs.writeFileSync(path.join(DIST, '404.html'), build404Page(template, 'en', enStrings, enMeta));

  // ── Copy static assets ──
  const assets = ['favicon.svg', 'og-image.png', 'og-image.svg', 'llms.txt'];
  for (const a of assets) {
    const src = path.join(ROOT, a);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST, a));
    }
  }
  // Copy src/ directory
  const srcDir = path.join(ROOT, 'src');
  if (fs.existsSync(srcDir)) {
    copyDirSync(srcDir, path.join(DIST, 'src'));
  }

  // ── Sitemap ──
  const sitemap = generateSitemap(dailyInfos);
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);

  // ── Robots.txt ──
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml

# AI crawlers welcome
# llms.txt: ${SITE_URL}/llms.txt
`;
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robots);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone! ${pageCount} pages generated in ${elapsed}s`);
  console.log(`Output: ${DIST}/`);
}

function copyDirSync(src, dest) {
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

build();
