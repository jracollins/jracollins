const RssParser = require("rss-parser");
const vfile = require("to-vfile");
const remark = require("remark");
const zone = require("mdast-zone");
const { promisify } = require("util");
const { writeFile } = require("fs");
const { join } = require("path");

const rssParser = new RssParser();
const readmePath = join(__dirname, "..", "README.md");

(async () => {
  const feed = await rssParser.parseURL("https://jracollins.com/rss.xml");
  const file = await remark()
    .use(refreshBlogPosts(feed.items.slice(0, 3)))
    .process(vfile.readSync(readmePath));
  await promisify(writeFile)(readmePath, String(file));
})();

function refreshBlogPosts(feedItems) {
  return () => (tree) => {
    zone(tree, "blog", (start, nodes, end) => {
      return [
        start,
        {
          type: "list",
          ordered: false,
          children: feedItems.map(
            ({ title, link, contentSnippet, pubDate }) => {
              return {
                type: "listItem",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "link",
                        url: link,
                        children: [{ type: "text", value: title }],
                      },
                      { type: "html", value: "<br/>" },
                      {
                        type: "emphasis",
                        children: [{ type: "text", value: contentSnippet }],
                      },
                    ],
                  },
                ],
              };
            }
          ),
        },
        end,
      ];
    });
  };
}
