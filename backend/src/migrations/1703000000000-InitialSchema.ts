import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1703000000000 implements MigrationInterface {
    name = 'InitialSchema1703000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` varchar(36) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`password\` varchar(255) NOT NULL,
                \`role\` varchar(255) NOT NULL DEFAULT 'admin',
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create blog table
        await queryRunner.query(`
            CREATE TABLE \`blog\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`content\` text NOT NULL,
                \`excerpt\` varchar(255) NULL,
                \`featuredImage\` varchar(255) NULL,
                \`tags\` text NULL,
                \`status\` varchar(255) NOT NULL DEFAULT 'published',
                \`slug\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`publishedAt\` datetime NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create music table
        await queryRunner.query(`
            CREATE TABLE \`music\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` text NULL,
                \`audioUrl\` varchar(255) NULL,
                \`coverArt\` varchar(255) NULL,
                \`genre\` varchar(255) NULL,
                \`duration\` int NULL,
                \`playCount\` int NOT NULL DEFAULT '0',
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`releaseDate\` datetime NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create video table
        await queryRunner.query(`
            CREATE TABLE \`video\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` text NULL,
                \`youtubeUrl\` varchar(255) NOT NULL,
                \`youtubeId\` varchar(255) NULL,
                \`thumbnail\` varchar(255) NULL,
                \`duration\` int NULL,
                \`viewCount\` int NOT NULL DEFAULT '0',
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        // Create audio table
        await queryRunner.query(`
            CREATE TABLE \`audio\` (
                \`id\` varchar(36) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`description\` text NULL,
                \`soundcloudUrl\` varchar(255) NOT NULL,
                \`soundcloudId\` varchar(255) NULL,
                \`artwork\` varchar(255) NULL,
                \`duration\` int NULL,
                \`playCount\` int NOT NULL DEFAULT '0',
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`audio\``);
        await queryRunner.query(`DROP TABLE \`video\``);
        await queryRunner.query(`DROP TABLE \`music\``);
        await queryRunner.query(`DROP TABLE \`blog\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}