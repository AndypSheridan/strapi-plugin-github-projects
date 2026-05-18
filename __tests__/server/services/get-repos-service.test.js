"use strict";

jest.mock("@octokit/request", () => ({ request: jest.fn() }));
jest.mock("axios", () => ({ get: jest.fn() }));

const { request } = require("@octokit/request");
const axios = require("axios");
const factory = require("../../../server/services/get-repos-service");

const makeStrapi = ({ findMany, getProjectOrRepo } = {}) => ({
  entityService: {
    findMany: findMany || jest.fn().mockResolvedValue([]),
  },
  plugin: () => ({
    service: () => ({
      getProjectOrRepo: getProjectOrRepo || jest.fn().mockResolvedValue(null),
    }),
  }),
});

const stubGithubRepo = {
  id: 1,
  name: "my-repo",
  description: "desc",
  html_url: "https://github.com/me/my-repo",
  owner: { login: "me" },
  default_branch: "main",
};

describe("get-repos-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProjectOrRepo", () => {
    it("returns null when no matching project exists", async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const service = factory({ strapi: makeStrapi({ findMany }) });

      const result = await service.getProjectOrRepo({ id: 1 });

      expect(result).toBeNull();
    });

    it("returns the project id when exactly one match exists", async () => {
      const findMany = jest.fn().mockResolvedValue([{ id: 42 }]);
      const service = factory({ strapi: makeStrapi({ findMany }) });

      const result = await service.getProjectOrRepo({ id: 1 });

      expect(result).toBe(42);
    });

    it("returns null when multiple matches exist", async () => {
      const findMany = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const service = factory({ strapi: makeStrapi({ findMany }) });

      const result = await service.getProjectOrRepo({ id: 1 });

      expect(result).toBeNull();
    });

    it("filters findMany by repositoryId", async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const service = factory({ strapi: makeStrapi({ findMany }) });

      await service.getProjectOrRepo({ id: 123 });

      expect(findMany).toHaveBeenCalledWith(
        "plugin::github-projects.project",
        { filters: { repositoryId: 123 } }
      );
    });
  });

  describe("getPublicRepos", () => {
    it("maps the GitHub API response to the plugin's repo shape", async () => {
      request.mockResolvedValue({ data: [stubGithubRepo] });
      axios.get.mockResolvedValue({ data: "# Hello" });
      const service = factory({ strapi: makeStrapi() });

      const result = await service.getPublicRepos();

      expect(result).toHaveLength(1);
      const [repo] = result;
      expect(repo.id).toBe(1);
      expect(repo.name).toBe("my-repo");
      expect(repo.shortDescription).toBe("desc");
      expect(repo.url).toBe("https://github.com/me/my-repo");
      expect(repo.longDescription).toContain("Hello");
      expect(repo.projectId).toBeNull();
    });

    it("calls the GitHub API with the token from process.env", async () => {
      const originalToken = process.env.GITHUB_TOKEN;
      process.env.GITHUB_TOKEN = "test-token-xyz";
      request.mockResolvedValue({ data: [] });
      const service = factory({ strapi: makeStrapi() });

      await service.getPublicRepos();

      expect(request).toHaveBeenCalledWith(
        "GET /user/repos",
        expect.objectContaining({
          headers: { authorization: "token test-token-xyz" },
        })
      );
      process.env.GITHUB_TOKEN = originalToken;
    });

    it("fetches the README from owner/name@default_branch", async () => {
      request.mockResolvedValue({
        data: [
          {
            ...stubGithubRepo,
            owner: { login: "user" },
            name: "lib",
            default_branch: "trunk",
          },
        ],
      });
      axios.get.mockResolvedValue({ data: "" });
      const service = factory({ strapi: makeStrapi() });

      await service.getPublicRepos();

      expect(axios.get).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/user/lib/trunk/README.md"
      );
    });

    it("leaves longDescription null when the README request fails", async () => {
      request.mockResolvedValue({ data: [stubGithubRepo] });
      axios.get.mockRejectedValue(new Error("404 Not Found"));
      const service = factory({ strapi: makeStrapi() });

      const result = await service.getPublicRepos();

      expect(result[0].longDescription).toBeNull();
    });

    it("attaches the projectId from getProjectOrRepo lookup", async () => {
      request.mockResolvedValue({ data: [stubGithubRepo] });
      axios.get.mockRejectedValue(new Error("404"));
      const getProjectOrRepo = jest.fn().mockResolvedValue(99);
      const service = factory({ strapi: makeStrapi({ getProjectOrRepo }) });

      const result = await service.getPublicRepos();

      expect(result[0].projectId).toBe(99);
      expect(getProjectOrRepo).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: "my-repo" })
      );
    });

    it("returns an empty array when GitHub returns no repos", async () => {
      request.mockResolvedValue({ data: [] });
      const service = factory({ strapi: makeStrapi() });

      const result = await service.getPublicRepos();

      expect(result).toEqual([]);
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
