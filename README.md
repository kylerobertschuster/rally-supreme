# Rally Supreme

An interactive 3D bike parts catalog and assembly viewer built with Next.js, React, and Three.js.

## Features

- **3D Model Viewer**: Interactive 3D visualization of motorcycle components using Three.js
- **Parts Catalog**: Browse and explore detailed parts with specifications, part numbers, and links
- **Multiple Viewing Modes**: Switch between 3D model viewer and 2D diagram with hotspots
- **Part Selection**: Click on parts to view detailed information in a side drawer
- **Index View**: Complete parts list with filtering and organization

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19 with Tailwind CSS
- **3D Graphics**: Three.js with react-three-fiber
- **Language**: TypeScript
- **Dev Tools**: Prettier, ESLint, Vitest

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd rally-supreme

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── bike/[slug]/       # Dynamic bike pages
│   └── page.tsx           # Home page (redirects to default bike)
├── components/            # React components
│   ├── Bike3DCanvas.tsx   # 3D model viewer
│   ├── BikeCanvas.tsx     # 2D diagram viewer
│   └── PartDrawer.tsx     # Part details panel
└── lib/
    ├── loadBike.ts        # Server-side data loading
    └── types.ts           # TypeScript type definitions

data/
└── bikes/                 # Bike data (JSON)
    └── [bike-slug]/
        ├── bike.json      # Bike metadata
        ├── diagram.json   # Diagram configuration
        ├── parts.json     # Parts list
        └── hotspots.json  # Interactive hotspots

public/
└── bikes/                 # 3D models and images
    └── [bike-slug]/
        ├── 360/           # 360-degree view images
        └── exploded/      # Exploded view images
```

## Adding a New Bike

1. Create a new directory in `data/bikes/[bike-slug]/`
2. Add required JSON files: `bike.json`, `diagram.json`, `parts.json`
3. Place 3D models and images in `public/bikes/[bike-slug]/`
4. Reference the slug in your navigation or links

## API Routes

- `GET /api/bikes` - List all available bikes
- `GET /api/bikes/[slug]` - Get bike details
- `GET /api/bikes/[slug]/parts` - Get parts for a bike

## Performance Optimizations

- Image optimization with Next.js Image component
- Lazy loading for 3D models
- Code splitting for large components
- Server-side data loading with streaming

## Contributing

Contributions are welcome! Please follow these guidelines:
- Use Prettier for code formatting
- Write tests for new features
- Update TypeScript types as needed

## License

MIT
# rally-supreme
