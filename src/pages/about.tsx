import React, { useEffect } from "react";
import styled from "styled-components";
import Layout from "../components/layout";
import { Card } from "react-bootstrap";
import SEO from "../components/seo";
import ReactGA from 'react-ga';
import { graphql } from "gatsby";
import Self from "../../content/assets/touring_main.jpeg";
import Mitch from "../../content/assets/mitch2.jpeg";

ReactGA.initialize('UA-177166710-1');


const MainContainer = styled.div`

.smaller-font {
  font-size:12px;
}
ul li{
  padding : 0;
  margin: 0;
}

.links{
  position:absolute;
  bottom:10px;
  margin-top:20px;
  left:0;
  text-align:center;
  width:100%;
}
`;

function MainContent() {
  return (
    <>
      <div className="row justify-content-between">
        <Card className="col-12 col-md-5 mx-2">
          <Card.Body>
            <Card.Title>Corey Smaller MS</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">Owner Operator</Card.Subtitle>
            <Card.Img variant="top" src={Self} />
            <div className="px-4">
              <ul>
                <li>30 years experience as a coach and trainer</li>
                <li>15 years of ski-touring the Wasatch Range</li>
                <li>Skiing and snowboarding instructor</li>
                <li>Instructed at Park City Mountain Resort and Snowbird Resort</li>
                <li>Competed in several disciplines in cycling - cross country, road, crits, downhill and Super D</li>
              </ul>
            </div>
            <h5>Education:</h5>
            <div className="px-4  mb-5">
              <ul>
                <li>Masters of Science - Information Technology</li>
                <li>Bachelors of Science - Exercise Physiology</li>
                <li>Associates of Arts - Communications</li>
                <li>AIARE Avalanche Level 1 Certified </li>
                <li>ACSM certified, CPR, First Aid</li>
              </ul>
            </div>
            <div className="text-center links">
              <Card.Link target="_blank" href="https://www.instagram.com/jackalopeadventures/">Instagram</Card.Link>
              <Card.Link target="_blank" href="https://www.facebook.com/corey.smaller/">Facebook</Card.Link>
            </div>
          </Card.Body>
        </Card>
        <Card className="col-12 col-md-5 mx-2">
          <Card.Body>
            <Card.Title>Mitch Frankel PhD</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">Jackalope</Card.Subtitle>
            <Card.Img variant="top" src={Mitch} />
            <div className="px-4 mb-5">
              Neuroscientist by trade, Jackalope by heart. <br /><br />
             With 25 years of backcountry experience across CO, MT, WY, and UT, Mitch is one of JAs most knowledgeable guides. <br />
              Having spent the last 15 years exploring every nook of the Wasatch Wilderness on foot, bike, and skis, he can safely find you the untracked powder you desire, whether it's on easy-going meadows or steep technical terrain.

            </div>
            <h5>Education:</h5>
            <div className="px-4  pb-5">
              <ul>
                <li>Doctor Of Philosophy- Neuroscience</li>
                <li>Bachelors of Science - Kinesiology</li>
                <li>Certified Wilderness First Responder</li>
                <li>CPR, First Aid</li>
              </ul>
            </div>

            <div className="text-center links">
              <Card.Link target="_blank" href="https://www.instagram.com/wasatchmcquack/">Instagram</Card.Link>
              <Card.Link target="_blank" href="https://www.facebook.com/mitch.frankel">Facebook</Card.Link>
            </div>
          </Card.Body>
        </Card>

      </div>
    </>

  );

}

export default function About(props) {

  useEffect(() => {
    if (typeof "window" !== "undefined") {
      ReactGA.pageview(window.location.pathname + window.location.search);
    }
  }, [])

  const siteTitle = "About Jackalope Adventures"

  return (
    <Layout location={props.location} title={siteTitle}>
      <SEO
        title="About"
        keywords={[`jackalope adventures`, `jackalope`, `backcountry skiing`, `utah ski touring`]}
      />
      <MainContainer className="col-12 justify-content-center">
        <MainContent />
      </MainContainer>
    </Layout>
  );

}