#!/usr/bin/env node
/**
 * Automated Database Backup Script
 * 
 * This script:
 * 1. Creates a database backup using mysqldump
 * 2. Compresses the backup with gzip
 * 3. Uploads to S3 with timestamp naming
 * 4. Deletes backups older than 30 days
 * 
 * Schedule: Daily at 12:00 AM WIB (5:00 PM UTC previous day)
 * 
 * Copyright © Compawnion Jadi Berkat
 * IP: Eddie Amintohir
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, unlinkSync } from 'fs';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const execAsync = promisify(exec);

// Configuration
const BACKUP_BUCKET = 'compawnion-approval-forms';
const BACKUP_PREFIX = 'database-backups/';
const RETENTION_DAYS = 30;
const AWS_REGION = 'us-west-2';

// Parse DATABASE_URL from environment
// Format: mysql://user:password@host:port/database
function parseDatabaseUrl(url) {
  const match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

// Create S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // 2026-02-23T03-30-00
  const backupFile = `/tmp/backup-${timestamp}.sql`;
  const compressedFile = `${backupFile}.gz`;

  try {
    console.log(`[${new Date().toISOString()}] Starting database backup...`);

    // Get database connection details
    const databaseUrl = process.env.DATABASE_URL || process.env.CUSTOM_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL or CUSTOM_DATABASE_URL not found in environment');
    }

    const dbConfig = parseDatabaseUrl(databaseUrl);
    console.log(`[${new Date().toISOString()}] Backing up database: ${dbConfig.database} from ${dbConfig.host}`);

    // Create mysqldump backup
    const dumpCommand = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.password}' ${dbConfig.database} > ${backupFile}`;
    await execAsync(dumpCommand);
    console.log(`[${new Date().toISOString()}] Database dump created: ${backupFile}`);

    // Compress backup
    await execAsync(`gzip ${backupFile}`);
    console.log(`[${new Date().toISOString()}] Backup compressed: ${compressedFile}`);

    // Upload to S3
    const fileContent = readFileSync(compressedFile);
    const s3Key = `${BACKUP_PREFIX}backup-${timestamp}.sql.gz`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/gzip',
      Metadata: {
        'backup-date': new Date().toISOString(),
        'database': dbConfig.database,
      },
    }));

    console.log(`[${new Date().toISOString()}] ✅ Backup uploaded to S3: s3://${BACKUP_BUCKET}/${s3Key}`);

    // Clean up local file
    unlinkSync(compressedFile);
    console.log(`[${new Date().toISOString()}] Local backup file deleted`);

    return s3Key;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Backup failed:`, error.message);
    throw error;
  }
}

async function deleteOldBackups() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for backups older than ${RETENTION_DAYS} days...`);

    // List all backups
    const listResponse = await s3Client.send(new ListObjectsV2Command({
      Bucket: BACKUP_BUCKET,
      Prefix: BACKUP_PREFIX,
    }));

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log(`[${new Date().toISOString()}] No backups found in S3`);
      return;
    }

    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const obj of listResponse.Contents) {
      const age = now - obj.LastModified.getTime();
      if (age > retentionMs) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: BACKUP_BUCKET,
          Key: obj.Key,
        }));
        console.log(`[${new Date().toISOString()}] Deleted old backup: ${obj.Key} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);
        deletedCount++;
      }
    }

    if (deletedCount === 0) {
      console.log(`[${new Date().toISOString()}] No old backups to delete`);
    } else {
      console.log(`[${new Date().toISOString()}] ✅ Deleted ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Failed to delete old backups:`, error.message);
    // Don't throw - backup was successful, cleanup failure is not critical
  }
}

// Main execution
async function main() {
  try {
    console.log(`[${new Date().toISOString()}] ========================================`);
    console.log(`[${new Date().toISOString()}] Database Backup Script Started`);
    console.log(`[${new Date().toISOString()}] ========================================`);

    await createBackup();
    await deleteOldBackups();

    console.log(`[${new Date().toISOString()}] ========================================`);
    console.log(`[${new Date().toISOString()}] Database Backup Completed Successfully`);
    console.log(`[${new Date().toISOString()}] ========================================`);
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ========================================`);
    console.error(`[${new Date().toISOString()}] Database Backup Failed`);
    console.error(`[${new Date().toISOString()}] ========================================`);
    process.exit(1);
  }
}

main();
