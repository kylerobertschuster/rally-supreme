export type Bike = {
  id: string;
  name: string;
  year?: string;
  manufacturer?: string;
  views?: string[];
};

export type Diagram = {
  id: string;
  label: string;
  image?: string; // URL under /public
  framePath?: string; // printf-style path, e.g. /bikes/.../frame-%04d.png
  frameCount?: number;
  viewer?: "frames" | "three";
  modelUrl?: string; // URL under /public
  width?: number;
  height?: number;
};

export type Part = {
  id: string;
  name: string;
  partNumber?: string;
  oemPartNumber?: string;
  supersedes?: string[];
  fitmentRules?: string[];
  inventorySources?: Array<{
    source: string;
    stockStatus?: "in_stock" | "low" | "backorder" | "unknown";
    leadTimeDays?: number;
    url?: string;
  }>;
  confidenceScore?: number;
  approvalStatus?: "draft" | "review" | "approved" | "deprecated";
  provenance?: {
    sourceSystem?: string;
    importedAt?: string;
    reviewedBy?: string;
    notes?: string;
  };
  tags?: string[];
  notes?: string;
  links?: { label: string; url: string }[];
  alternatives?: Array<{
    id: string;
    name: string;
    partNumber?: string;
    links?: { label: string; url: string }[];
  }>;
  replacement?: {
    id: string;
    name: string;
    partNumber?: string;
    links?: { label: string; url: string }[];
  } | null;
};

export type Hotspot = {
  partId: string;
  mode?: "norm" | "px"; // default norm
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MeshPartMappings = {
  meshNameToPartId?: Record<string, string>;
};
