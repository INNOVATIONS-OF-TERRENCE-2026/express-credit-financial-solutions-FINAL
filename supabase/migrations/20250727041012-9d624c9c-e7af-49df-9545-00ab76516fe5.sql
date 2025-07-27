-- Fix admin role assignments and add missing user roles

-- First, add admin role to the main admin user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'admin@expresscredit.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add admin role to Terrence as well (backup admin)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'terrencemilliner10@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add default 'user' roles for all users who don't have any role assigned
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'user'::app_role
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;