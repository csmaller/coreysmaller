import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertToAutoIncrementIds1734568100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);

    // Blog table
    await queryRunner.query(`ALTER TABLE blog DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE blog DROP COLUMN id`);
    await queryRunner.query(`ALTER TABLE blog ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST`);

    // Users table (if exists)
    const userTableExists = await queryRunner.hasTable('users');
    if (userTableExists) {
      await queryRunner.query(`ALTER TABLE users DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE users DROP COLUMN id`);
      await queryRunner.query(`ALTER TABLE users ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST`);
    }

    // Music table (if exists)
    const musicTableExists = await queryRunner.hasTable('music');
    if (musicTableExists) {
      await queryRunner.query(`ALTER TABLE music DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE music DROP COLUMN id`);
      await queryRunner.query(`ALTER TABLE music ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST`);
    }

    // Video table (if exists)
    const videoTableExists = await queryRunner.hasTable('video');
    if (videoTableExists) {
      await queryRunner.query(`ALTER TABLE video DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE video DROP COLUMN id`);
      await queryRunner.query(`ALTER TABLE video ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST`);
    }

    // Audio table (if exists)
    const audioTableExists = await queryRunner.hasTable('audio');
    if (audioTableExists) {
      await queryRunner.query(`ALTER TABLE audio DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE audio DROP COLUMN id`);
      await queryRunner.query(`ALTER TABLE audio ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST`);
    }

    // Re-enable foreign key checks
    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0`);

    // Blog table - revert to UUID
    await queryRunner.query(`ALTER TABLE blog DROP PRIMARY KEY`);
    await queryRunner.query(`ALTER TABLE blog DROP COLUMN id`);
    await queryRunner.query(`ALTER TABLE blog ADD COLUMN id VARCHAR(36) PRIMARY KEY FIRST`);

    // Users table (if exists)
    const userTableExists = await queryRunner.hasTable('users');
    if (userTableExists) {
      await queryRunner.query(`ALTER TABLE users DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE users DROP COLUMN id`);
      await queryRunner.query(`ALTER TABLE users ADD COLUMN id VARCHAR(36) PRIMARY KEY FIRST`);
    }

    // Music table (if exists)
    const musicTableExists = await queryRunner.hasTable('music');
    if (musicTableExists) {
      await queryRunner.query(`ALTER TABLE music DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE music DROP COLUMN id`);
      await queryRunner.query(`ALTER TABLE music ADD COLUMN id VARCHAR(36) PRIMARY KEY FIRST`);
    }

    // Video table (if exists)
    const videoTableExists = await queryRunner.hasTable('video');
    if (videoTableExists) {
      await queryRunner.query(`ALTER TABLE video DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE video DROP COLUMN id`);
      await queryRunner.query(`ALTER TABLE video ADD COLUMN id VARCHAR(36) PRIMARY KEY FIRST`);
    }

    // Audio table (if exists)
    const audioTableExists = await queryRunner.hasTable('audio');
    if (audioTableExists) {
      await queryRunner.query(`ALTER TABLE audio DROP PRIMARY KEY`);
      await queryRunner.query(`ALTER TABLE audio DROP COLUMN id`);
      await queryRunner.query(`ALTER TABLE audio ADD COLUMN id VARCHAR(36) PRIMARY KEY FIRST`);
    }

    // Re-enable foreign key checks
    await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1`);
  }
}