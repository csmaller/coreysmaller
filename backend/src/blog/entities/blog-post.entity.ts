import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';

@Entity('blog')
@Index(['status', 'publishedAt'])
@Index(['slug'], { unique: true, where: 'slug IS NOT NULL' })
@Check(`"title" != ''`)
@Check(`"content" != ''`)
@Check(`"status" IN ('draft', 'published', 'archived')`)
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true, length: 500 })
  excerpt: string;

  @Column({ nullable: true, length: 2048 })
  featuredImage: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ 
    type: 'varchar',
    length: 20,
    default: 'published' 
  })
  status: 'draft' | 'published' | 'archived';

  @Column({ nullable: true, length: 100 })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  publishedAt: Date;
}