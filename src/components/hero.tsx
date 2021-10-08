import React from "react";
import styled from "styled-components";
import HeroImage from "../../content/assets/superior_rectangle.png";

const HeroContainer = styled.div`
  background-size: cover;
  padding: 1px 0px 0px 0px;
  position: relative;
  margin-left: -33.33%;
  margin-right: -33.33%;

  .container-hero-image-background {
    width: 100%;
    height: 100%;

    .hero-image-source {
      height: 100%;
      width: 100%;
      object-fit: cover;
    }
  }
`;

const Hero = (props) =>{
    return (
        <HeroContainer>
            <img src={HeroImage} className="hero-image-source" />
        </HeroContainer>
    );
}

export default Hero;