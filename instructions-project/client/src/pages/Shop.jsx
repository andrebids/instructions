import React from "react";
import { Card, CardBody, Image, Button, Input } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { Icon } from "@iconify/react";
import { PageTitle } from "../components/page-title";
import { useUser } from "../context/UserContext";

// Fallback-friendly images (use local if present, else remote placeholder)
// High-quality Unsplash images matching categories; cropped to fill cards
const categoryImages = {
  // Local WebP assets in public/demo-images/shop
  trending: "/demo-images/shop/TRENDING.webp",
  new: "/demo-images/shop/NEW.webp",
  sale: "/demo-images/shop/SALE.webp",
  christmas: "/demo-images/shop/XMAS.webp",
  summer: "/demo-images/shop/SUMMER.webp",
};

// No online fallbacks: force local assets only

export default function Shop() {
  const navigate = useNavigate();
  const { categories } = useShop();
  const { userName } = useUser();
  const mainDescription = "Pick a category or explore what's trending today.";

  const topRow = [
    { id: "trending", title: "Trending", subtitle: "Our best sellers" },
    { id: "new", title: "New" },
    { id: "sale", title: "Sale" },
  ];
  const bottomRow = [
    { id: "christmas", title: "XMAS", rightIcon: "lucide:sparkles" },
    { id: "summer", title: "SUMMER", rightIcon: "lucide:sun" },
  ];

  const exists = (id) => categories.find((c) => c.id === id);

  const SmallCard = ({ cfg }) => {
    if (!exists(cfg.id)) return null;
    return (
      <Card isPressable onPress={() => navigate(`/shop/${cfg.id}`)} className="group bg-content1/40 overflow-hidden h-full">
        <CardBody className="p-0 h-full overflow-hidden">
          <div className="relative h-full">
            <Image
              removeWrapper
              src={categoryImages[cfg.id]}
              alt={cfg.title}
              className={`z-0 w-full h-full transition-transform duration-300 ${cfg.id === 'summer' ? 'object-contain object-top bg-black group-hover:scale-100' : 'object-cover group-hover:scale-105'}`}
            />
            <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${cfg.id === 'summer' ? 'bg-gradient-to-b from-transparent via-black/30 to-black/50 dark:via-black/60 dark:to-black/80 opacity-100' : 'bg-black/35 dark:bg-black/60 opacity-100 group-hover:opacity-70'}`} />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-white text-4xl md:text-5xl font-bold tracking-tight uppercase text-center">
                {cfg.title}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  const LargeCard = ({ cfg }) => {
    if (!exists(cfg.id)) return null;
    return (
      <Card isPressable onPress={() => navigate(`/shop/${cfg.id}`)} className="group bg-content1/40 overflow-hidden h-full">
        <CardBody className="p-0 h-full overflow-hidden">
          <div className="relative h-full">
            <Image removeWrapper src={categoryImages[cfg.id]} alt={cfg.title} className="z-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 z-10 bg-black/35 dark:bg-black/60 opacity-100 transition-opacity duration-300 group-hover:opacity-70 pointer-events-none" />
            <div className="absolute inset-0 z-20 p-6 flex items-center justify-center">
              <div className="text-white text-7xl md:text-8xl font-bold tracking-tight uppercase text-center">
                {cfg.title}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden p-6 flex flex-col">
      <PageTitle title="Shop" userName={userName} lead={`Here's your catalog, ${userName}`} subtitle={mainDescription} />
      {/* Top utility bar */}
      <div className="mb-5 flex items-center justify-end gap-2">
        <Button isIconOnly variant="light" aria-label="Search">
          <Icon icon="lucide:search" className="text-xl" />
        </Button>
        <Button isIconOnly variant="light" aria-label="Cart">
          <Icon icon="lucide:shopping-cart" className="text-xl" />
        </Button>
      </div>

      {/* Grid container fills remaining area; explicit proportion: top ~35%, bottom ~65% */}
      <div className="flex-1 grid grid-rows-[35%_65%] gap-5 min-h-0">
        {/* Top row: cards fill row height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 h-full">
          {topRow.map((cfg) => (
            <SmallCard key={cfg.id} cfg={cfg} />
          ))}
        </div>

        {/* Bottom row: stretches to fill remaining height */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full min-h-0">
          {bottomRow.map((cfg) => (
            <LargeCard key={cfg.id} cfg={cfg} />
          ))}
        </div>
      </div>
    </div>
  );
}


