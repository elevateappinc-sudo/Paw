-- ─────────────────────────────────────────────────────────────────────────────
-- Semilla del directorio · Bogotá (Chapinero, Usaquén, Cedritos)
-- Negocios FICTICIOS para desarrollo y demo. Reemplazar por la carga real
-- de la ciudad piloto. Ejecutar después de las migraciones 20261007005.
-- ─────────────────────────────────────────────────────────────────────────────

WITH b AS (
  INSERT INTO public.businesses
    (name, type, categories, description, phone, whatsapp, address, neighborhood, city, lat, lng, hours, emergency_24h, price_level, price_from, verified, claimed, writes_history, promo_text, cover_url)
  VALUES
  ('Clínica Huellas', 'veterinaria', '{veterinaria,urgencias}', 'Clínica veterinaria con urgencias 24 horas, laboratorio y cirugía.', '+57 601 555 0101', '573105550101', 'Cra. 15 n.º 93-40', 'Chapinero Alto', 'Bogotá', 4.6765, -74.0485,
    '{"mon":[["08:00","20:00"]],"tue":[["08:00","20:00"]],"wed":[["08:00","20:00"]],"thu":[["08:00","20:00"]],"fri":[["08:00","20:00"]],"sat":[["08:00","18:00"]],"sun":[["09:00","14:00"]]}', true, 3, 80000, true, true, true, NULL, NULL),
  ('Pelos y Patas', 'peluqueria', '{peluqueria}', 'Baño, corte y spa para perros y gatos. Secado sin jaula.', '+57 601 555 0102', '573105550102', 'Cra. 11 n.º 86-30', 'Chapinero Alto', 'Bogotá', 4.6702, -74.0548,
    '{"mon":[["09:00","19:00"]],"tue":[["09:00","19:00"]],"wed":[["09:00","19:00"]],"thu":[["09:00","19:00"]],"fri":[["09:00","19:00"]],"sat":[["08:00","17:00"]]}', false, 2, 45000, true, true, true, 'Primer baño con 20 % menos', NULL),
  ('Animalia Tienda', 'tienda', '{tienda,farmacia}', 'Alimento, farmacia veterinaria y accesorios con entrega el mismo día.', '+57 601 555 0103', '573105550103', 'Cl. 85 n.º 12-15', 'Chapinero Alto', 'Bogotá', 4.6688, -74.0531,
    '{"mon":[["08:00","21:00"]],"tue":[["08:00","21:00"]],"wed":[["08:00","21:00"]],"thu":[["08:00","21:00"]],"fri":[["08:00","21:00"]],"sat":[["08:00","21:00"]],"sun":[["10:00","18:00"]]}', false, 2, 12000, false, false, false, 'Entrega hoy', NULL),
  ('Dr. Pata Veterinaria', 'veterinaria', '{veterinaria}', 'Consulta general, vacunación y odontología.', '+57 601 555 0104', '573105550104', 'Cra. 7 n.º 70-20', 'Chapinero', 'Bogotá', 4.6560, -74.0580,
    '{"mon":[["08:00","18:00"]],"tue":[["08:00","18:00"]],"wed":[["08:00","18:00"]],"thu":[["08:00","18:00"]],"fri":[["08:00","18:00"]],"sat":[["09:00","13:00"]]}', false, 2, 60000, true, true, true, NULL, NULL),
  ('Guardería Parque Canino', 'guarderia', '{guarderia,paseador}', 'Guardería de día con patio y paseos grupales.', '+57 601 555 0105', '573105550105', 'Cl. 72 n.º 9-55', 'Chapinero', 'Bogotá', 4.6598, -74.0601,
    '{"mon":[["07:00","19:00"]],"tue":[["07:00","19:00"]],"wed":[["07:00","19:00"]],"thu":[["07:00","19:00"]],"fri":[["07:00","19:00"]]}', false, 2, 40000, false, true, false, NULL, NULL),
  ('Julián Entrena', 'entrenador', '{entrenador}', 'Obediencia básica, socialización y modificación de conducta. Clases a domicilio y en parque.', '+57 601 555 0106', '573105550106', 'Parque de los Hippies', 'Chapinero', 'Bogotá', 4.6538, -74.0617,
    '{"mon":[["07:00","12:00"],["15:00","19:00"]],"wed":[["07:00","12:00"],["15:00","19:00"]],"sat":[["07:00","12:00"]]}', false, 2, 70000, true, true, false, NULL, NULL),
  ('Paseos Felices', 'paseador', '{paseador}', 'Paseos individuales y grupales con reporte por WhatsApp.', '+57 601 555 0107', '573105550107', 'Cl. 90 n.º 14-20', 'Chicó', 'Bogotá', 4.6730, -74.0520,
    '{"mon":[["06:00","18:00"]],"tue":[["06:00","18:00"]],"wed":[["06:00","18:00"]],"thu":[["06:00","18:00"]],"fri":[["06:00","18:00"]],"sat":[["07:00","12:00"]]}', false, 1, 25000, false, true, false, NULL, NULL),
  ('Café Bigotes', 'pet_friendly', '{pet_friendly}', 'Café con terraza, agua para perros y menú para mascotas.', '+57 601 555 0108', NULL, 'Cra. 4a n.º 57-30', 'Chapinero', 'Bogotá', 4.6440, -74.0620,
    '{"mon":[["08:00","20:00"]],"tue":[["08:00","20:00"]],"wed":[["08:00","20:00"]],"thu":[["08:00","20:00"]],"fri":[["08:00","22:00"]],"sat":[["09:00","22:00"]],"sun":[["09:00","18:00"]]}', false, 2, NULL, false, false, false, NULL, NULL),
  ('Veterinaria Usaquén 24h', 'urgencias', '{urgencias,veterinaria}', 'Urgencias y hospitalización las 24 horas.', '+57 601 555 0109', '573105550109', 'Cra. 6 n.º 117-20', 'Usaquén', 'Bogotá', 4.6950, -74.0310,
    NULL, true, 3, 120000, true, true, true, NULL, NULL),
  ('Spa Canino Cedritos', 'peluqueria', '{peluqueria}', 'Peluquería canina y felina con recogida a domicilio.', '+57 601 555 0110', '573105550110', 'Cl. 140 n.º 11-45', 'Cedritos', 'Bogotá', 4.7230, -74.0400,
    '{"mon":[["09:00","18:00"]],"tue":[["09:00","18:00"]],"wed":[["09:00","18:00"]],"thu":[["09:00","18:00"]],"fri":[["09:00","18:00"]],"sat":[["09:00","15:00"]]}', false, 2, 50000, false, true, true, NULL, NULL),
  ('MascoMarket Chicó', 'tienda', '{tienda}', 'Alimento premium, juguetes y camas. Programa de recompra.', '+57 601 555 0111', '573105550111', 'Cl. 93 n.º 13-10', 'Chicó', 'Bogotá', 4.6760, -74.0505,
    '{"mon":[["09:00","20:00"]],"tue":[["09:00","20:00"]],"wed":[["09:00","20:00"]],"thu":[["09:00","20:00"]],"fri":[["09:00","20:00"]],"sat":[["09:00","20:00"]],"sun":[["10:00","17:00"]]}', false, 3, 15000, false, false, false, NULL, NULL),
  ('Farmacia Vet Express', 'farmacia', '{farmacia,tienda}', 'Medicamentos veterinarios con receta y antiparasitarios.', '+57 601 555 0112', '573105550112', 'Cra. 13 n.º 79-35', 'Chapinero', 'Bogotá', 4.6650, -74.0570,
    '{"mon":[["08:00","20:00"]],"tue":[["08:00","20:00"]],"wed":[["08:00","20:00"]],"thu":[["08:00","20:00"]],"fri":[["08:00","20:00"]],"sat":[["08:00","18:00"]]}', false, 2, 20000, true, true, false, NULL, NULL),
  ('Adiós con Amor', 'funeraria', '{funeraria}', 'Cremación individual y acompañamiento.', '+57 601 555 0113', '573105550113', 'Av. Cl. 100 n.º 19-50', 'Chicó', 'Bogotá', 4.6830, -74.0490,
    NULL, true, 3, 250000, true, true, false, NULL, NULL),
  ('Gatos y Más', 'veterinaria', '{veterinaria,peluqueria}', 'Clínica exclusiva para gatos. Ambiente sin perros.', '+57 601 555 0114', '573105550114', 'Cl. 65 n.º 5-40', 'Chapinero', 'Bogotá', 4.6490, -74.0600,
    '{"mon":[["09:00","18:00"]],"tue":[["09:00","18:00"]],"wed":[["09:00","18:00"]],"thu":[["09:00","18:00"]],"fri":[["09:00","18:00"]],"sat":[["09:00","13:00"]]}', false, 2, 70000, true, true, true, NULL, NULL),
  ('Hotel Canino El Virrey', 'guarderia', '{guarderia}', 'Hospedaje por noche con cámaras y paseos diarios.', '+57 601 555 0115', '573105550115', 'Cl. 88 n.º 15-60', 'Chicó', 'Bogotá', 4.6710, -74.0500,
    '{"mon":[["07:00","20:00"]],"tue":[["07:00","20:00"]],"wed":[["07:00","20:00"]],"thu":[["07:00","20:00"]],"fri":[["07:00","20:00"]],"sat":[["08:00","20:00"]],"sun":[["08:00","20:00"]]}', false, 3, 60000, true, true, false, NULL, NULL)
  RETURNING id, name
)
INSERT INTO public.business_services (business_id, name, description, price, duration_min, care_cycle_kind, care_cycle_name, sort)
SELECT b.id, s.name, s.description, s.price, s.duration_min, s.kind::care_cycle_kind, s.cycle_name, s.sort
  FROM b
  JOIN (VALUES
    ('Clínica Huellas', 'Consulta general', '30 min · crea registro de consulta', 80000, 30, 'checkup', 'Control veterinario', 1),
    ('Clínica Huellas', 'Vacuna antirrábica', '15 min · completa el ciclo Rabia', 45000, 15, 'vaccine', 'Antirrábica', 2),
    ('Clínica Huellas', 'Vacuna polivalente', '15 min', 55000, 15, 'vaccine', 'Polivalente (múltiple)', 3),
    ('Clínica Huellas', 'Desparasitación', '15 min', 30000, 15, 'deworm_internal', 'Desparasitación interna', 4),
    ('Clínica Huellas', 'Urgencia 24 h', 'Sin cita · triage en 10 min', 150000, 60, NULL, NULL, 5),
    ('Pelos y Patas', 'Baño + uñas', '75 min · completa 2 ciclos de higiene', 70000, 75, 'bath', 'Baño', 1),
    ('Pelos y Patas', 'Baño', '45 min · secado y perfume', 45000, 45, 'bath', 'Baño', 2),
    ('Pelos y Patas', 'Corte completo', '90 min · incluye baño', 95000, 90, 'grooming', 'Corte de pelo', 3),
    ('Pelos y Patas', 'Uñas', '15 min', 20000, 15, 'nails', 'Uñas', 4),
    ('Dr. Pata Veterinaria', 'Consulta general', '30 min', 60000, 30, 'checkup', 'Control veterinario', 1),
    ('Dr. Pata Veterinaria', 'Vacuna antirrábica', '15 min', 40000, 15, 'vaccine', 'Antirrábica', 2),
    ('Dr. Pata Veterinaria', 'Limpieza dental', '60 min · con sedación', 220000, 60, 'dental', 'Dientes', 3),
    ('Guardería Parque Canino', 'Día de guardería', '8 h con paseo', 40000, 480, NULL, NULL, 1),
    ('Guardería Parque Canino', 'Paseo grupal', '45 min', 18000, 45, NULL, NULL, 2),
    ('Julián Entrena', 'Clase individual', '60 min a domicilio', 70000, 60, NULL, NULL, 1),
    ('Julián Entrena', 'Clase grupal en parque', '60 min · máx. 6 perros', 35000, 60, NULL, NULL, 2),
    ('Paseos Felices', 'Paseo individual', '45 min', 25000, 45, NULL, NULL, 1),
    ('Veterinaria Usaquén 24h', 'Urgencia', 'Triage inmediato', 120000, 60, NULL, NULL, 1),
    ('Spa Canino Cedritos', 'Baño', '45 min', 50000, 45, 'bath', 'Baño', 1),
    ('Spa Canino Cedritos', 'Corte', '90 min', 100000, 90, 'grooming', 'Corte de pelo', 2),
    ('Gatos y Más', 'Consulta felina', '30 min', 70000, 30, 'checkup', 'Control veterinario', 1),
    ('Gatos y Más', 'Triple felina', '15 min', 50000, 15, 'vaccine', 'Triple felina', 2),
    ('Hotel Canino El Virrey', 'Noche de hospedaje', 'Incluye 2 paseos', 60000, 1440, NULL, NULL, 1)
  ) AS s(biz, name, description, price, duration_min, kind, cycle_name, sort) ON s.biz = b.name;

