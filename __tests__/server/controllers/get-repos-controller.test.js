"use strict";

const factory = require("../../../server/controllers/get-repos-controller");

describe("get-repos-controller", () => {
  describe("index", () => {
    it("calls getReposService.getPublicRepos and writes the result to ctx.body", async () => {
      const getPublicRepos = jest
        .fn()
        .mockResolvedValue([{ id: 1, name: "repo" }]);
      const strapi = {
        plugin: () => ({ service: () => ({ getPublicRepos }) }),
      };
      const ctx = {};
      const controller = factory({ strapi });

      await controller.index(ctx);

      expect(getPublicRepos).toHaveBeenCalledTimes(1);
      expect(ctx.body).toEqual([{ id: 1, name: "repo" }]);
    });

    it("propagates errors from the service", async () => {
      const getPublicRepos = jest
        .fn()
        .mockRejectedValue(new Error("GitHub down"));
      const strapi = {
        plugin: () => ({ service: () => ({ getPublicRepos }) }),
      };
      const ctx = {};
      const controller = factory({ strapi });

      await expect(controller.index(ctx)).rejects.toThrow("GitHub down");
    });
  });
});
