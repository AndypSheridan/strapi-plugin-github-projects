module.exports = {
  admin: {
    type: "admin",
    routes: [
      {
        method: "GET",
        path: "/repos",
        handler: "getReposController.index",
        config: {
          policies: [
            "admin::isAuthenticatedAdmin",
            {
              name: "admin::hasPermissions",
              config: {
                actions: ["plugin::github-projects.repos.read"],
              },
            },
          ],
          // auth: false, // TODO: Change this to authorised only for admin panel users
        },
      },
      {
        method: "POST",
        path: "/project",
        handler: "projectController.create",
        config: {
          policies: ["admin::isAuthenticatedAdmin"],
          // auth: false, // TODO: Change this to authorised only for admin panel users
        },
      },
      {
        method: "DELETE",
        path: "/project/:id",
        handler: "projectController.delete",
        config: {
          policies: ["admin::isAuthenticatedAdmin"],
        },
      },
      {
        method: "POST",
        path: "/projects/bulk",
        handler: "projectController.bulkCreate",
        config: {
          policies: ["admin::isAuthenticatedAdmin"],
        },
      },
      {
        method: "DELETE",
        path: "/projects/bulk",
        handler: "projectController.bulkDelete",
        config: {
          policies: ["admin::isAuthenticatedAdmin"],
        },
      },
      {
        method: "GET",
        path: "/projects",
        handler: "projectController.find",
        config: {
          auth: false,
          prefix: false,
        },
      },
      {
        method: "GET",
        path: "/projects/:id",
        handler: "projectController.findOne",
        config: {
          auth: false,
          prefix: false,
        },
      },
    ],
  },
};
