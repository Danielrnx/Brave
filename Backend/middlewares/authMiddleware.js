const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extrai o token do header Authorization

  if (!token)
    return res.status(401).json({ message: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 👇 ISTO ESTÁ CERTO!
    req.userId = decoded.id; // Usa o ID do token para associar ao utilizador autenticado
    
    next(); // Continua para o próximo middleware ou route handler
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
