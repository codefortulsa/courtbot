CREATE TABLE registrations(
  registration_id BIGSERIAL PRIMARY KEY,
  phone           TEXT,
  name            TEXT,
  state           INT,
  create_date     TEXT,
  case_number     TEXT
);
