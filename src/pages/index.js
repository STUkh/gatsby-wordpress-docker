import React, { Component } from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"

class Home extends Component {
  render() {
    const data = this.props.data

    return (
      <Layout>
        <div>
          <h1>Pages</h1>
          {data.allWordpressPage.edges.map(({ node }) => (
            <div key={node.slug}>
              <Link to={`/${node.slug}`} css={{ textDecoration: `none` }}>
                <h3>{node.title}</h3>
              </Link>
              <div dangerouslySetInnerHTML={{ __html: node.excerpt }} />
            </div>
          ))}
        </div>
        <hr />
        <h1>Posts</h1>
        {data.allWordpressPost.edges.map(({ node }) => (
          <div key={node.slug}>
            <Link to={`/${node.slug}`} css={{ textDecoration: `none` }}>
              <h3>{node.title}</h3>
            </Link>
            <div dangerouslySetInnerHTML={{ __html: node.excerpt }} />
          </div>
        ))}
      </Layout>
    )
  }
}

export default Home

// Set here the ID of the home page.
export const pageQuery = graphql`
    query {
        allWordpressPage {
            edges {
                node {
                    id,
                    title,
                    excerpt,
                    slug,
                    date(formatString: "MMMM DD, YYYY")
                }
            }
        }
        allWordpressPost(sort: { fields: [date] }) {
            edges {
                node {
                    title,
                    excerpt,
                    slug
                }
            }
        }
    }
`
