import { Product } from '../models/index.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { generateThumbnail, processImageToWebP } from '../utils/imageUtils.js';

// Função helper para atualizar tag "new" baseado no releaseYear mais recente
async function updateNewTagForProducts() {
  try {
    console.log('🆕 [UPDATE NEW TAG] Atualizando tags "new" baseado no releaseYear...');

    // Buscar todos os produtos ativos com releaseYear
    var allProducts = await Product.findAll({
      where: {
        isActive: true
      },
      attributes: ['id', 'releaseYear', 'tags']
    });

    // Encontrar o ano mais recente
    var latestYear = null;
    for (var i = 0; i < allProducts.length; i++) {
      var product = allProducts[i];
      if (product.releaseYear && typeof product.releaseYear === 'number') {
        if (latestYear === null || product.releaseYear > latestYear) {
          latestYear = product.releaseYear;
        }
      }
    }

    console.log('🆕 [UPDATE NEW TAG] Ano mais recente encontrado:', latestYear);

    if (latestYear === null) {
      console.log('🆕 [UPDATE NEW TAG] Nenhum produto com releaseYear encontrado');
      return;
    }

    // Atualizar tags de todos os produtos
    for (var j = 0; j < allProducts.length; j++) {
      var productToUpdate = allProducts[j];
      var currentTags = productToUpdate.tags || [];
      var hasNewTag = false;

      // Verificar se já tem tag "new"
      for (var k = 0; k < currentTags.length; k++) {
        if (currentTags[k].toLowerCase() === 'new') {
          hasNewTag = true;
          break;
        }
      }

      // Se o produto tem releaseYear igual ao mais recente, adicionar tag "new"
      var shouldHaveNewTag = productToUpdate.releaseYear === latestYear;

      if (shouldHaveNewTag && !hasNewTag) {
        // Adicionar tag "new"
        var updatedTags = currentTags.slice();
        updatedTags.push('new');
        await productToUpdate.update({ tags: updatedTags });
        console.log('✅ [UPDATE NEW TAG] Tag "new" adicionada ao produto:', productToUpdate.id);
      } else if (!shouldHaveNewTag && hasNewTag) {
        // Remover tag "new"
        var cleanedTags = [];
        for (var m = 0; m < currentTags.length; m++) {
          if (currentTags[m].toLowerCase() !== 'new') {
            cleanedTags.push(currentTags[m]);
          }
        }
        await productToUpdate.update({ tags: cleanedTags });
        console.log('✅ [UPDATE NEW TAG] Tag "new" removida do produto:', productToUpdate.id);
      }
    }

    console.log('✅ [UPDATE NEW TAG] Processo concluído');
  } catch (error) {
    console.error('❌ [UPDATE NEW TAG] Erro ao atualizar tags "new":', error);
  }
}

