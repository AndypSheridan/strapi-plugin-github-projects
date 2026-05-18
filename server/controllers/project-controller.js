"use strict";

const getService = (strapi) =>
  strapi.plugin("github-projects").service("projectService");

module.exports = ({ strapi }) => ({
  create: async (ctx) => {
    const repo = ctx.request.body;
    const userId = ctx.state.user.id;
    const project = await getService(strapi).create(repo, userId);
    ctx.send(project);
  },
  delete: async (ctx) => {
    const { id } = ctx.params;
    const project = await getService(strapi).delete(id);
    ctx.send(project);
  },
  bulkCreate: async (ctx) => {
    const { repos } = ctx.request.body;
    if (!Array.isArray(repos) || repos.length === 0) {
      return ctx.badRequest("repos must be a non-empty array");
    }
    const userId = ctx.state.user.id;
    const projects = await getService(strapi).bulkCreate(repos, userId);
    ctx.send(projects);
  },
  bulkDelete: async (ctx) => {
    const { ids } = ctx.request.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return ctx.badRequest("ids must be a non-empty array");
    }
    const result = await getService(strapi).bulkDelete(ids);
    ctx.send(result);
  },
  find: async (ctx) => {
    return await strapi
      .plugin("github-projects")
      .service("projectService")
      .find(ctx.query);
  },
  findOne: async (ctx) => {
    const projectId = ctx.params.id;
    return await strapi
      .plugin("github-projects")
      .service("projectService")
      .findOne(projectId, ctx.query);
  },
});
