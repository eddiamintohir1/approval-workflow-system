# Automated Database Backup System

**Copyright © Compawnion Jadi Berkat**  
**IP: Eddie Amintohir**

## Overview

This automated backup system creates daily database backups, uploads them to AWS S3, and maintains a 30-day retention policy.

## Features

- **Automated Daily Backups**: Runs every day at 12:00 AM WIB (5:00 PM UTC)
- **Compression**: All backups are gzip-compressed to save storage space
- **S3 Storage**: Backups are uploaded to `s3://compawnion-approval-forms/database-backups/`
- **30-Day Retention**: Automatically deletes backups older than 30 days
- **Logging**: All backup operations are logged to `logs/backup.log`

## Files

- **`backup-database.mjs`**: Main backup script (Node.js ES module)
- **`setup-backup-cron.sh`**: Helper script to install cron job
- **`README.md`**: This documentation file

## Installation

### 1. Test the Backup Script Manually

Before setting up the cron job, test the backup script manually:

```bash
cd /home/ubuntu/approval_workflow_system
node scripts/backup-database.mjs
```

You should see output like:

```
[2026-02-23T03:30:00.000Z] ========================================
[2026-02-23T03:30:00.000Z] Database Backup Script Started
[2026-02-23T03:30:00.000Z] ========================================
[2026-02-23T03:30:00.000Z] Starting database backup...
[2026-02-23T03:30:00.000Z] Backing up database: approval_workflow from xxx.rds.amazonaws.com
[2026-02-23T03:30:05.000Z] Database dump created: /tmp/backup-2026-02-23T03-30-00.sql
[2026-02-23T03:30:06.000Z] Backup compressed: /tmp/backup-2026-02-23T03-30-00.sql.gz
[2026-02-23T03:30:08.000Z] ✅ Backup uploaded to S3: s3://compawnion-approval-forms/database-backups/backup-2026-02-23T03-30-00.sql.gz
[2026-02-23T03:30:08.000Z] Local backup file deleted
[2026-02-23T03:30:08.000Z] Checking for backups older than 30 days...
[2026-02-23T03:30:09.000Z] No old backups to delete
[2026-02-23T03:30:09.000Z] ========================================
[2026-02-23T03:30:09.000Z] Database Backup Completed Successfully
[2026-02-23T03:30:09.000Z] ========================================
```

### 2. Install the Cron Job

Run the setup script to see the cron job command:

```bash
./scripts/setup-backup-cron.sh
```

Then install the cron job:

```bash
(crontab -l 2>/dev/null; echo "0 17 * * * cd /home/ubuntu/approval_workflow_system && NODE_ENV=production node /home/ubuntu/approval_workflow_system/scripts/backup-database.mjs >> /home/ubuntu/approval_workflow_system/logs/backup.log 2>&1") | crontab -
```

### 3. Verify Cron Job Installation

Check that the cron job is installed:

```bash
crontab -l
```

You should see:

```
0 17 * * * cd /home/ubuntu/approval_workflow_system && NODE_ENV=production node /home/ubuntu/approval_workflow_system/scripts/backup-database.mjs >> /home/ubuntu/approval_workflow_system/logs/backup.log 2>&1
```

## Schedule

The backup runs at:
- **12:00 AM WIB** (Western Indonesian Time, UTC+7)
- **5:00 PM UTC** (previous day)

This ensures backups are created during off-peak hours.

## Backup Location

All backups are stored in:

```
s3://compawnion-approval-forms/database-backups/
```

Backup filename format:

```
backup-YYYY-MM-DDTHH-MM-SS.sql.gz
```

Example:

```
backup-2026-02-23T03-30-00.sql.gz
```

## Retention Policy

- **Retention Period**: 30 days
- **Automatic Cleanup**: Old backups are deleted automatically during each backup run
- **Manual Cleanup**: You can manually delete backups from S3 if needed

## Logs

All backup operations are logged to:

```
/home/ubuntu/approval_workflow_system/logs/backup.log
```

To view recent logs:

```bash
tail -f /home/ubuntu/approval_workflow_system/logs/backup.log
```

To view all logs:

```bash
cat /home/ubuntu/approval_workflow_system/logs/backup.log
```

## Restoring from Backup

To restore a backup:

### 1. Download the Backup from S3

```bash
aws s3 cp s3://compawnion-approval-forms/database-backups/backup-2026-02-23T03-30-00.sql.gz /tmp/
```

### 2. Decompress the Backup

```bash
gunzip /tmp/backup-2026-02-23T03-30-00.sql.gz
```

### 3. Restore to Database

```bash
mysql -h <host> -P <port> -u <user> -p <database> < /tmp/backup-2026-02-23T03-30-00.sql
```

Replace `<host>`, `<port>`, `<user>`, and `<database>` with your database connection details.

## Troubleshooting

### Backup Script Fails

1. Check the log file: `tail -f logs/backup.log`
2. Verify environment variables are set:
   - `DATABASE_URL` or `CUSTOM_DATABASE_URL`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
3. Test database connection: `mysql -h <host> -P <port> -u <user> -p`
4. Test S3 access: `aws s3 ls s3://compawnion-approval-forms/database-backups/`

### Cron Job Not Running

1. Check cron job is installed: `crontab -l`
2. Check cron service is running: `systemctl status cron`
3. Check system logs: `grep CRON /var/log/syslog`
4. Verify script permissions: `ls -l scripts/backup-database.mjs`

### S3 Upload Fails

1. Verify AWS credentials are correct
2. Check S3 bucket exists: `aws s3 ls s3://compawnion-approval-forms/`
3. Check IAM permissions include `s3:PutObject`, `s3:ListBucket`, `s3:DeleteObject`

## Maintenance

### Update Retention Period

Edit `scripts/backup-database.mjs` and change:

```javascript
const RETENTION_DAYS = 30; // Change to desired number of days
```

### Change Backup Schedule

Edit the cron job:

```bash
crontab -e
```

Change the schedule (currently `0 17 * * *` for 5:00 PM UTC daily).

Cron format: `minute hour day month weekday`

Examples:
- `0 17 * * *` - Daily at 5:00 PM UTC (12:00 AM WIB)
- `0 17 * * 0` - Weekly on Sunday at 5:00 PM UTC
- `0 17 1 * *` - Monthly on 1st at 5:00 PM UTC

### Disable Backups

Remove the cron job:

```bash
crontab -l | grep -v 'backup-database.mjs' | crontab -
```

## Security Notes

- Backup files contain sensitive database data
- S3 bucket should have appropriate access controls
- Consider enabling S3 encryption at rest
- Rotate AWS credentials regularly
- Monitor backup logs for unauthorized access attempts

## Support

For issues or questions, contact:
- **Technical Support**: https://tech.compawnion.id/
- **Company Website**: https://www.compawnion.co/