// GET /api/products - Listar todos os produtos
export async function getAll(req, res) {
  try {
    console.log('📦 [PRODUCTS API] GET /api/products - Iniciando busca');
    console.log('📦 [PRODUCTS API] Query params:', JSON.stringify(req.query));

    var where = {};
    var query = req.query;

    // Filtro por tags - apenas se não for string vazia
    if (query.tags) {
      if (Array.isArray(query.tags)) {
        var tagsArray = query.tags.filter(function (tag) {
          return tag && String(tag).trim() !== '';
        });
        if (tagsArray.length > 0) {
          where.tags = {
            [Op.overlap]: tagsArray,
          };
        }
      } else if (typeof query.tags === 'string' && query.tags.trim() !== '') {
        where.tags = {
          [Op.overlap]: [query.tags],
        };
      }
    }

    // Filtro por type - apenas se não for string vazia
    if (query.type && typeof query.type === 'string' && query.type.trim() !== '') {
      where.type = query.type;
    }

    // Filtro por isActive - apenas se for 'true' ou 'false' (não string vazia)
    // Por padrão, mostrar apenas produtos ativos (não arquivados)
    // Se showArchived=true, mostrar apenas produtos arquivados (isActive=false)
    if (query.showArchived === 'true') {
      // Se mostrar arquivados, mostrar apenas produtos arquivados
      where.isActive = false;
    } else {
      // Por padrão, mostrar apenas produtos ativos
      where.isActive = true;
    }

    // Se o usuário especificou explicitamente isActive, respeitar isso (mas apenas se showArchived não estiver ativo)
    if (query.isActive !== undefined && query.isActive !== '' && query.isActive !== null && query.showArchived !== 'true') {
      where.isActive = query.isActive === 'true' || query.isActive !== 'false';
    }

    // Filtro por location - apenas se não for string vazia
    if (query.location && typeof query.location === 'string' && query.location.trim() !== '') {
      where.location = query.location;
    }

    // Filtro por mount - apenas se não for string vazia
    if (query.mount && typeof query.mount === 'string' && query.mount.trim() !== '') {
      where.mount = query.mount;
    }

    // Filtro por season - apenas se não for string vazia
    if (query.season && typeof query.season === 'string' && query.season.trim() !== '') {
      where.season = query.season;
    }

    // Filtro por isTrending - apenas se for 'true' ou 'false' (não string vazia)
    if (query.isTrending !== undefined && query.isTrending !== '' && query.isTrending !== null) {
      where.isTrending = query.isTrending === 'true' || query.isTrending === true;
    }

    // Filtro por releaseYear - apenas se não for string vazia
    if (query.releaseYear && typeof query.releaseYear === 'string' && query.releaseYear.trim() !== '') {
      var year = parseInt(query.releaseYear);
      if (!isNaN(year)) {
        where.releaseYear = year;
      }
    }

    // Filtro por isOnSale - apenas se for 'true' ou 'false' (não string vazia)
    if (query.isOnSale !== undefined && query.isOnSale !== '' && query.isOnSale !== null) {
      where.isOnSale = query.isOnSale === 'true' || query.isOnSale === true;
    }

    // Filtros por dimensões (range: minHeight, maxHeight, minWidth, maxWidth, minDepth, maxDepth, minDiameter, maxDiameter)
    var heightConditions = {};
    if (query.minHeight !== undefined && query.minHeight !== '' && query.minHeight !== null) {
      var minHeight = parseFloat(query.minHeight);
      if (!isNaN(minHeight)) {
        heightConditions[Op.gte] = minHeight;
      }
    }
    if (query.maxHeight !== undefined && query.maxHeight !== '' && query.maxHeight !== null) {
      var maxHeight = parseFloat(query.maxHeight);
      if (!isNaN(maxHeight)) {
        heightConditions[Op.lte] = maxHeight;
      }
    }
    if (Object.keys(heightConditions).length > 0) {
      where.height = heightConditions;
    }

    var widthConditions = {};
    if (query.minWidth !== undefined && query.minWidth !== '' && query.minWidth !== null) {
      var minWidth = parseFloat(query.minWidth);
      if (!isNaN(minWidth)) {
        widthConditions[Op.gte] = minWidth;
      }
    }
    if (query.maxWidth !== undefined && query.maxWidth !== '' && query.maxWidth !== null) {
      var maxWidth = parseFloat(query.maxWidth);
      if (!isNaN(maxWidth)) {
        widthConditions[Op.lte] = maxWidth;
      }
    }
    if (Object.keys(widthConditions).length > 0) {
      where.width = widthConditions;
    }

    var depthConditions = {};
    if (query.minDepth !== undefined && query.minDepth !== '' && query.minDepth !== null) {
      var minDepth = parseFloat(query.minDepth);
      if (!isNaN(minDepth)) {
        depthConditions[Op.gte] = minDepth;
      }
    }
    if (query.maxDepth !== undefined && query.maxDepth !== '' && query.maxDepth !== null) {
      var maxDepth = parseFloat(query.maxDepth);
      if (!isNaN(maxDepth)) {
        depthConditions[Op.lte] = maxDepth;
      }
    }
    if (Object.keys(depthConditions).length > 0) {
      where.depth = depthConditions;
    }

    var diameterConditions = {};
    if (query.minDiameter !== undefined && query.minDiameter !== '' && query.minDiameter !== null) {
      var minDiameter = parseFloat(query.minDiameter);
      if (!isNaN(minDiameter)) {
        diameterConditions[Op.gte] = minDiameter;
      }
    }
    if (query.maxDiameter !== undefined && query.maxDiameter !== '' && query.maxDiameter !== null) {
      var maxDiameter = parseFloat(query.maxDiameter);
      if (!isNaN(maxDiameter)) {
        diameterConditions[Op.lte] = maxDiameter;
      }
    }
    if (Object.keys(diameterConditions).length > 0) {
      where.diameter = diameterConditions;
    }

    console.log('📦 [PRODUCTS API] Where clause:', JSON.stringify(where));

    var products;
    try {
      products = await Product.findAll({
        where: where,
        order: [['name', 'ASC']],
        attributes: { exclude: ['isSourceImage', 'usage'] },
      });
      console.log('✅ [PRODUCTS API] Query executada com sucesso');
    } catch (queryError) {
      console.error('❌ [PRODUCTS API] Erro ao executar query:', queryError);
      console.error('❌ [PRODUCTS API] Query Error Stack:', queryError.stack);

      // Se o erro for relacionado a coluna não encontrada (animationSimulationUrl), tentar com query raw
      if (queryError.message && (queryError.message.includes('column') || queryError.message.includes('does not exist') || queryError.message.includes('animationSimulationUrl'))) {
        console.warn('⚠️ [PRODUCTS API] Campo animationSimulationUrl não existe ainda. Executando migração automática ou usando query alternativa...');

        // Tentar executar a migração automaticamente
        try {
          const checkColumn = await sequelize.query(
            `SELECT column_name 
             FROM information_schema.columns 
             WHERE table_name = 'products' AND column_name = 'animationSimulationUrl'`,
            { type: QueryTypes.SELECT }
          );

          if (!checkColumn || checkColumn.length === 0) {
            console.log('🔄 [PRODUCTS API] Adicionando campo animationSimulationUrl...');
            await sequelize.query(
              `ALTER TABLE products ADD COLUMN IF NOT EXISTS "animationSimulationUrl" VARCHAR(255) NULL;`,
              { type: QueryTypes.RAW }
            );
            console.log('✅ [PRODUCTS API] Campo animationSimulationUrl adicionado!');

            // Tentar novamente a query
            products = await Product.findAll({
              where: where,
              order: [['name', 'ASC']],
              attributes: { exclude: ['isSourceImage', 'usage'] },
            });
          } else {
            // Campo existe mas ainda há erro, re-throw
            throw queryError;
          }
        } catch (migrationError) {
          console.error('❌ [PRODUCTS API] Erro ao adicionar campo:', migrationError);
          throw queryError; // Re-throw o erro original
        }
      } else {
        throw queryError; // Re-throw para ser capturado pelo catch externo
      }
    }

    console.log('📦 [PRODUCTS API] Produtos encontrados:', products.length);
    if (products.length > 0) {
      console.log('📦 [PRODUCTS API] Primeiros 3 produtos:', products.slice(0, 3).map(function (p) {
        return { id: p.id, name: p.name, isActive: p.isActive };
      }));
    } else {
      console.log('⚠️  [PRODUCTS API] NENHUM PRODUTO ENCONTRADO! Where clause:', JSON.stringify(where));
      // Fazer uma busca sem filtros para debug
      var allProductsCount = await Product.count();
      console.log('📦 [PRODUCTS API] Total de produtos na BD (sem filtros):', allProductsCount);

      // Verificar especificamente o IPL317R
      var ipl317r = await Product.findOne({ where: { id: 'IPL317R' } });
      if (ipl317r) {
        console.log('🔍 [PRODUCTS API] IPL317R encontrado na BD:', {
          id: ipl317r.id,
          name: ipl317r.name,
          isActive: ipl317r.isActive,
        });
        console.log('🔍 [PRODUCTS API] IPL317R não aparece porque:', {
          showArchived: query.showArchived,
          isActive: ipl317r.isActive,
          whereIsActive: where.isActive
        });
      } else {
        console.log('⚠️  [PRODUCTS API] IPL317R NÃO encontrado na BD - pode ter sido deletado');
      }
    }

    // Converter produtos para objetos simples para evitar problemas de serialização
    var productsData = [];
    try {
      for (var i = 0; i < products.length; i++) {
        try {
          var plainProduct = products[i].get({ plain: true });

          // Converter campos JSON para objetos simples se necessário
          try {
            if (plainProduct.specs !== null && plainProduct.specs !== undefined) {
              if (typeof plainProduct.specs === 'object') {
                plainProduct.specs = JSON.parse(JSON.stringify(plainProduct.specs));
              } else if (typeof plainProduct.specs === 'string') {
                plainProduct.specs = JSON.parse(plainProduct.specs);
              }

              // Debug para IPL317R
              if (plainProduct.id === 'IPL317R') {
                console.log('🔍 [PRODUCTS API GET] IPL317R specs do banco:', JSON.stringify(plainProduct.specs, null, 2));
              }

              // Debug para IPL337W - verificar animationSimulationUrl
              if (plainProduct.id === 'IPL337W' || plainProduct.name === 'IPL337W') {
                console.log('🔍 [PRODUCTS API GET] IPL337W - animationSimulationUrl:', plainProduct.animationSimulationUrl);
                console.log('🔍 [PRODUCTS API GET] IPL337W - produto completo (campos principais):', {
                  id: plainProduct.id,
                  name: plainProduct.name,
                  animationSimulationUrl: plainProduct.animationSimulationUrl,
                  animationUrl: plainProduct.animationUrl,
                  videoFile: plainProduct.videoFile
                });
              }
            }
          } catch (e) {
            console.warn('⚠️  [PRODUCTS API] Erro ao processar specs do produto ' + plainProduct.id + ':', e.message);
            plainProduct.specs = null;
          }

          try {
            if (plainProduct.availableColors !== null && plainProduct.availableColors !== undefined) {
              if (typeof plainProduct.availableColors === 'object') {
                plainProduct.availableColors = JSON.parse(JSON.stringify(plainProduct.availableColors));
              } else if (typeof plainProduct.availableColors === 'string') {
                plainProduct.availableColors = JSON.parse(plainProduct.availableColors);
              }
            }
          } catch (e) {
            console.warn('⚠️  [PRODUCTS API] Erro ao processar availableColors do produto ' + plainProduct.id + ':', e.message);
            plainProduct.availableColors = null;
          }

          try {
            if (plainProduct.variantProductByColor !== null && plainProduct.variantProductByColor !== undefined) {
              if (typeof plainProduct.variantProductByColor === 'object') {
                plainProduct.variantProductByColor = JSON.parse(JSON.stringify(plainProduct.variantProductByColor));
              } else if (typeof plainProduct.variantProductByColor === 'string') {
                plainProduct.variantProductByColor = JSON.parse(plainProduct.variantProductByColor);
              }
            }
          } catch (e) {
            console.warn('⚠️  [PRODUCTS API] Erro ao processar variantProductByColor do produto ' + plainProduct.id + ':', e.message);
            plainProduct.variantProductByColor = null;
          }

          // Garantir que valores numéricos são números, não strings ou objetos DECIMAL
          if (plainProduct.price !== null && plainProduct.price !== undefined) {
            if (typeof plainProduct.price === 'object' && plainProduct.price.toString) {
              plainProduct.price = parseFloat(plainProduct.price.toString());
            } else {
              plainProduct.price = parseFloat(plainProduct.price);
            }
            if (isNaN(plainProduct.price)) plainProduct.price = 0;
          }
          if (plainProduct.stock !== null && plainProduct.stock !== undefined) {
            plainProduct.stock = parseInt(String(plainProduct.stock), 10);
            if (isNaN(plainProduct.stock)) plainProduct.stock = 0;
          }
          if (plainProduct.oldPrice !== null && plainProduct.oldPrice !== undefined) {
            if (typeof plainProduct.oldPrice === 'object' && plainProduct.oldPrice.toString) {
              plainProduct.oldPrice = parseFloat(plainProduct.oldPrice.toString());
            } else {
              plainProduct.oldPrice = parseFloat(plainProduct.oldPrice);
            }
            if (isNaN(plainProduct.oldPrice)) plainProduct.oldPrice = null;
          }

          // Garantir que tags é um array válido
          if (!Array.isArray(plainProduct.tags)) {
            plainProduct.tags = [];
          }

          // Garantir que releaseYear é um número válido
          if (plainProduct.releaseYear !== null && plainProduct.releaseYear !== undefined) {
            plainProduct.releaseYear = parseInt(String(plainProduct.releaseYear), 10);
            if (isNaN(plainProduct.releaseYear)) plainProduct.releaseYear = null;
          }

          // Garantir que height, width, depth, diameter são números válidos
          if (plainProduct.height !== null && plainProduct.height !== undefined) {
            if (typeof plainProduct.height === 'object' && plainProduct.height.toString) {
              plainProduct.height = parseFloat(plainProduct.height.toString());
            } else {
              plainProduct.height = parseFloat(plainProduct.height);
            }
            if (isNaN(plainProduct.height)) plainProduct.height = null;
          }
          if (plainProduct.width !== null && plainProduct.width !== undefined) {
            if (typeof plainProduct.width === 'object' && plainProduct.width.toString) {
              plainProduct.width = parseFloat(plainProduct.width.toString());
            } else {
              plainProduct.width = parseFloat(plainProduct.width);
            }
            if (isNaN(plainProduct.width)) plainProduct.width = null;
          }
          if (plainProduct.depth !== null && plainProduct.depth !== undefined) {
            if (typeof plainProduct.depth === 'object' && plainProduct.depth.toString) {
              plainProduct.depth = parseFloat(plainProduct.depth.toString());
            } else {
              plainProduct.depth = parseFloat(plainProduct.depth);
            }
            if (isNaN(plainProduct.depth)) plainProduct.depth = null;
          }
          if (plainProduct.diameter !== null && plainProduct.diameter !== undefined) {
            if (typeof plainProduct.diameter === 'object' && plainProduct.diameter.toString) {
              plainProduct.diameter = parseFloat(plainProduct.diameter.toString());
            } else {
              plainProduct.diameter = parseFloat(plainProduct.diameter);
            }
            if (isNaN(plainProduct.diameter)) plainProduct.diameter = null;
          }

          // Converter valores Date para strings ISO se necessário
          if (plainProduct.createdAt && plainProduct.createdAt instanceof Date) {
            plainProduct.createdAt = plainProduct.createdAt.toISOString();
          }
          if (plainProduct.updatedAt && plainProduct.updatedAt instanceof Date) {
            plainProduct.updatedAt = plainProduct.updatedAt.toISOString();
          }

          productsData.push(plainProduct);
        } catch (err) {
          console.error('❌ [PRODUCTS API] Erro ao serializar produto ' + (products[i].id || 'unknown') + ':', err);
          console.error('❌ [PRODUCTS API] Stack do erro de serialização:', err.stack);
          // Continuar mesmo se um produto falhar
        }
      }

      console.log('✅ [PRODUCTS API] Produtos serializados com sucesso:', productsData.length);

      // Verificar se a resposta já foi enviada
      if (!res.headersSent) {
        res.json(productsData);
      } else {
        console.warn('⚠️  [PRODUCTS API] Resposta já foi enviada, ignorando...');
      }
    } catch (serializationError) {
      console.error('❌ [PRODUCTS API] Erro crítico na serialização:', serializationError);
      console.error('❌ [PRODUCTS API] Stack:', serializationError.stack);
      // Tentar enviar pelo menos um array vazio
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Erro ao serializar produtos',
          details: serializationError.message,
          name: serializationError.name
        });
      } else {
        console.error('❌ [PRODUCTS API] Não foi possível enviar resposta de erro - headers já enviados');
      }
    }
  } catch (error) {
    console.error('❌ [PRODUCTS API] Erro ao buscar produtos:', error);
    console.error('❌ [PRODUCTS API] Nome do erro:', error.name);
    console.error('❌ [PRODUCTS API] Mensagem:', error.message);
    console.error('❌ [PRODUCTS API] Stack:', error.stack);

    // Garantir que sempre enviamos uma resposta JSON válida
    if (!res.headersSent) {
      var errorMessage = error.message || 'Erro desconhecido ao buscar produtos';
      res.status(500).json({
        error: errorMessage,
        details: error.message,
        name: error.name
      });
    } else {
      console.error('❌ [PRODUCTS API] Não foi possível enviar resposta de erro - headers já enviados');
    }
  }
}

