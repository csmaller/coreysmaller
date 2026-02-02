import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';

@Entity('video')
@Index(['youtubeId'], { unique: true, where: 'youtubeId IS NOT NULL' })
@Index(['viewCount'])
@Check(`"title" != ''`)
@Check(`"youtubeUrl" LIKE 'https://www.youtube.com/%' OR "youtubeUrl" LIKE 'https://youtu.be/%'`)
@Check(`"duration" IS NULL OR "duration" > 0`)
@Check(`"viewCount" >= 0`)
export class VideoContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 2048 })
  youtubeUrl: string;

  @Column({ nullable: true, length: 20 })
  youtubeId: string;

  @Column({ nullable: true, length: 2048 })
  thumbnail: string;

  @Column({ nullable: true, type: 'int', unsigned: true })
  duration: number;

  @Column({ default: 0, type: 'int', unsigned: true })
  viewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}