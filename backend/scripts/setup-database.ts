import { DataSource } from 'typeorm';
import { User } from '../src/auth/entities/user.entity';
import { BlogPost } from '../src/blog/entities/blog-post.entity';
import { MusicTrack } from '../src/music/entities/music-track.entity';
import { VideoContent } from '../src/video/entities/video-content.entity';
import { AudioContent } from '../src/audio/entities/audio-content.entity';
import * as bcrypt from 'bcrypt';

async function setupDatabase() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'coreysmaller_db',
    entities: [User, BlogPost, MusicTrack, VideoContent, AudioContent],
    migrations: ['src/migrations/*.ts'],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('🔄 Initializing database connection...');
    await dataSource.initialize();
    console.log('✅ Database connection established');

    console.log('🔄 Running migrations...');
    await dataSource.runMigrations();
    console.log('✅ Migrations completed');

    // Create default admin user if it doesn't exist
    const userRepository = dataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email: 'admin@coreysmaller.com' } });
    
    if (!existingUser) {
      console.log('🔄 Creating default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = userRepository.create({
        email: 'admin@coreysmaller.com',
        password: hashedPassword,
        role: 'admin',
      });
      await userRepository.save(adminUser);
      console.log('✅ Default admin user created (email: admin@coreysmaller.com, password: admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

setupDatabase();