// GET /api/products/source-images - Listar todos os produtos ativos
export async function getSourceImages(req, res) {
  try {
    var products = await Product.findAll({
      where: {
        isActive: true,
      },
      order: [['name', 'ASC']],
      attributes: { exclude: ['isSourceImage', 'usage'] },
    });

    // Converter produtos para objetos simples
    var productsData = products.map(function (p) {
      return p.get({ plain: true });
    });

    res.json(productsData);
  } catch (error) {
    console.error('Erro ao buscar Source Images:', error);
    res.status(500).json({ error: error.message });
  }
}

// Simple in-memory cache for trending products
let trendingCache = {
  data: null,
  timestamp: null,
  ttl: 5 * 60 * 1000 // 5 minutes
};

// GET /api/products/trending - Listar produtos trending (otimizado para performance)
export async function getTrending(req, res) {
  try {
    console.log('🔥 [TRENDING API] GET /api/products/trending - Iniciando busca');

    // Check cache first
    const now = Date.now();
    if (trendingCache.data && trendingCache.timestamp && (now - trendingCache.timestamp < trendingCache.ttl)) {
      console.log('✅ [TRENDING API] Retornando dados do cache');
      return res.json(trendingCache.data);
    }

    console.log('🔄 [TRENDING API] Cache expirado ou vazio, buscando do banco');

    // Buscar produtos com imagens noturnas (preferência para trending)
    var products = await Product.findAll({
      where: {
        isActive: true,
        imagesNightUrl: {
          [Op.ne]: null
        }
      },
      order: [
        // Priorizar produtos marcados como trending (DESC coloca true primeiro)
        ['isTrending', 'DESC'],
        // Depois por nome
        ['name', 'ASC']
      ],
      limit: 5,
      // Retornar apenas campos necessários para o widget
      attributes: [
        'id',
        'name',
        'price',
        'oldPrice',
        'stock',
        'imagesNightUrl',
        'imagesDayUrl',
        'thumbnailUrl',
        'isTrending'
      ]
    });

    console.log('📦 [TRENDING API] Produtos encontrados:', products.length);

    // Converter para objetos simples e processar
    var productsData = products.map(function (p) {
      var plainProduct = p.get({ plain: true });

      // Garantir que valores numéricos são números
      if (plainProduct.price !== null && plainProduct.price !== undefined) {
        if (typeof plainProduct.price === 'object' && plainProduct.price.toString) {
          plainProduct.price = parseFloat(plainProduct.price.toString());
        } else {
          plainProduct.price = parseFloat(plainProduct.price);
        }
        if (isNaN(plainProduct.price)) plainProduct.price = 0;
      }

      if (plainProduct.oldPrice !== null && plainProduct.oldPrice !== undefined) {
        if (typeof plainProduct.oldPrice === 'object' && plainProduct.oldPrice.toString) {
          plainProduct.oldPrice = parseFloat(plainProduct.oldPrice.toString());
        } else {
          plainProduct.oldPrice = parseFloat(plainProduct.oldPrice);
        }
        if (isNaN(plainProduct.oldPrice)) plainProduct.oldPrice = null;
      }

      if (plainProduct.stock !== null && plainProduct.stock !== undefined) {
        plainProduct.stock = parseInt(String(plainProduct.stock), 10);
        if (isNaN(plainProduct.stock)) plainProduct.stock = 0;
      }

      return plainProduct;
    });

    // Update cache
    trendingCache.data = productsData;
    trendingCache.timestamp = now;

    console.log('✅ [TRENDING API] Cache atualizado');
    res.json(productsData);
  } catch (error) {
    console.error('❌ [TRENDING API] Erro ao buscar produtos trending:', error);

    // Write error to file for debugging
    try {
      const fs = await import('fs');
      const errorLog = `[${new Date().toISOString()}] Error in getTrending: ${error.message}\nStack: ${error.stack}\n\n`;
      fs.appendFileSync('server_error.log', errorLog);
    } catch (e) {
      console.error('Failed to write error log:', e);
    }

    res.status(500).json({ error: error.message });
  }
}

