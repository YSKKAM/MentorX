# 💾 Database Backup & Data Retention Strategy

## 1. Database Backup Policy (Neon Postgres)

- **Backup Type:** Automated Point-In-Time Recovery (PITR) & daily WAL snapshots.
- **Provider:** Hosted Neon Serverless Postgres.
- **Retention Period:** 7 days (Free/Standard tier), 30 days (Pro tier).
- **RPO (Recovery Point Objective):** < 5 minutes.
- **RTO (Recovery Time Objective):** < 15 minutes.

### Manual Backup Procedure (pg_dump)

To take a manual snapshot before major updates or migrations:

```bash
# Run pg_dump from terminal using the DATABASE_URL connection string:
pg_dump "postgresql://neondb_owner:npg_c3MbsGtKwN4q@ep-rapid-field-ayrq4fbw.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require" -F c -b -v -f ./backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Procedure

To restore from a dump file to a target database:

```bash
pg_restore -d "TARGET_DATABASE_URL" -v ./backup_20260808_120000.dump
```

---

## 2. Data Retention Policy

| Data Category | Table(s) | Retention Period | Deletion Action |
|---|---|---|---|
| Student Activity Logs | `student_activity` | 90 days | Automatic purge of records older than 90 days |
| Chat Messages | `chat_messages` | 180 days | Archived or purged after semester end |
| Password Reset Tokens | `password_reset_tokens` | 1 hour | Auto-deleted upon use or expiration |
| Submissions & Code | `assignment_submissions`, `submission_results` | Permanent / Academic Year | Kept for grading records |
