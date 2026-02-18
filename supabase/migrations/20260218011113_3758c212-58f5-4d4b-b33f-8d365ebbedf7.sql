-- Allow admins to delete wheel_spins for archive/clear functionality
CREATE POLICY "Admins can delete spins"
ON public.wheel_spins
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));