// GET /api/products/search - Pesquisar produtos
export async function search(req, res) {
  try {
    var q = req.query.q;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    var products = await Product.findAll({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: '%' + q + '%',
            },
          },
          {
            tags: {
              [Op.overlap]: [q],
            },
          },
          {
            type: {
              [Op.iLike]: '%' + q + '%',
            },
          },
        ],
      },
      order: [['name', 'ASC']],
      attributes: { exclude: ['isSourceImage', 'usage'] },
    });

    // Converter produtos para objetos simples
    var productsData = products.map(function (p) {
      return p.get({ plain: true });
    });

    res.json(productsData);
  } catch (error) {
    console.error('Erro ao pesquisar produtos:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/products/:id - Buscar produto por ID
export async function getById(req, res) {
  try {
    var product = await Product.findByPk(req.params.id, {
      attributes: { exclude: ['isSourceImage', 'usage'] },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Converter para objeto simples
    var productData = product.get({ plain: true });

    // Garantir que valores numéricos são números, não strings ou objetos DECIMAL
    if (productData.price !== null && productData.price !== undefined) {
      if (typeof productData.price === 'object' && productData.price.toString) {
        productData.price = parseFloat(productData.price.toString());
      } else {
        productData.price = parseFloat(productData.price);
      }
      if (isNaN(productData.price)) productData.price = 0;
    }
    if (productData.stock !== null && productData.stock !== undefined) {
      productData.stock = parseInt(String(productData.stock), 10);
      if (isNaN(productData.stock)) productData.stock = 0;
    }
    if (productData.oldPrice !== null && productData.oldPrice !== undefined) {
      if (typeof productData.oldPrice === 'object' && productData.oldPrice.toString) {
        productData.oldPrice = parseFloat(productData.oldPrice.toString());
      } else {
        productData.oldPrice = parseFloat(productData.oldPrice);
      }
      if (isNaN(productData.oldPrice)) productData.oldPrice = null;
    }

    // Garantir que releaseYear é um número válidoFilterUpdate
    if (productData.releaseYear !== null && productData.releaseYear !== undefined) {
      productData.releaseYear = parseInt(String(productData.releaseYear), 10);
      if (isNaN(productData.releaseYear)) productData.releaseYear = null;
    }

    // Garantir que height, width, depth, diameter são números válidos
    if (productData.height !== null && productData.height !== undefined) {
      if (typeof productData.height === 'object' && productData.height.toString) {
        productData.height = parseFloat(productData.height.toString());
      } else {
        productData.height = parseFloat(productData.height);
      }
      if (isNaN(productData.height)) productData.height = null;
    }
    if (productData.width !== null && productData.width !== undefined) {
      if (typeof productData.width === 'object' && productData.width.toString) {
        productData.width = parseFloat(productData.width.toString());
      } else {
        productData.width = parseFloat(productData.width);
      }
      if (isNaN(productData.width)) productData.width = null;
    }
    if (productData.depth !== null && productData.depth !== undefined) {
      if (typeof productData.depth === 'object' && productData.depth.toString) {
        productData.depth = parseFloat(productData.depth.toString());
      } else {
        productData.depth = parseFloat(productData.depth);
      }
      if (isNaN(productData.depth)) productData.depth = null;
    }
    if (productData.diameter !== null && productData.diameter !== undefined) {
      if (typeof productData.diameter === 'object' && productData.diameter.toString) {
        productData.diameter = parseFloat(productData.diameter.toString());
      } else {
        productData.diameter = parseFloat(productData.diameter);
      }
      if (isNaN(productData.diameter)) productData.diameter = null;
    }

    // Processar campos JSON
    try {
      if (productData.specs !== null && productData.specs !== undefined) {
        if (typeof productData.specs === 'object') {
          productData.specs = JSON.parse(JSON.stringify(productData.specs));
        } else if (typeof productData.specs === 'string') {
          productData.specs = JSON.parse(productData.specs);
        }
      }
    } catch (e) {
      console.warn('⚠️  Erro ao processar specs do produto:', e.message);
      productData.specs = null;
    }

    try {
      if (productData.availableColors !== null && productData.availableColors !== undefined) {
        if (typeof productData.availableColors === 'object') {
          productData.availableColors = JSON.parse(JSON.stringify(productData.availableColors));
        } else if (typeof productData.availableColors === 'string') {
          productData.availableColors = JSON.parse(productData.availableColors);
        }
      }
    } catch (e) {
      console.warn('⚠️  Erro ao processar availableColors do produto:', e.message);
      productData.availableColors = null;
    }

    try {
      if (productData.variantProductByColor !== null && productData.variantProductByColor !== undefined) {
        if (typeof productData.variantProductByColor === 'object') {
          productData.variantProductByColor = JSON.parse(JSON.stringify(productData.variantProductByColor));
        } else if (typeof productData.variantProductByColor === 'string') {
          productData.variantProductByColor = JSON.parse(productData.variantProductByColor);
        }
      }
    } catch (e) {
      console.warn('⚠️  Erro ao processar variantProductByColor do produto:', e.message);
      productData.variantProductByColor = null;
    }

    // Garantir que tags é um array válido
    if (!Array.isArray(productData.tags)) {
      productData.tags = [];
    }

    // Converter valores Date para strings ISO se necessário
    if (productData.createdAt && productData.createdAt instanceof Date) {
      productData.createdAt = productData.createdAt.toISOString();
    }
    if (productData.updatedAt && productData.updatedAt instanceof Date) {
      productData.updatedAt = productData.updatedAt.toISOString();
    }

    res.json(productData);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/products - Criar produto
export async function create(req, res) {
  try {
    var files = req.files || {};
    var body = req.body;

    console.log('📦 [PRODUCTS API] POST /api/products - Criar produto');
    console.log('📦 [PRODUCTS API] Body recebido:', JSON.stringify(body, null, 2));
    console.log('📦 [PRODUCTS API] Files recebidos:', Object.keys(files));
    try {
      console.log('🧾 [FILES META]', {
        dayImage: files.dayImage?.[0]?.originalname,
        nightImage: files.nightImage?.[0]?.originalname,
        animation: files.animation?.[0]?.originalname,
        thumbnail: files.thumbnail?.[0]?.originalname,
      });
    } catch (_) { }

    // Processar URLs de imagens dos ficheiros enviados
    var imagesDayUrl = null;
    var imagesNightUrl = null;
    var animationUrl = null;
    var animationSimulationUrl = null;
    var thumbnailUrl = null;
    var availableColors = {};

    if (files.dayImage && files.dayImage[0]) {
      var dayImagePath = files.dayImage[0].path;
      var dayImageFilename = files.dayImage[0].filename;

      // Converter imagem para WebP
      try {
        var processedDayImagePath = await processImageToWebP(dayImagePath, dayImageFilename);
        var processedDayImageFilename = path.basename(processedDayImagePath);
        imagesDayUrl = '/uploads/products/' + processedDayImageFilename;
        console.log('✅ Imagem do dia convertida para WebP:', imagesDayUrl);
      } catch (webpError) {
        console.warn('⚠️  Erro ao converter imagem do dia para WebP:', webpError.message);
        // Usar imagem original em caso de erro
        imagesDayUrl = '/uploads/products/' + dayImageFilename;
        var processedDayImagePath = dayImagePath;
      }

      // Auto-gerar thumbnail se não foi fornecido
      if (!files.thumbnail || !files.thumbnail[0]) {
        try {
          var thumbnailFilename = 'thumb_' + path.basename(processedDayImagePath).replace(/\.[^/.]+$/, '.webp');
          var thumbnailPath = path.join(path.dirname(processedDayImagePath), thumbnailFilename);
          await generateThumbnail(processedDayImagePath, thumbnailPath, 300, 300);
          thumbnailUrl = '/uploads/products/' + thumbnailFilename;
          console.log('✅ Thumbnail auto-gerado:', thumbnailUrl);
        } catch (thumbError) {
          console.warn('⚠️  Erro ao gerar thumbnail automático:', thumbError.message);
          // Usar imagem de dia como fallback
          thumbnailUrl = imagesDayUrl;
        }
      }
    }

    if (files.nightImage && files.nightImage[0]) {
      var nightImagePath = files.nightImage[0].path;
      var nightImageFilename = files.nightImage[0].filename;

      // Converter imagem para WebP
      try {
        var processedNightImagePath = await processImageToWebP(nightImagePath, nightImageFilename);
        var processedNightImageFilename = path.basename(processedNightImagePath);
        imagesNightUrl = '/uploads/products/' + processedNightImageFilename;
        console.log('✅ Imagem da noite convertida para WebP:', imagesNightUrl);
      } catch (webpError) {
        console.warn('⚠️  Erro ao converter imagem da noite para WebP:', webpError.message);
        // Usar imagem original em caso de erro
        imagesNightUrl = '/uploads/products/' + nightImageFilename;
      }
    }

    if (files.animation && files.animation[0]) {
      animationUrl = '/uploads/products/' + files.animation[0].filename;
    }

    if (files.animationSimulation && files.animationSimulation[0]) {
      animationSimulationUrl = '/uploads/products/' + files.animationSimulation[0].filename;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      thumbnailUrl = '/uploads/products/' + files.thumbnail[0].filename;
    }

    // Se não há thumbnail ainda, usar imagem de dia como fallback
    if (!thumbnailUrl && imagesDayUrl) {
      thumbnailUrl = imagesDayUrl;
    }

    // Processar availableColors do body se fornecido
    if (body.availableColors) {
      try {
        var colorsFromBody = typeof body.availableColors === 'string'
          ? JSON.parse(body.availableColors)
          : body.availableColors;
        availableColors = Object.assign({}, availableColors, colorsFromBody);
      } catch (e) {
        console.warn('Erro ao processar availableColors do body:', e);
      }
    }

    // Processar specs
    var specs = null;
    if (body.specs) {
      try {
        specs = typeof body.specs === 'string' ? JSON.parse(body.specs) : body.specs;
        console.log('📦 [PRODUCTS API CREATE] Specs processados:', JSON.stringify(specs, null, 2));
        if (specs && specs.materiais !== undefined) {
          console.log('📦 [PRODUCTS API CREATE] Materiais no specs:', specs.materiais);
        }
      } catch (e) {
        console.warn('Erro ao processar specs:', e);
      }
    }

    // Processar variantProductByColor
    var variantProductByColor = null;
    if (body.variantProductByColor) {
      try {
        variantProductByColor = typeof body.variantProductByColor === 'string'
          ? JSON.parse(body.variantProductByColor)
          : body.variantProductByColor;
      } catch (e) {
        console.warn('Erro ao processar variantProductByColor:', e);
      }
    }

    // Processar tags
    var tags = [];
    if (body.tags) {
      if (typeof body.tags === 'string') {
        try {
          tags = JSON.parse(body.tags);
        } catch (e) {
          tags = body.tags.split(',').map(function (tag) { return tag.trim(); });
        }
      } else if (Array.isArray(body.tags)) {
        tags = body.tags;
      }
    }

    // Adicionar/remover tag "sale" automaticamente baseado em oldPrice
    var oldPrice = body.oldPrice ? parseFloat(body.oldPrice) : null;
    var price = parseFloat(body.price) || 0;
    var isOnSale = oldPrice && oldPrice > price;

    // Verificar se tag "sale" já existe
    var hasSaleTag = false;
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].toLowerCase() === 'sale') {
        hasSaleTag = true;
        break;
      }
    }

    // Adicionar tag "sale" se houver desconto, remover se não houver
    if (isOnSale && !hasSaleTag) {
      tags.push('sale');
    } else if (!isOnSale && hasSaleTag) {
      // Remover tag "sale"
      var newTags = [];
      for (var j = 0; j < tags.length; j++) {
        if (tags[j].toLowerCase() !== 'sale') {
          newTags.push(tags[j]);
        }
      }
      tags = newTags;
    }

    // Função auxiliar para converter strings vazias ou "null" para null
    var toNullIfEmpty = function (value) {
      if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
        return null;
      }
      return value;
    };

    var productData = {
      id: body.id || null, // ID será gerado automaticamente se não fornecido
      name: body.name,
      price: parseFloat(body.price) || 0,
      stock: parseInt(body.stock, 10) || 0,
      oldPrice: oldPrice,
      imagesDayUrl: imagesDayUrl || toNullIfEmpty(body.imagesDayUrl),
      imagesNightUrl: imagesNightUrl || toNullIfEmpty(body.imagesNightUrl),
      animationUrl: animationUrl || toNullIfEmpty(body.animationUrl),
      animationSimulationUrl: animationSimulationUrl || toNullIfEmpty(body.animationSimulationUrl),
      thumbnailUrl: thumbnailUrl || toNullIfEmpty(body.thumbnailUrl),
      tags: tags,
      type: toNullIfEmpty(body.type),
      location: toNullIfEmpty(body.location),
      mount: toNullIfEmpty(body.mount),
      specs: specs,
      availableColors: Object.keys(availableColors).length > 0 ? availableColors : null,
      variantProductByColor: variantProductByColor,
      videoFile: toNullIfEmpty(body.videoFile),
      isActive: body.isActive !== 'false' && body.isActive !== false,
      season: toNullIfEmpty(body.season),
      isTrending: body.isTrending === 'true' || body.isTrending === true,
      releaseYear: body.releaseYear ? parseInt(body.releaseYear, 10) : null,
      isOnSale: isOnSale,
      height: body.height ? parseFloat(body.height) : null,
      width: body.width ? parseFloat(body.width) : null,
      depth: body.depth ? parseFloat(body.depth) : null,
      diameter: body.diameter ? parseFloat(body.diameter) : null,
    };

    // Validar campos obrigatórios
    console.log('📦 [PRODUCTS API] Validando campos obrigatórios...');
    console.log('📦 [PRODUCTS API] productData.name:', productData.name);
    console.log('📦 [PRODUCTS API] typeof productData.name:', typeof productData.name);

    if (!productData.name || (typeof productData.name === 'string' && productData.name.trim() === '')) {
      console.error('❌ [PRODUCTS API] Campo "name" está vazio ou não foi fornecido');
      console.error('❌ [PRODUCTS API] Body completo:', JSON.stringify(body, null, 2));
      return res.status(400).json({
        error: 'Campo "name" é obrigatório',
        received: {
          name: productData.name,
          body: body
        }
      });
    }

    // Gerar ID automaticamente se não fornecido
    if (!productData.id) {
      // Gerar ID baseado no nome (formato: prd-XXXXX onde XXXXX é o nome em maiúsculas sem espaços)
      var idBase = productData.name.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '');
      var generatedId = 'prd-' + idBase;

      // Verificar se o ID já existe, se sim, adicionar timestamp
      var existingProduct = await Product.findByPk(generatedId);
      if (existingProduct) {
        var timestamp = Date.now().toString().slice(-6);
        generatedId = 'prd-' + idBase + '-' + timestamp;
      }

      productData.id = generatedId;
      console.log('📦 [PRODUCTS API] ID gerado automaticamente:', productData.id);
    }

    console.log('📦 [PRODUCTS API] Criando produto:', { id: productData.id, name: productData.name });

    var product = await Product.create(productData);

    // Atualizar tags "new" baseado no releaseYear mais recente
    await updateNewTagForProducts();

    // Recarregar o produto para ter as tags atualizadas
    await product.reload();

    // Converter para objeto simples antes de enviar
    var productResponse = product.get({ plain: true });

    // Debug: verificar specs após salvar
    if (productResponse.specs) {
      console.log('✅ [PRODUCTS API CREATE] Specs salvos:', JSON.stringify(productResponse.specs, null, 2));
      if (productResponse.specs.materiais !== undefined) {
        console.log('✅ [PRODUCTS API CREATE] Materiais salvos:', productResponse.specs.materiais);
      }
      if (productResponse.specs.softXLED !== undefined) {
        console.log('✅ [PRODUCTS API CREATE] SOFT XLED salvo:', productResponse.specs.softXLED);
      }
      if (productResponse.specs.sparkles !== undefined) {
        console.log('✅ [PRODUCTS API CREATE] Sparkles salvos:', productResponse.specs.sparkles);
      }
      if (productResponse.specs.effects !== undefined) {
        console.log('✅ [PRODUCTS API CREATE] Effects salvos:', productResponse.specs.effects);
      }
      if (productResponse.specs.printType !== undefined) {
        console.log('✅ [PRODUCTS API CREATE] Print Type salvo:', productResponse.specs.printType);
      }
    }
    console.log('💾 [PRODUCT SAVED] URLs persistidas:', {
      id: productResponse.id,
      imagesDayUrl: productResponse.imagesDayUrl,
      imagesNightUrl: productResponse.imagesNightUrl,
      thumbnailUrl: productResponse.thumbnailUrl,
    });

    res.status(201).json(productResponse);
  } catch (error) {
    console.error('❌ [PRODUCTS API] Erro ao criar produto:', error);
    console.error('❌ [PRODUCTS API] Nome do erro:', error.name);
    console.error('❌ [PRODUCTS API] Mensagem:', error.message);
    console.error('❌ [PRODUCTS API] Stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Erro ao criar produto',
      details: error.message,
      name: error.name
    });
  }
}

