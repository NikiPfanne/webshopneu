-- Wellness Website Database Schema
-- SQLite Database for Wellness Services

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'enabled',
    seo_url TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Create Services table
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration INTEGER, -- in minutes
    model TEXT,
    sku TEXT UNIQUE,
    category_id INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'enabled',
    seo_url TEXT UNIQUE,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Insert Categories
INSERT INTO categories (name, description, parent_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Wellness Services', 'Professionelle Wellness-Dienstleistungen für Entspannung und Wohlbefinden. Entdecken Sie unser umfassendes Angebot an Massagen, Fußpflege und Maniküre-Services. Alle Behandlungen werden von qualifizierten Fachkräften durchgeführt und sorgen für ganzheitliche Entspannung und Wohlbefinden für Körper und Geist.', NULL, 1, 'wellness-services', 'Wellness Services - Massage, Fußpflege & Maniküre', 'Professionelle Wellness-Services: Massagen, Fußpflege und Maniküre. Entspannung und Wohlbefinden für Körper und Geist. Jetzt Termin buchen!', 'wellness, massage, fußpflege, maniküre, entspannung, beauty, spa');

INSERT INTO categories (name, description, parent_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Massagen', 'Entspannende und therapeutische Massagen für Körper und Geist. Von der klassischen Entspannungsmassage bis zur speziellen Anti-Aging Behandlung bieten unsere erfahrenen Therapeuten verschiedene Massagetechniken für Ihr Wohlbefinden. Unser Angebot umfasst klassische Massagen, therapeutische Behandlungen, Anti-Aging Gesichtsmassagen und spezielle Techniken aus aller Welt für ultimative Entspannung und Regeneration.', 1, 1, 'massagen', 'Massagen - Entspannung & Therapie | Wellness Services', 'Professionelle Massagen: Klassische Massage, Aromamassage, Sportmassage und mehr. Entspannung und Therapie von erfahrenen Therapeuten.', 'massage, entspannung, therapie, klassische massage, aromamassage, sportmassage');

INSERT INTO categories (name, description, parent_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Fußpflege', 'Professionelle Fußpflege für gesunde und gepflegte Füße. Von der medizinischen Fußpflege bis zur entspannenden Wellness-Behandlung bieten wir umfassende Services für die Gesundheit und Schönheit Ihrer Füße. Unser Leistungsspektrum umfasst medizinische Fußpflege, Nagelpilzbehandlungen, Wellness Pediküre und entspannende Fußreflexzonenmassage für ganzheitliches Wohlbefinden.', 1, 2, 'fusspflege', 'Fußpflege - Medizinisch & Wellness | Professionelle Behandlung', 'Professionelle Fußpflege: Medizinische Behandlungen, Pediküre, Nagelpilztherapie und Reflexzonenmassage. Gesunde Füße in besten Händen.', 'fußpflege, pediküre, nagelpilz, reflexzonenmassage, medizinische fußpflege');

INSERT INTO categories (name, description, parent_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Maniküre', 'Professionelle Handpflege für gepflegte und schöne Nägel. Verwöhnen Sie Ihre Hände mit unseren professionellen Maniküre-Services von der klassischen Handpflege bis zur langanhaltenden Gel-Maniküre. Unser Angebot umfasst klassische Maniküre, moderne Gel-Maniküre, die exklusive japanische P-Shine Methode sowie kreative Nagelpflege und individuelles Nageldesign für perfekt gepflegte Hände.', 1, 3, 'manikuere', 'Maniküre - Handpflege & Nagelpflege | Professionelle Services', 'Professionelle Maniküre: Klassische Handpflege, Gel-Maniküre und P-Shine Methode. Gepflegte Nägel und schöne Hände.', 'maniküre, handpflege, nagelpflege, gel maniküre, nageldesign');

-- Insert Services
-- Massage Services
INSERT INTO services (name, description, price, duration, model, sku, category_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Japanische Lifting-Gesichtsmassage', 'Erleben Sie das Geheimnis japanischer Schönheitspflege mit unserer speziellen Anti-Aging Gesichtsmassage. Diese traditionelle Behandlung verbindet sanfte Berührungen mit gezielten Druckpunkten für ein natürliches Lifting-Ergebnis. Die 60-minütige Behandlung ist für alle Hauttypen geeignet und kombiniert Straffung, Anti-Aging und tiefe Entspannung durch traditionelle japanische Massagetechniken. Sie erleben sichtbare Straffung bereits nach der ersten Behandlung, verbesserte Durchblutung, Reduktion von Mimikfalten und tiefe Entspannung für Gesicht und Nacken - alles als natürliches Lifting ohne Nebenwirkungen. Buchen Sie jetzt Ihre japanische Lifting-Gesichtsmassage und erleben Sie die Kraft traditioneller Schönheitspflege.', 85.00, 60, 'JLG-60', 'SERVICE-MASSAGE-001', 2, 1, 'japanische-lifting-gesichtsmassage', 'Japanische Lifting-Gesichtsmassage - 60 Min €85 | Anti-Aging', 'Japanische Lifting-Gesichtsmassage: Anti-Aging Behandlung mit traditionellen Techniken. 60 Min für €85. Natürliches Lifting - jetzt buchen!', 'japanische massage, lifting, gesichtsmassage, anti-aging, falten, straffung');

INSERT INTO services (name, description, price, duration, model, sku, category_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Maderothoerapie', 'Die Maderothoerapie ist eine innovative Bodyforming und Cellulite Massage mit speziellen Holzwerkzeugen aus Südamerika, die den Körper formt und Cellulite reduziert. Mit speziellen Holzinstrumenten wird die Durchblutung gefördert und das Gewebe gestrafft. Die 75-minütige Behandlung nutzt südamerikanische Holzwerkzeug-Massage-Techniken speziell für Problemzonen und Cellulite mit deutlichem Bodyforming und Straffungseffekt. Die Wirkung umfasst Reduktion von Cellulite, Körperformung und Straffung, Verbesserung der Durchblutung, Lymphdrainage-Effekt und Aktivierung des Stoffwechsels. Entdecken Sie die natürliche Kraft der Maderothoerapie für einen strafferen Körper.', 95.00, 75, 'MDR-75', 'SERVICE-MASSAGE-002', 2, 2, 'maderothoerapie-cellulite-massage', 'Maderothoerapie - Cellulite & Bodyforming €95 | 75 Min', 'Maderothoerapie: Bodyforming & Cellulite-Behandlung mit Holzwerkzeugen. 75 Min für €95. Natürliche Körperformung - jetzt buchen!', 'maderothoerapie, cellulite, bodyforming, holzwerkzeuge, massage, straffung');

INSERT INTO services (name, description, price, duration, model, sku, category_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Kerzenmassage', 'Gönnen Sie sich ultimative Entspannung mit unserer sinnlichen Kerzenmassage mit warmem Kerzenwachs. Das warme Wachs pflegt die Haut intensiv und die sanfte Massage löst Verspannungen nachhaltig. Die 60-minütige Warmes Kerzenwachs-Massage wirkt tiefenentspannend und hautpflegend und ist für alle Hauttypen geeignet. Die Vorteile umfassen intensive Hautpflege durch warmes Wachs, tiefe Muskelentspannung, ein sinnliches Wellness-Erlebnis, Lösung von Verspannungen und Förderung der Durchblutung. Lassen Sie sich von der warmen, pflegenden Wirkung des Kerzenwachses verwöhnen.', 70.00, 60, 'KZM-60', 'SERVICE-MASSAGE-003', 2, 3, 'kerzenmassage-entspannung', 'Kerzenmassage - Entspannung pur €70 | Warmes Wachs', 'Kerzenmassage: Entspannung mit warmem Kerzenwachs. 60 Min für €70. Intensive Hautpflege und Tiefenentspannung - jetzt buchen!', 'kerzenmassage, warmes wachs, entspannung, hautpflege, wellness, massage');

INSERT INTO services (name, description, price, duration, model, sku, category_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Aromamassage', 'Erleben Sie die heilende Kraft der Natur mit unserer sinnlichen Entspannung mit ätherischen Ölen. Hochwertige ätherische Öle wirken entspannend auf Körper und Geist, während die sanfte Massage Stress abbaut. Die 60-minütige sanfte Aromatherapie-Massage mit hochwertigen ätherischen Ölen sorgt für Entspannung und Stressabbau. Die Wirkung der ätherischen Öle umfasst tiefe Entspannung und Stressabbau, Harmonisierung von Körper und Geist, Verbesserung der Schlafqualität, Stärkung des Immunsystems und Ausgleich des Energiehaushalts. Tauchen Sie ein in die Welt der Düfte und erleben Sie ganzheitliche Entspannung.', 75.00, 60, 'ARM-60', 'SERVICE-MASSAGE-004', 2, 4, 'aromamassage-aetherische-oele', 'Aromamassage mit ätherischen Ölen €75 | 60 Min Entspannung', 'Aromamassage: Entspannung mit hochwertigen ätherischen Ölen. 60 Min für €75. Stressabbau und Wellness - jetzt buchen!', 'aromamassage, ätherische öle, entspannung, stressabbau, aromatherapie');

INSERT INTO services (name, description, price, duration, model, sku, category_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Sportmassage', 'Unsere therapeutische Massage für Sportler und aktive Menschen ist speziell für Sportler und aktive Menschen entwickelt. Spezielle Techniken lockern verspannte Muskulatur und fördern die Regeneration nach intensivem Training. Die 60-minütige therapeutische Sportmassage richtet sich an Sportler und aktive Menschen mit Fokus auf Muskelregeneration und Leistungssteigerung. Die Vorteile für Sportler umfassen schnellere Regeneration nach dem Training, Lösung von Muskelverspannungen, Verbesserung der Flexibilität, Vorbeugung von Verletzungen und Optimierung der sportlichen Leistung. Steigern Sie Ihre Leistung und verkürzen Sie Ihre Regenerationszeit.', 80.00, 60, 'SPM-60', 'SERVICE-MASSAGE-005', 2, 5, 'sportmassage-regeneration', 'Sportmassage - Regeneration für Sportler €80 | 60 Min', 'Sportmassage: Therapeutische Massage für Sportler. 60 Min für €80. Schnellere Regeneration und bessere Leistung - jetzt buchen!', 'sportmassage, regeneration, sportler, muskelregeneration, training, leistung');

-- Fußpflege Services
INSERT INTO services (name, description, price, duration, model, sku, category_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Nagelpilzbehandlung', 'Professionelle Therapie für gesunde Nägel mit schonender und effektiver Behandlung von Nagelpilz mit modernsten Methoden für dauerhafte Gesundheit Ihrer Nägel. Die 45-minütige Behandlung nutzt modernste Therapieverfahren mit schonender und effektiver Wirkung für nachhaltige Nagelgesundheit und professionelle Pflege.', 45.00, 45, 'NPB-45', 'SERVICE-FUSSPFLEGE-001', 3, 1, 'nagelpilzbehandlung-therapie', 'Nagelpilzbehandlung - Professionelle Therapie €45', 'Professionelle Nagelpilzbehandlung mit modernsten Methoden. 45 Min für €45. Schonend und effektiv - jetzt buchen!', 'nagelpilz, behandlung, therapie, fußpflege, gesunde nägel');

-- Maniküre Services
INSERT INTO services (name, description, price, duration, model, sku, category_id, sort_order, seo_url, meta_title, meta_description, meta_keywords) VALUES
('Klassische Maniküre', 'Traditionelle Handpflege für gepflegte Nägel mit umfassender Pflege von Nägeln, Nagelhaut und Händen für ein perfektes Erscheinungsbild. Die 45-minütige Behandlung umfasst Nagelpflege, Nagelhautpflege und entspannende Handmassage für gepflegte, schöne Hände und ein perfektes Gesamtbild.', 35.00, 45, 'KLM-45', 'SERVICE-MANIKUERE-001', 4, 1, 'klassische-manikuere-handpflege', 'Klassische Maniküre - Handpflege €35 | 45 Min', 'Klassische Maniküre: Professionelle Handpflege für gepflegte Nägel. 45 Min für €35. Traditionelle Pflege - jetzt buchen!', 'klassische maniküre, handpflege, nagelpflege, gepflegte nägel');