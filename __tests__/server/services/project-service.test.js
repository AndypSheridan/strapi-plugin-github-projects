"use strict";

const factory = require("../../../server/services/project-service");

const UID = "plugin::github-projects.project";

const makeStrapi = () => ({
  entityService: {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findOne: jest.fn(),
  },
  db: {
    transaction: jest.fn((fn) => fn()),
    query: jest.fn(() => ({ deleteMany: jest.fn() })),
  },
});

describe("project-service", () => {
  let strapi;
  let service;

  beforeEach(() => {
    strapi = makeStrapi();
    service = factory({ strapi });
  });

  describe("create", () => {
    const repo = {
      id: 123,
      name: "my-repo",
      shortDescription: "a short description",
      url: "https://github.com/me/my-repo",
      longDescription: "<p>readme html</p>",
    };

    it("maps the repo to the project schema and calls entityService.create", async () => {
      strapi.entityService.create.mockResolvedValue({ id: 1 });

      const result = await service.create(repo, 42);

      expect(strapi.entityService.create).toHaveBeenCalledWith(UID, {
        data: {
          repositoryId: "123",
          title: "my-repo",
          shortDescription: "a short description",
          repositoryUrl: "https://github.com/me/my-repo",
          longDescription: "<p>readme html</p>",
          createdBy: 42,
          updatedBy: 42,
        },
      });
      expect(result).toEqual({ id: 1 });
    });

    it("stringifies the GitHub repo id (uid field expects a string)", async () => {
      strapi.entityService.create.mockResolvedValue({ id: 1 });
      await service.create({ ...repo, id: 999 }, 1);
      const callData = strapi.entityService.create.mock.calls[0][1].data;
      expect(callData.repositoryId).toBe("999");
      expect(typeof callData.repositoryId).toBe("string");
    });

    it("propagates errors from entityService.create", async () => {
      strapi.entityService.create.mockRejectedValue(new Error("unique constraint"));
      await expect(service.create(repo, 1)).rejects.toThrow("unique constraint");
    });
  });

  describe("delete", () => {
    it("calls entityService.delete with the UID and id", async () => {
      strapi.entityService.delete.mockResolvedValue({ id: 5 });
      const result = await service.delete(5);
      expect(strapi.entityService.delete).toHaveBeenCalledWith(UID, 5);
      expect(result).toEqual({ id: 5 });
    });
  });

  describe("bulkCreate", () => {
    it("wraps the work in a db.transaction", async () => {
      strapi.entityService.create.mockResolvedValue({ id: 1 });
      await service.bulkCreate([{ id: 1, name: "a" }], 1);
      expect(strapi.db.transaction).toHaveBeenCalledTimes(1);
    });

    it("creates one entity per repo and returns them in order", async () => {
      strapi.entityService.create
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 });

      const repos = [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
      ];
      const result = await service.bulkCreate(repos, 7);

      expect(strapi.entityService.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("attributes createdBy/updatedBy on every created entity", async () => {
      strapi.entityService.create.mockResolvedValue({ id: 0 });
      await service.bulkCreate([{ id: 1, name: "a" }, { id: 2, name: "b" }], 99);

      strapi.entityService.create.mock.calls.forEach(([, opts]) => {
        expect(opts.data.createdBy).toBe(99);
        expect(opts.data.updatedBy).toBe(99);
      });
    });

    it("handles an empty input without calling entityService.create", async () => {
      const result = await service.bulkCreate([], 1);
      expect(strapi.entityService.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("bulkDelete", () => {
    it("issues a single deleteMany with a where id IN clause", async () => {
      const deleteMany = jest.fn().mockResolvedValue({ count: 3 });
      strapi.db.query.mockReturnValue({ deleteMany });

      const result = await service.bulkDelete([1, 2, 3]);

      expect(strapi.db.query).toHaveBeenCalledWith(UID);
      expect(deleteMany).toHaveBeenCalledWith({
        where: { id: { $in: [1, 2, 3] } },
      });
      expect(result).toEqual({ count: 3 });
    });
  });

  describe("find / findOne", () => {
    it("find delegates to entityService.findMany with the UID and params", async () => {
      strapi.entityService.findMany.mockResolvedValue([{ id: 1 }]);
      const params = { filters: { foo: "bar" } };

      const result = await service.find(params);

      expect(strapi.entityService.findMany).toHaveBeenCalledWith(UID, params);
      expect(result).toEqual([{ id: 1 }]);
    });

    it("findOne delegates to entityService.findOne with the UID, id, and params", async () => {
      strapi.entityService.findOne.mockResolvedValue({ id: 5 });
      const params = { populate: "*" };

      const result = await service.findOne(5, params);

      expect(strapi.entityService.findOne).toHaveBeenCalledWith(UID, 5, params);
      expect(result).toEqual({ id: 5 });
    });
  });
});
