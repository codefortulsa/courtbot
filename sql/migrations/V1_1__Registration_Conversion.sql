CREATE TABLE registrations(
  registration_id SERIAL PRIMARY KEY,
  phone           CHAR(50),
  name            CHAR(200),
  state           INT
);
