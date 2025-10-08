import { Decoration } from '../models/index.js';
import { Op } from 'sequelize';

// GET /api/decorations - Listar todas as decorações
export async function getAll(req, res) {
  try {
    const { category, tag } = req.query;
    const where = {};
    
    if (category) {
      where.category = category;
    }
    
    if (tag) {
      where.tags = {
        [Op.contains]: [tag],
      };
    }
    
    const decorations = await Decoration.findAll({
      where,
      order: [['name', 'ASC']],
    });
    
    res.json(decorations);
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

