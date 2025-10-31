import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  oldPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Preço antigo para produtos em promoção',
  },
  imagesDayUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL da imagem de dia',
  },
  imagesNightUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL da imagem de noite',
  },
  animationUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL do vídeo/animação (webm, mp4)',
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL da thumbnail para listagem',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '2D ou 3D',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Exterior ou Interior',
  },
  mount: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Poste, Chão, Transversal',
  },
  specs: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Especificações técnicas: descricao, tecnicas, dimensoes, dimensions, weight, effects, materiais, stockPolicy',
  },
  availableColors: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Objeto com chaves de cores e URLs de imagens: { brancoPuro: "/url", vermelho: "/url" }',
  },
  variantProductByColor: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Mapeamento de cores para IDs de produtos',
  },
  videoFile: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome do ficheiro de vídeo',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Se o produto está ativo/visível',
  },
  season: {
    type: DataTypes.ENUM('xmas', 'summer'),
    allowNull: true,
    comment: 'Estação/categoria: xmas ou summer',
  },
  isTrending: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se o produto está em trending',
  },
  releaseYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Ano de lançamento para produtos NEW (ex: 2024)',
  },
  isOnSale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se o produto está em promoção (calculado ou explícito)',
  },
  height: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Altura em metros (H)',
  },
  width: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Largura em metros (W)',
  },
  depth: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Profundidade em metros (D)',
  },
  diameter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Diâmetro em metros',
  },
}, {
  tableName: 'products',
  timestamps: true,
});

export default Product;

