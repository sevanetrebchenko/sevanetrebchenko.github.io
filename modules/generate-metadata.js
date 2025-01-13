
const fs = require("fs");
const path = require("path");

class GenerateMetadataPlugin {
    constructor(options) {
        this.root = options.root;
    }

    getFiles(root) {
        let files = [];

        const items = fs.readdirSync(root);
        items.forEach((item) => {
            const p = path.join(root, item);
            const stats = fs.statSync(p);

            if (stats.isDirectory()) {
                files = files.concat(this.getFiles(p));
            }
            else if (stats.isFile()) {
                files.push(p);
            }
        })

        return files;
    }

    getPost(posts, p) {
        for (const post of posts) {
            if (path.normalize(post["filepath"]) === p) {
                return post;
            }
        }

        return null;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync("GenerateMetadataPlugin", (compilation, callback) => {
            // Assumes working directory is within ./modules and not ./public
            const outputPath = path.join(__dirname, "../public", "site_content.json");
            const outputData = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

            this.getFiles(path.join(this.root, "posts")).forEach((p) => {
                const stats = fs.statSync(p);

                // Find the post with this name
                p = path.normalize(path.relative(this.root, p));
                let post = this.getPost(outputData["posts"], p);
                if (post) {
                    // Cache file last modified time
                    post["last_modified_time"] = stats.mtime.toISOString();
                }
            });

            fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 4), "utf-8");
            callback();
        });
    }
}

module.exports = GenerateMetadataPlugin;