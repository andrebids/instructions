import { Product } from '../models/index.js';
import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { generateThumbnail } from '../utils/imageUtils.js';

// GET /api/products - Listar todos os produtos
export async function getAll(req, res) {
  try {
    console.log('📦 [PRODUCTS API] GET /api/products - Iniciando busca');
    console.log('📦 [PRODUCTS API] Query params:', JSON.stringify(req.query));
    
    var where = {};
    var query = req.query;
    
    // Filtro por tags - apenas se não for string vazia
    if (query.tags && query.tags.trim() !== '') {
      var tagsArray = Array.isArray(query.tags) ? query.tags : [query.tags];
      where.tags = {
        [Op.overlap]: tagsArray,
      };
    }
    
    // Filtro por type - apenas se não for string vazia
    if (query.type && query.type.trim() !== '') {
      where.type = query.type;
    }
    
    // Filtro por isSourceImage - apenas se for 'true' ou 'false' (não string vazia)
    if (query.isSourceImage !== undefined && query.isSourceImage !== '' && query.isSourceImage !== null) {
      where.isSourceImage = query.isSourceImage === 'true' || query.isSourceImage === true;
    }
    
    // Filtro por isActive - apenas se for 'true' ou 'false' (não string vazia)
    // Por padrão, mostrar apenas produtos ativos (não arquivados)
    // Se showArchived=true, mostrar todos (arquivados e não arquivados)
    if (query.showArchived === 'true') {
      // Se mostrar arquivados, não filtrar por isActive (mostrar todos)
      // Não adicionar filtro de isActive
    } else {
      // Por padrão, mostrar apenas produtos ativos
      where.isActive = true;
    }
    
    // Se o usuário especificou explicitamente isActive, respeitar isso
    if (query.isActive !== undefined && query.isActive !== '' && query.isActive !== null && query.showArchived !== 'true') {
      where.isActive = query.isActive === 'true' || query.isActive !== 'false';
    }
    
    // Filtro por location - apenas se não for string vazia
    if (query.location && query.location.trim() !== '') {
      where.location = query.location;
    }
    
    // Filtro por usage - apenas se não for string vazia
    if (query.usage && query.usage.trim() !== '') {
      where.usage = query.usage;
    }
    
    // Filtro por mount - apenas se não for string vazia
    if (query.mount && query.mount.trim() !== '') {
      where.mount = query.mount;
    }
    
    // Filtro por season - apenas se não for string vazia
    if (query.season && query.season.trim() !== '') {
      where.season = query.season;
    }
    
    // Filtro por isTrending - apenas se for 'true' ou 'false' (não string vazia)
    if (query.isTrending !== undefined && query.isTrending !== '' && query.isTrending !== null) {
      where.isTrending = query.isTrending === 'true' || query.isTrending === true;
    }
    
    // Filtro por releaseYear - apenas se não for string vazia
    if (query.releaseYear && query.releaseYear.trim() !== '') {
      where.releaseYear = parseInt(query.releaseYear);
    }
    
    // Filtro por isOnSale - apenas se for 'true' ou 'false' (não string vazia)
    if (query.isOnSale !== undefined && query.isOnSale !== '' && query.isOnSale !== null) {
      where.isOnSale = query.isOnSale === 'true' || query.isOnSale === true;
    }
    
    console.log('📦 [PRODUCTS API] Where clause:', JSON.stringify(where));
    
    var products = await Product.findAll({
      where: where,
      order: [['name', 'ASC']],
    });
    
    console.log('📦 [PRODUCTS API] Produtos encontrados:', products.length);
    if (products.length > 0) {
      console.log('📦 [PRODUCTS API] Primeiros 3 produtos:', products.slice(0, 3).map(function(p) {
        return { id: p.id, name: p.name, isSourceImage: p.isSourceImage };
      }));
    } else {
      console.log('⚠️  [PRODUCTS API] NENHUM PRODUTO ENCONTRADO! Where clause:', JSON.stringify(where));
      // Fazer uma busca sem filtros para debug
      var allProducts = await Product.findAll({ limit: 1 });
      console.log('📦 [PRODUCTS API] Total de produtos na BD (sem filtros):', await Product.count());
    }
    
    res.json(products);
  } catch (error) {
    console.error('❌ [PRODUCTS API] Erro ao buscar produtos:', error);
    console.error('❌ [PRODUCTS API] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/products/source-images - Listar apenas produtos marcados como Source Images
export async function getSourceImages(req, res) {
  try {
    var products = await Product.findAll({
      where: {
        isSourceImage: true,
        isActive: true,
      },
      order: [['name', 'ASC']],
    });
    
    res.json(products);
  } catch (error) {
    console.error('Erro ao buscar Source Images:', error);
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
          {
            usage: {
              [Op.iLike]: '%' + q + '%',
            },
          },
        ],
      },
      order: [['name', 'ASC']],
    });
    
    res.json(products);
  } catch (error) {
    console.error('Erro ao pesquisar produtos:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/products/:id - Buscar produto por ID
export async function getById(req, res) {
  try {
    var product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
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
    
    // Processar URLs de imagens dos ficheiros enviados
    var imagesDayUrl = null;
    var imagesNightUrl = null;
    var animationUrl = null;
    var thumbnailUrl = null;
    var availableColors = {};
    
    if (files.dayImage && files.dayImage[0]) {
      var dayImagePath = files.dayImage[0].path;
      imagesDayUrl = '/uploads/products/' + files.dayImage[0].filename;
      
      // Auto-gerar thumbnail se não foi fornecido
      if (!files.thumbnail || !files.thumbnail[0]) {
        try {
          var thumbnailFilename = 'thumb_' + files.dayImage[0].filename.replace(/\.[^/.]+$/, '.jpg');
          var thumbnailPath = path.join(path.dirname(dayImagePath), thumbnailFilename);
          await generateThumbnail(dayImagePath, thumbnailPath, 300, 300);
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
      imagesNightUrl = '/uploads/products/' + files.nightImage[0].filename;
    }
    
    if (files.animation && files.animation[0]) {
      animationUrl = '/uploads/products/' + files.animation[0].filename;
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
          tags = body.tags.split(',').map(function(tag) { return tag.trim(); });
        }
      } else if (Array.isArray(body.tags)) {
        tags = body.tags;
      }
    }
    
    var productData = {
      name: body.name,
      price: parseFloat(body.price) || 0,
      stock: parseInt(body.stock, 10) || 0,
      oldPrice: body.oldPrice ? parseFloat(body.oldPrice) : null,
      imagesDayUrl: imagesDayUrl || body.imagesDayUrl || null,
      imagesNightUrl: imagesNightUrl || body.imagesNightUrl || null,
      animationUrl: animationUrl || body.animationUrl || null,
      thumbnailUrl: thumbnailUrl || body.thumbnailUrl || null,
      tags: tags,
      type: body.type || null,
      usage: body.usage || null,
      location: body.location || null,
      mount: body.mount || null,
      specs: specs,
      availableColors: Object.keys(availableColors).length > 0 ? availableColors : null,
      variantProductByColor: variantProductByColor,
      videoFile: body.videoFile || null,
      isSourceImage: body.isSourceImage === 'true' || body.isSourceImage === true,
      isActive: body.isActive !== 'false' && body.isActive !== false,
    };
    
    var product = await Product.create(productData);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: error.message });
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
      updateData.imagesDayUrl = '/uploads/products/' + files.dayImage[0].filename;
      
      // Auto-gerar thumbnail se não foi fornecido e a imagem de dia mudou
      if (!files.thumbnail || !files.thumbnail[0]) {
        try {
          var thumbnailFilename = 'thumb_' + files.dayImage[0].filename.replace(/\.[^/.]+$/, '.jpg');
          var thumbnailPath = path.join(path.dirname(dayImagePath), thumbnailFilename);
          await generateThumbnail(dayImagePath, thumbnailPath, 300, 300);
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
      updateData.imagesNightUrl = '/uploads/products/' + files.nightImage[0].filename;
    } else if (body.imagesNightUrl !== undefined) {
      updateData.imagesNightUrl = body.imagesNightUrl || null;
    }
    
    if (files.animation && files.animation[0]) {
      updateData.animationUrl = '/uploads/products/' + files.animation[0].filename;
    } else if (body.animationUrl !== undefined) {
      updateData.animationUrl = body.animationUrl || null;
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
    
    // Atualizar campos básicos
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = parseFloat(body.price) || 0;
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock, 10) || 0;
    if (body.oldPrice !== undefined) updateData.oldPrice = body.oldPrice ? parseFloat(body.oldPrice) : null;
    if (body.type !== undefined) updateData.type = body.type || null;
    if (body.usage !== undefined) updateData.usage = body.usage || null;
    if (body.location !== undefined) updateData.location = body.location || null;
    if (body.mount !== undefined) updateData.mount = body.mount || null;
    if (body.videoFile !== undefined) updateData.videoFile = body.videoFile || null;
    
    // Processar tags
    if (body.tags !== undefined) {
      var tags = [];
      if (typeof body.tags === 'string') {
        try {
          tags = JSON.parse(body.tags);
        } catch (e) {
          tags = body.tags.split(',').map(function(tag) { return tag.trim(); });
        }
      } else if (Array.isArray(body.tags)) {
        tags = body.tags;
      }
      updateData.tags = tags;
    }
    
    // Processar specs
    if (body.specs !== undefined) {
      try {
        updateData.specs = typeof body.specs === 'string' ? JSON.parse(body.specs) : body.specs;
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
    if (body.isSourceImage !== undefined) {
      updateData.isSourceImage = body.isSourceImage === 'true' || body.isSourceImage === true;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive !== 'false' && body.isActive !== false;
    }
    
    await product.update(updateData);
    
    res.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: error.message });
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
    var product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Hard delete: apagar permanentemente da base de dados
    await product.destroy();
    
    res.json({ message: 'Product deleted permanently' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: error.message });
  }
}

