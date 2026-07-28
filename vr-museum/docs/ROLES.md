# Role permissions

Roles are enforced in UI controls, server-rendered pages, middleware, and API
Route Handlers. Hiding a control is never the authorization boundary.

| Capability | Visitor | Researcher | Archaeologist | Artist | Curator |
| --- | :---: | :---: | :---: | :---: | :---: |
| Browse collections and marketplace | Yes | Yes | Yes | Yes | Yes |
| Cart, checkout, and order history | Yes | Yes | Yes | Yes | Yes |
| Upload and manage own artifacts | No | No | Yes | Yes | Yes |
| List and manage own marketplace items | No | No | Yes | Yes | Yes |
| Approve or reject any upload | No | No | No | No | Yes |

## Role definitions

- **Visitor** is the buyer-oriented role for browsing and acquiring artifacts.
- **Researcher** has buyer access and uses acquired artifacts for study.
- **Archaeologist** can also contribute scans and list their own work.
- **Artist** can also contribute models and list their own work.
- **Curator** can contribute and sell, and is the sole moderation authority.

All marketplace listing edits and deletes remain owner-scoped. Curators do not
silently take ownership of another seller's listing. The only cross-owner
capability is explicit upload moderation.

Role-less OAuth accounts may only complete their profile. Authentication alone
does not grant role-protected access.
