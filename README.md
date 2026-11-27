# TechStock — Sistema de Gestión de Inventario Tecnológico (15 Patrones de Diseño GoF)

**TechStock** es una aplicación Full-Stack Orientada a Objetos diseñada para administrar el inventario de una tienda tecnológica (Laptops, Periféricos, Componentes y Accesorios), aplicando de forma explícita, real y conectada **15 Patrones de Diseño Gang of Four (GoF)** en el Backend y exponiendo acciones visibles en el Frontend para probar cada patrón en tiempo real.

---

## Stack Tecnológico

- **Backend:** Node.js + TypeScript + Express (POO estricta con clases abstractas, interfaces y encapsulación) + Persistencia JSON mediante capa Singleton/Repositorio (`backend/data/inventory.json`) + `multer` (carga de fotos) + `exceljs` (exportación real `.xlsx`).
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + `lucide-react`.
- **Exportación:** Archivos **Excel reales (`.xlsx`)** con estilos, formato de moneda, autofiltros y fila de resumen, además de **CSV (`.csv`)** UTF-8 con BOM descargables directamente desde la interfaz.

---

## Estructura del Proyecto (Monorepo)

```text
.
├── package.json                     # Scripts globales del monorepo
├── README.md                        # Guía de instalación, uso y endpoints
├── PATTERNS.md                      # Documentación técnica, tabla de 15 patrones y diagramas UML Mermaid
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/images/               # Ilustraciones SVG locales para los productos semilla
│   ├── uploads/                     # Imágenes subidas por el usuario (multer)
│   ├── data/                        # Persistencia automática inventory.json
│   └── src/
│       ├── app.ts                   # Ensamblaje de Express + los 15 patrones GoF
│       ├── server.ts                # Punto de entrada HTTP (puerto 3001)
│       ├── models/
│       │   ├── types.ts             # Tipos, DTOs y contratos del dominio
│       │   └── Product.ts           # Jerarquía POO: Product, Laptop, Peripheral, Component, Accessory
│       ├── patterns/
│       │   ├── creational/
│       │   │   ├── singleton/       # DatabaseConfig.ts, InventoryStore.ts
│       │   │   ├── factory-method/  # ProductFactory.ts
│       │   │   ├── abstract-factory/# ProductLineFactory.ts
│       │   │   ├── builder/         # ProductBuilder.ts
│       │   │   └── prototype/       # IPrototype.ts
│       │   ├── structural/
│       │   │   ├── adapter/         # IReportExporter.ts, ExcelExporterAdapter.ts, CsvExporterAdapter.ts
│       │   │   ├── bridge/          # ReportFormat.ts, InventoryReport.ts
│       │   │   ├── composite/       # InventoryItem.ts
│       │   │   ├── decorator/       # ProductDecorator.ts
│       │   │   ├── facade/          # InventoryFacade.ts
│       │   │   └── proxy/           # InventoryAccessProxy.ts
│       │   └── behavioral/
│       │       ├── command/         # InventoryCommand.ts
│       │       ├── memento/         # ProductMemento.ts
│       │       ├── observer/        # InventoryObserver.ts
│       │       └── state/           # StockState.ts
│       ├── routes/inventoryRoutes.ts
│       ├── seed/seedData.ts         # 8 productos tecnológicos + 1 Combo Gamer
│       └── utils/upload.ts          # Configuración Multer para subida de fotos
└── frontend/
    ├── package.json
    ├── vite.config.ts               # Proxy /api, /uploads, /images -> http://localhost:3001
    └── src/
        ├── App.tsx                  # Dashboard principal, sidebar, Role Switcher y modales
        ├── api/client.ts            # Cliente REST tipado con cabeceras de rol (Proxy)
        ├── types/inventory.ts
        └── components/
            ├── KpiCards.tsx
            ├── AlertsPanel.tsx
            ├── ProductCard.tsx
            ├── ProductTable.tsx
            ├── ProductFormModal.tsx
            ├── ProductDetailModal.tsx
            ├── StockModal.tsx
            ├── CloneModal.tsx
            ├── ServicesModal.tsx
            ├── KitsSection.tsx
            ├── AuditSection.tsx
            ├── ExportModal.tsx
            ├── PatternsAndConfigSection.tsx
            └── ToastBanner.tsx
```

---

## Instalación y Ejecución Local

### Requisitos Previos
- **Node.js 18 o superior** (verificado con Node `v22.13.1` y npm `10.9.2`).

