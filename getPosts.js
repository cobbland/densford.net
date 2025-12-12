const Parser = require('rss-parser');
const cheerio = require('cheerio');
const fs = require('fs/promises');
const parser = new Parser;
const page = 'index.html';
const feeds = [
    'https://daryldensford.com/feed/',
    'https://blog.jacobdensford.com/feed.rss',
    'https://cobb.land/feed.xml',
    'https://blog.saisarida.com/feed.xml',
];
const authors = {
    "daryldensford.com": "Daryl",
    "blog.jacobdensford.com": "Jacob",
    "cobb.land": "Jacob",
    "blog.saisarida.com": "Sai",
};

function extractDomain(url) {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

async function fetchFeeds(feedsArray = feeds) {
    const allFeeds = [];
    const allPosts = {};
    for (let feed of feedsArray) {
        const posts = await parser.parseURL(feed);
        allFeeds.push(posts);
    }
    for (let site of allFeeds) {
        allPosts[site.title] = site.items.slice(0, 3).map((item) => {
            const domain  = extractDomain(site.link || item.link);
            const author = authors[domain];
            return {
                title: item.title.trim() || 'Post',
                author: author,
                link: item.link,
                pubDate: new Date(item.pubDate),
                source: site.title,
                sourceLink: site.link || site.items[0]?.link || "#",
            }
        })
    }
    const allPostsSorted = Object.values(allPosts).flat();
    allPostsSorted.sort((a, b) => b.pubDate - a.pubDate);
    return allPostsSorted;
}

async function updateHTML(htmlPath = page) {
    const posts = await fetchFeeds();
    const html = await fs.readFile(htmlPath, 'utf-8');
    const $ = cheerio.load(html);
    const postsList = $("#posts-list");
    const postsUpdated = $("#posts-updated");
    postsList.empty();
    postsUpdated.empty();
    posts.forEach(post => {
        postsList.append(`
            <li>
                <a href="${post.link}">${post.title}</a> by ${post.author}
            </li>
        `)
    });
    postsUpdated.append(`Last update: ${new Date().toString()}`);
    await fs.writeFile(htmlPath, $.html(), 'utf-8');
}

updateHTML()
    .then(() => console.log('Updated RSS section!'))
    .catch(console.error);
