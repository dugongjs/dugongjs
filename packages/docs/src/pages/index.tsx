import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";
import type { ReactNode } from "react";
import { GithubLogo } from "../components/github-logo";
import styles from "./index.module.css";

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={clsx("hero hero--primary", styles.heroBanner)}>
            <div className="container">
                <Heading as="h1" className="hero__title">
                    <img src="/img/dugongjs_logo_text.png" alt="DugongJS Logo" className={styles.logo} />
                </Heading>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link className="button button--secondary button--lg" to="/docs/getting-started/introduction">
                        <span className={styles.documentationButtonIcon} />
                        Documentation
                    </Link>

                    <a
                        className={clsx("button button--secondary button--outline button--lg", styles.sourceCodeButton)}
                        href="https://github.com/dugongjs/dugongjs"
                    >
                        <GithubLogo />
                        Source code
                    </a>
                </div>
            </div>
        </header>
    );
}

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout title={siteConfig.title} description="Description will go into a meta tag in <head />">
            <HomepageHeader />
        </Layout>
    );
}