-- Eventos de ejemplo (próximas semanas)
INSERT INTO public.events (organizer_name, title, description, category, starts_at, ends_at, address, city, lat, lng, price, cover_url, species)
VALUES
  ('Fundación Patitas', 'Jornada de adopción · Parque El Virrey', '32 perros y 15 gatos buscan familia. Trae tu cédula.', 'adopcion', date_trunc('week', now()) + interval '5 days 9 hours', date_trunc('week', now()) + interval '5 days 14 hours', 'Parque El Virrey, Cl. 88 con Cra. 15', 'Bogotá', 4.6738, -74.0528, 0, NULL, '{perro,gato}'),
  ('Club Trote Canino', 'Canicross 5K · Parque Simón Bolívar', 'Carrera con tu perro. Inscripción hasta el viernes. Vacunas al día obligatorias.', 'carrera', date_trunc('week', now()) + interval '6 days 7 hours', date_trunc('week', now()) + interval '6 days 10 hours', 'Parque Simón Bolívar, entrada Cl. 63', 'Bogotá', 4.6580, -74.0940, 35000, NULL, '{perro}'),
  ('Julián Entrena', 'Clase grupal de obediencia básica', '6 cupos. Perros de todas las edades.', 'clase', date_trunc('week', now()) + interval '9 days 18 hours 30 minutes', date_trunc('week', now()) + interval '9 days 19 hours 30 minutes', 'Parque de los Hippies', 'Bogotá', 4.6538, -74.0617, 35000, NULL, '{perro}'),
  ('Feria Pet Friendly Usaquén', 'Feria Pet Friendly · Usaquén', '40 marcas y vacunación gratuita con Clínica Huellas.', 'feria', date_trunc('week', now()) + interval '12 days 10 hours', date_trunc('week', now()) + interval '12 days 18 hours', 'Plaza de Usaquén', 'Bogotá', 4.6955, -74.0313, 0, NULL, '{perro,gato}');
