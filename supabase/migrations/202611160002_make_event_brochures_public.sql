-- Brochures are public festival content. Upload, update, and delete access
-- remains restricted by the existing admin-only storage policies.
update storage.buckets
set public = true
where id = 'event-files';
