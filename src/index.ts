import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import favoriteRoutes from './routes/favorite.routes';
import preferenceRoutes from './routes/preference.routes';
import searchHistoryRoutes from './routes/search-history.routes';
import cityRoutes from './routes/city.routes';
import weatherRoutes from './routes/weather.routes';

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Middlewares globales
// ---------------------------------------------------------------------------

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/preferences', preferenceRoutes);
app.use('/search-history', searchHistoryRoutes);
app.use('/cities', cityRoutes);
app.use('/weather', weatherRoutes);

// ---------------------------------------------------------------------------
// Inicio del servidor
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
