import { MDXRenderer } from "gatsby-plugin-mdx";
import React from "react";
import styled from "styled-components";
import HeaderText from "./headerText";

const NewsItem = (props) => {

    return (
        <>
            <h5>{props.news.frontmatter.title}</h5>
            <small>{props.news.frontmatter.date}</small>
            <div className="border-bottom mb-4">
                <MDXRenderer>{props.news.body}</MDXRenderer>
            </div>
        </>
    )
}

const NewsContainer = styled.div`
    h3 {
        margin-bottom: 20px;
    }
`;

const News = (props) => {
    return (
        <NewsContainer className={props.className} suppressHydrationWarning>
            <h3>News</h3>
            {props.news.nodes.map((news, index) => {
                return <NewsItem news={news} key={index} />
            })}
        </NewsContainer>
    )
}

export default News;