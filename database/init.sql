-- Database initialization script for StaySyncGold

-- Properties Table: Stores information about each hotel property
CREATE TABLE Properties (
    id SERIAL PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    managerName VARCHAR(255),
    ownerName VARCHAR(255),
    phone_num VARCHAR(50)
);

-- Guests Table: Stores guest information
CREATE TABLE Guests (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    passport_no VARCHAR(255),
    FOREIGN KEY (property_id) REFERENCES Properties(id)
);

-- RoomTypes Table: Stores information about different room types
CREATE TABLE RoomTypes (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    max_occupancy INT NOT NULL,
    amenities TEXT,
    FOREIGN KEY (property_id) REFERENCES Properties(id)
);

-- Rooms Table: Stores information about each room
CREATE TABLE Rooms (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    type_id INT NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'available', 'occupied', 'maintenance'
    floor INT,
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (type_id) REFERENCES RoomTypes(id)
);

-- Reservations Table: Stores reservation details
CREATE TABLE Reservations (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    guest_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'confirmed', 'checked-in', 'checked-out', 'cancelled'
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (guest_id) REFERENCES Guests(id),
    FOREIGN KEY (room_id) REFERENCES Rooms(id)
);

-- Payments Table: Stores payment information
CREATE TABLE Payments (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    res_id INT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method VARCHAR(50), -- e.g., 'credit_card', 'cash'
    status VARCHAR(50), -- e.g., 'pending', 'completed', 'failed'
    token VARCHAR(255), -- For payment gateway integration
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (res_id) REFERENCES Reservations(id)
);

-- Staff Table: Stores staff information
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    role VARCHAR(50) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_num VARCHAR(50),
    pin VARCHAR(255), -- Hashed pin for security
    FOREIGN KEY (property_id) REFERENCES Properties(id)
);

-- HousekeepingLog Table: Logs housekeeping status changes
CREATE TABLE HousekeepingLog (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    room_id INT NOT NULL,
    staff_id INT NOT NULL,
    status_from VARCHAR(50),
    status_to VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (room_id) REFERENCES Rooms(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);

-- Maintenance Table: Logs maintenance requests
CREATE TABLE Maintenance (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    room_id INT NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'reported', 'in_progress', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (room_id) REFERENCES Rooms(id)
);

-- Users Table: Stores user accounts for the system
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    property_id INT,
    role VARCHAR(50) NOT NULL,
    isAdmin BOOLEAN DEFAULT FALSE,
    isStaff BOOLEAN DEFAULT FALSE,
    isOwner BOOLEAN DEFAULT FALSE,
    isManager BOOLEAN DEFAULT FALSE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    FOREIGN KEY (property_id) REFERENCES Properties(id)
);

-- SystemLogs Table: Logs important system events
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    property_id INT,
    user_id INT,
    type VARCHAR(50), -- e.g., 'auth', 'database', 'api'
    event TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Staff Clock Events Table: Logs staff clock-in/out events
CREATE TABLE staff_clock_events (
    id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    property_id INT NOT NULL,
    "type" VARCHAR(10) NOT NULL, -- e.g., 'in', 'out'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (property_id) REFERENCES Properties(id)
);

-- Staff Schedules Table: Stores staff work schedules
CREATE TABLE staff_schedules (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    staff_id INT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT,
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (staff_id) REFERENCES staff(id)
);
