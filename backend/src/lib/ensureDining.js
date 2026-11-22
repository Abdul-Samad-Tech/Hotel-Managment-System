const { DiningMenuCategory, DiningMenuItem, DiningTable } = require("../models");

/** Mirrors frontend/src/data/dining.js for first boot. Prices in cents. */
const DEFAULT_MENU = [
  {
    slug: "breakfast",
    title: "Breakfast",
    sortOrder: 1,
    items: [
      ["Tropical fruit plate", "Papaya, mango and lime", 1800],
      ["Ocean omelette", "Herbs, tomato and soft cheese", 2200],
      ["Maldivian pancakes", "Coconut and palm honey", 1600],
    ],
  },
  {
    slug: "lunch",
    title: "Lunch",
    sortOrder: 2,
    items: [
      ["Reef salad", "Greens, citrus and grilled prawn", 2800],
      ["Catch of the day", "Line-caught fish, herbs and lime", 3600],
      ["Garden risotto", "Seasonal vegetables and parmesan", 2600],
    ],
  },
  {
    slug: "dinner",
    title: "Dinner",
    sortOrder: 3,
    items: [
      ["Lantern tasting", "Five small plates by the water", 4800, true],
      ["Lagoon lobster", "Butter, chili and grilled lemon", 6400, true],
      ["Dark chocolate shell", "Sea salt and coconut cream", 1400],
    ],
  },
  {
    slug: "drinks",
    title: "Drinks",
    sortOrder: 4,
    items: [
      ["Palm honey tea", "Warm, with lime", 800],
      ["Lagoon cooler", "Coconut, lime and still water", 1000],
      ["Still water", "Chilled", 400],
    ],
  },
];

const DEFAULT_TABLES = [
  { label: "T1", capacity: 2, zone: "terrace", sortOrder: 1 },
  { label: "T2", capacity: 2, zone: "terrace", sortOrder: 2 },
  { label: "T3", capacity: 4, zone: "terrace", sortOrder: 3 },
  { label: "T4", capacity: 4, zone: "terrace", sortOrder: 4 },
  { label: "T5", capacity: 6, zone: "lantern", sortOrder: 5 },
  { label: "T6", capacity: 6, zone: "lantern", sortOrder: 6 },
  { label: "T7", capacity: 8, zone: "pavilion", sortOrder: 7 },
  { label: "T8", capacity: 4, zone: "pavilion", sortOrder: 8 },
];

async function ensureDiningMenu() {
  const count = await DiningMenuCategory.countDocuments();
  if (count > 0) return;

  for (const cat of DEFAULT_MENU) {
    const category = await DiningMenuCategory.create({
      slug: cat.slug,
      title: cat.title,
      sortOrder: cat.sortOrder,
      active: true,
    });
    let order = 0;
    for (const row of cat.items) {
      const [name, description, price, featured = false] = row;
      await DiningMenuItem.create({
        categoryId: category._id,
        name,
        description,
        price,
        available: true,
        featured: Boolean(featured),
        sortOrder: order++,
      });
    }
  }
}

async function ensureDiningTables() {
  const count = await DiningTable.countDocuments();
  if (count > 0) return;
  for (const table of DEFAULT_TABLES) {
    await DiningTable.create({ ...table, status: "free", active: true });
  }
}

async function ensureDiningDefaults() {
  await ensureDiningMenu();
  await ensureDiningTables();
}

module.exports = { ensureDiningDefaults, ensureDiningMenu, ensureDiningTables, DEFAULT_MENU };
