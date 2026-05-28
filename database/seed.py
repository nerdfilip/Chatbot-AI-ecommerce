import psycopg2
import pandas as pd
import random
import string

# ── Conexiune ─────────────────────────────────────────────────────
conn = psycopg2.connect(
    host="localhost",
    port="5432",
    dbname="chatbot_db",
    user="postgres",
    password="postgres"
)
cur = conn.cursor()

DATA_DIR = "../data_raw/"

print("=" * 50)
print("  IMPORT DATE OLIST -> PostgreSQL")
print("=" * 50)

# ── 1. Clienti ────────────────────────────────────────────────────
print("\n[1/4] Import clienti...")
customers = pd.read_csv(DATA_DIR + "olist_customers_dataset.csv")
customers = customers.drop_duplicates(subset="customer_id").head(5000)

inserted = 0
for _, row in customers.iterrows():
    try:
        cur.execute(
            "INSERT INTO customers (customer_id, city, state) "
            "VALUES (%s, %s, %s) ON CONFLICT (customer_id) DO NOTHING",
            (row["customer_id"], row["customer_city"], row["customer_state"])
        )
        inserted += 1
    except Exception:
        conn.rollback()

conn.commit()
print(f"    {inserted} clienti importati.")

# ── 2. Comenzi ────────────────────────────────────────────────────
print("\n[2/4] Import comenzi...")
orders = pd.read_csv(DATA_DIR + "olist_orders_dataset.csv")
orders = orders[orders["customer_id"].isin(customers["customer_id"])].head(5000)

def gen_tracking():
    return "TRK" + "".join(random.choices(string.digits, k=10))

inserted = 0
for _, row in orders.iterrows():
    try:
        estimated = pd.to_datetime(row.get("order_estimated_delivery_date"), errors="coerce")
        actual    = pd.to_datetime(row.get("order_delivered_customer_date"), errors="coerce")
        order_dt  = pd.to_datetime(row.get("order_purchase_timestamp"), errors="coerce")

        cur.execute(
            "INSERT INTO orders "
            "(order_id, customer_id, status, order_date, estimated_delivery, actual_delivery, tracking_code) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (order_id) DO NOTHING",
            (
                row["order_id"],
                row["customer_id"],
                row["order_status"],
                None if pd.isna(order_dt)  else order_dt,
                None if pd.isna(estimated) else estimated.date(),
                None if pd.isna(actual)    else actual.date(),
                gen_tracking()
            )
        )
        inserted += 1
    except Exception:
        conn.rollback()

conn.commit()
print(f"    {inserted} comenzi importate.")

# ── 3. Produse ────────────────────────────────────────────────────
print("\n[3/4] Import produse...")
products     = pd.read_csv(DATA_DIR + "olist_products_dataset.csv")
translations = pd.read_csv(DATA_DIR + "product_category_name_translation.csv")
products     = products.merge(translations, on="product_category_name", how="left").head(2000)

inserted = 0
for _, row in products.iterrows():
    try:
        category = row.get("product_category_name_english", row["product_category_name"])
        cur.execute(
            "INSERT INTO products (product_id, category, stock_status) "
            "VALUES (%s, %s, %s) ON CONFLICT (product_id) DO NOTHING",
            (
                row["product_id"],
                str(category) if pd.notna(category) else "general",
                "instock"
            )
        )
        inserted += 1
    except Exception:
        conn.rollback()

conn.commit()
print(f"    {inserted} produse importate.")

# ── 4. FAQ ────────────────────────────────────────────────────────
print("\n[4/4] Import FAQ...")
faq_data = [
    ("Cat dureaza garantia?",
     "Produsele beneficiaza de garantie legala de minimum 2 ani conform legislatiei romane. "
     "Garantia acopera defectele de fabricatie, nu deteriorarile accidentale.",
     "garantie", "ro"),
    ("Cum fac un retur?",
     "Puteti returna produsul in termen de 14 zile calendaristice de la primire, "
     "fara a fi necesara o justificare. Contactati-ne pentru eticheta de retur gratuita.",
     "retur", "ro"),
    ("Cat dureaza livrarea?",
     "Livrarea standard dureaza 2-5 zile lucratoare. "
     "Livrarea rapida (next day) este disponibila in orasele mari.",
     "livrare", "ro"),
    ("Cum platesc in rate?",
     "Puteti plati in rate prin partenerii nostri bancari: "
     "3-12 rate fara dobanda pentru comenzi peste 300 RON.",
     "plata", "ro"),
    ("Cum urmaresc comanda?",
     "Dupa expediere primiti un email cu codul de tracking. "
     "Puteti urmari comanda si in contul dvs. la sectiunea Comenzile mele.",
     "tracking", "ro"),
    ("Ce fac daca produsul e defect?",
     "Daca produsul prezinta defecte la livrare, fotografiati ambalajul si produsul "
     "si contactati-ne in 48 de ore. Vom organiza ridicarea si inlocuirea gratuita.",
     "garantie", "ro"),
    ("Pot schimba adresa de livrare?",
     "Adresa de livrare poate fi modificata doar daca comanda nu a fost inca expediata. "
     "Contactati suportul cat mai repede posibil.",
     "livrare", "ro"),
    ("Metode de plata acceptate?",
     "Acceptam: card bancar (Visa, Mastercard), PayPal, ramburs la livrare si transfer bancar.",
     "plata", "ro"),
]

for question, answer, category, lang in faq_data:
    cur.execute(
        "INSERT INTO faq_entries (question, answer, category, language) "
        "VALUES (%s, %s, %s, %s)",
        (question, answer, category, lang)
    )

conn.commit()
print(f"    {len(faq_data)} intrari FAQ importate.")

# ── Statistici finale ─────────────────────────────────────────────
print("\n" + "=" * 50)
for table in ["customers", "orders", "products", "faq_entries"]:
    cur.execute("SELECT COUNT(*) FROM " + table)
    count = cur.fetchone()[0]
    print(f"  {table:<20} {count:>6} inregistrari")

print("=" * 50)
print("  Import finalizat cu succes!")
print("=" * 50)

cur.close()
conn.close()