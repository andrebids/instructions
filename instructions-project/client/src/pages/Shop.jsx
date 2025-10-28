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
  // Trending points to provided asset in public/demo-images/shop
  trending: "/demo-images/shop/IPL334W.jpg",
  new: "/demo-images/shop/TSLWW-W.jpg",
  sale: "/demo-images/shop/tgl72lw.jpg",
  christmas: "/demo-images/shop/pl250w_pl250b_V2.jpg",
  summer: "/demo-images/shop/simu-Gx254_V4.jpg",
};

// Fallbacks (online) in case a local image is missing
const fallbackImages = {
  trending: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1600&q=80",
  new: "https://images.unsplash.com/photo-1520975693416-35ae9233e6cf?auto=format&fit=crop&w=1600&q=80",
  sale: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80",
  christmas: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1600&q=80",
  summer: "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=1600&q=80",
};

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
    const [src, setSrc] = React.useState(categoryImages[cfg.id] || fallbackImages[cfg.id]);
    return (
      <Card isPressable onPress={() => navigate(`/shop/${cfg.id}`)} className="group bg-content1/40 overflow-hidden h-full">
        <CardBody className="p-0 h-full overflow-hidden">
          <div className="relative h-full">
            <Image
              removeWrapper
              src={src}
              alt={cfg.title}
              onError={() => setSrc(fallbackImages[cfg.id])}
              className={`z-0 w-full h-full transition-transform duration-300 ${cfg.id === 'summer' ? 'object-contain object-top bg-black group-hover:scale-100' : 'object-cover group-hover:scale-105'}`}
            />
            <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${cfg.id === 'summer' ? 'bg-gradient-to-b from-transparent via-black/30 to-black/50 dark:via-black/60 dark:to-black/80 opacity-100' : 'bg-black/35 dark:bg-black/60 opacity-100 group-hover:opacity-70'}`} />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-white text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg uppercase text-center">
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
    const [src, setSrc] = React.useState(categoryImages[cfg.id] || fallbackImages[cfg.id]);
    return (
      <Card isPressable onPress={() => navigate(`/shop/${cfg.id}`)} className="group bg-content1/40 overflow-hidden h-full">
        <CardBody className="p-0 h-full overflow-hidden">
          <div className="relative h-full">
            <Image removeWrapper src={src} alt={cfg.title} onError={() => setSrc(fallbackImages[cfg.id])} className="z-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 z-10 bg-black/35 dark:bg-black/60 opacity-100 transition-opacity duration-300 group-hover:opacity-70 pointer-events-none" />
            <div className="absolute inset-0 z-20 p-6 flex items-center justify-center">
              <div className="text-white text-7xl md:text-8xl font-bold tracking-tight drop-shadow-lg uppercase text-center">
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


