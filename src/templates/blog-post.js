import React, { useEffect } from "react";
import { Link, graphql } from "gatsby";
import { MDXRenderer } from "gatsby-plugin-mdx";

import Bio from "../components/bio";
import Layout from "../components/layout";
import SEO from "../components/seo";
import ReactYouTube from "../components/reactYouTube";
import ReactVimeo from "../components/reactVimeo";
import { rhythm, scale } from "../utils/typography";
import { MDXProvider } from "@mdx-js/react";
import ReactGA from 'react-ga';
ReactGA.initialize(process.env.GOOGLE_ID);

const BlogPostTemplate = (props) => {


  useEffect(() => {
    if (typeof "window" !== "undefined") {
      ReactGA.pageview(window.location.pathname + window.location.search);
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());

      gtag('config', process.env.GOOGLE_ID);
    }
  }, []);


  const post = props.data.mdx;
  const siteTitle = props.data.site.siteMetadata.title;
  const { previous, next } = props.pageContext;

  const Shortcodes = { ReactYouTube, ReactVimeo };
  return (
    <Layout location={props.location} title={siteTitle}>
      <SEO
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
      />
      <div className="text-center w-100">
        <h1>{post.frontmatter.title}</h1>
      </div>
      <p
        style={{
          ...scale(-1 / 5),
          display: `block`,
          marginBottom: rhythm(1)
        }}
      >
        {post.frontmatter.date}
      </p>

      <MDXProvider components={{ ...Shortcodes }}>
        <MDXRenderer>{post.body}</MDXRenderer>
      </MDXProvider>
      <hr
        style={{
          marginBottom: rhythm(1),
        }}
      />
      <Bio />

      <ul
        style={{
          display: `flex`,
          flexWrap: `wrap`,
          justifyContent: `space-between`,
          listStyle: `none`,
          padding: 0,
        }}
      >
        <li>
          {previous && (
            <Link to={`/blog${ previous.fields.slug }`} rel="prev">
              ← {previous.frontmatter.title}
            </Link>
          )}
        </li>
        <li>
          {next && (
            <Link to={`/blog${ next.fields.slug }`} rel="next">
              {next.frontmatter.title} →
            </Link>
          )}
        </li>
      </ul>
    </Layout>
  );
};


export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    mdx(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      body
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
      }
    }
  }
`;
