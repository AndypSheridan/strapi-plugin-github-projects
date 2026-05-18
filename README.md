## strapi-plugin-github-projects

A Strapi v4 plugin that adds a GitHub Projects admin panel page. Browse your public GitHub repositories from inside Strapi, and turn any of them into a `project` content-type entry with one click — single or in bulk.

## Features

- List your public GitHub repositories inside the Strapi admin panel
- Create a Strapi `project` entry from any repository (title, short description, long description from README, repository URL)
- Bulk create / bulk delete (single round-trip, transactional)
- Confirmation dialog before deletes
- Author attribution: projects are created `createdBy` the admin user who clicked Add
- Permission-gated route (`plugin::github-projects.repos.read`) so non-super-admin roles can be locked out

## Requirements

- Strapi `^4.0.0`
- Node `>=18.0.0 <=20.x.x`
- A GitHub personal access token with `read:user` and `public_repo` scopes

## Installation

```sh
yarn add strapi-plugin-github-projects
# or
npm install strapi-plugin-github-projects
```

## Configuration

### 1. Enable the plugin

In your Strapi project, edit `config/plugins.js`:

```js
module.exports = ({ env }) => ({
  "github-projects": {
    enabled: true,
  },
});
```

### 2. Set the GitHub token

The plugin reads `process.env.GITHUB_TOKEN`. Add it to your `.env`:

```
GITHUB_TOKEN=ghp_your_personal_access_token
```

Create the token at https://github.com/settings/tokens with at minimum the `read:user` and `public_repo` scopes.

### 3. Grant permissions

After starting Strapi, go to **Settings → Administration Panel → Roles** and grant:

- `View and access the plugin` — controls whether the plugin's nav item appears
- `Read Github repositories` — controls whether the role can call `GET /github-projects/repos`

Grant these on whichever roles (Editor, Author, custom) should have access. Super Admin gets them automatically.

### 4. Restart

```sh
yarn develop
```

The "Github Projects" item appears in the admin nav.

## Usage

Open the plugin from the admin nav. You'll see a table of your public repositories. For each row:

- **Add (+)** — creates a `project` entry from this repo
- **Edit (pencil)** — opens the existing project in the content manager
- **Delete (trash)** — deletes the project, asks for confirmation first

Use the row checkboxes plus the bulk buttons at the top to add or delete multiple projects in one request.

## License

MIT
