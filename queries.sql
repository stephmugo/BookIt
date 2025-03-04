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

ALTER TABLE businesses
ADD COLUMN business_logo VARCHAR(255),
ADD COLUMN background_image VARCHAR(255),
ADD COLUMN description TEXT,
ADD COLUMN region VARCHAR(255)

-- Alter businesses table to add rating and review_count columns
ALTER TABLE businesses
  ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0.00,
  ADD COLUMN review_count INTEGER DEFAULT 0;

-- Adding  constraints to ensure rating is within a valid range (0-5)
ALTER TABLE businesses
  ADD CONSTRAINT valid_rating_range CHECK (rating >= 0 AND rating <= 5),
  ADD CONSTRAINT review_count_non_negative CHECK (review_count >= 0);

-- Creating an  index on rating to improve performance of searches/sorts by rating
CREATE INDEX idx_businesses_rating ON businesses(rating);

CREATE TABLE business_services (
  id BIGSERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  service VARCHAR(255) NOT NULL,
  UNIQUE(business_id, service)
);

-- Alter business_services table to add staff count, price, service image, and duration
ALTER TABLE business_services
  ADD COLUMN staff_count INTEGER DEFAULT 1,
  ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN service_image VARCHAR(255),
  ADD COLUMN duration_minutes INTEGER DEFAULT 30;

-- Add constraints to ensure valid data
ALTER TABLE business_services
  ADD CONSTRAINT staff_count_positive CHECK (staff_count > 0),
  ADD CONSTRAINT price_non_negative CHECK (price >= 0),
  ADD CONSTRAINT duration_positive CHECK (duration_minutes > 0);

-- Add an index on business_id to improve query performance
CREATE INDEX idx_business_services_business_id ON business_services(business_id);

-- Create bookmarks table
CREATE TABLE bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, business_id)
);

-- Add index for faster lookups
CREATE INDEX idx_bookmarks_user_business ON bookmarks(user_id, business_id);

-- Create a table for main regions
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) UNIQUE, -- Optional short code for regions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for sub-regions with foreign key to main regions
CREATE TABLE sub_regions (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10), -- Optional short code for sub-regions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region_id, name) -- Ensure unique sub-region names within each region
);

-- Create indices to improve query performance
CREATE INDEX idx_sub_regions_region_id ON sub_regions(region_id);

-- Adjust the businesses table to reference these tables
ALTER TABLE businesses
    ADD COLUMN region_id INTEGER REFERENCES regions(id),
    ADD COLUMN sub_region_id INTEGER REFERENCES sub_regions(id);


-- Insert main regions
INSERT INTO regions (name, code) VALUES
    ('Nairobi', 'NRB'),
    ('Kiambu', 'KMB'),
    ('Mombasa', 'MSA');

-- Insert sub-regions for Nairobi
INSERT INTO sub_regions (region_id, name) VALUES
    ((SELECT id FROM regions WHERE name = 'Nairobi'), 'Embakasi'),
    ((SELECT id FROM regions WHERE name = 'Nairobi'), 'Karen'),
    ((SELECT id FROM regions WHERE name = 'Nairobi'), 'Kilimani'),
    ((SELECT id FROM regions WHERE name = 'Nairobi'), 'Nairobi Central'),
    ((SELECT id FROM regions WHERE name = 'Nairobi'), 'Kahawa'),
    ((SELECT id FROM regions WHERE name = 'Nairobi'), 'Roysambu');

-- Insert sub-regions for Kiambu
INSERT INTO sub_regions (region_id, name) VALUES
    ((SELECT id FROM regions WHERE name = 'Kiambu'), 'Juja'),
    ((SELECT id FROM regions WHERE name = 'Kiambu'), 'Kikuyu'),
    ((SELECT id FROM regions WHERE name = 'Kiambu'), 'Ruiru'),
    ((SELECT id FROM regions WHERE name = 'Kiambu'), 'Thika'),
    ((SELECT id FROM regions WHERE name = 'Kiambu'), 'Ruaka'),
    ((SELECT id FROM regions WHERE name = 'Kiambu'), 'Kabete');

-- Insert sub-regions for Mombasa
INSERT INTO sub_regions (region_id, name) VALUES
    ((SELECT id FROM regions WHERE name = 'Mombasa'), 'Mvita'),
    ((SELECT id FROM regions WHERE name = 'Mombasa'), 'Nyali'),
    ((SELECT id FROM regions WHERE name = 'Mombasa'), 'Kisauni'),
    ((SELECT id FROM regions WHERE name = 'Mombasa'), 'Mombasa CBD'),
    ((SELECT id FROM regions WHERE name = 'Mombasa'), 'Bamburi'),
    ((SELECT id FROM regions WHERE name = 'Mombasa'), 'Likoni');

    -- ADDING A CATEGORY TABLE TO HANDLE CHILD SERVICES

-- Create service categories table
CREATE TABLE service_categories (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- Modify business_services table to reference categories
ALTER TABLE business_services 
    DROP COLUMN service,
    ADD COLUMN name VARCHAR(255) NOT NULL,
    ADD COLUMN description TEXT,
    ADD COLUMN category_id BIGINT REFERENCES service_categories(id) ON DELETE CASCADE,
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
    DROP CONSTRAINT business_services_business_id_service_key,
    ADD CONSTRAINT business_services_business_id_name_key UNIQUE(business_id, name);

-- Create service images table for multiple images per service
CREATE TABLE service_images (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT REFERENCES business_services(id) ON DELETE CASCADE,
    image_path VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff table
CREATE TABLE staff (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    max_daily_appointments INTEGER DEFAULT 8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_services table (which services each staff member can perform)
CREATE TABLE staff_services (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT REFERENCES staff(id) ON DELETE CASCADE,
    service_id BIGINT REFERENCES business_services(id) ON DELETE CASCADE,
    UNIQUE(staff_id, service_id)
);

-- Create staff_schedules table
CREATE TABLE staff_schedules (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE(staff_id, day_of_week)
);

-- Create business_hours table
CREATE TABLE business_hours (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME,
    close_time TIME,
    is_open BOOLEAN DEFAULT TRUE,
    UNIQUE(business_id, day_of_week)
);

-- Create branches table
CREATE TABLE branches (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    telephone VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- Add branch_id to staff table to associate staff with specific branches
ALTER TABLE staff
    ADD COLUMN branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL;

-- Add service delivery type to businesses
ALTER TABLE businesses
    ADD COLUMN service_type VARCHAR(20) CHECK (service_type IN ('store-based', 'mobile', 'both')) DEFAULT 'store-based',
    ADD COLUMN service_radius INTEGER,
    ADD COLUMN travel_fee DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN minimum_booking_amount DECIMAL(10, 2) DEFAULT 0.00,
    ADD COLUMN minimum_notice_hours INTEGER DEFAULT 1;




