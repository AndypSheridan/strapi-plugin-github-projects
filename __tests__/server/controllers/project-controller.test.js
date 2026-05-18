"use strict";

const factory = require("../../../server/controllers/project-controller");

const makeStrapi = (serviceMethods = {}) => {
  const service = {
    create: jest.fn(),
    delete: jest.fn(),
    bulkCreate: jest.fn(),
    bulkDelete: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    ...serviceMethods,
  };
  return {
    strapi: { plugin: () => ({ service: () => service }) },
    service,
  };
};

const makeCtx = (overrides = {}) => ({
  request: { body: {} },
  params: {},
  query: {},
  state: { user: { id: 1 } },
  send: jest.fn(),
  badRequest: jest.fn(),
  ...overrides,
});

describe("project-controller", () => {
  describe("create", () => {
    it("forwards the request body and user id to service.create, then sends the result", async () => {
      const { strapi, service } = makeStrapi();
      service.create.mockResolvedValue({ id: 1, title: "ok" });
      const controller = factory({ strapi });
      const ctx = makeCtx({
        request: { body: { id: 123, name: "repo" } },
        state: { user: { id: 42 } },
      });

      await controller.create(ctx);

      expect(service.create).toHaveBeenCalledWith({ id: 123, name: "repo" }, 42);
      expect(ctx.send).toHaveBeenCalledWith({ id: 1, title: "ok" });
    });
  });

  describe("delete", () => {
    it("pulls id from ctx.params and forwards to service.delete", async () => {
      const { strapi, service } = makeStrapi();
      service.delete.mockResolvedValue({ id: 5 });
      const controller = factory({ strapi });
      const ctx = makeCtx({ params: { id: "5" } });

      await controller.delete(ctx);

      expect(service.delete).toHaveBeenCalledWith("5");
      expect(ctx.send).toHaveBeenCalledWith({ id: 5 });
    });
  });

  describe("bulkCreate", () => {
    it("forwards repos and user id to service.bulkCreate", async () => {
      const { strapi, service } = makeStrapi();
      service.bulkCreate.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const controller = factory({ strapi });
      const ctx = makeCtx({
        request: { body: { repos: [{ id: 1 }, { id: 2 }] } },
        state: { user: { id: 7 } },
      });

      await controller.bulkCreate(ctx);

      expect(service.bulkCreate).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }], 7);
      expect(ctx.send).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });

    it("rejects when repos is missing", async () => {
      const { strapi, service } = makeStrapi();
      const controller = factory({ strapi });
      const ctx = makeCtx({ request: { body: {} } });

      await controller.bulkCreate(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith(
        "repos must be a non-empty array"
      );
      expect(service.bulkCreate).not.toHaveBeenCalled();
    });

    it("rejects when repos is an empty array", async () => {
      const { strapi, service } = makeStrapi();
      const controller = factory({ strapi });
      const ctx = makeCtx({ request: { body: { repos: [] } } });

      await controller.bulkCreate(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith(
        "repos must be a non-empty array"
      );
      expect(service.bulkCreate).not.toHaveBeenCalled();
    });

    it("rejects when repos is not an array", async () => {
      const { strapi, service } = makeStrapi();
      const controller = factory({ strapi });
      const ctx = makeCtx({ request: { body: { repos: "not-an-array" } } });

      await controller.bulkCreate(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith(
        "repos must be a non-empty array"
      );
      expect(service.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe("bulkDelete", () => {
    it("forwards ids to service.bulkDelete", async () => {
      const { strapi, service } = makeStrapi();
      service.bulkDelete.mockResolvedValue({ count: 3 });
      const controller = factory({ strapi });
      const ctx = makeCtx({ request: { body: { ids: [1, 2, 3] } } });

      await controller.bulkDelete(ctx);

      expect(service.bulkDelete).toHaveBeenCalledWith([1, 2, 3]);
      expect(ctx.send).toHaveBeenCalledWith({ count: 3 });
    });

    it("rejects when ids is missing", async () => {
      const { strapi, service } = makeStrapi();
      const controller = factory({ strapi });
      const ctx = makeCtx({ request: { body: {} } });

      await controller.bulkDelete(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith(
        "ids must be a non-empty array"
      );
      expect(service.bulkDelete).not.toHaveBeenCalled();
    });

    it("rejects when ids is empty", async () => {
      const { strapi, service } = makeStrapi();
      const controller = factory({ strapi });
      const ctx = makeCtx({ request: { body: { ids: [] } } });

      await controller.bulkDelete(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith(
        "ids must be a non-empty array"
      );
      expect(service.bulkDelete).not.toHaveBeenCalled();
    });
  });

  describe("find", () => {
    it("delegates to service.find with ctx.query", async () => {
      const { strapi, service } = makeStrapi();
      service.find.mockResolvedValue([{ id: 1 }]);
      const controller = factory({ strapi });
      const ctx = makeCtx({ query: { filters: { foo: "bar" } } });

      const result = await controller.find(ctx);

      expect(service.find).toHaveBeenCalledWith({ filters: { foo: "bar" } });
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe("findOne", () => {
    it("delegates to service.findOne with id and query", async () => {
      const { strapi, service } = makeStrapi();
      service.findOne.mockResolvedValue({ id: 5 });
      const controller = factory({ strapi });
      const ctx = makeCtx({ params: { id: "5" }, query: { populate: "*" } });

      const result = await controller.findOne(ctx);

      expect(service.findOne).toHaveBeenCalledWith("5", { populate: "*" });
      expect(result).toEqual({ id: 5 });
    });
  });
});
