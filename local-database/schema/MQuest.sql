-- Create the database
DROP DATABASE IF EXISTS MQuest;
CREATE DATABASE MQuest;
USE MQuest;

-- Create roles table
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Insert basic roles
INSERT INTO roles (role_name, description) VALUES 
('admin', 'Administrator'),
('teacher', 'Teaching'),
('pupil', 'Student');

-- Create users table with password hashing
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    suffix VARCHAR(50),
    gender ENUM('Male', 'Female', 'Prefer not to say') NOT NULL,
    birth_date DATE NOT NULL,
    lrn VARCHAR(12),
    email VARCHAR(255) NOT NULL UNIQUE,
    teacher_id VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- Create super_admin table for elevated privileges
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    access_level INT DEFAULT 10,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- Create users table with password hashing
CREATE TABLE users_verification_code (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    verification_code VARCHAR(6) NOT NULL UNIQUE,
	verification_expires DATETIME,
    type VARCHAR(50) NOT NULL,
	is_verified BOOLEAN DEFAULT FALSE
);

-- Create token table with password hashing
CREATE TABLE revoked_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (token(255))
);

-- Create a log for clean up
CREATE TABLE cleanup_logs (
	event_name VARCHAR(255), 
    rows_affected INT, 
	executed_at TIMESTAMP
);

SET GLOBAL event_scheduler = ON;

DELIMITER $$

CREATE EVENT clean_expired_revoked_tokens
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Delete tokens revoked more than 30 days ago
    DELETE FROM revoked_tokens 
    WHERE revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    --  Log the cleanup
    INSERT INTO cleanup_logs (event_name, rows_affected, executed_at)
    VALUES ('clean_expired_revoked_tokens', ROW_COUNT(), NOW());
END$$

DELIMITER ; 

DELIMITER $$

CREATE EVENT clean_expired_verification_code
ON SCHEDULE EVERY 1 DAY 
DO
BEGIN
    -- Delete tokens revoked more than 15 mins ago
    DELETE FROM users_verification_code 
    WHERE verification_expires < DATE_SUB(NOW(), INTERVAL 1 DAY);
    
    --  Log the cleanup
    INSERT INTO cleanup_logs (event_name, rows_affected, executed_at)
    VALUES ('clean_users_verification_code', ROW_COUNT(), NOW());
END$$

DELIMITER ;

SHOW EVENTS FROM mquest;




