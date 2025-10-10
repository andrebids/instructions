import React from "react";
import { Card, CardFooter, Image } from "@heroui/react";
import { Icon } from "@iconify/react";

export function ProjectTypeCard({
  type,
  title,
  description,
  image,
  isSelected,
  onSelect,
}) {
  return (
    <Card 
      isPressable 
      isFooterBlurred
      radius="lg"
      shadow="sm"
      aria-label={`Select ${title} project type`}
      className={`cursor-pointer transition-all duration-200 w-full ${
        isSelected 
          ? "ring-2 ring-primary/70 shadow-medium" 
          : "hover:shadow-medium"
      }`}
      onPress={onSelect}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
        <Image
          removeWrapper
          src={image}
          alt={title}
          className="z-0 w-full h-full object-cover"
        />
        <CardFooter className="absolute bottom-0 z-10 bg-black/50 text-white flex items-center justify-between w-full gap-3">
          <div className="leading-tight text-left">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs opacity-90 mt-0.5">{description}</p>
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            isSelected 
              ? "border-primary bg-primary/20" 
              : "border-white/50 bg-white/10"
          }`}>
            {isSelected && (
              <Icon icon="lucide:check" className="text-primary text-sm" />
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}

