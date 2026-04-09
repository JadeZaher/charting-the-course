-- C1: Primary Solution Assignment Survey reference
INSERT INTO app_settings (key, value)
VALUES (
  'primary_solution_survey',
  '{"survey_id": null, "survey_slug": null, "label": "Primary Solution Assignment Survey"}'
)
ON CONFLICT (key) DO NOTHING;

-- C5 (seeded here for proximity): Consent gate text
INSERT INTO app_settings (key, value)
VALUES (
  'ethos_consent_text',
  '{"heading": "Before you enter", "body": "By entering this area, you will be visible to other matched participants. Your profile link will be shared within this Solution area.", "accept_label": "I understand, continue", "decline_label": "Not now"}'
)
ON CONFLICT (key) DO NOTHING;
