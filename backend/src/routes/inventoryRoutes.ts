import { Request, Response, Router } from 'express';
import {
  ActorContext,
  ExtraServiceType,
  ProductCategory,
  ProductLine,
  ReportFormatType,
  ReportType,
  UserRole,
} from '../models/types';
import { EXTRA_SERVICE_CATALOG } from '../patterns/structural/decorator/ProductDecorator';
import { DomainError } from '../patterns/structural/facade/InventoryFacade';
import { AccessDeniedError, IInventoryService } from '../patterns/structural/proxy/InventoryAccessProxy';
import { ProductLineFactoryProvider } from '../patterns/creational/abstract-factory/ProductLineFactory';
import { ProductFactoryProvider } from '../patterns/creational/factory-method/ProductFactory';
import { uploadProductImage } from '../utils/upload';

/**
 * Extrae el contexto del actor desde la cabecera de simulación de roles de la UI.
 * Principio de mínimo privilegio (fail-closed): si la cabecera falta o no es válida,
 * el rol por defecto es SELLER (nunca ADMIN).
 */
function extractActor(req: Request): ActorContext {
  const rawRole = String(req.header('x-user-role') ?? 'SELLER').trim().toUpperCase();
  const role: UserRole = rawRole === 'ADMIN' ? 'ADMIN' : 'SELLER';
  const defaultName = role === 'ADMIN' ? 'Administrador TechStock' : 'Vendedor de Tienda';
  const rawName = String(req.header('x-user-name') ?? defaultName)
    .replace(/[\r\n\t\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 60);
  const actorName = rawName || defaultName;
  return { role, actorName };
}

function handleRouteError(res: Response, error: unknown): void {
  if (error instanceof AccessDeniedError) {
    res.status(403).json({
      error: error.message,
      code: 'ACCESS_DENIED',
      pattern: error.pattern,
    });
    return;
  }
  if (error instanceof DomainError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: 'DOMAIN_ERROR',
    });
    return;
  }
  if (error instanceof Error) {
    res.status(400).json({
      error: error.message,
      code: 'VALIDATION_ERROR',
    });
    return;
  }
  res.status(500).json({ error: 'Error interno del servidor.' });
}

