import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class EncryptUserPasswords1734568200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all users with plain text passwords
    const users = await queryRunner.query(`SELECT id, password FROM users`);
    
    const saltRounds = 10;
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (!user.password.startsWith('$2b$')) {
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        await queryRunner.query(
          `UPDATE users SET password = ? WHERE id = ?`,
          [hashedPassword, user.id]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot reverse password encryption for security reasons
    // This migration is irreversible
    console.log('Cannot reverse password encryption - this migration is irreversible');
  }
}