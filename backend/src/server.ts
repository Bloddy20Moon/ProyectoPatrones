import { createApp } from './app';

const PORT = Number(process.env.PORT ?? 3001);
const app = createApp();

app.listen(PORT, () => {
  console.log(`\n=======================================================`);
  console.log(`  TechStock API ejecutándose en http://localhost:${PORT}`);
  console.log(`  15 Patrones de Diseño GoF activos y conectados`);
  console.log(`=======================================================\n`);
});
