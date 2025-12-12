const Parser = require('rss-parser');
const cheerio = require('cheerio');
const rss = require('rss');
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
    "cobb.land": "Cobb",
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
    const allFeeds = await Promise.all(feedsArray.map(url => parser.parseURL(url)));
    const allPosts = {};
    // for (let feed of feedsArray) {
    //     const posts = await parser.parseURL(feed);
    //     allFeeds.push(posts);
    // }
    for (let site of allFeeds) {
        allPosts[site.title] = site.items.slice(0, 3).map((item) => {
            const domain  = extractDomain(site.link || item.link);
            const author = authors[domain];
            return {
                title: (item.title || 'Post').trim(),
                author: author,
                link: item.link,
                pubDate: new Date(item.pubDate || 0),
                source: site.title,
                sourceLink: site.link || site.items[0]?.link || "#",
                content: item['content:encoded'] || item.content || item.summary || '',
            }
        })
    }
    const allPostsSorted = Object.values(allPosts).flat();
    allPostsSorted.sort((a, b) => b.pubDate - a.pubDate);
    return allPostsSorted;
}

async function generateRSS(posts, outputPath = 'rss.xml') {
    const feed = new rss({
        title: "Densford Family Network",
        description: "A combined feed of all the sites on the Densford network.",
        feed_url: "https://densford.net/rss.xml",
        site_url: 'https://densford.net',
        language: "en",
        pubDate: new Date(),
        ttl: 60,
    });

    posts.forEach(post => {
        feed.item({
            title: post.title,
            description: `A post by ${post.author} from ${post.source}`,
            url: post.link,
            author: post.author,
            date: post.pubDate,
            custom_elements: [
                { 'content:encoded': post.content || post.description || '' }
            ],
        });
    });
    
    const xml = feed.xml({ indent: true });
    await fs.writeFile(outputPath, xml, 'utf-8');
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
    await generateRSS(posts);
}

updateHTML()
    .then(() => console.log('Updated RSS section!'))
    .catch(console.error);
