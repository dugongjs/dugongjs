import type * as Preset from "@docusaurus/preset-classic";
import RemarkPlugin from "@docusaurus/remark-plugin-npm2yarn";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
    title: "DugongJS",
    tagline: "An event sourcing framework for Node.js",
    favicon: "img/favicon.ico",

    // Set the production url of your site here
    url: "https://your-docusaurus-site.example.com",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "facebook", // Usually your GitHub org/user name.
    projectName: "docusaurus", // Usually your repo name.

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"]
    },

    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    remarkPlugins: [[RemarkPlugin, { sync: true, converters: ["pnpm", "yarn"] }]]
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true
                    },
                    // Useful options to enforce blogging best practices
                    onInlineTags: "warn",
                    onInlineAuthors: "warn",
                    onUntruncatedBlogPosts: "warn"
                },
                theme: {
                    customCss: "./src/css/custom.css"
                }
            } satisfies Preset.Options
        ]
    ],

    themeConfig: {
        // Replace with your project's social card
        image: "img/docusaurus-social-card.jpg",
        navbar: {
            style: "primary",
            title: "",
            logo: {
                alt: "DugongJS Logo",
                src: "img/dugongjs_text_dark.png"
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "sidebar",
                    position: "left",
                    label: "Docs"
                },
                {
                    href: "https://github.com/dugongjs/dugongjs",
                    label: "GitHub",
                    position: "right"
                }
            ]
        },
        colorMode: {
            defaultMode: "dark"
        },
        footer: {
            style: "dark",
            copyright: `Copyright © ${new Date().getFullYear()} dugongjs`
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula
        }
    } satisfies Preset.ThemeConfig,

    markdown: {
        mermaid: true
    },
    themes: ["@docusaurus/theme-mermaid"]
};

export default config;
