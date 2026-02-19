
-- Create live_rooms table to track active broadcasts
CREATE TABLE public.live_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_room_name TEXT NOT NULL UNIQUE,
  daily_room_url TEXT NOT NULL,
  title TEXT DEFAULT 'بث مباشر',
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  viewer_count INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create join_requests table for participants wanting to go live
CREATE TABLE public.live_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS for live_rooms
CREATE POLICY "Anyone can view live rooms" ON public.live_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON public.live_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update their rooms" ON public.live_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host can delete their rooms" ON public.live_rooms FOR DELETE USING (auth.uid() = host_id);

-- RLS for join_requests
CREATE POLICY "Users can view requests for rooms they host or their own" ON public.live_join_requests FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.live_rooms WHERE id = room_id AND host_id = auth.uid())
);
CREATE POLICY "Authenticated users can request to join" ON public.live_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Host can update join requests" ON public.live_join_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.live_rooms WHERE id = room_id AND host_id = auth.uid())
);
CREATE POLICY "Users can delete their own requests" ON public.live_join_requests FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_join_requests;

-- Trigger to update updated_at
CREATE TRIGGER update_live_rooms_updated_at BEFORE UPDATE ON public.live_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_live_join_requests_updated_at BEFORE UPDATE ON public.live_join_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
