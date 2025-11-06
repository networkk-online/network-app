-- Add foreign key constraints for notifications
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_actor_id_fkey 
  FOREIGN KEY (actor_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES public.posts(id) 
  ON DELETE CASCADE;