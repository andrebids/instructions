// Mock data for Shop: products, categories, and projects

export const categories = [
  { id: "trending", name: "Trending" },
  { id: "new", name: "New" },
  { id: "sale", name: "Sale" },
  { id: "christmas", name: "Christmas" },
  { id: "summer", name: "Summer" },
];

export const projects = [
  { id: "p1", name: "Centro Comercial Colombo", budget: 40000, status: "in_progress" },
  { id: "p2", name: "Lisbon Municipality", budget: 25000, status: "created" },
  { id: "p3", name: "Luxury Hotel Chain", budget: 30000, status: "created" },
];

// Helper images from public/demo-images (fallback to unsplash if missing)
const img = (path, fallback) => path || fallback;
// Simple SVG color placeholder for temporary product images
const svg = (color) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><rect width='100%' height='100%' fill='${color}'/></svg>`)}`;

export const products = [
  {
    id: "prd-001",
    name: "IPL317R",
    price: 1299,
    stock: 32,
    videoFile: "IPL317R.webm",
    images: {
      day: img("/SHOP/TRENDING/DAY/IPL317R_DAY.webp", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/SHOP/TRENDING/NIGHT/IPL317R_NIGHT.webp", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: {
        brancoPuro: img("/demo-images/shop/IPL334W.webp", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
        vermelho: svg('#ef4444'),
      },
    },
    tags: ["trending", "christmas"],
    type: "2D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
    specs: {
      descricao: "Decorative banner-style light for pole mounting. Fictitious data for demo.",
      tecnicas: "230V AC, IP65, 48W",
      dimensoes: "2.80 m x 0.80 m",
      dimensions: { widthM: 0.80, heightM: 2.80 },
      weight: "11 kg",
      effects: "SLOWFLASH & SOFT XLED (Pure White and Red)",
      materiais: "LED modules, aluminum, white and red bioprint",
      stockPolicy: "Made to order (lead time 2–4 weeks)",
    },
  },
  {
    id: "prd-005b",
    name: "GX350LW",
    price: 899,
    stock: 18,
    videoFile: "GX350LW.webm",
    images: {
      day: img("/SHOP/TRENDING/DAY/GX350LW.webp", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/SHOP/TRENDING/NIGHT/GX350LW_NIGHT.webp", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: {
        brancoPuro: img("/demo-images/shop/IPL334W.webp", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
        brancoQuente: img("/demo-images/shop/TSLWW-W.webp", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"),
      },
    },
    tags: ["trending"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Chão",
    specs: {
      descricao: "SCENETTE JOSÉ",
      tecnicas: "IP65, 230V AC, 85W",
      dimensoes: "2.4 m (H) x 2.0 m (W) x 0.5 m (D)",
      dimensions: { widthM: 2.0, heightM: 2.4, depthM: 0.5 },
      weight: "36 kg",
      effects: "Warm white & Pure white XLED (257)",
      materiais: "Warm‑white and pure‑white LEDs, aluminum",
    },
  },
  {
    id: "prd-005",
    name: "GX349L",
    price: 899,
    stock: 21,
    videoFile: "GX349L.webm",
    images: {
      day: img("/SHOP/TRENDING/DAY/GX349L_DAY.webp", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/SHOP/TRENDING/NIGHT/GX349L_NIGHT.webp", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: {
        brancoPuro: img("/demo-images/shop/IPL334W.webp", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
        brancoQuente: img("/demo-images/shop/TSLWW-W.webp", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"),
      },
    },
    tags: ["trending", "sale"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Chão",
    specs: {
      descricao: "Luminous 3D bear-shaped sculpture with illuminated decorative swirl.",
      tecnicas: "IP65, 230V AC, 60W, high‑efficiency LEDs",
      dimensoes: "2.60 m (W) x 1.50 m (H) x 1.10 m (D)",
      dimensions: { widthM: 2.60, heightM: 1.50, depthM: 1.10 },
      materiais: "White bioprint, gold bioprint, Fil Lumière, pure white LEDs with flash",
      weight: "65 kg",
      effects: "Pure white with warm‑white accent (day/night modes)",
    },
  },
  {
    id: "prd-005a",
    name: "IPL337W",
    price: 1299,
    stock: 28,
    videoFile: "IPL337W.webm",
    images: {
      day: img("/SHOP/TRENDING/DAY/IPL337W.webp", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/SHOP/TRENDING/NIGHT/IPL337W.webp", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: { brancoQuente: img("/demo-images/shop/TSLWW-W.webp", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800") },
    },
    tags: ["trending"],
    type: "2D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
    variantProductByColor: { brancoPuro: "prd-006", brancoQuente: "prd-005a" },
    specs: {
      descricao: "GATSBY BANNER",
      tecnicas: "230V AC, IP65, 50W",
      dimensoes: "2.80 m x 0.80 m",
      dimensions: { widthM: 0.80, heightM: 2.80 },
      weight: "8 kg",
      effects: "SLOWFLASH & SOFT XLED",
      materiais: "Warm‑white LEDs with flash, gold bioprint, aluminum, Comet wire",
      stockPolicy: "Made to order (lead time 2–4 weeks)",
    },
  },
  // Additional placeholder products to reach 16 items for the grid
  {
    id: "prd-006",
    name: "IPL337",
    price: 1299,
    stock: 31,
    videoFile: "IPL337.webm",
    images: {
      day: img("/SHOP/TRENDING/DAY/IPL337.webp", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/SHOP/TRENDING/NIGHT/IPL337.webp", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: { brancoPuro: img("/demo-images/shop/IPL334W.webp", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800") }
    },
    tags: ["trending", "summer"],
    type: "2D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
    variantProductByColor: { brancoPuro: "prd-006", brancoQuente: "prd-005a" },
    specs: {
      descricao: "GATSBY BANNER",
      tecnicas: "230V AC, IP65, 50W",
      dimensoes: "2.80 m x 0.80 m",
      dimensions: { widthM: 0.80, heightM: 2.80 },
      weight: "8 kg",
      effects: "SLOWFLASH & SOFT XLED",
      materiais: "Pure‑white LEDs with flash, white bioprint, aluminum, Comet wire",
      stockPolicy: "Made to order (lead time 2–4 weeks)",
    },
  },
];

export function getProductsByCategory(categoryId) {
  if (!categoryId) return products;
  return products.filter((p) => p.tags.includes(categoryId));
}


