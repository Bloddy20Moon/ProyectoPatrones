import cors from 'cors';
import express, { Express } from 'express';
import path from 'path';
import { CommandInvoker } from './patterns/behavioral/command/InventoryCommand';
import { ProductHistory } from './patterns/behavioral/memento/ProductMemento';
import {
  AuditLogObserver,
  DashboardAlertObserver,
  InventorySubject,
} from './patterns/behavioral/observer/InventoryObserver';
import { InventoryStore } from './patterns/creational/singleton/InventoryStore';
import { InventoryFacade } from './patterns/structural/facade/InventoryFacade';
import { InventoryAccessProxy } from './patterns/structural/proxy/InventoryAccessProxy';
import { createInventoryRouter } from './routes/inventoryRoutes';
import { seedInitialInventory } from './seed/seedData';
import { uploadsDir } from './utils/upload';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  const allowedOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir peticiones sin Origin (CLI/curl/mismo origen) y orígenes explícitos
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origen CORS no permitido'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-User-Role', 'X-User-Name'],
    })
  );

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Servir imágenes subidas con cabeceras restrictivas e imágenes SVG locales de catálogo
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      },
    })
  );
  app.use('/images', express.static(path.resolve(process.cwd(), 'public', 'images')));

  // Inicializar subsistemas y conectar los 15 Patrones de Diseño GoF
  const subject = new InventorySubject();
  subject.subscribe(new DashboardAlertObserver());
  subject.subscribe(new AuditLogObserver());

  const commandInvoker = new CommandInvoker();
  const productHistory = new ProductHistory(20);

  let facade!: InventoryFacade;
  facade = new InventoryFacade(subject, commandInvoker, productHistory, () => {
    seedInitialInventory(facade);
  });

  // Cargar persistencia JSON o poblar con datos semilla en el primer arranque
  const store = InventoryStore.getInstance();
  const loadedFromDisk = store.loadFromDisk();
  if (!loadedFromDisk && !store.hasData()) {
    seedInitialInventory(facade);
  }

  // Envolver InventoryFacade con el Protection Proxy (RBAC Admin vs Vendedor)
  const securedInventoryService = new InventoryAccessProxy(facade, subject);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'TechStock Backend API',
      patternsImplemented: 15,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api', createInventoryRouter(securedInventoryService));

  return app;
}