export function createInventoryRouter(inventoryService: IInventoryService): Router {
  const router = Router();

  // --- Dashboard & Metadata ---
  router.get('/dashboard', (req, res) => {
    try {
      res.json(inventoryService.getDashboardSummary(extractActor(req)));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get('/meta/services', (_req, res) => {
    res.json({ services: EXTRA_SERVICE_CATALOG });
  });

  router.get('/meta/next-code', (req, res) => {
    try {
      const category = String(req.query.category ?? 'LAPTOP').toUpperCase() as ProductCategory;
      const code = inventoryService.suggestNextCode(extractActor(req), category);
      const prefix = ProductFactoryProvider.getPrefixForCategory(category);
      res.json({ category, prefix, suggestedCode: code });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get('/meta/line-preview', (req, res) => {
    try {
      const line = String(req.query.line ?? 'GAMER').toUpperCase() as ProductLine;
      const category = String(req.query.category ?? 'LAPTOP').toUpperCase() as ProductCategory;
      const code = String(req.query.code ?? `${ProductFactoryProvider.getPrefixForCategory(category)}-001`);
      const name = String(req.query.name ?? 'Producto Tecnológico');
      const factory = ProductLineFactoryProvider.getFactory(line);
      res.json({
        specSheet: factory.createTechSpecSheet(name, category, {}).toJSON(),
        codeLabel: factory.createCodeLabel(code, name, category).toJSON(),
      });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Subida de imagen de producto ---
  router.post('/uploads', (req, res) => {
    const actor = extractActor(req);
    if (actor.role !== 'ADMIN') {
      res.status(403).json({
        error: '[InventoryAccessProxy] Solo el ADMINISTRADOR puede subir imágenes de productos.',
        code: 'ACCESS_DENIED',
      });
      return;
    }

    uploadProductImage.single('image')(req, res, (err: unknown) => {
      if (err) {
        handleRouteError(res, err);
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });
        return;
      }
      res.status(201).json({
        imageUrl: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
      });
    });
  });

  // --- Productos CRUD + Patrones ---
  router.get('/products', (req, res) => {
    try {
      res.json({ products: inventoryService.listProducts(extractActor(req)) });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get('/products/:id', (req, res) => {
    try {
      res.json({ product: inventoryService.getProductById(extractActor(req), req.params.id) });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post('/products', (req, res) => {
    try {
      const product = inventoryService.registerProduct(extractActor(req), req.body);
      res.status(201).json({ product });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.put('/products/:id', (req, res) => {
    try {
      const product = inventoryService.updateProduct(extractActor(req), req.params.id, req.body);
      res.json({ product });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.delete('/products/:id', (req, res) => {
    try {
      const result = inventoryService.deleteProduct(extractActor(req), req.params.id);
      res.json(result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Movimientos de Stock (State + Command + Observer) ---
  router.post('/products/:id/stock', (req, res) => {
    try {
      const product = inventoryService.updateStock(extractActor(req), req.params.id, req.body);
      res.json({ product });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Descontinuar / Reactivar (State: DiscontinuedState) ---
  router.patch('/products/:id/discontinue', (req, res) => {
    try {
      const discontinued = Boolean(req.body?.discontinued);
      const product = inventoryService.toggleDiscontinued(
        extractActor(req),
        req.params.id,
        discontinued
      );
      res.json({ product });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Clonar variante (Prototype) ---
  router.post('/products/:id/clone', (req, res) => {
    try {
      const product = inventoryService.cloneProduct(extractActor(req), req.params.id, req.body);
      res.status(201).json({ product });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Deshacer edición (Memento) ---
  router.get('/products/:id/history', (req, res) => {
    try {
      const history = inventoryService.getProductUndoHistory(extractActor(req), req.params.id);
      res.json({ history });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post('/products/:id/undo', (req, res) => {
    try {
      const product = inventoryService.undoProductEdit(extractActor(req), req.params.id);
      res.json({ product });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Servicios Extra (Decorator) ---
  router.post('/products/:id/services', (req, res) => {
    try {
      const service = String(req.body?.service ?? '').toUpperCase() as ExtraServiceType;
      if (!['EXTENDED_WARRANTY', 'SOFTWARE_SETUP', 'PRIORITY_SUPPORT'].includes(service)) {
        throw new DomainError(`Servicio extra inválido: ${service}`);
      }
      const product = inventoryService.addServiceToProduct(
        extractActor(req),
        req.params.id,
        service
      );
      res.json({ product });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.delete('/products/:id/services/:service', (req, res) => {
    try {
      const service = String(req.params.service ?? '').toUpperCase() as ExtraServiceType;
      const product = inventoryService.removeServiceFromProduct(
        extractActor(req),
        req.params.id,
        service
      );
      res.json({ product });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Combos / Kits (Composite) ---
  router.get('/kits', (req, res) => {
    try {
      res.json({ kits: inventoryService.listKits(extractActor(req)) });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post('/kits', (req, res) => {
    try {
      const kit = inventoryService.createKit(extractActor(req), req.body);
      res.status(201).json({ kit });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.delete('/kits/:id', (req, res) => {
    try {
      const result = inventoryService.deleteKit(extractActor(req), req.params.id);
      res.json(result);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Alertas, Auditoría e Historial de Comandos (Observer + Command) ---
  router.get('/alerts', (req, res) => {
    try {
      const includeResolved = req.query.includeResolved === 'true';
      res.json({ alerts: inventoryService.listAlerts(extractActor(req), includeResolved) });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get('/audit/logs', (req, res) => {
    try {
      res.json({ logs: inventoryService.listAuditLogs(extractActor(req)) });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.get('/audit/commands', (req, res) => {
    try {
      res.json({ commands: inventoryService.listCommandHistory(extractActor(req)) });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Exportación de Reportes (Bridge + Adapter) ---
  router.get('/reports/export', async (req, res) => {
    try {
      const rawType = String(req.query.type ?? 'general').toLowerCase();
      const rawFormat = String(req.query.format ?? 'excel').toLowerCase();

      const reportType: ReportType =
        rawType === 'low-stock' || rawType === 'valued' ? rawType : 'general';
      const formatType: ReportFormatType = rawFormat === 'csv' ? 'csv' : 'excel';

      const exported = await inventoryService.exportInventory(
        extractActor(req),
        reportType,
        formatType
      );

      res.setHeader('Content-Type', exported.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
      res.setHeader('Content-Length', String(exported.buffer.length));
      res.send(exported.buffer);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  // --- Configuración Global (Singleton) & Reset ---
  router.get('/config', (req, res) => {
    try {
      res.json({ config: inventoryService.getConfig(extractActor(req)) });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.put('/config', (req, res) => {
    try {
      const config = inventoryService.updateConfig(extractActor(req), req.body);
      res.json({ config });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  router.post('/admin/reset-seed', (req, res) => {
    try {
      const summary = inventoryService.resetSeedData(extractActor(req));
      res.json({ message: 'Datos semilla restaurados correctamente.', summary });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  return router;
}