// PUT /api/products/:id - Atualizar produto
export async function update(req, res) {
  try {
    var product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    var files = req.files || {};
    var body = req.body;

    // Processar URLs de imagens dos ficheiros enviados
    var updateData = {};

    if (files.dayImage && files.dayImage[0]) {
      var dayImagePath = files.dayImage[0].path;
      var dayImageFilename = files.dayImage[0].filename;

      console.log('📸 [UPDATE] Processando imagem do dia:', {
        originalPath: dayImagePath,
        originalFilename: dayImageFilename,
        fileExists: fs.existsSync(dayImagePath)
      });

      // Converter imagem para WebP
      try {
        var processedDayImagePath = await processImageToWebP(dayImagePath, dayImageFilename);
        var processedDayImageFilename = path.basename(processedDayImagePath);

        // Verificar se o arquivo processado existe
        if (!fs.existsSync(processedDayImagePath)) {
          console.error('❌ [UPDATE] Arquivo processado não encontrado:', processedDayImagePath);
          throw new Error('Arquivo processado não encontrado após conversão');
        }

        updateData.imagesDayUrl = '/uploads/products/' + processedDayImageFilename;

        // Verificar novamente se o arquivo existe antes de salvar
        var finalFilePath = path.resolve(process.cwd(), 'public', 'uploads', 'products', processedDayImageFilename);
        if (!fs.existsSync(finalFilePath)) {
          console.error('❌ [UPDATE] Arquivo não encontrado no caminho final:', finalFilePath);
          // Tentar usar o caminho processado diretamente
          finalFilePath = processedDayImagePath;
        }

        console.log('✅ [UPDATE] Imagem do dia convertida para WebP:', {
          url: updateData.imagesDayUrl,
          filePath: processedDayImagePath,
          finalFilePath: finalFilePath,
          fileExists: fs.existsSync(finalFilePath),
          basename: processedDayImageFilename
        });
        var finalDayImagePath = processedDayImagePath;
      } catch (webpError) {
        console.warn('⚠️  [UPDATE] Erro ao converter imagem do dia para WebP:', webpError.message);
        // Verificar se o arquivo original ainda existe
        if (fs.existsSync(dayImagePath)) {
          updateData.imagesDayUrl = '/uploads/products/' + dayImageFilename;
          var finalDayImagePath = dayImagePath;
          console.log('📸 [UPDATE] Usando imagem original:', updateData.imagesDayUrl);
        } else {
          console.error('❌ [UPDATE] Arquivo original também não existe:', dayImagePath);
        }
      }

      // Auto-gerar thumbnail se não foi fornecido e a imagem de dia mudou
      if (!files.thumbnail || !files.thumbnail[0]) {
        try {
          var thumbnailFilename = 'thumb_' + path.basename(finalDayImagePath).replace(/\.[^/.]+$/, '.webp');
          var thumbnailPath = path.join(path.dirname(finalDayImagePath), thumbnailFilename);
          await generateThumbnail(finalDayImagePath, thumbnailPath, 300, 300);
          updateData.thumbnailUrl = '/uploads/products/' + thumbnailFilename;
          console.log('✅ Thumbnail auto-gerado:', updateData.thumbnailUrl);
        } catch (thumbError) {
          console.warn('⚠️  Erro ao gerar thumbnail automático:', thumbError.message);
        }
      }
    } else if (body.imagesDayUrl !== undefined) {
      updateData.imagesDayUrl = body.imagesDayUrl || null;
    }

    if (files.nightImage && files.nightImage[0]) {
      var nightImagePath = files.nightImage[0].path;
      var nightImageFilename = files.nightImage[0].filename;

      // Converter imagem para WebP
      try {
        var processedNightImagePath = await processImageToWebP(nightImagePath, nightImageFilename);
        var processedNightImageFilename = path.basename(processedNightImagePath);
        updateData.imagesNightUrl = '/uploads/products/' + processedNightImageFilename;
        console.log('✅ Imagem da noite convertida para WebP:', updateData.imagesNightUrl);
      } catch (webpError) {
        console.warn('⚠️  Erro ao converter imagem da noite para WebP:', webpError.message);
        // Usar imagem original em caso de erro
        updateData.imagesNightUrl = '/uploads/products/' + nightImageFilename;
      }
    } else if (body.imagesNightUrl !== undefined) {
      updateData.imagesNightUrl = body.imagesNightUrl || null;
    }

    if (files.animation && files.animation[0]) {
      updateData.animationUrl = '/uploads/products/' + files.animation[0].filename;
    } else if (body.animationUrl !== undefined) {
      updateData.animationUrl = body.animationUrl || null;
    }

    if (files.animationSimulation && files.animationSimulation[0]) {
      updateData.animationSimulationUrl = '/uploads/products/' + files.animationSimulation[0].filename;
    } else if (body.animationSimulationUrl !== undefined) {
      updateData.animationSimulationUrl = body.animationSimulationUrl || null;
    }

    if (files.thumbnail && files.thumbnail[0]) {
      updateData.thumbnailUrl = '/uploads/products/' + files.thumbnail[0].filename;
    } else if (body.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = body.thumbnailUrl || null;
    }

    // Processar availableColors do body (removido processamento de colorImages)
    if (body.availableColors !== undefined) {
      try {
        updateData.availableColors = typeof body.availableColors === 'string'
          ? JSON.parse(body.availableColors)
          : body.availableColors;
      } catch (e) {
        console.warn('Erro ao processar availableColors:', e);
      }
    }

    // Função auxiliar para converter strings vazias ou "null" para null
    var toNullIfEmpty = function (value) {
      if (value === null || value === undefined || value === '' || value === 'null' || value === 'undefined') {
        return null;
      }
      return value;
    };

    // Atualizar campos básicos
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = parseFloat(body.price) || 0;
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock, 10) || 0;
    if (body.oldPrice !== undefined) updateData.oldPrice = body.oldPrice ? parseFloat(body.oldPrice) : null;
    if (body.type !== undefined) updateData.type = toNullIfEmpty(body.type);
    if (body.location !== undefined) updateData.location = toNullIfEmpty(body.location);
    if (body.mount !== undefined) updateData.mount = toNullIfEmpty(body.mount);
    if (body.videoFile !== undefined) updateData.videoFile = toNullIfEmpty(body.videoFile);

    // Processar specs
    if (body.specs !== undefined) {
      try {
        updateData.specs = typeof body.specs === 'string' ? JSON.parse(body.specs) : body.specs;
        console.log('📦 [PRODUCTS API UPDATE] Specs processados:', JSON.stringify(updateData.specs, null, 2));
        if (updateData.specs) {
          if (updateData.specs.materiais !== undefined) {
            console.log('📦 [PRODUCTS API UPDATE] Materiais no specs:', updateData.specs.materiais);
          }
          if (updateData.specs.softXLED !== undefined) {
            console.log('📦 [PRODUCTS API UPDATE] SOFT XLED no specs:', updateData.specs.softXLED);
          }
          if (updateData.specs.sparkles !== undefined) {
            console.log('📦 [PRODUCTS API UPDATE] Sparkles no specs:', updateData.specs.sparkles);
          }
          if (updateData.specs.effects !== undefined) {
            console.log('📦 [PRODUCTS API UPDATE] Effects no specs:', updateData.specs.effects);
          }
          if (updateData.specs.printType !== undefined) {
            console.log('📦 [PRODUCTS API UPDATE] Print Type no specs:', updateData.specs.printType);
          }
        }
      } catch (e) {
        console.warn('Erro ao processar specs:', e);
      }
    }

    // Processar variantProductByColor
    if (body.variantProductByColor !== undefined) {
      try {
        updateData.variantProductByColor = typeof body.variantProductByColor === 'string'
          ? JSON.parse(body.variantProductByColor)
          : body.variantProductByColor;
      } catch (e) {
        console.warn('Erro ao processar variantProductByColor:', e);
      }
    }

    // Processar booleanos
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive !== 'false' && body.isActive !== false;
    }

    // Processar tags (antes de outros campos para poder usar os valores de price/oldPrice)
    if (body.tags !== undefined) {
      var tags = [];
      if (typeof body.tags === 'string') {
        try {
          tags = JSON.parse(body.tags);
        } catch (e) {
          tags = body.tags.split(',').map(function (tag) { return tag.trim(); });
        }
      } else if (Array.isArray(body.tags)) {
        tags = body.tags;
      }

      // Adicionar/remover tag "sale" automaticamente baseado em oldPrice
      var oldPrice = body.oldPrice !== undefined ? (body.oldPrice ? parseFloat(body.oldPrice) : null) : product.oldPrice;
      var price = body.price !== undefined ? parseFloat(body.price) : product.price;
      var isOnSale = oldPrice && oldPrice > price;

      // Verificar se tag "sale" já existe
      var hasSaleTag = false;
      for (var i = 0; i < tags.length; i++) {
        if (tags[i].toLowerCase() === 'sale') {
          hasSaleTag = true;
          break;
        }
      }

      // Adicionar tag "sale" se houver desconto, remover se não houver
      if (isOnSale && !hasSaleTag) {
        tags.push('sale');
      } else if (!isOnSale && hasSaleTag) {
        // Remover tag "sale"
        var newTags = [];
        for (var j = 0; j < tags.length; j++) {
          if (tags[j].toLowerCase() !== 'sale') {
            newTags.push(tags[j]);
          }
        }
        tags = newTags;
      }

      updateData.tags = tags;
    } else {
      // Se tags não foram fornecidas, verificar se precisa atualizar tag "sale" baseado em oldPrice
      var oldPriceForSale = body.oldPrice !== undefined ? (body.oldPrice ? parseFloat(body.oldPrice) : null) : product.oldPrice;
      var priceForSale = body.price !== undefined ? parseFloat(body.price) : product.price;
      var isOnSaleCheck = oldPriceForSale && oldPriceForSale > priceForSale;
      var currentTags = product.tags || [];
      var hasSaleTagCheck = false;
      for (var k = 0; k < currentTags.length; k++) {
        if (currentTags[k].toLowerCase() === 'sale') {
          hasSaleTagCheck = true;
          break;
        }
      }

      if (isOnSaleCheck && !hasSaleTagCheck) {
        var updatedTags = currentTags.slice();
        updatedTags.push('sale');
        updateData.tags = updatedTags;
      } else if (!isOnSaleCheck && hasSaleTagCheck) {
        var cleanedTags = [];
        for (var m = 0; m < currentTags.length; m++) {
          if (currentTags[m].toLowerCase() !== 'sale') {
            cleanedTags.push(currentTags[m]);
          }
        }
        updateData.tags = cleanedTags;
      }
    }

    // Processar season, isTrending, releaseYear
    if (body.season !== undefined) {
      updateData.season = toNullIfEmpty(body.season);
    }
    if (body.isTrending !== undefined) {
      updateData.isTrending = body.isTrending === 'true' || body.isTrending === true;
    }
    if (body.releaseYear !== undefined) {
      updateData.releaseYear = body.releaseYear ? parseInt(body.releaseYear, 10) : null;
    }

    // Processar dimensões
    if (body.height !== undefined) {
      updateData.height = body.height ? parseFloat(body.height) : null;
    }
    if (body.width !== undefined) {
      updateData.width = body.width ? parseFloat(body.width) : null;
    }
    if (body.depth !== undefined) {
      updateData.depth = body.depth ? parseFloat(body.depth) : null;
    }
    if (body.diameter !== undefined) {
      updateData.diameter = body.diameter ? parseFloat(body.diameter) : null;
    }

    // Atualizar isOnSale baseado em oldPrice (sempre calcular, ignorar valor explícito se fornecido)
    var finalOldPrice = body.oldPrice !== undefined ? (body.oldPrice ? parseFloat(body.oldPrice) : null) : product.oldPrice;
    var finalPrice = body.price !== undefined ? parseFloat(body.price) : product.price;
    var finalIsOnSale = finalOldPrice && finalOldPrice > finalPrice;
    updateData.isOnSale = finalIsOnSale;

    await product.update(updateData);

    // Atualizar tags "new" baseado no releaseYear mais recente
    await updateNewTagForProducts();

    // Recarregar o produto atualizado
    await product.reload();
    console.log('💾 [PRODUCT UPDATED] URLs persistidas:', {
      id: product.id,
      imagesDayUrl: product.imagesDayUrl,
      imagesNightUrl: product.imagesNightUrl,
      thumbnailUrl: product.thumbnailUrl,
    });

    // Converter para objeto simples antes de enviar
    var productResponse = product.get({ plain: true });

    // Debug: verificar specs após atualizar
    if (productResponse.specs) {
      console.log('✅ [PRODUCTS API UPDATE] Specs salvos:', JSON.stringify(productResponse.specs, null, 2));
      if (productResponse.specs.materiais !== undefined) {
        console.log('✅ [PRODUCTS API UPDATE] Materiais salvos:', productResponse.specs.materiais);
      }
      if (productResponse.specs.softXLED !== undefined) {
        console.log('✅ [PRODUCTS API UPDATE] SOFT XLED salvo:', productResponse.specs.softXLED);
      }
      if (productResponse.specs.sparkles !== undefined) {
        console.log('✅ [PRODUCTS API UPDATE] Sparkles salvos:', productResponse.specs.sparkles);
      }
      if (productResponse.specs.effects !== undefined) {
        console.log('✅ [PRODUCTS API UPDATE] Effects salvos:', productResponse.specs.effects);
      }
      if (productResponse.specs.printType !== undefined) {
        console.log('✅ [PRODUCTS API UPDATE] Print Type salvo:', productResponse.specs.printType);
      }
    }

    res.json(productResponse);
  } catch (error) {
    console.error('❌ [PRODUCTS API] Erro ao atualizar produto:', error);
    console.error('❌ [PRODUCTS API] Nome do erro:', error.name);
    console.error('❌ [PRODUCTS API] Mensagem:', error.message);
    console.error('❌ [PRODUCTS API] Stack:', error.stack);
    res.status(500).json({
      error: error.message || 'Erro ao atualizar produto',
      details: error.message,
      name: error.name
    });
  }
}

