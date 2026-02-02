import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogPost } from './entities/blog-post.entity';
import { MigrationService } from './migration.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogPost]),
    CommonModule,
  ],
  controllers: [BlogController],
  providers: [BlogService, MigrationService],
  exports: [BlogService, MigrationService],
})
export class BlogModule {}