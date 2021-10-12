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
  const onReady = (event) => {
    event.target.pauseVideo();
  };

  const opts = {
    width: props.width,
    height: props.height,
    playerVars: {
      autoplay: 0,
    },
  };

  console.log(opts)

  return <YouTubeContainer>
    <YouTube videoId={props.videoId} onReady={onReady} opts={opts} containerClassName="you-tube-wrapper" />;
    </YouTubeContainer >
}

export default ReactYouTube;