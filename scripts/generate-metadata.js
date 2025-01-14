
const fs = require("fs");
const path = require("path");

function getFiles(root) {
    let files = [];
    const items = fs.readdirSync(root);
    items.forEach((item) => {
        const p = path.join(root, item);
        const stats = fs.statSync(p);
        if (stats.isDirectory()) {
            files = files.concat(getFiles(p));
        }
        else if (stats.isFile()) {
            files.push(p);
        }
    })
    return files;
}

function getPost(posts, p) {
    for (const post of posts) {
        if (path.normalize(post["filepath"]) === p) {
            return post;
        }
    }
    return null;
}

// argv[0] - node
// argv[1] - script
const root = process.argv[2];

// Assumes working directory is within ./modules and not ./public
const outputPath = path.join(root, "site_content.json");
const outputData = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

getFiles(path.join(root, "posts")).forEach((p) => {
    const stats = fs.statSync(p);
    // Find the post with this name
    p = path.relative(root, p);
    if (!p.startsWith("/")) {
        p = path.normalize(path.join("/", p));
    }

    let post = getPost(outputData["posts"], p);
    if (post) {
        // Cache file last modified time
        post["last_modified_time"] = stats.mtime.toISOString();
    }
});
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 4), "utf-8");