// GET /api/products/:id/debug-media - inspecionar media no disco e no DB
export async function debugMedia(req, res) {
  try {
    const id = req.params.id;
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const build = (url) => {
      if (!url) return null;
      const rel = url.replace(/^\//, '');
      const abs = path.resolve(process.cwd(), 'public', rel.replace(/^public\//, ''));
      return { url, abs, exists: fs.existsSync(abs), size: fs.existsSync(abs) ? fs.statSync(abs).size : null };
    };
    const report = {
      id: product.id,
      day: build(product.imagesDayUrl),
      night: build(product.imagesNightUrl),
      thumb: build(product.thumbnailUrl),
    };
    console.log('🧪 [DEBUG MEDIA]', report);
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e?.message });
  }
}

// PATCH /api/products/:id/archive - Arquivar produto (soft delete)
export async function archiveProduct(req, res) {
  try {
    var product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Arquivar: marcar como inativo
    await product.update({ isActive: false });

    res.json({ message: 'Product archived successfully', product: product });
  } catch (error) {
    console.error('Erro ao arquivar produto:', error);
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/products/:id/unarchive - Desarquivar produto
export async function unarchiveProduct(req, res) {
  try {
    var product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Desarquivar: marcar como ativo
    await product.update({ isActive: true });

    res.json({ message: 'Product unarchived successfully', product: product });
  } catch (error) {
    console.error('Erro ao desarquivar produto:', error);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /api/products/:id - Deletar produto permanentemente (hard delete)
export async function deleteProduct(req, res) {
  try {
    console.log('🗑️  [DELETE PRODUCT] Iniciando deleção do produto:', req.params.id);

    var product = await Product.findByPk(req.params.id);

    if (!product) {
      console.log('❌ [DELETE PRODUCT] Produto não encontrado:', req.params.id);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('📦 [DELETE PRODUCT] Produto encontrado:', {
      id: product.id,
      name: product.name,
      imagesDayUrl: product.imagesDayUrl,
      imagesNightUrl: product.imagesNightUrl,
      animationUrl: product.animationUrl,
      thumbnailUrl: product.thumbnailUrl,
      availableColors: product.availableColors
    });

    // Coletar todos os ficheiros de imagem/vídeo para apagar
    var filesToDelete = [];
    var uploadDir = path.resolve(process.cwd(), 'public/uploads/products');

    // Adicionar imagem de dia
    if (product.imagesDayUrl) {
      var dayImagePath = path.join(process.cwd(), 'public', product.imagesDayUrl);
      if (fs.existsSync(dayImagePath)) {
        filesToDelete.push({ path: dayImagePath, type: 'imagesDayUrl' });
        console.log('📸 [DELETE PRODUCT] Ficheiro de dia encontrado:', dayImagePath);
      } else {
        console.log('⚠️  [DELETE PRODUCT] Ficheiro de dia não encontrado:', dayImagePath);
      }
    }

    // Adicionar imagem de noite
    if (product.imagesNightUrl) {
      var nightImagePath = path.join(process.cwd(), 'public', product.imagesNightUrl);
      if (fs.existsSync(nightImagePath)) {
        filesToDelete.push({ path: nightImagePath, type: 'imagesNightUrl' });
        console.log('🌙 [DELETE PRODUCT] Ficheiro de noite encontrado:', nightImagePath);
      } else {
        console.log('⚠️  [DELETE PRODUCT] Ficheiro de noite não encontrado:', nightImagePath);
      }
    }

    // Adicionar animação
    if (product.animationUrl) {
      var animationPath = path.join(process.cwd(), 'public', product.animationUrl);
      if (fs.existsSync(animationPath)) {
        filesToDelete.push({ path: animationPath, type: 'animationUrl' });
        console.log('🎬 [DELETE PRODUCT] Ficheiro de animação encontrado:', animationPath);
      } else {
        console.log('⚠️  [DELETE PRODUCT] Ficheiro de animação não encontrado:', animationPath);
      }
    }

    // Adicionar vídeo de simulação animada
    if (product.animationSimulationUrl) {
      var animationSimulationPath = path.join(process.cwd(), 'public', product.animationSimulationUrl);
      if (fs.existsSync(animationSimulationPath)) {
        filesToDelete.push({ path: animationSimulationPath, type: 'animationSimulationUrl' });
        console.log('🎬 [DELETE PRODUCT] Ficheiro de simulação animada encontrado:', animationSimulationPath);
      } else {
        console.log('⚠️  [DELETE PRODUCT] Ficheiro de simulação animada não encontrado:', animationSimulationPath);
      }
    }

    // Adicionar thumbnail
    if (product.thumbnailUrl) {
      var thumbnailPath = path.join(process.cwd(), 'public', product.thumbnailUrl);
      if (fs.existsSync(thumbnailPath)) {
        filesToDelete.push({ path: thumbnailPath, type: 'thumbnailUrl' });
        console.log('🖼️  [DELETE PRODUCT] Ficheiro de thumbnail encontrado:', thumbnailPath);
      } else {
        console.log('⚠️  [DELETE PRODUCT] Ficheiro de thumbnail não encontrado:', thumbnailPath);
      }
    }

    // Adicionar imagens de cores disponíveis
    if (product.availableColors && typeof product.availableColors === 'object') {
      console.log('🎨 [DELETE PRODUCT] Verificando imagens de cores disponíveis...');
      for (var colorKey in product.availableColors) {
        if (product.availableColors.hasOwnProperty(colorKey)) {
          var colorUrl = product.availableColors[colorKey];
          if (colorUrl && typeof colorUrl === 'string') {
            var colorImagePath = path.join(process.cwd(), 'public', colorUrl);
            if (fs.existsSync(colorImagePath)) {
              filesToDelete.push({ path: colorImagePath, type: 'availableColors.' + colorKey });
              console.log('🎨 [DELETE PRODUCT] Ficheiro de cor encontrado:', colorImagePath, '(' + colorKey + ')');
            } else {
              console.log('⚠️  [DELETE PRODUCT] Ficheiro de cor não encontrado:', colorImagePath, '(' + colorKey + ')');
            }
          }
        }
      }
    }

    console.log('🗑️  [DELETE PRODUCT] Total de ficheiros para apagar:', filesToDelete.length);

    // Apagar ficheiros físicos
    var deletedFiles = 0;
    var failedFiles = [];

    for (var i = 0; i < filesToDelete.length; i++) {
      var fileInfo = filesToDelete[i];
      try {
        fs.unlinkSync(fileInfo.path);
        deletedFiles++;
        console.log('✅ [DELETE PRODUCT] Ficheiro apagado:', fileInfo.path, '(' + fileInfo.type + ')');
      } catch (fileError) {
        console.error('❌ [DELETE PRODUCT] Erro ao apagar ficheiro:', fileInfo.path, '-', fileError.message);
        failedFiles.push({ path: fileInfo.path, error: fileError.message });
      }
    }

    console.log('📊 [DELETE PRODUCT] Resumo de ficheiros:', {
      total: filesToDelete.length,
      deleted: deletedFiles,
      failed: failedFiles.length
    });

    // Hard delete: apagar permanentemente da base de dados
    console.log('🗑️  [DELETE PRODUCT] Apagando produto da base de dados...');
    await product.destroy();
    console.log('✅ [DELETE PRODUCT] Produto apagado da base de dados com sucesso!');

    res.json({
      message: 'Product deleted permanently',
      filesDeleted: deletedFiles,
      filesFailed: failedFiles.length,
      failedFiles: failedFiles.length > 0 ? failedFiles : undefined
    });
  } catch (error) {
    console.error('❌ [DELETE PRODUCT] Erro ao deletar produto:', error);
    console.error('❌ [DELETE PRODUCT] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/products/colors - Buscar todas as cores disponíveis
export async function getAvailableColors(req, res) {
  try {
    console.log('🎨 [PRODUCTS API] GET /api/products/colors - Buscando cores disponíveis');

    var products = await Product.findAll({
      where: {
        isActive: true
      },
      attributes: ['availableColors']
    });

    // Extrair todas as cores únicas de todos os produtos
    var allColors = {};

    for (var i = 0; i < products.length; i++) {
      var product = products[i];
      var availableColors = product.availableColors;

      if (availableColors && typeof availableColors === 'object') {
        // Se for string, tentar fazer parse
        if (typeof availableColors === 'string') {
          try {
            availableColors = JSON.parse(availableColors);
          } catch (e) {
            console.warn('⚠️  [GET COLORS] Erro ao fazer parse de availableColors:', e);
            continue;
          }
        }

        // Adicionar cores ao objeto de cores únicas
        for (var colorName in availableColors) {
          if (availableColors.hasOwnProperty(colorName)) {
            // Se a cor ainda não existe ou queremos manter a primeira ocorrência
            if (!allColors.hasOwnProperty(colorName)) {
              allColors[colorName] = availableColors[colorName];
            }
          }
        }
      }
    }

    console.log('🎨 [PRODUCTS API] Cores encontradas:', Object.keys(allColors).length);

    res.json(allColors);
  } catch (error) {
    console.error('❌ [GET COLORS] Erro ao buscar cores:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/products/categories - Listar categorias únicas baseadas no campo mount
export async function getCategories(req, res) {
  try {
    console.log('📂 [PRODUCTS API] GET /api/products/categories - Buscando categorias');

    // Buscar todos os produtos ativos com mount
    var products = await Product.findAll({
      where: {
        isActive: true,
        mount: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: '' }
          ]
        } // Apenas produtos com mount definido e não vazio
      },
      attributes: ['mount'],
      order: [['mount', 'ASC']]
    });

    // Extrair categorias únicas usando um objeto para evitar duplicatas
    var categoriesMap = {};
    var mountNameMap = { 'Poste': 'Pole', 'Chão': 'Floor', 'Transversal': 'Transversal' };

    for (var i = 0; i < products.length; i++) {
      var mount = products[i].mount;
      if (mount && typeof mount === 'string' && mount.trim() !== '') {
        if (!categoriesMap[mount]) {
          var displayName = mountNameMap[mount] || mount;
          categoriesMap[mount] = {
            id: mount,
            name: displayName
          };
        }
      }
    }

    // Converter objeto em array
    var categories = [];
    for (var key in categoriesMap) {
      if (categoriesMap.hasOwnProperty(key)) {
        categories.push(categoriesMap[key]);
      }
    }

    // Ordenar por nome
    categories.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    console.log('📂 [PRODUCTS API] Categorias encontradas:', categories.length);

    res.json(categories);
  } catch (error) {
    console.error('❌ [GET CATEGORIES] Erro ao buscar categorias:', error);
    res.status(500).json({ error: error.message });
  }
}


