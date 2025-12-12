const Parser = require('rss-parser');
const parser = new Parser;
const feeds = [
    'https://daryldensford.com/feed/',
    'https://blog.jacobdensford.com/feed.rss',
    'https://cobb.land/feed.xml',
    'https://blog.saisarida.com/feed.xml',
];

async function fetchFeeds(feedsArray = feeds) {
    const allFeeds = [];
    const allPosts = [];
    for (let feed of feedsArray) {
        const posts = await parser.parseURL(feed);
        allFeeds.push(posts);
    }
    for (let site of allFeeds) {
        allPosts[site.title] = site.items.slice(0, 3).map((item) => ({
            title: item.title.trim() || 'Post',
            link: item.link,
            pubDate: new Date(item.pubDate),
            source: site.title,
            sourceLink: site.link,
        }))
    }
    const allPostsSorted = Object.values(allPosts).flat();
    allPostsSorted.sort((a, b) => b.pubDate - a.pubDate);
    console.log(allPostsSorted);
}

fetchFeeds();