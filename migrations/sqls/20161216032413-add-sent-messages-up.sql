CREATE TABLE sent_messages(
  msg_id BIGSERIAL PRIMARY KEY,
  phone           TEXT,
  date            TEXT,
  description     TEXT
);
