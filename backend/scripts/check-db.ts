import { AppDataSource } from '../src/config/database.config';

async function checkDatabaseConnection() {
  try {
    console.log('Attempting to connect to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection successful!');
    console.log('Database:', AppDataSource.options.database);
    
    // Type-safe access to MySQL-specific options
    const options = AppDataSource.options as any;
    if (options.host) {
      console.log('Host:', options.host);
    }
    if (options.port) {
      console.log('Port:', options.port);
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error((error as Error).message);
    process.exit(1);
  }
}

checkDatabaseConnection();