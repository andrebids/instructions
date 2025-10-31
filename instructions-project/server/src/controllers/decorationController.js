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

// GET /api/decorations/search - Pesquisar decorações
export async function search(req, res) {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const decorations = await Decoration.findAll({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: `%${q}%`,
            },
          },
          {
            description: {
              [Op.iLike]: `%${q}%`,
            },
          },
          {
            tags: {
              [Op.overlap]: [q],
            },
          },
        ],
      },
      order: [['name', 'ASC']],
    });
    
    res.json(decorations);
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

