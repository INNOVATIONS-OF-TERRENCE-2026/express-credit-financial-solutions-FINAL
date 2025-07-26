-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule VIP trial expiration check to run every hour
SELECT cron.schedule(
  'expire-vip-trials-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://vctxvlkzoyqrwnletgsp.supabase.co/functions/v1/expire-vip-trials',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjdHh2bGt6b3lxcndubGV0Z3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNTQ4NDMsImV4cCI6MjA2ODgzMDg0M30.ljyLcxUiUZ0eXo9qBjbWTvYu0h8HViOGEkqfsGoQJxk"}'::jsonb,
        body:=concat('{"scheduled_run": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);