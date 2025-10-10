// Mock de clientes
export const MOCK_CLIENTS = [
  { id: 1, name: "Fashion Outlet", email: "contact@fashionoutlet.com", phone: "+351 123 456 789" },
  { id: 2, name: "Lisbon Municipality", email: "info@cm-lisboa.pt", phone: "+351 987 654 321" },
  { id: 3, name: "TechStart Inc", email: "hello@techstart.com", phone: "+351 234 567 890" },
  { id: 4, name: "GreenMarket", email: "contact@greenmarket.pt", phone: "+351 345 678 901" },
  { id: 5, name: "Urban Cafe", email: "info@urbancafe.pt", phone: "+351 456 789 012" },
  { id: 6, name: "Digital Agency", email: "team@digitalagency.com", phone: "+351 567 890 123" },
  { id: 7, name: "Restaurant Porto", email: "reservas@restaurantporto.pt", phone: "+351 678 901 234" },
  { id: 8, name: "Sports Center", email: "info@sportscenter.pt", phone: "+351 789 012 345" },
];

// Nomes de projetos para demo
export const PROJECT_NAME_SUGGESTIONS = [
  "Christmas 2025 Collection",
  "Summer Campaign 2025",
  "New Year Celebration",
  "Spring Showcase",
  "Black Friday Special",
  "Winter Wonderland",
  "Easter Display",
  "Valentine's Day Decor",
  "Halloween Theme",
  "Back to School Event",
  "Mother's Day Campaign",
  "Father's Day Showcase",
  "Independence Day Display",
  "Autumn Collection",
  "Holiday Season 2025",
];

// Funções utilitárias
export const getRandomClient = () => {
  const randomIndex = Math.floor(Math.random() * MOCK_CLIENTS.length);
  return MOCK_CLIENTS[randomIndex];
};

export const getRandomProjectName = () => {
  const randomIndex = Math.floor(Math.random() * PROJECT_NAME_SUGGESTIONS.length);
  return PROJECT_NAME_SUGGESTIONS[randomIndex];
};

