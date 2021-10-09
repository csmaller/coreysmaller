import React from "react";
import { Link } from "gatsby";
import { Button } from "react-bootstrap";
import "../../style.scss";
import Logo from "../../content/assets/logo_no_bg.png";
import styled from "styled-components";
import { SocialIcon } from 'react-social-icons';
import classNames from "classnames";
import { Container } from "react-bootstrap";

export default function Layout(props) {

  const { location, children, layoutClass } = props;
  const rootPath = `${ __PATH_PREFIX__ }/`;
  const blogPath = `${ __PATH_PREFIX__ }/blog/`;

  function Header() {
    return (
      <>
        <div className="col-lg-2 col-4 p-0 header-link-container align-content-middle">
          <Link to={`/`} className="header-link" >
            <img src={Logo} />
          </Link>
        </div>
        <nav className="col-lg-10 col-8 mb-4 mt-0 justify-content-left d-flex mt-5 p-0 pt-4">
          <Link className="header-link nav-link" to="/" disabled={location.pathname === "/"}>
            Home
          </Link>
          <Link to="/music/" className="header-link nav-link" disabled={location.pathname === "/music/"}>
            Songs
          </Link>
          <Link to="/blog/" className="header-link nav-link" disabled={location.pathname === "/blog/"}>
            Blog
          </Link>
        </nav>
      </>
    );
  }

  return (
    <>
      <HeaderContainer className="row mb-0 px-5 d-flex">
        <Header />
      </HeaderContainer>
      <Container>
        <LayoutContainer >
          <MainContainer className={classNames(layoutClass, "row")}>
            <main className="px-2 px-lg-0">{children}</main>
          </MainContainer>
        </LayoutContainer>
        <Footer className="align-content-center">
          <p><a href="https://www.jackalopeadventures.com">coreysmaller.com &trade;</a></p>
          <SocialIcon url="https://www.facebook.com/coreysmaller" />
          <SocialIcon url="https://www.instagram.com/jackalopeadventures/" />

        </Footer>
      </Container>
    </>
  );
}

const LayoutContainer = styled.div`
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 10rem; 

  .hidden {
    display:none;
  }
`;

const MainContainer = styled.div`
  position:relative;
`;

const HeaderContainer = styled.div`
  position:relative;

  a {
    text-decoration: none;
    box-shadow: none;
    color:#2f4b72;
    display: block;

    img{
      max-height:190px;
    }
  }

  .nav-link:hover {
    text-decoration: underline;
  }

  nav {
    height: 40px;
  }
`;

const Wrapper = styled.div`
  min-height: 100vh;
`;

const Footer = styled.footer`
  text-align: center;
  width: 100%;
  height: 2.5rem; 

  a {
    box-shadow: none;
    margin-left:10px;
    height:30px !important;
    width:30px !important;
  }
`;