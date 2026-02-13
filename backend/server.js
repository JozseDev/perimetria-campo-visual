const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')

const app = express()
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
app.use(express.json())

// CONEXIÓN A NEON.TECH (¡PEGA AQUÍ TU CADENA!)
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_q6UTshoLDJC2@ep-flat-lake-ac474qg8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
})

// CREAR TABLA (solo una vez)
app.get('/api/crear-tabla', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS respuestas (
        id UUID PRIMARY KEY,
        angulo INTEGER,
        distancia INTEGER,
        ojo TEXT,
        visto BOOLEAN,
        timestamp TEXT,
        paciente TEXT DEFAULT 'anónimo'
      )
    `)
    res.json({ mensaje: '✅ Tabla creada' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GUARDAR RESPUESTA
app.post('/api/guardar', async (req, res) => {
  try {
    const { id, angulo, distancia, visto, timestamp } = req.body
    await pool.query(
      'INSERT INTO respuestas (id, angulo, distancia, visto, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [id, angulo, distancia, visto, timestamp]
    )
    res.json({ mensaje: '✅ Respuesta guardada' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// OBTENER TODAS LAS RESPUESTAS
app.get('/api/respuestas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM respuestas ORDER BY timestamp DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})