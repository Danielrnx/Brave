const jwt = require('jsonwebtoken');
const { Users } = require('../models');

// Login de utilizador
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id, name: user.name }, 'segredo', { expiresIn: '1h' });

    return res.json({
      message: 'Login bem-sucedido',
      token,
      name: user.name // ← Enviado para o frontend
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro no login', error: error.message });
  }
};

// Obter informações do utilizador autenticado
exports.getUserInfo = async (req, res) => {
  try {
    const user = await Users.findByPk(req.userId); // <-- Atenção ao nome correto do modelo
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });

    res.json({ name: user.name });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter informações do utilizador' });
  }
};


module.exports = {
  loginUser,
  getUserInfo
}; 

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Customer.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Email incorreto' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Password incorreta' });
    }

    // Aqui poderias usar JWT se quiseres, mas vamos supor um token falso
    const token = 'fake-token-exemplo';

    // Aqui é onde colocas a resposta com isAdmin incluído
    res.json({
      token,
      name: user.name,
      isAdmin: user.is_admin // <- usa exatamente o nome da coluna (sem underscore)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});
