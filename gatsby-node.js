const path = require(`path`);
const { createFilePath } = require(`gatsby-source-filesystem`);

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage: createGatsbyPage } = actions;

  const isProdBuild = process.env.NODE_ENV === "production";

  const blogPost = require.resolve(`./src/components/blog-post.js`);
  const result = await graphql(
    `
      {
        blog: allMdx(
          sort: { fields: [frontmatter___date], order: DESC }
          filter: { fileAbsolutePath: { regex: "/posts/" } }
        ) {
          edges {
            node {
              frontmatter {
                published
              }
              fields {
                slug
              }
            }
          }
        }
      }
    `
  );

  if (result.errors) {
    reporter.panicOnBuild('🚨  ERROR: Loading "createPages" query');
    return;
  }

  // Create blog posts pages.
  const posts = result.data.blog.edges;
  posts.forEach((post, index) => {
    if (post.node.frontmatter.published === false && isProdBuild) {
      return;
    }

    const previous = index === posts.length - 1 ? null : posts[index + 1].node;
    const next = index === 0 ? null : posts[index - 1].node;

    const slug = post.node.fields.slug;
    createGatsbyPage({
      path: slug,
      component: blogPost,
      context: {
        slug,
        previous,
        next,
      },
    });
  });

  // create top-level pages
  // this isn't needed because src/pages already gets created
  // const pages = result.data.pages.edges;
  // pages.forEach((page) => {
  //   console.log(page.node);
  //   createPage(page.node.fields.slug);
  // });
};

// add slugs to pages
exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === "Mdx") {
    const filePath = createFilePath({ node, getNode });

    // since all markdown comes through here, we have to distinguish which files are blog posts vs top-level pages
    const value = path
      .relative(__dirname, node.fileAbsolutePath)
      .startsWith("posts")
      ? `/blog/post${filePath}`
      : filePath;

    createNodeField({
      name: `slug`,
      node,
      value,
    });
  }
};