### 1. Instalar dependencias (Backend + Frontend)

Desde la raíz del proyecto:

```bash
npm run install:all
```

*(O individualmente: `cd backend && npm install` y `cd frontend && npm install`)*

### 2. Iniciar en modo desarrollo

Abre **dos terminales** en la raíz del proyecto:

**Terminal 1 — Backend (puerto `3001`):**
```bash
npm run dev:backend
```

**Terminal 2 — Frontend (puerto `5173`):**
```bash
npm run dev:frontend
```

Luego abre en tu navegador: **http://localhost:5173**

### 3. Compilar para producción

```bash
npm run build
```

---

## Datos Semilla Iniciales (Seed)

Al iniciar por primera vez (o al pulsar **"Restaurar Datos Semilla"** en *15 Patrones & Config*), el sistema carga automáticamente:

| Código | Producto | Categoría | Gama | Precio Base | Stock / Mín. | Estado Inicial |
| :--- | :--- | :--- | :--- | ---: | :---: | :--- |
| `LAP-001` | ASUS ROG Strix G16 (2025) | Laptop | Gamer | $1,699.00 | 8 / 3 | Disponible *(+Garantía 24m)* |
| `LAP-002` | Lenovo ThinkPad X1 Carbon Gen 12 | Laptop | Oficina | $1,549.00 | 2 / 4 | **Stock Bajo** *(+Inst. Software)* |
| `PER-001` | Logitech G Pro X Superlight 2 | Periférico | Gamer | $159.00 | 14 / 5 | Disponible |
| `PER-002` | Keychron K8 Pro Mecánico RGB | Periférico | Gamer | $129.00 | 3 / 5 | **Stock Bajo** |
| `PER-003` | Dell UltraSharp 27" 4K USB-C Hub | Periférico | Oficina | $629.00 | 6 / 3 | Disponible |
| `CMP-001` | NVIDIA GeForce RTX 4070 Ti Super 16GB | Componente | Gamer | $849.00 | 0 / 3 | **Agotado** |
| `CMP-002` | Samsung 990 PRO NVMe M.2 2TB | Componente | Oficina | $179.00 | 12 / 4 | Disponible |
| `ACC-001` | HyperX Cloud III Wireless DTS:X | Accesorio | Gamer | $169.00 | 9 / 3 | Disponible |

Además incluye **1 Combo Gamer (Composite)**:
- **`KIT-001` — Combo Pro Gamer Ultimate** (10% descuento): agrupa `LAP-001` + `PER-001` + `PER-002` + `ACC-001`, calculando dinámicamente su precio descontado y su stock máximo armable (`3` combos iniciales).

---

## Endpoints REST del Backend (`/api`)

Todos los endpoints leen la cabecera `X-User-Role: ADMIN | SELLER` evaluada por `InventoryAccessProxy`.

