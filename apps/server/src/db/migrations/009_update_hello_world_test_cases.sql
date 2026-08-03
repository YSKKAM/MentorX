-- Update test cases for Hello World assignments to expect 'Hello World'
UPDATE assignment_test_cases
SET expected_output = 'Hello World'
WHERE assignment_id IN (
  SELECT id FROM assignments
  WHERE LOWER(title) LIKE '%hello world%' OR LOWER(description) LIKE '%hello world%'
) AND (LOWER(expected_output) LIKE '%test_success%' OR LOWER(expected_output) LIKE '%fallback_out%');
