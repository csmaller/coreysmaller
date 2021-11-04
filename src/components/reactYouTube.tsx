import { MDXRenderer } from "gatsby-plugin-mdx";
import React from "react";
import styled from "styled-components";

import YouTube from 'react-youtube';


const YouTubeContainer = styled.div`
    .you-tube-wrapper {
        margin-bottom: 20px;
    }
`;

const ReactYouTube = (props) => {


  const opts = {
    width: props.width,
    height: props.height,
    playerVars: {
      autoplay: 0,
    },
  };

  return <YouTubeContainer>
    <iframe
      src={`https://www.youtube.com/embed/${ props.id }`}
      frameBorder="0"
      className="video-iframe"
      width="640" height="360"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </YouTubeContainer >
}

export default ReactYouTube;