-- handle_new_user é SECURITY DEFINER e só deve rodar pelo gatilho on_auth_user_created.
-- Sem este revoke ela ficava exposta em /rest/v1/rpc/handle_new_user (aviso do Security Advisor).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
