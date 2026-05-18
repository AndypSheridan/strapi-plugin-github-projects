"use strict";

const { request } = require("@octokit/request");
const axios = require("axios");
const md = require("markdown-it")();

module.exports = ({ strapi }) => ({
  getProjectOrRepo: async (repo) => {
    const { id } = repo;
    const matchingProjects = await strapi.entityService.findMany(
      "plugin::github-projects.project",
      {
        filters: {
          repositoryId: id,
        },
      }
    );
    if (matchingProjects.length == 1) return matchingProjects[0].id;
    return null;
    // add some logic to search for an existing project for the current repo
  },

  getPublicRepos: async () => {
    const result = await request("GET /user/repos", {
      headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
      type: "public",
    });
    // id, name, shortDescription, longDescription, url
    return Promise.all(
      result.data.map(async (item) => {
        const { id, name, description, html_url, owner, default_branch } = item;
        const readmeUrl = `https://raw.githubusercontent.com/${owner.login}/${name}/${default_branch}/README.md`;
        let longDescription = null;
        try {
          const res = await axios.get(readmeUrl);
          longDescription = md.render(res.data).replaceAll("\n", "<br/>");
        } catch (err) {
          // repo has no README.md at the default branch root — leave longDescription null
        }
        const repo = {
          id,
          name,
          shortDescription: description,
          url: html_url,
          longDescription,
        };
        // add some logic to search for an existing project for the current repo
        const relatedProjectId = await strapi
          .plugin("github-projects")
          .service("getReposService")
          .getProjectOrRepo(repo);
        return {
          ...repo,
          projectId: relatedProjectId,
        };
      })
    );
  },
});
