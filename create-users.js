const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Modelo de Usuario (igual que en server.js)
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
    enum: [0, 1]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Usuarios a crear
// tipoUs: 1 = Admin, 0 = Usuario Normal
const users = [
  {
    email: 'admin@gmail.com',
    password: 'admin',
    tipoUs: 1  // Admin
  },
  {
    email: '2022371010@uteq.edu.mx',
    password: '123456789',
    tipoUs: 0  // Usuario Normal
  }
];

async function createUsers() {
  try {
    // Conectar a MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB Atlas');

    // Crear cada usuario
    for (const userData of users) {
      // Verificar si ya existe
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  Usuario ${userData.email} ya existe, saltando...`);
        continue;
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Crear usuario
      const newUser = new User({
        email: userData.email,
        password: hashedPassword,
        tipoUs: userData.tipoUs
      });

      await newUser.save();
      
      const userType = userData.tipoUs === 1 ? '(Admin)' : '(Usuario Normal)';
      console.log(`✅ Usuario creado: ${userData.email} ${userType}`);
    }

    console.log('\n🎉 ¡Todos los usuarios han sido creados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n👋 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar
createUsers();