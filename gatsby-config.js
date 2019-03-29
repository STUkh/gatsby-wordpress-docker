module.exports = {
  siteMetadata: {
    title: `Gatsby Default Starter`,
    description: `Kick off your next, great Gatsby project with this default starter. This barebones starter ships with the main Gatsby configuration files you might need.`,
    author: `@gatsbyjs`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-sitemap`,
    'gatsby-plugin-robots-txt',
    {
        resolve: require.resolve(`./src/plugins/gatsby-source-wordpress`),
        options: {
            baseUrl: process.env.WORDPRESS_URL,
            protocol: "http",
            hostingWPCOM: false,
            useACF: true,
            acfOptionPageIds: [],
            auth: {},
            verboseOutput: true,
            perPage: 100,
            concurrentRequests: 10,
            includedRoutes: [
                "/*/*/posts",
                "/*/*/pages",
                "/*/*/menus",
                // "**/*/*/categories",
                // "**/*/*/posts",
                // "**/*/*/pages",
                // "**/*/*/media",
                // "**/*/*/tags",
                // "**/*/*/taxonomies",
                // "**/*/*/users",
            ],
            excludedRoutes: ["/wp/v2/users/me", "/acf/v3/options", "/wp/v2/settings"],
        },
    },
    {
      resolve: `gatsby-plugin-prefetch-google-fonts`,
      options: {
        fonts: [
          {
            family: `Montserrat`,
            variants: [`400`, `600`, `700`]
          },
        ],
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        sourceMap: true
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // 'gatsby-plugin-offline',
  ],
}
