# Rally Supreme Systems

Enterprise aftermarket digitization platform for legacy assemblies.

Rally Supreme Systems converts fragmented parts catalogs into interactive, governed assembly workspaces for OEM aftersales, dealer operations, and distributor teams.

## Platform Positioning

- `Category`: B2B Aftersales Infrastructure
- `Primary User`: Aftersales Director, Catalog Manager, Service Ops Lead
- `Core Problem`: Parts misidentification across legacy model lines
- `Delivery Model`: SaaS workflow + conversion services

## Core Capabilities

- Interactive exploded assembly workspace (`/bike/[slug]`)
- Mesh-level part mapping for 3D models (`mesh-map.json`)
- Controlled replacement and alternative routing
- Fitment-aware part metadata model
- Source traceability and approval workflow attributes

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Three.js with `@react-three/fiber`
- TypeScript
- Tailwind CSS

## Enterprise Pages

- `/` Platform overview and pilot framing
- `/solutions`
- `/industries`
- `/security`
- `/integrations`
- `/contact-sales`

## Data Contract

Each program is stored in `data/bikes/[slug]/`.

Required files:

- `bike.json`
- `diagram.json`
- `parts.json`

Optional files:

- `hotspots.json`
- `mesh-map.json`

### `parts.json` enterprise fields

In addition to `id`, `name`, and `links`, parts now support:

- `oemPartNumber`
- `supersedes`
- `fitmentRules`
- `inventorySources`
- `confidenceScore`
- `approvalStatus`
- `provenance`

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```
