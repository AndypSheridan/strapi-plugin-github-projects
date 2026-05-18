"use strict";

const UID = "plugin::github-projects.project";

const mapRepoToData = (repo, userId) => ({
  repositoryId: `${repo.id}`,
  title: repo.name,
  shortDescription: repo.shortDescription,
  repositoryUrl: repo.url,
  longDescription: repo.longDescription,
  createdBy: userId,
  updatedBy: userId,
});

module.exports = ({ strapi }) => ({
  create: async (repo, userId) =>
    strapi.entityService.create(UID, { data: mapRepoToData(repo, userId) }),

  delete: async (projectId) => strapi.entityService.delete(UID, projectId),

  bulkCreate: async (repos, userId) =>
    strapi.db.transaction(async () =>
      Promise.all(
        repos.map((repo) =>
          strapi.entityService.create(UID, { data: mapRepoToData(repo, userId) })
        )
      )
    ),

  bulkDelete: async (ids) =>
    strapi.db.query(UID).deleteMany({ where: { id: { $in: ids } } }),
  find: async (params) => strapi.entityService.findMany(UID, params),
  findOne: async (id, params) => strapi.entityService.findOne(UID, id, params),
});
