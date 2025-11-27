
import { Product } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

async function checkTrending() {
    try {
        const total = await Product.count();
        const trending = await Product.count({ where: { isTrending: true } });
        const trendingWithImage = await Product.count({
            where: {
                isTrending: true,
                imagesNightUrl: { [Op.ne]: null }
            }
        });
        const trendingWithImageAndActive = await Product.count({
            where: {
                isTrending: true,
                isActive: true,
                imagesNightUrl: { [Op.ne]: null }
            }
        });

        console.log(`Total Products: ${total}`);
        console.log(`Trending Products: ${trending}`);
        console.log(`Trending Products with Night Image: ${trendingWithImage}`);
        console.log(`Trending + Night Image + Active: ${trendingWithImageAndActive}`);

        if (trending > 0) {
            const products = await Product.findAll({
                where: { isTrending: true },
                attributes: ['id', 'name', 'isTrending', 'isActive', 'imagesNightUrl']
            });
            console.log('Trending Products List:', JSON.stringify(products, null, 2));
        }

    } catch (error) {
        console.error('Error checking trending products:', error);
    } finally {
        await sequelize.close();
    }
}

checkTrending();
