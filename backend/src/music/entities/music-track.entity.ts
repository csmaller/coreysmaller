import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';

@Entity('music')
@Index(['genre', 'releaseDate'])
@Index(['playCount'])
@Check(`"title" != ''`)
@Check(`"duration" IS NULL OR "duration" > 0`)
@Check(`"playCount" >= 0`)
export class MusicTrack {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, length: 2048 })
  audioUrl: string;

  @Column({ nullable: true, length: 2048 })
  coverArt: string;

  @Column({ nullable: true, length: 50 })
  genre: string;

  @Column({ nullable: true, type: 'int', unsigned: true })
  duration: number;

  @Column({ default: 0, type: 'int', unsigned: true })
  playCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  releaseDate: Date;
}