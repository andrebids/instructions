import { Decoration } from '../models/index.js';
import { Op } from 'sequelize';

// GET /api/decorations - Listar todas as decorações
export async function getAll(req, res) {
  try {
    // Logs iniciais e parâmetros
    console.log('[API] GET /api/decorations', { query: req.query });

    var category = req.query.category;
    var tag = req.query.tag;
    var q = req.query.q;
    var sort = req.query.sort || 'name'; // name | width | height
    var order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    var page = parseInt(req.query.page || '1', 10);
    var limit = parseInt(req.query.limit || '24', 10);
    if (page < 1) page = 1;
    if (limit < 1) limit = 24;

    var where = {};

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = { [Op.contains]: [tag] };
    }

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: '%' + q + '%' } },
        { description: { [Op.iLike]: '%' + q + '%' } },
      ];
    }

    var validSorts = { name: 'name', width: 'width', height: 'height' };
    var orderBy = validSorts[sort] || 'name';

    var offset = (page - 1) * limit;

    console.time('[API] decorations:db');
    const { rows, count } = await Decoration.findAndCountAll({
      where,
      order: [[orderBy, order]],
      offset,
      limit,
    });
    console.timeEnd('[API] decorations:db');

    // Avisos para itens sem imagens
    for (var i = 0; i < rows.length; i++) {
      var d = rows[i];
      if (!d.thumbnailUrl && !d.thumbnailNightUrl) {
        console.warn('[API] decoration without thumbnails', { id: d.id, name: d.name });
      }
    }

    console.log('[API] decorations:count', rows.length, 'total:', count);

    res.json({
      items: rows,
      page,
      limit,
      total: count,
    });
  } catch (error) {
    console.error('Erro ao buscar decorações:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/decorations/search - Pesquisar decorações com filtros e paginação
export async function search(req, res) {
  try {
    console.log('[API] GET /api/decorations/search', { query: req.query });

    // Parâmetros (tudo opcional)
    var q = req.query.q;
    var category = req.query.category || req.query.categoryId;
    var heightMin = parseInt(req.query.heightMin || '0', 10);
    var heightMax = parseInt(req.query.heightMax || '0', 10);
    var priceMin = req.query.priceMin ? parseFloat(req.query.priceMin) : null;
    var priceMax = req.query.priceMax ? parseFloat(req.query.priceMax) : null;

    // Aceita, mas ainda não aplicado: stockMin, colors, dimensions
    // Mantido para compatibilidade futura sem quebrar clientes
    var page = parseInt(req.query.page || '1', 10);
    var limit = parseInt(req.query.limit || '24', 10);
    if (page < 1) page = 1;
    if (limit < 1) limit = 24;

    var sort = req.query.sort || 'name'; // name | width | height | price
    var order = req.query.order === 'desc' ? 'DESC' : 'ASC';

    var where = {};

    if (category) {
      where.category = category;
    }

    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: '%' + q + '%' } },
        { description: { [Op.iLike]: '%' + q + '%' } },
        { tags: { [Op.overlap]: [q] } },
      ];
    }

    if (heightMin && heightMin > 0) {
      where.height = Object.assign(where.height || {}, { [Op.gte]: heightMin });
    }
    if (heightMax && heightMax > 0) {
      where.height = Object.assign(where.height || {}, { [Op.lte]: heightMax });
    }

    if (priceMin !== null && !isNaN(priceMin)) {
      where.price = Object.assign(where.price || {}, { [Op.gte]: priceMin });
    }
    if (priceMax !== null && !isNaN(priceMax)) {
      where.price = Object.assign(where.price || {}, { [Op.lte]: priceMax });
    }

    var validSorts = { name: 'name', width: 'width', height: 'height', price: 'price' };
    var orderBy = validSorts[sort] || 'name';

    var offset = (page - 1) * limit;

    console.time('[API] decorations:search:db');
    const { rows, count } = await Decoration.findAndCountAll({
      where,
      order: [[orderBy, order]],
      offset,
      limit,
    });
    console.timeEnd('[API] decorations:search:db');

    res.json({
      items: rows,
      page,
      limit,
      total: count,
    });
  } catch (error) {
    console.error('Erro ao pesquisar decorações:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/decorations/:id - Buscar decoração por ID
export async function getById(req, res) {
  try {
    const decoration = await Decoration.findByPk(req.params.id);
    
    if (!decoration) {
      return res.status(404).json({ error: 'Decoration not found' });
    }
    
    res.json(decoration);
  } catch (error) {
    console.error('Erro ao buscar decoração:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/decorations/categories - Listar categorias únicas
export async function getCategories(req, res) {
  try {
    const decorations = await Decoration.findAll({
      attributes: ['category'],
      group: ['category'],
    });
    
    const categories = decorations.map(d => d.category);
    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: error.message });
  }
}

