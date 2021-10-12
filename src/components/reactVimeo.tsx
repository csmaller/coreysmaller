import React from "react";
import styled from "styled-components";
import Vimeo from '@u-wave/react-vimeo';


const VimeoContainer = styled.div`
    .you-tube-wrapper {
        margin-bottom: 20px;
    }
`;

const ReactVimeo = (props) => {


  return <VimeoContainer>
    <Vimeo video={props.id} />;
    </VimeoContainer >
}

export default ReactVimeo;