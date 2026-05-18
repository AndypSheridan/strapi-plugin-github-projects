import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Td, Th } from "@strapi/design-system/Table";
import {
  Box,
  Typography,
  Checkbox,
  Loader,
  Alert,
  Link,
  Flex,
  IconButton,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
} from "@strapi/design-system";
import { Pencil, Trash, Plus, ExclamationMarkCircle } from "@strapi/icons";
import { useNotification } from "@strapi/helper-plugin";
import axios from "../utils/axiosInstance";

const extractMessage = (err) =>
  err?.response?.data?.error?.message || err?.message || "Something went wrong";

const COL_COUNT = 5;

const Repo = () => {
  const history = useHistory();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);

  const toggleNotification = useNotification();
  const notifyError = (err) =>
    toggleNotification({
      type: "warning",
      message: {
        id: "github-projects.notification.error",
        defaultMessage: extractMessage(err),
      },
    });
  const notifySuccess = (message) =>
    toggleNotification({
      type: "success",
      message: {
        id: "github-projects.notification.success",
        defaultMessage: message,
      },
    });

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/github-projects/repos");
        setRepos(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const setProjectId = (repoId, projectId) =>
    setRepos((current) =>
      current.map((r) => (r.id === repoId ? { ...r, projectId } : r))
    );

  const toggleSelected = (repoId, checked) =>
    setSelectedRepos((current) =>
      checked ? [...current, repoId] : current.filter((id) => id !== repoId)
    );

  const createProject = async (repo) => {
    try {
      const response = await axios.post("/github-projects/project", repo);
      setProjectId(repo.id, response.data.id);
    } catch (err) {
      notifyError(err);
    }
  };

  const deleteProject = async (repoId, projectId) => {
    try {
      await axios.delete(`/github-projects/project/${projectId}`);
      setProjectId(repoId, null);
    } catch (err) {
      notifyError(err);
    }
  };

  const bulkCreate = async () => {
    const toCreate = repos.filter(
      (r) => selectedRepos.includes(r.id) && !r.projectId
    );
    if (toCreate.length === 0) return;
    try {
      const response = await axios.post("/github-projects/projects/bulk", {
        repos: toCreate,
      });
      setRepos((current) =>
        current.map((r) => {
          const project = response.data.find(
            (p) => p.repositoryId === `${r.id}`
          );
          return project ? { ...r, projectId: project.id } : r;
        })
      );
      setSelectedRepos([]);
      notifySuccess(
        `Created ${response.data.length} project${
          response.data.length === 1 ? "" : "s"
        }`
      );
    } catch (err) {
      notifyError(err);
    }
  };

  const bulkDelete = async () => {
    const toDelete = repos.filter(
      (r) => selectedRepos.includes(r.id) && r.projectId
    );
    if (toDelete.length === 0) return;
    const projectIds = toDelete.map((r) => r.projectId);
    try {
      await axios.delete("/github-projects/projects/bulk", {
        data: { ids: projectIds },
      });
      setRepos((current) =>
        current.map((r) =>
          projectIds.includes(r.projectId) ? { ...r, projectId: null } : r
        )
      );
      setSelectedRepos([]);
      notifySuccess(
        `Deleted ${projectIds.length} project${
          projectIds.length === 1 ? "" : "s"
        }`
      );
    } catch (err) {
      notifyError(err);
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete?.kind === "single") {
      await deleteProject(pendingDelete.repoId, pendingDelete.projectId);
    } else if (pendingDelete?.kind === "bulk") {
      await bulkDelete();
    }
    setPendingDelete(null);
  };

  if (error) {
    return (
      <Alert
        closeLabel="Close alert"
        title="Error fetching repos"
        variant="danger"
      >
        {error.toString()}
      </Alert>
    );
  }

  if (loading) {
    return <Loader />;
  }
  console.log(repos);

  const allChecked = selectedRepos?.length === repos.length;
  const isIndeterminate = selectedRepos?.length > 0 && !allChecked;

  const createableCount = repos.filter(
    (r) => selectedRepos.includes(r.id) && !r.projectId
  ).length;
  const deletableCount = repos.filter(
    (r) => selectedRepos.includes(r.id) && r.projectId
  ).length;

  return (
    <Box padding={8} background="neutral100">
      <Box paddingBottom={4}>
        <Flex gap={2}>
          <Button
            variant="default"
            startIcon={<Plus />}
            disabled={createableCount === 0}
            onClick={bulkCreate}
          >
            Add selected ({createableCount})
          </Button>
          <Button
            variant="danger"
            startIcon={<Trash />}
            disabled={deletableCount === 0}
            onClick={() => setPendingDelete({ kind: "bulk" })}
          >
            Delete selected ({deletableCount})
          </Button>
        </Flex>
      </Box>
      <Table colCount={COL_COUNT} rowCount={repos.length}>
        <Thead>
          <Tr>
            <Th>
              <Checkbox
                aria-label="Select all entries"
                value={allChecked}
                indeterminate={isIndeterminate}
                onValueChange={(checked) =>
                  setSelectedRepos(checked ? repos.map((r) => r.id) : [])
                }
              />
            </Th>
            <Th>
              <Typography variant="sigma">Name</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Description</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Url</Typography>
            </Th>
            <Th>
              <Typography variant="sigma">Actions</Typography>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {repos.map((repo) => {
            const { id, name, shortDescription, url, projectId } = repo;
            return (
              <Tr key={id}>
                <Td>
                  <Checkbox
                    aria-label={`Select ${id}`}
                    value={selectedRepos.includes(id)}
                    onValueChange={(checked) => toggleSelected(id, checked)}
                  />
                </Td>
                <Td>
                  <Typography textColor="neutral800">{name}</Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">
                    {shortDescription}
                  </Typography>
                </Td>
                <Td>
                  <Typography textColor="neutral800">
                    <Link
                      href={url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {url}
                    </Link>
                  </Typography>
                </Td>
                <Td>
                  {projectId ? (
                    <Flex>
                      <IconButton
                        onClick={() =>
                          history.push(
                            `/content-manager/collection-types/plugin::github-projects.project/${projectId}`
                          )
                        }
                        label="Edit"
                        borderWidth={0}
                      >
                        <Pencil />
                      </IconButton>
                      <Box paddingLeft={1}>
                        <IconButton
                          onClick={() =>
                            setPendingDelete({
                              kind: "single",
                              repoId: id,
                              projectId,
                            })
                          }
                          label="Delete"
                          borderWidth={0}
                        >
                          <Trash />
                        </IconButton>
                      </Box>
                    </Flex>
                  ) : (
                    <IconButton
                      onClick={() => createProject(repo)}
                      label="Add"
                      borderWidth={0}
                      icon={<Plus />}
                    />
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
      <Dialog
        onClose={() => setPendingDelete(null)}
        title="Confirmation"
        isOpen={pendingDelete !== null}
      >
        <DialogBody icon={<ExclamationMarkCircle />}>
          <Flex direction="column" alignItems="center" gap={2}>
            <Typography>
              {pendingDelete?.kind === "bulk"
                ? `Are you sure you want to delete ${deletableCount} project${
                    deletableCount === 1 ? "" : "s"
                  }?`
                : "Are you sure you want to delete this project?"}
            </Typography>
            <Typography variant="omega" textColor="neutral600">
              This action cannot be undone.
            </Typography>
          </Flex>
        </DialogBody>
        <DialogFooter
          startAction={
            <Button onClick={() => setPendingDelete(null)} variant="tertiary">
              Cancel
            </Button>
          }
          endAction={
            <Button
              onClick={confirmDelete}
              variant="danger-light"
              startIcon={<Trash />}
            >
              Confirm
            </Button>
          }
        />
      </Dialog>
    </Box>
  );
};

export default Repo;
