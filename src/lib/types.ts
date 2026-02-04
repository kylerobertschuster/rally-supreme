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
  image: string; // URL under /public
  width?: number;
  height?: number;
};

export type Part = {
  id: string;
  name: string;
  partNumber?: string;
  tags?: string[];
  notes?: string;
  links?: { label: string; url: string }[];
};

export type Hotspot = {
  partId: string;
  mode?: "norm" | "px"; // default norm
  x: number;
  y: number;
  w: number;
  h: number;
};
