import React, { useEffect } from "react"
import styled from "styled-components";
import Layout from "../components/layout"
import SEO from "../components/seo"
import ReactGA from 'react-ga';
import { graphql } from "gatsby";
import News from "../components/news";
import { Helmet } from "react-helmet";
import Hero from "../components/hero";
import HeaderText from "../components/headerText";
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

function MainContent(props) {

  const onReady = (event) => {
    event.target.pauseVideo();
  }

  const opts = {
    width: '100%',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className={props.className}>
      <h3>Welcome</h3>
      <p>Whether it's learning skills on the mountain bike,
      training hard for that big race,
      learning how to rock climb,
      finding the deep untracked lines,
      or exploring one of the many great ski resorts in the Wasatch
      Jackalope Adventures will be your guide.
      </p>
      <div className="col-12 py-3 text-center justify-content-center">
        <YouTube videoId="DGFtDL8ziQ0" opts={opts} onReady={onReady} containerClassName="you-tube-wrapper" />
      </div>
    </div>
  );
}

export default function IndexPage(props) {

  const news = props.data.news;

  useEffect(() => {
    if (typeof "window" !== "undefined") {
      ReactGA.pageview(window.location.pathname + window.location.search);
    }
  }, [])

  const siteTitle = "Jackalope Adventures - Home Page"

  return (
    <Layout location={props.location} title={siteTitle}>
      <Helmet>
        <script type="text/javascript" src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
      </Helmet>
      <SEO
        title="Home"
        keywords={[`mountain bike lessons`, `enduro mountain bike lessons`, `bike lessons utah`, `jackalope adventures`, `jackalope`, `backcountry skiing`, `utah ski touring`]}
      />
      <Hero />
      <MainContainer className="row position-relative">
        <News className="col-12 col-lg-6 p-3" news={news} />
        <MainContent className="col-12 col-lg-6 p-3" />
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