// Mock data for Shop: products, categories, and projects

export const categories = [
  { id: "trending", name: "Trending" },
  { id: "new", name: "New" },
  { id: "sale", name: "Sale" },
  { id: "christmas", name: "Christmas" },
  { id: "summer", name: "Summer" },
];

export const projects = [
  { id: "p1", name: "Centro Comercial Colombo", budget: 40000 },
  { id: "p2", name: "Lisbon Municipality", budget: 25000 },
  { id: "p3", name: "Luxury Hotel Chain", budget: 30000 },
];

// Helper images from public/demo-images (fallback to unsplash if missing)
const img = (path, fallback) => path || fallback;

export const products = [
  {
    id: "prd-001",
    name: "Arco Luminoso 3D",
    price: 1299,
    images: {
      day: img("/demo-images/results/bridge_day.jpg", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/demo-images/results/bridge_night.jpg", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: {
        brancoPuro: img("/demo-images/decorations/star_white.jpg", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
        brancoQuente: img("/demo-images/decorations/star_warm.jpg", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"),
      },
    },
    tags: ["trending", "christmas"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
    specs: {
      descricao: "Arco decorativo com LED de alta eficiência.",
      tecnicas: "IP65, 220V, 120W",
      dimensoes: "3.0m x 2.2m x 0.4m",
      materiais: "Alumínio, Acrílico difusor",
    },
  },
  {
    id: "prd-002",
    name: "Estrela Suspensa 2D",
    price: 349,
    images: {
      day: img("/demo-images/decorations/star_day.jpg", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/demo-images/decorations/star_night.jpg", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: {
        brancoPuro: img("/demo-images/decorations/star_white.jpg", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
        brancoQuente: img("/demo-images/decorations/star_warm.jpg", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"),
      },
    },
    tags: ["new", "christmas"],
    type: "2D",
    usage: "Shopping",
    location: "Interior",
    mount: "Transversal",
    specs: {
      descricao: "Estrela leve para ambientes internos.",
      tecnicas: "IP20, 24V, 25W",
      dimensoes: "0.8m x 0.8m",
      materiais: "PVC, LED SMD",
    },
  },
  {
    id: "prd-003",
    name: "Caminho Luminoso",
    price: 499,
    images: {
      day: img("/demo-images/decorations/path_day.jpg", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/demo-images/decorations/path_night.jpg", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: {
        brancoPuro: img("/demo-images/decorations/star_white.jpg", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
        brancoQuente: img("/demo-images/decorations/star_warm.jpg", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"),
      },
    },
    tags: ["sale", "summer"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Chão",
    specs: {
      descricao: "Balizadores modulares para caminhos externos.",
      tecnicas: "IP67, 24V, 12W",
      dimensoes: "0.6m x 0.15m",
      materiais: "Alumínio anodizado",
    },
  },
  {
    id: "prd-004",
    name: "Fita LED Decorativa",
    price: 129,
    images: {
      day: img("/demo-images/decorations/strip_day.jpg", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/demo-images/decorations/strip_night.jpg", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: {
        brancoPuro: img("/demo-images/decorations/star_white.jpg", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
        brancoQuente: img("/demo-images/decorations/star_warm.jpg", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"),
      },
    },
    tags: ["new", "summer"],
    type: "2D",
    usage: "Shopping",
    location: "Interior",
    mount: "Transversal",
    specs: {
      descricao: "Fita LED flexível para aplicações variadas.",
      tecnicas: "IP20, 12V, 14W/m",
      dimensoes: "Bobina 5m",
      materiais: "PCB flexível, LED SMD",
    },
  },
  {
    id: "prd-005",
    name: "Poste Ornamental",
    price: 899,
    images: {
      day: img("/demo-images/decorations/pole_day.jpg", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
      night: img("/demo-images/decorations/pole_night.jpg", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800"),
      colors: {
        brancoPuro: img("/demo-images/decorations/star_white.jpg", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"),
        brancoQuente: img("/demo-images/decorations/star_warm.jpg", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"),
      },
    },
    tags: ["trending", "sale"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
    specs: {
      descricao: "Poste urbano com adorno iluminado.",
      tecnicas: "IP65, 220V, 60W",
      dimensoes: "3.5m altura",
      materiais: "Aço galvanizado, LED COB",
    },
  },
];

export function getProductsByCategory(categoryId) {
  if (!categoryId) return products;
  return products.filter((p) => p.tags.includes(categoryId));
}


