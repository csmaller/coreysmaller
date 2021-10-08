/**
 * Bio component that queries for data
 * with Gatsby's StaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/static-query/
 */

import React, {useEffect} from "react"
import { StaticQuery, graphql } from "gatsby";
import styled from "styled-components"
import ReactGA from 'react-ga';
ReactGA.initialize('UA-177166710-1');

function Bio() {

  useEffect(()=>{
    if(typeof "window" !=="undefined"){
      ReactGA.pageview(window.location.pathname + window.location.search);
    }
  },[])

  return (
    <StaticQuery
      query={bioQuery}
      render={data => {
        const { author, social } = data.site.siteMetadata
        return (
          <Container>
            <p>
              Written by <strong>{author}</strong>
              {` `}
              <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noreferrer">
                Follow me on Instagram
              </a>
            </p>
          </Container>
        )
      }}
    />
  )
}

const bioQuery = graphql`
  query BioQuery {
    site {
      siteMetadata {
        author
        social {
          instagram
        }
      }
    }
  }
`

const Container = styled.div`
  display: flex;
`

export default Bio
