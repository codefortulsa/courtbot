CREATE TABLE registrations(
  registration_id SERIAL PRIMARY KEY,
  phone           VARCHAR(50),
  name            VARCHAR(200),
  state           INT
);
