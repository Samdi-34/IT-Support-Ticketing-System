
CREATE DATABASE IF NOT EXISTS it_support_db;

USE it_support_db;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role ENUM('requester', 'support', 'admin') NOT NULL DEFAULT 'requester',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    assigned_to INT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical')
        NOT NULL DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed')
        NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ticket_requester
        FOREIGN KEY (requester_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_ticket_assigned_staff
        FOREIGN KEY (assigned_to)
        REFERENCES users(user_id)
);

CREATE TABLE ticket_updates (
    update_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    updated_by INT NOT NULL,
    old_status ENUM('open', 'in_progress', 'resolved', 'closed') NULL,
    new_status ENUM('open', 'in_progress', 'resolved', 'closed') NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_update_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id),

    CONSTRAINT fk_update_user
        FOREIGN KEY (updated_by)
        REFERENCES users(user_id)
);
