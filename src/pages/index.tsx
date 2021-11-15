import React, { useEffect } from "react"
import styled from "styled-components";
import Layout from "../components/layout"
import SEO from "../components/seo"
import ReactGA from 'react-ga';
import { graphql } from "gatsby";
import News from "../components/news";
import { Helmet } from "react-helmet";
import Hero from "../components/hero";
import YouTube from 'react-youtube';

ReactGA.initialize(process.env.GOOGLE_ID);

const MainContainer = styled.div`
  .overlay {
    width: 50%;
    padding: 75px 95px 75px 70px;
    opacity: .9;
    color: white;

    @media(max-width:765px){
      width:100%;
      padding: 10px;
    }
  }

  @media(max-width:700px){
    .you-tube-wrapper {
      iframe{
        width:100%;
      }
    }
  }

    .you-tube-wrapper {
      padding-left:20px;
      padding-right:20px; 
  }
`;

export default function IndexPage(props) {

  const news = props.data.news;

  useEffect(() => {
    if (typeof "window" !== "undefined") {
      ReactGA.pageview(window.location.pathname + window.location.search);

      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());

      gtag('config', process.env.GOOGLE_ID);
    }
  }, [])

  const siteTitle = "Corey Smaller- Home Page"

  return (
    <Layout location={props.location} title={siteTitle}>
      <Helmet>
        <script type="text/javascript" src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
      </Helmet>
      <SEO
        title="Home"
        keywords={[`corey smaller`, `corey adam smaller`, 'utah musicians', 'musicians in park city', `jackalope`, `backcountry skiing`, `utah ski touring`]}
      />
      <Hero />
      <MainContainer className="row position-relative">
        <News className="col-12 p-3 text-justify" news={news} />
      </MainContainer>
    </Layout>
  );
}

export const pageQuery = graphql` query {
  
    news:  allMdx(
        filter: {frontmatter: {isNews: {eq: true}}}
        sort: {order: DESC, fields: frontmatter___date}) {
      nodes {
        frontmatter {
          isNews
          date(formatString: "MMM d, YYYY")
          description
          path
          title
        }
        body
      }
    }
}

`;