| Método | Ruta | Rol | Descripción y Patrones Aplicados |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Todos | Estado del servidor API |
| `GET` | `/api/dashboard` | Todos | KPIs en tiempo real, resumen por categoría y telemetría de patrones (**Facade + Singleton**) |
| `GET` | `/api/products` | Todos | Lista productos con estado (**State**), precio decorado (**Decorator**) y ficha/etiqueta (**Abstract Factory**) |
| `POST` | `/api/products` | **Admin** | Registra un producto paso a paso (**Proxy + Facade + Builder + Factory Method + Abstract Factory + Observer**) |
| `PUT` | `/api/products/:id` | **Admin** | Edita un producto guardando snapshot previo (**Proxy + Memento + Command + Observer**) |
| `DELETE` | `/api/products/:id` | **Admin** | Elimina un producto (**Proxy + Facade + Observer**) |
| `POST` | `/api/products/:id/stock` | Admin (IN) / Todos (OUT) | Registra entrada (`IN`) o salida (`OUT`) validando estado (**Proxy + State + Command + Observer**) |
| `PATCH` | `/api/products/:id/discontinue` | **Admin** | Cambia a `DiscontinuedState` o reactiva (**Proxy + State + Memento**) |
| `POST` | `/api/products/:id/clone` | **Admin** | Clona un producto generando una variante con nuevo código (**Prototype + Factory Method**) |
| `GET` | `/api/products/:id/history` | Todos | Lista instantáneas guardadas (**Memento**) |
| `POST` | `/api/products/:id/undo` | **Admin** | Deshace la última edición restaurando el snapshot anterior (**Memento**) |
| `POST` | `/api/products/:id/services` | Todos | Añade servicio extra (`EXTENDED_WARRANTY`, `SOFTWARE_SETUP`, `PRIORITY_SUPPORT`) (**Decorator**) |
| `DELETE` | `/api/products/:id/services/:service` | **Admin** | Retira un servicio extra (**Decorator + Proxy**) |
| `POST` | `/api/uploads` | **Admin** | Sube archivo de imagen de producto (`multipart/form-data`, campo `image`) |
| `GET` | `/api/kits` | Todos | Lista combos con precio y stock armable calculado en vivo (**Composite**) |
| `POST` | `/api/kits` | **Admin** | Crea un nuevo Combo / Kit agrupando productos (**Composite + Proxy**) |
| `DELETE` | `/api/kits/:id` | **Admin** | Elimina un Combo / Kit (**Composite + Proxy**) |
| `GET` | `/api/alerts` | Todos | Alertas activas generadas por `DashboardAlertObserver` (**Observer**) |
| `GET` | `/api/audit/logs` | Todos | Bitácora de auditoría registrada por `AuditLogObserver` (**Observer**) |
| `GET` | `/api/audit/commands` | Todos | Historial de comandos ejecutados por `CommandInvoker` (**Command**) |
| `GET` | `/api/reports/export?type=general\|low-stock\|valued&format=excel\|csv` | Todos | Descarga archivo `.xlsx` o `.csv` real (**Bridge + Adapter**) |
| `GET` / `PUT` | `/api/config` | Todos / **Admin** | Consulta o actualiza configuración global (**Singleton: `DatabaseConfig`**) |
| `POST` | `/api/admin/reset-seed` | **Admin** | Restaura los datos semilla iniciales |

---

## Cómo Probar los 15 Patrones desde la Interfaz

1. **Singleton:** Ve a **15 Patrones & Config**, cambia la moneda (`USD` → `PEN`) o el stock mínimo por defecto y guarda; toda la aplicación y los reportes reflejarán el cambio al instante.
2. **Factory Method + Abstract Factory + Builder:** Haz clic en **+ Nuevo Producto**. Cambia la categoría (verás cambiar el prefijo `LAP-` / `PER-` / `CMP-` / `ACC-`) y alterna entre **Gamer** y **Oficina** para ver la vista previa en vivo de la Ficha Técnica y Etiqueta generadas por la Abstract Factory. Puedes subir una foto real o usar una URL.
3. **Prototype:** En cualquier tarjeta de producto pulsa **Clonar**, asigna el nuevo código sugerido y crea una variante instantánea.
4. **Decorator:** Pulsa **Servicios** en un producto, activa *Garantía Extendida* o *Instalación de Software* y observa la cadena decorada y el precio recalculado.
5. **Composite:** Entra a **Combos / Kits**, revisa el `Combo Pro Gamer Ultimate` (o arma uno nuevo) y luego descuenta stock de `PER-002` en el Dashboard para ver cómo el stock armable del combo se recalcula automáticamente.
6. **State + Command + Observer:** Pulsa **Stock +/-** en `CMP-001` (Agotado) e intenta registrar una salida: `OutOfStockState` bloqueará la operación. Luego descuenta unidades de un producto disponible hasta bajar del mínimo para disparar la alerta en tiempo real del `DashboardAlertObserver` y ver el comando registrado en **Auditoría & Comandos**.
7. **Memento (Undo):** Pulsa **Editar** en cualquier producto, modifica su nombre o precio y guarda. Luego haz clic en **Deshacer (1)** para restaurar exactamente el estado anterior.
8. **Proxy (RBAC):** Cambia el selector superior de **Admin** a **Vendedor**. Intenta crear, editar, clonar o eliminar un producto: `InventoryAccessProxy` devolverá HTTP `403` bloqueando la acción y registrando `ACCESS_DENIED` en la auditoría, mientras sigue permitiendo registrar ventas (`OUT`) y exportar reportes.
9. **Bridge + Adapter:** Pulsa **Exportar Excel/CSV**, combina cualquiera de los 3 reportes (`General`, `Stock Bajo`, `Valorizado`) con `Excel (.xlsx)` o `CSV (.csv)` y descarga el archivo real.

Para la documentación técnica detallada de arquitectura y diagramas UML, consulta [PATTERNS.md](./PATTERNS.md).
#   P r o y e c t o P a t r o n e s 
 
 