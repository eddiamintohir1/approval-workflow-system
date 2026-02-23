#!/bin/bash
#
# Setup Cron Job for Automated Database Backup
# 
# Schedule: Daily at 12:00 AM WIB (5:00 PM UTC previous day)
# WIB = UTC+7, so 00:00 WIB = 17:00 UTC (previous day)
#
# Copyright © Compawnion Jadi Berkat
# IP: Eddie Amintohir

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.mjs"
LOG_FILE="$PROJECT_DIR/logs/backup.log"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Cron job entry
# Runs at 17:00 UTC (00:00 WIB next day) every day
CRON_ENTRY="0 17 * * * cd $PROJECT_DIR && NODE_ENV=production node $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

echo "========================================="
echo "Database Backup Cron Job Setup"
echo "========================================="
echo ""
echo "Project Directory: $PROJECT_DIR"
echo "Backup Script: $BACKUP_SCRIPT"
echo "Log File: $LOG_FILE"
echo "Schedule: Daily at 12:00 AM WIB (17:00 UTC)"
echo ""
echo "Cron Entry:"
echo "$CRON_ENTRY"
echo ""
echo "========================================="
echo ""
echo "To install this cron job, run:"
echo ""
echo "  (crontab -l 2>/dev/null; echo \"$CRON_ENTRY\") | crontab -"
echo ""
echo "To view installed cron jobs:"
echo ""
echo "  crontab -l"
echo ""
echo "To remove this cron job:"
echo ""
echo "  crontab -l | grep -v 'backup-database.mjs' | crontab -"
echo ""
echo "========================================="
