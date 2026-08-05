-- Server-side record of the user's AI-partner consent (App Store 5.1.2(i)).
--
-- The consent prompt existed only on the device: it wrote a flag to local
-- storage and the server never learned about it. Meanwhile a 6-hour background
-- sweep marshalled each flagged user's brain — food logs, gym sessions, goals,
-- body weights — and POSTed it to api.anthropic.com regardless of whether that
-- user had ever seen the disclosure, let alone accepted it. A device-local flag
-- cannot gate a server-side job; the consent has to live where the job runs.
--
-- NULL means "no consent on record" and every provider send is refused.
alter table profiles add column if not exists ai_consent_at timestamptz;

comment on column profiles.ai_consent_at is
  'When the user accepted AI-partner processing (Gemini/Anthropic). NULL = not consented; server-side AI paths must refuse.';
