-- Clienți
CREATE TABLE IF NOT EXISTS customers (
    customer_id     VARCHAR(50) PRIMARY KEY,
    email           VARCHAR(100),
    city            VARCHAR(100),
    state           VARCHAR(50),
    orders_count    INTEGER DEFAULT 0
);

-- Comenzi
CREATE TABLE IF NOT EXISTS orders (
    order_id            VARCHAR(50) PRIMARY KEY,
    customer_id         VARCHAR(50) REFERENCES customers(customer_id),
    status              VARCHAR(30),
    order_date          TIMESTAMP,
    estimated_delivery  DATE,
    actual_delivery     DATE,
    tracking_code       VARCHAR(50)
);

-- Produse
CREATE TABLE IF NOT EXISTS products (
    product_id      VARCHAR(50) PRIMARY KEY,
    product_name    VARCHAR(200),
    category        VARCHAR(100),
    price           DECIMAL(10,2),
    stock_status    VARCHAR(20) DEFAULT 'instock',
    description     TEXT
);

-- Iteme comandă
CREATE TABLE IF NOT EXISTS order_items (
    id          SERIAL PRIMARY KEY,
    order_id    VARCHAR(50) REFERENCES orders(order_id),
    product_id  VARCHAR(50) REFERENCES products(product_id),
    quantity    INTEGER,
    price       DECIMAL(10,2)
);

-- FAQ
CREATE TABLE IF NOT EXISTS faq_entries (
    id          SERIAL PRIMARY KEY,
    question    TEXT,
    answer      TEXT,
    category    VARCHAR(50),
    language    VARCHAR(10) DEFAULT 'ro'
);

-- Conversații (Tracker Store Rasa)
CREATE TABLE IF NOT EXISTS conversations (
    session_id  VARCHAR(100) PRIMARY KEY,
    intent      VARCHAR(50),
    response    TEXT,
    timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);