import React, { Component } from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"

export default class PageTemplate extends Component {
  render() {
    const currentPage = this.props.data.wordpressPage

    return (
      <Layout>
        <h1 dangerouslySetInnerHTML={{ __html: currentPage.title }} />
        <div dangerouslySetInnerHTML={{ __html: currentPage.content }} />
      </Layout>
    )
  }
}

export const pageQuery = graphql`
    query($id: String) {
        wordpressPage(id: { eq: $id }) {
            content,
            title
        }
    }
`;
