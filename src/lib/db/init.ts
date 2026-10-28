import { seedDatabase } from './seed';

async function main() {
  console.log('Initializing Tectranz LMS Database...');
  await seedDatabase();
  console.log('Database successfully initialized and seeded!');
}

main().catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
