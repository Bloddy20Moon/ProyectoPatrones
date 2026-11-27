import { ActorContext } from '../models/types';
import { InventoryFacade } from '../patterns/structural/facade/InventoryFacade';

const SYSTEM_ACTOR: ActorContext = {
  role: 'ADMIN',
  actorName: 'Sistema (Seed)',
};

/**
 * Puebla TechStock con 8 productos tecnológicos realistas (cubriendo las 4 categorías,
 * ambas líneas Gamer/Oficina y estados Disponible, Stock Bajo y Agotado)
 * más 1 Combo Gamer (Composite).
 */
export function seedInitialInventory(facade: InventoryFacade): void {
  const rogLaptop = facade.registerProduct(SYSTEM_ACTOR, {
    code: 'LAP-001',
    name: 'ASUS ROG Strix G16 (2025)',
    brand: 'ASUS ROG',
    category: 'LAPTOP',
    line: 'GAMER',
    price: 1699.0,
    stock: 8,
    minStock: 3,
    supplier: 'ASUS Latam Distribution',
    imageUrl: '/images/laptop-gamer.svg',
    services: ['EXTENDED_WARRANTY'],
    specifications: {
      Procesador: 'Intel Core i9-14900HX',
      RAM: '32GB DDR5 5600MHz',
      Almacenamiento: '1TB NVMe PCIe 4.0',
      Pantalla: '16" QHD+ 240Hz ROG Nebula',
      GPU: 'NVIDIA RTX 4070 8GB',
    },
  });

  facade.registerProduct(SYSTEM_ACTOR, {
    code: 'LAP-002',
    name: 'Lenovo ThinkPad X1 Carbon Gen 12',
    brand: 'Lenovo',
    category: 'LAPTOP',
    line: 'OFFICE',
    price: 1549.0,
    stock: 2,
    minStock: 4,
    supplier: 'Lenovo Enterprise Partners',
    imageUrl: '/images/laptop-office.svg',
    services: ['SOFTWARE_SETUP'],
    specifications: {
      Procesador: 'Intel Core Ultra 7 155U',
      RAM: '16GB LPDDR5X',
      Almacenamiento: '512GB NVMe Opal 2.0',
      Pantalla: '14" 2.8K OLED Anti-glare',
      Peso: '1.09 kg Chasis Fibra de Carbono',
    },
  });

  const superlightMouse = facade.registerProduct(SYSTEM_ACTOR, {
    code: 'PER-001',
    name: 'Logitech G Pro X Superlight 2',
    brand: 'Logitech G',
    category: 'PERIPHERAL',
    line: 'GAMER',
    price: 159.0,
    stock: 14,
    minStock: 5,
    supplier: 'Logitech Gaming Hub',
    imageUrl: '/images/mouse-gamer.svg',
    specifications: {
      Conectividad: 'LIGHTSPEED Wireless 4KHz',
      Sensor: 'HERO 2 32,000 DPI',
      Switches: 'LIGHTFORCE Híbridos Óptico-Mecánicos',
      Peso: '60 gramos ultraligero',
    },
  });

  const keychronKeyboard = facade.registerProduct(SYSTEM_ACTOR, {
    code: 'PER-002',
    name: 'Keychron K8 Pro Mecánico RGB',
    brand: 'Keychron',
    category: 'PERIPHERAL',
    line: 'GAMER',
    price: 129.0,
    stock: 3,
    minStock: 5,
    supplier: 'Keychron Global',
    imageUrl: '/images/keyboard-gamer.svg',
    specifications: {
      Conectividad: 'Bluetooth 5.1 / USB-C',
      Switches: 'Gateron G Pro Red Hot-Swappable',
      Formato: 'TKL 80% Aluminio CNC',
      Firmware: 'QMK / VIA Programable',
    },
  });

  facade.registerProduct(SYSTEM_ACTOR, {
    code: 'PER-003',
    name: 'Dell UltraSharp 27" 4K USB-C Hub',
    brand: 'Dell',
    category: 'PERIPHERAL',
    line: 'OFFICE',
    price: 629.0,
    stock: 6,
    minStock: 3,
    supplier: 'Dell Commercial Peru',
    imageUrl: '/images/monitor-office.svg',
    specifications: {
      Panel: 'IPS Black 4K UHD (3840x2160)',
      Color: '98% DCI-P3 calibrado de fábrica',
      Interfaz: 'USB-C 90W PD + RJ45 + KVM',
      Ergonomía: 'Ajuste altura, pivote y giro',
    },
  });

  facade.registerProduct(SYSTEM_ACTOR, {
    code: 'CMP-001',
    name: 'NVIDIA GeForce RTX 4070 Ti Super 16GB',
    brand: 'MSI Gaming',
    category: 'COMPONENT',
    line: 'GAMER',
    price: 849.0,
    stock: 0,
    minStock: 3,
    supplier: 'MSI Components Wholesale',
    imageUrl: '/images/gpu-gamer.svg',
    specifications: {
      Memoria: '16GB GDDR6X 256-bit',
      Interfaz: 'PCI Express 4.0 x16',
      Refrigeración: 'TRI FROZR 3 Triple Ventilador',
      TDP: '285W (Fuente recomendada 700W)',
    },
  });

  facade.registerProduct(SYSTEM_ACTOR, {
    code: 'CMP-002',
    name: 'Samsung 990 PRO NVMe M.2 2TB',
    brand: 'Samsung',
    category: 'COMPONENT',
    line: 'OFFICE',
    price: 179.0,
    stock: 12,
    minStock: 4,
    supplier: 'Samsung Memory Distributors',
    imageUrl: '/images/ssd-office.svg',
    specifications: {
      Interfaz: 'PCIe Gen 4.0 x4, NVMe 2.0',
      Capacidad: '2TB V-NAND 3-bit MLC',
      Lectura: 'Hasta 7,450 MB/s',
      Escritura: 'Hasta 6,900 MB/s',
    },
  });

  const hyperxHeadset = facade.registerProduct(SYSTEM_ACTOR, {
    code: 'ACC-001',
    name: 'HyperX Cloud III Wireless DTS:X',
    brand: 'HyperX',
    category: 'ACCESSORY',
    line: 'GAMER',
    price: 169.0,
    stock: 9,
    minStock: 3,
    supplier: 'HP / HyperX Latam',
    imageUrl: '/images/headset-gamer.svg',
    specifications: {
      Conectividad: '2.4GHz Wireless USB-C / USB-A',
      Audio: 'Drivers 53mm + DTS Headphone:X',
      Batería: 'Hasta 120 horas de autonomía',
      Compatibilidad: 'PC, PS5, Nintendo Switch',
    },
  });

  // 1 Combo Gamer (Patrón Composite: ProductKit compuesto por 4 SingleProduct)
  facade.createKit(SYSTEM_ACTOR, {
    code: 'KIT-001',
    name: 'Combo Pro Gamer Ultimate',
    description:
      'Estación completa de esports: Laptop ASUS ROG Strix G16 + Mouse Superlight 2 + Teclado Keychron K8 Pro + Audífonos HyperX Cloud III con 10% de descuento por paquete.',
    line: 'GAMER',
    discountPercent: 10,
    imageUrl: '/images/combo-gamer.svg',
    items: [
      { productId: rogLaptop.id, quantity: 1 },
      { productId: superlightMouse.id, quantity: 1 },
      { productId: keychronKeyboard.id, quantity: 1 },
      { productId: hyperxHeadset.id, quantity: 1 },
    ],
  });
}
