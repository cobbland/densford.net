const cheerio = require('cheerio');
const fs = require('fs/promises');
const page = 'index.html';
const favicons = [
    '🫂', '💅🏼', '🧙🏼‍♂️', '🐌', '🐐', '🐑', '🦔', '🐲', '🍄', '🍣',
    '🧋', '🍔', '🍙', '🥞', '🏋️‍♀️', '🎮', '🎲', '🛰', '🚀', '🕹', 
    '📺', '🪔', '⚔️', '🔭', '📚', '📖', '✒️', '🫟', '🫜', '❤️‍🔥',
    '🕷️', '💩', '🫀',
];

async function setFavicon(options = favicons, htmlPath = page) {
    const icon = options[Math.floor(Math.random() * options.length)];
    const html = await fs.readFile(htmlPath, 'utf-8');
    const $ = cheerio.load(html);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y=".9em" font-size="90">${icon}</text>
</svg>
    `.trim();
    const encodedSvg = encodeURIComponent(svg);
    const dataUrl = `data:image/svg+xml,${encodedSvg}`;
    const headingEmoji = $('#heading-emoji');
    headingEmoji.empty();
    headingEmoji.append(icon);
    let favicon = $("head > link[rel='icon']");
    if (!favicon.length) {
        $("head").append(`<link rel="icon">`);
        favicon = $("head > link[rel='icon']");
    }
    favicon.attr("href", dataUrl);
    await fs.writeFile(htmlPath, $.html(), "utf-8");
}

setFavicon()
    .then(() => console.log('Updated favicon!'))
    .catch(console.error);

module.exports = { setFavicon };