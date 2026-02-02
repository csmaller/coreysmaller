import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';

@Entity('audio')
@Index(['soundcloudId'], { unique: true, where: 'soundcloudId IS NOT NULL' })
@Index(['playCount'])
@Check(`"title" != ''`)
@Check(`"soundcloudUrl" LIKE 'https://soundcloud.com/%'`)
@Check(`"duration" IS NULL OR "duration" > 0`)
@Check(`"playCount" >= 0`)
export class AudioContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 2048 })
  soundcloudUrl: string;

  @Column({ nullable: true, length: 100 })
  soundcloudId: string;

  @Column({ nullable: true, length: 2048 })
  artwork: string;

  @Column({ nullable: true, type: 'int', unsigned: true })
  duration: number;

  @Column({ default: 0, type: 'int', unsigned: true })
  playCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}