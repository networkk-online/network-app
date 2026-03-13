-- Use CREATE OR REPLACE where possible, DROP IF EXISTS + CREATE for triggers

-- 2. Post likes count
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON public.likes;
CREATE TRIGGER update_post_likes_count_trigger AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- 3. Post comments count
DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON public.comments;
CREATE TRIGGER update_post_comments_count_trigger AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- 4. Comment replies count
DROP TRIGGER IF EXISTS update_comment_replies_count_trigger ON public.comments;
CREATE TRIGGER update_comment_replies_count_trigger AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_comment_replies_count();

-- 5. Follow counts
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON public.follows;
CREATE TRIGGER update_follow_counts_trigger AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- 6. Follow notification
DROP TRIGGER IF EXISTS handle_follow_notification_trigger ON public.follows;
CREATE TRIGGER handle_follow_notification_trigger AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();

-- 7. Like notification
DROP TRIGGER IF EXISTS notify_post_like_trigger ON public.likes;
CREATE TRIGGER notify_post_like_trigger AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

-- 8. Comment notification
DROP TRIGGER IF EXISTS notify_post_comment_trigger ON public.comments;
CREATE TRIGGER notify_post_comment_trigger AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

-- 9. Comment reply notification
DROP TRIGGER IF EXISTS notify_comment_reply_trigger ON public.comments;
CREATE TRIGGER notify_comment_reply_trigger AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_comment_reply();

-- 10. Reel likes count
DROP TRIGGER IF EXISTS update_reel_likes_count_trigger ON public.reel_likes;
CREATE TRIGGER update_reel_likes_count_trigger AFTER INSERT OR DELETE ON public.reel_likes FOR EACH ROW EXECUTE FUNCTION public.update_reel_likes_count();

-- 11. Reel comments count
DROP TRIGGER IF EXISTS update_reel_comments_count_trigger ON public.reel_comments;
CREATE TRIGGER update_reel_comments_count_trigger AFTER INSERT OR DELETE ON public.reel_comments FOR EACH ROW EXECUTE FUNCTION public.update_reel_comments_count();

-- 12. Reel comment replies count
DROP TRIGGER IF EXISTS update_reel_comment_replies_count_trigger ON public.reel_comments;
CREATE TRIGGER update_reel_comment_replies_count_trigger AFTER INSERT OR DELETE ON public.reel_comments FOR EACH ROW EXECUTE FUNCTION public.update_reel_comment_replies_count();

-- 13. Reel comment reply notification
DROP TRIGGER IF EXISTS notify_reel_comment_reply_trigger ON public.reel_comments;
CREATE TRIGGER notify_reel_comment_reply_trigger AFTER INSERT ON public.reel_comments FOR EACH ROW EXECUTE FUNCTION public.notify_reel_comment_reply();

-- 14. Conversation timestamp update
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON public.messages;
CREATE TRIGGER update_conversation_timestamp_trigger AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- 15. Story views count
DROP TRIGGER IF EXISTS update_story_views_count_trigger ON public.story_views;
CREATE TRIGGER update_story_views_count_trigger AFTER INSERT ON public.story_views FOR EACH ROW EXECUTE FUNCTION public.update_story_views_count();

-- 16. Wheel spin processing
DROP TRIGGER IF EXISTS process_wheel_spin_trigger ON public.wheel_spins;
CREATE TRIGGER process_wheel_spin_trigger AFTER INSERT ON public.wheel_spins FOR EACH ROW EXECUTE FUNCTION public.process_wheel_spin();

-- 17. Ad stats
DROP TRIGGER IF EXISTS update_ad_stats_trigger ON public.ad_interactions;
CREATE TRIGGER update_ad_stats_trigger AFTER INSERT ON public.ad_interactions FOR EACH ROW EXECUTE FUNCTION public.update_ad_stats();

-- 18. Broadcast donation processing
DROP TRIGGER IF EXISTS process_broadcast_donation_trigger ON public.broadcast_donations;
CREATE TRIGGER process_broadcast_donation_trigger BEFORE INSERT ON public.broadcast_donations FOR EACH ROW EXECUTE FUNCTION public.process_broadcast_donation();

-- 19. Donation notification
DROP TRIGGER IF EXISTS notify_creator_donation_trigger ON public.broadcast_donations;
CREATE TRIGGER notify_creator_donation_trigger AFTER INSERT ON public.broadcast_donations FOR EACH ROW EXECUTE FUNCTION public.notify_creator_donation();

-- 20. Post tip processing
DROP TRIGGER IF EXISTS process_post_tip_trigger ON public.post_tips;
CREATE TRIGGER process_post_tip_trigger BEFORE INSERT ON public.post_tips FOR EACH ROW EXECUTE FUNCTION public.process_post_tip();

-- 21. Financial transaction notification
DROP TRIGGER IF EXISTS notify_financial_transaction_trigger ON public.transactions;
CREATE TRIGGER notify_financial_transaction_trigger AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.notify_financial_transaction();

-- 22. Fame score on post
DROP TRIGGER IF EXISTS update_user_fame_score_trigger ON public.posts;
CREATE TRIGGER update_user_fame_score_trigger AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_user_fame_score();

-- 23. Fame score on follow
DROP TRIGGER IF EXISTS update_user_fame_score_on_follow_trigger ON public.follows;
CREATE TRIGGER update_user_fame_score_on_follow_trigger AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.update_user_fame_score_on_follow();

-- 24. Call signals cleanup
DROP TRIGGER IF EXISTS cleanup_old_signals_trigger ON public.call_signals;
CREATE TRIGGER cleanup_old_signals_trigger AFTER INSERT ON public.call_signals FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_signals();

-- 25. Tweet likes count
DROP TRIGGER IF EXISTS update_tweet_likes_count_trigger ON public.tweet_likes;
CREATE TRIGGER update_tweet_likes_count_trigger AFTER INSERT OR DELETE ON public.tweet_likes FOR EACH ROW EXECUTE FUNCTION public.update_tweet_likes_count();