-- Allow application cron workflows (service_role) to execute telemetry retention RPC.
grant execute on function public.cleanup_operational_telemetry(interval, interval, integer) to service_role;
