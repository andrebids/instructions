// Função para gerar o Logo Number automaticamente baseado no nome do projeto
export const generateLogoNumber = (projectName, currentLogoNumber = "", savedLogos = [], currentLogo = {}) => {
  if (!projectName || projectName.trim() === "") {
    return "";
  }

  // IMPORTANTE: Se o currentLogo já tem um logoNumber válido e estamos editando, NÃO gerar novo número
  // Verificar se o currentLogo tem um ID (indica que é um logo existente sendo editado)
  if (currentLogo.id && currentLogo.logoNumber && currentLogo.logoNumber.trim() !== "") {
    const match = currentLogo.logoNumber.match(/-L\s*(\d+)/i);
    if (match) {
      console.log("Logo has ID and valid logoNumber (editing existing logo). Preserving:", currentLogo.logoNumber);
      return currentLogo.logoNumber; // Preservar o número existente
    }
  }

  // Usar o nome do projeto como base
  const baseName = projectName.trim();
  let maxNumber = 0;
  const usedNumbers = new Set();

  // Verificar nos logos salvos - contar todos os logos que têm o padrão -L<número>
  console.log("Generating Logo Number. SavedLogos:", savedLogos);
  savedLogos.forEach((logo) => {
    if (logo.logoNumber) {
      // Limpar espaços extras e tentar encontrar o padrão -L<número>
      // Pode estar no meio ou no final, com ou sem espaços
      const cleanedLogoNumber = logo.logoNumber.trim();
      const match = cleanedLogoNumber.match(/-L\s*(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > 0) {
          console.log("Found logo number:", num, "in saved logo:", logo.logoNumber);
          usedNumbers.add(num);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
  });

  // IMPORTANTE: Também verificar o currentLogo atual (que pode ter um logo anterior ainda não salvo)
  // Isso garante que quando criamos o Logo 2, o Logo 1 (ainda em currentLogo) seja contado
  // Só contar se o currentLogo.logoNumber for diferente do currentLogoNumber (que está sendo gerado)
  // e se o currentLogo.logoNumber não estiver vazio
  // NÃO contar se o currentLogo tem um ID (é um logo existente sendo editado)
  if (currentLogo.logoNumber &&
    currentLogo.logoNumber.trim() !== "" &&
    currentLogo.logoNumber !== currentLogoNumber &&
    !currentLogo.id) { // Não contar se tem ID (logo existente)
    const cleanedCurrentLogoNumber = currentLogo.logoNumber.trim();
    const match = cleanedCurrentLogoNumber.match(/-L\s*(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        console.log("Found logo number in currentLogo:", num, "in", currentLogo.logoNumber);
        usedNumbers.add(num);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }

  console.log("Max number found:", maxNumber, "from", savedLogos.length, "saved logos. Used numbers:", Array.from(usedNumbers).sort((a, b) => a - b));

  // Se o logo atual já tem um número válido, não contar ele mesmo (estamos editando)
  // Mas se não tem número ou tem um número diferente, precisamos gerar um novo
  if (currentLogoNumber && currentLogoNumber.trim() !== "") {
    const cleanedCurrentLogoNumber = currentLogoNumber.trim();
    const match = cleanedCurrentLogoNumber.match(/-L\s*(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        // Se este número já está nos logos salvos ou no currentLogo, significa que estamos editando este logo
        // Nesse caso, não devemos gerar um novo número, devemos manter o atual
        if (usedNumbers.has(num)) {
          console.log("Current logo number exists in saved logos or currentLogo (editing). Returning:", currentLogoNumber);
          return currentLogoNumber.trim(); // Retornar o número atual se já existe (sem espaços extras)
        }
        // Se não está nos salvos mas tem um número, considerar para o máximo
        if (num > maxNumber) {
          maxNumber = num;
        }
        // Adicionar ao usedNumbers para não gerar duplicado
        usedNumbers.add(num);
      }
    }
  }

  // Encontrar o próximo número disponível (não apenas maxNumber + 1, mas o próximo que não está em uso)
  // Isso garante que mesmo se houver gaps (ex: L1, L3), o próximo será L2, não L4
  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber++;
  }

  // Se nextNumber for maior que maxNumber + 1, significa que há gaps, mas vamos usar o próximo disponível
  // Se não há gaps, nextNumber será maxNumber + 1
  console.log("Next number generated:", nextNumber, "for project:", baseName, "(max was:", maxNumber, ", used:", Array.from(usedNumbers).sort((a, b) => a - b), ")");
  return `${baseName} -L${nextNumber}`;
};




