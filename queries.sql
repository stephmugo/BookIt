CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY NOT NULL,
	first_name VARCHAR(50) NOT NULL,
	last_name VARCHAR(50) NOT NULL,
	phone_number VARCHAR(20) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

SELECT * FROM users WHERE email = $1

INSERT INTO users (first_name, last_name, phone_number, email, password)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, password

CREATE TABLE businesses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  location VARCHAR(255),
  telephone VARCHAR(20),
  password TEXT NOT NULL
);

CREATE TABLE business_services (
  id BIGSERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  service VARCHAR(255) NOT NULL,
  UNIQUE(business_id, service)
);
