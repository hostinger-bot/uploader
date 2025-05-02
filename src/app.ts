import express, { Express, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import uploadRouter from './routes/upload';

const app: Express = express();

// Setup view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.set('json spaces', 2);

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Trust proxy if behind a reverse proxy
app.set('trust proxy', 1);

// Logger
app.use(morgan('dev'));

// Rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Max 50 requests per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' https://cdn.tailwindcss.com",
      "style-src 'self' https://cdn.tailwindcss.com 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  next();
});

app.disable('x-powered-by');

// Routes
app.use('/', uploadRouter);

app.get('/', (req: Request, res: Response) => {
  res.render('index', {
    error: req.query.error,
    success: null,
    files: null,
    baseUrl: `${req.protocol}://${req.get('host')}`,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).render('index', {
    error: 'Page not found',
    success: null,
    files: null,
    baseUrl: `${req.protocol}://${req.get('host')}`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Application error:', err);
  res.status(500).render('index', {
    error: 'Server error occurred',
    success: null,
    files: null,
    baseUrl: `${req.protocol}://${req.get('host')}`,
  });
});

export default app;
