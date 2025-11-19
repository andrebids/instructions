import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para mudança de password
 * Limita a 5 tentativas por 15 minutos por IP
 */
export const passwordUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por janela
    message: {
        error: 'Demasiadas tentativas',
        message: 'Demasiadas tentativas de mudança de password. Tente novamente mais tarde.'
    },
    standardHeaders: true, // Retornar info de rate limit nos headers `RateLimit-*`
    legacyHeaders: false, // Desabilitar headers `X-RateLimit-*`
    // Usar IP do cliente como chave
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    },
    // Handler customizado para quando limite é excedido
    handler: (req, res) => {
        console.warn('⚠️  [Rate Limiter] Limite de tentativas excedido:', {
            ip: req.ip,
            path: req.path,
            userId: req.params.id
        });
        res.status(429).json({
            error: 'Demasiadas tentativas',
            message: 'Demasiadas tentativas de mudança de password. Tente novamente em 15 minutos.'
        });
    },
    // Pular rate limiting se estiver em desenvolvimento e configurado para pular
    skip: (req) => {
        // Permitir pular em desenvolvimento se variável de ambiente estiver definida
        return process.env.SKIP_RATE_LIMIT === 'true';
    }
});

/**
 * Rate limiter geral para rotas de API
 * Limita a 100 requisições por 15 minutos por IP
 */
export const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requisições por janela
    message: {
        error: 'Demasiadas requisições',
        message: 'Demasiadas requisições. Tente novamente mais tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return process.env.SKIP_RATE_LIMIT === 'true';
    }
});
