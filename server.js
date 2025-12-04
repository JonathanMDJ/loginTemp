const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI ;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log(' Conectado a MongoDB Atlas'))
.catch(err => console.error(' Error al conectar a MongoDB:', err));

// Modelo de Usuario
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  tipoUs: {
    type: Number,
    required: true,
    default: 0,  // 0 = usuario normal, 1 = admin
    enum: [0, 1] // Solo permite 0 o 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// 🔹 Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🎯 API de Autenticación funcionando correctamente' });
});

// 🔹 LOGIN de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      message: 'Login exitoso',
      token,
      user: {
        email: user.email,
        id: user._id,
        tipoUs: user.tipoUs
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al iniciar sesión' 
    });
  }
});

// 🔹 Verificar token (middleware para rutas protegidas)
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    req.userId = decoded.userId;
    next();
  });
};

// 🔹 Ruta protegida de ejemplo
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Acceso autorizado',
    userId: req.userId 
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor corriendo en puerto ${PORT}`);
});