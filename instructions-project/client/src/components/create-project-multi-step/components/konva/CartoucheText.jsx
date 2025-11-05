import React from "react";
import { Text, Group } from "react-konva";

/**
 * Componente para renderizar texto do cartouche sobre a imagem
 * Posiciona o texto no canto inferior esquerdo da área do cartouche
 */
export const CartoucheText = ({ 
  cartoucheImage, 
  backgroundImage,
  projectName = "", 
  streetOrZone = "", 
  option = "" 
}) => {
  console.log('🎨 [CartoucheText] Renderizando texto:', {
    hasCartoucheImage: !!cartoucheImage,
    hasBackgroundImage: !!backgroundImage,
    projectName,
    streetOrZone,
    option,
    cartoucheImage: cartoucheImage ? {
      x: cartoucheImage.x,
      y: cartoucheImage.y,
      width: cartoucheImage.width,
      height: cartoucheImage.height
    } : null,
    backgroundImage: backgroundImage ? {
      x: backgroundImage.x,
      y: backgroundImage.y,
      width: backgroundImage.width,
      height: backgroundImage.height
    } : null
  });

  if (!cartoucheImage) {
    console.warn('⚠️ [CartoucheText] Não há cartoucheImage');
    return null;
  }

  // Usar coordenadas absolutas fixas no canvas (702, 298)
  // Essas coordenadas são absolutas no canvas virtual (1200x600)
  // Baseadas nas dimensões da imagem fornecidas pelo usuário
  const baseX = 258;
  const baseY = 536;
  
  // Tamanhos de fonte
  const fontSizeLarge = 17; // Linha 1 (maior) - Nome do projeto
  const fontSizeMedium = 12; // Linha 2 e 3 - Rua e Opção
  const lineSpacing = 5; // Espaçamento fixo entre linhas
  
  console.log('📍 [CartoucheText] Posições calculadas:', {
    baseX,
    baseY,
    cartoucheImage: {
      x: cartoucheImage.x,
      y: cartoucheImage.y,
      width: cartoucheImage.width,
      height: cartoucheImage.height
    }
  });
  
  // Formatar option para exibição
  const formatOption = (opt) => {
    if (!opt || opt === "base") {
      return "Offre de base";
    }
    if (opt.startsWith("option-")) {
      const num = opt.replace("option-", "");
      return `Option ${num}`;
    }
    return opt;
  };

  // Calcular posições finais dos textos
  const projectNameY = baseY;
  const streetOrZoneY = baseY + fontSizeLarge + lineSpacing;
  const optionY = baseY + fontSizeLarge + fontSizeMedium + (lineSpacing * 2);

  console.log('📍 [CartoucheText] Renderizando textos com posições FINAIS:', {
    baseX,
    baseY,
    projectName: projectName ? { x: baseX, y: projectNameY, text: projectName } : null,
    streetOrZone: streetOrZone ? { x: baseX, y: streetOrZoneY, text: streetOrZone } : null,
    option: option ? { x: baseX, y: optionY, text: formatOption(option) } : null,
    fontSizeLarge,
    fontSizeMedium,
    lineSpacing
  });

  // Usar key única baseada nas coordenadas para forçar re-renderização quando mudar
  const positionKey = `${baseX}-${baseY}`;

  return (
    <Group key={`cartouche-text-group-${positionKey}`}>
      {/* Linha 1: Nome do projeto (fonte maior) */}
      {projectName && (
        <Text
          key={`projectName-${positionKey}`}
          x={baseX}
          y={projectNameY}
          text={projectName}
          fontSize={fontSizeLarge}
          fontFamily="Arial, sans-serif"
          fill="#000000"
          fontStyle="bold"
          align="left"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Linha 2: Rua ou zona (fonte média) */}
      {streetOrZone && (
        <Text
          key={`streetOrZone-${positionKey}`}
          x={baseX}
          y={streetOrZoneY}
          text={streetOrZone}
          fontSize={fontSizeMedium}
          fontFamily="Arial, sans-serif"
          fill="#000000"
          fontStyle="normal"
          align="left"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Linha 3: Opção (fonte média) */}
      {option && (
        <Text
          key={`option-${positionKey}`}
          x={baseX}
          y={optionY}
          text={formatOption(option)}
          fontSize={fontSizeMedium}
          fontFamily="Arial, sans-serif"
          fill="#000000"
          fontStyle="normal"
          align="left"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
};

