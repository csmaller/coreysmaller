import { DataSource } from 'typeorm';
import { User } from './src/auth/entities/user.entity';
import { BlogPost } from './src/blog/entities/blog-post.entity';
import { MusicTrack } from './src/music/entities/music-track.entity';
import { VideoContent } from './src/video/entities/video-content.entity';
import { AudioContent } from './src/audio/entities/audio-content.entity';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'coreysmaller_db',
  entities: [User, BlogPost, MusicTrack, VideoContent, AudioContent],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false,
});