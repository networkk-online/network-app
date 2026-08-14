import { supabase } from '@/integrations/supabase/client';

/**
 * Thin client wrappers around the server-side admin RPCs.
 * Every one of these is authorization-checked and audited in the database —
 * the browser never carries privileged credentials.
 */

type Json = Record<string, unknown>;

export async function adminLog(
  action: string,
  opts: {
    resourceType?: string;
    resourceId?: string;
    targetUserId?: string;
    reason?: string;
    metadata?: Json;
  } = {}
) {
  const { error } = await supabase.rpc('admin_log_action' as never, {
    _action: action,
    _resource_type: opts.resourceType ?? null,
    _resource_id: opts.resourceId ?? null,
    _target_user_id: opts.targetUserId ?? null,
    _reason: opts.reason ?? null,
    _metadata: (opts.metadata ?? {}) as never,
  } as never);
  return { error };
}

export type AdminUserAction = 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'verify' | 'unverify';

export async function adminUserAction(userId: string, action: AdminUserAction, reason: string) {
  return supabase.rpc('admin_user_action' as never, {
    _user_id: userId,
    _action: action,
    _reason: reason,
  } as never);
}

export type ModerationResource = 'post' | 'reel' | 'story' | 'comment';

export async function adminDeleteContent(type: ModerationResource, id: string, reason: string) {
  return supabase.rpc('admin_moderate_content' as never, {
    _resource_type: type,
    _resource_id: id,
    _action: 'delete',
    _reason: reason,
  } as never);
}

export async function adminResolveReport(
  reportId: string,
  status: 'reviewed' | 'resolved' | 'dismissed' | 'escalated',
  reason: string
) {
  return supabase.rpc('admin_resolve_report' as never, {
    _report_id: reportId,
    _status: status,
    _reason: reason,
  } as never);
}

/** Human readable message for RPC failures raised by the admin functions. */
export function adminErrorMessage(message?: string) {
  if (!message) return 'حدث خطأ غير متوقع';
  if (message.includes('forbidden')) return 'ليست لديك صلاحية تنفيذ هذا الإجراء';
  if (message.includes('reason_required')) return 'يجب كتابة سبب واضح (3 أحرف على الأقل)';
  if (message.includes('cannot_target_self')) return 'لا يمكنك تنفيذ هذا الإجراء على حسابك';
  if (message.includes('not_found')) return 'العنصر غير موجود';
  return message;
}
