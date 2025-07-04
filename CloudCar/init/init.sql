CREATE DATABASE IF NOT EXISTS webshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Zur richtigen Datenbank wechseln
USE webshop;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Produkte-Tabelle erstellen
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    video_url VARCHAR(255),
    category VARCHAR(50) DEFAULT 'Automotive',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert product data with correct image URLs
-- Insert products with English names and descriptions
INSERT INTO products (name, description, price, image_url, video_url, category) VALUES
('Elegance Glass Water Bottle - with Embossing', 'This bottle is made from 100% recycled material, is environmentally friendly and perfect for on-the-go use.', 40.00, 'http://localhost:9000/images/Glastrinkflasche.jpg', 'http://localhost:9000/videos/videos.json', 'Accessories'),
('Elegance Charge-o-mat Pro Basic', 'Compact charger for Elegance vehicles with high efficiency and simple operation.', 299.00, 'http://localhost:9000/images/Elegance%20Charge-o-mat%20Pro.webp', 'http://localhost:9000/videos/videos.json', 'Electronics'),
('Elegance Child Seat i-Size Comfort', 'Safe and stylish child seat in Elegance design with comfort padding.', 499.00, 'http://localhost:9000/images/Elegance%20Kid%20Seat%20i-Size.jpg', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Elegance Wallbox Home', 'High-quality Elegance wallbox for home charging with basic functions.', 999.00, 'http://localhost:9000/images/Elegance%20Walbox.jpg', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Repair Manual Elegance 911 Classic', 'Technical manual for maintenance of the classic Elegance 911.', 79.00, 'http://localhost:9000/images/Reperaturleitfaden%20Elegance%20911.webp', 'http://localhost:9000/videos/videos.json', 'Books & Media'),
('Elegance Spare Bulb Kit Professional', 'Set of bulbs and fuses (12V), specially assembled for the Elegance 911, Type 996.', 70.00, 'http://localhost:9000/images/Ersatzlampenbox.webp', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Warning Triangle Elegance Classic', 'Warning triangle for all Elegance models.', 599.00, 'http://localhost:9000/images/Warndreieck_Elegance_Classic.webp', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Elegance Child Seat i-Size Luxury', 'Luxurious Elegance child seat with highest safety standards and elegant leather finish.', 749.00, 'http://localhost:9000/images/Elegance_Kindersitz_i-Size_Luxury.avif', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Elegance System Clothes Hanger', 'Elegance clothes hanger; usable for the Elegance Cayenne and for the first generation Elegance Macan (only in connection with removable headrest).', 1299.00, 'http://localhost:9000/images/Elegance_System-Kleiderbügel.webp', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Microfiber Cloth', 'Elegance Classic microfiber cloth for all models.', 1199.00, 'http://localhost:9000/images/Mikrofasertuch.webp', 'http://localhost:9000/videos/videos.json', 'Home & Living'),
('Elegance Classic Leather Cloth', 'Elegance Classic leather cloth for all models.', 899.00, 'http://localhost:9000/images/Elegance_Ledertuch.webp', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Elegance Classic Tire Care', 'Elegance Classic tire care product for all models.', 149.00, 'http://localhost:9000/images/Elegance-Classic-Reifenpfleger.webp', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Classic Performance Steering Wheel Prototipo', 'The classic 3-spoke sports steering wheel with horn button made of genuine leather, embossed with a historic Porsche crest.', 1499.00, 'http://localhost:9000/images/Classic-Performance-Lenkrad-Prototipo.webp', 'http://localhost:9000/videos/videos.json', 'Automotive'),
('Reutter Badge Elegance 356', 'Original Reutter badge for the classic Elegance 356 - a piece of automotive history.', 179.00, 'http://localhost:9000/images/Reutter-Plakette.webp', 'http://localhost:9000/videos/videos.json', 'Accessories'),
('Elegance Titanium Wheel Bolts', 'High-quality titanium wheel bolts for maximum performance and corrosion protection.', 35.00, 'http://localhost:9000/images/Titan-Randschrauben.webp', 'http://localhost:9000/videos/videos.json', 'Accessories'),
('Elegance Classic assembly gloves “McLaughlan”', 'The famous “McLaughlan” tartan seat pattern of the first Elegance 911 Turbo, which was given to Louise Piëch on the occasion of her 70th birthday, inspired the design of the Porsche Classic assembly gloves.', 89.00, 'http://localhost:9000/images/Elegance-Classic-Montagehandschuhe-„McLaughlan“.jpg', 'http://localhost:9000/videos/videos.json', 'Accessories');
