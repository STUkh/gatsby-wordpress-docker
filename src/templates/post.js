import React, { Component } from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"

export default class PostTemplate extends Component {
  render() {
    const post = this.props.data.wordpressPost

    return (
      <Layout>
        <h1 dangerouslySetInnerHTML={{ __html: post.title }} />
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </Layout>
    )
  }
}

export const pageQuery = graphql`
    query($id: String) {
        wordpressPost(id: { eq: $id }) {
            content,
            title
        }
    }
`;

