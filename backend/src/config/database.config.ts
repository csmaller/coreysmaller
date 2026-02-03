import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { BlogPost } from '../blog/entities/blog-post.entity';
import { MusicTrack } from '../music/entities/music-track.entity';
import { VideoContent } from '../video/entities/video-content.entity';
import { AudioContent } from '../audio/entities/audio-content.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    
    // Always use MySQL for now
    const sslConfig = this.configService.get<string>('DB_SSL', 'false');
    
    return {
      type: 'mysql',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 3306),
      username: this.configService.get<string>('DB_USERNAME', 'root'),
      password: this.configService.get<string>('DB_PASSWORD', ''),
      database: this.configService.get<string>('DB_DATABASE', 'coreysmaller_db'),
      entities: [User, BlogPost, MusicTrack, VideoContent, AudioContent],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: this.configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
      logging: this.configService.get<string>('DB_LOGGING', 'false') === 'true',
      ssl: sslConfig === 'true' ? true : false,
      extra: {
        charset: 'utf8mb4_unicode_ci',
      },
    };
  }
}

// Export DataSource for TypeORM CLI
const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'coreysmaller_db',
  entities: [User, BlogPost, MusicTrack, VideoContent, AudioContent],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;