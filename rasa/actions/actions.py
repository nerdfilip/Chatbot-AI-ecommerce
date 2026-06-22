import os
import re
import psycopg2
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker, FormValidationAction
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction
from rasa_sdk.types import DomainDict

# def get_db_connection():
#     return psycopg2.connect(
#         host=os.getenv("DB_HOST", "localhost"),
#         port=os.getenv("DB_PORT", "5432"),
#         dbname=os.getenv("DB_NAME", "chatbot_db"),
#         user=os.getenv("DB_USER", "postgres"),
#         password=os.getenv("DB_PASSWORD", "postgres")
#     )

def get_db_connection():
    return psycopg2.connect(
        "postgresql://postgres.edpxrivqoveheytqsxlo:postgres123.@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"
    )

def normalize_order_id(value: str) -> str:
    value = value.strip()
    if re.match(r'^\d+$', value):
        return "ORD" + value.zfill(3)
    if re.match(r'^ORD\d+$', value, re.IGNORECASE):
        return value.upper()
    return value


# ══════════════════════════════════════════════════════════════════
# FORM VALIDATORS
# ══════════════════════════════════════════════════════════════════

class ValidateProductForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_product_form"

    def validate_product_name(self, slot_value, dispatcher, tracker, domain):
        value = str(slot_value).strip()
        if len(value) < 3:
            dispatcher.utter_message(text="Va rog specificati un nume de produs valid.")
            return {"product_name": None}
        return {"product_name": value}


class ValidateOrderForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_order_form"

    def validate_order_id(self, slot_value, dispatcher, tracker, domain):
        value = str(slot_value).strip()
        value_lower = value.lower()

        negative_phrases = [
            'nu am', 'nu stiu', 'nu am comanda', 'fara comanda',
            'nu am numar', 'nu am id', 'nu am numarul', 'nu am ordine',
            'nu stiu numarul', 'nu il stiu', 'nu mai stiu'
        ]
        if any(phrase in value_lower for phrase in negative_phrases):
            dispatcher.utter_message(
                text="Inteleg! Puteti verifica numarul comenzii in emailul de confirmare. Cu ce altceva va pot ajuta?"
            )
            return {"order_id": None, "requested_slot": None}

        if len(value) > 20 and not re.match(r'^[a-f0-9]{32}$', value):
            dispatcher.utter_message(text="Va rog sa furnizati doar numarul comenzii, de exemplu: ORD017 sau 017.")
            return {"order_id": None}

        if re.match(r'^\d+$', value):
            candidate = "ORD" + value.zfill(3)
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("SELECT order_id FROM orders WHERE order_id = %s", (candidate,))
                row = cur.fetchone()
                cur.close()
                conn.close()
                if row:
                    dispatcher.utter_message(text="Am inteles - numarul comenzii tale este {}. Verific acum...".format(candidate))
                    return {"order_id": candidate}
            except Exception:
                pass
            return {"order_id": "ORD" + value}

        if re.match(r'^ORD\d+$', value, re.IGNORECASE):
            return {"order_id": value.upper()}

        if re.match(r'^[a-f0-9]{32}$', value, re.IGNORECASE):
            return {"order_id": value.lower()}

        dispatcher.utter_message(text="Numarul '{}' nu pare valid. Furnizati numarul comenzii, de exemplu: ORD017 sau 017.".format(value))
        return {"order_id": None}


class ValidateReturnForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_return_form"

    def validate_order_id(self, slot_value, dispatcher, tracker, domain):
        value = str(slot_value).strip()
        if len(value) > 20 and not re.match(r'^[a-f0-9]{32}$', value):
            return {"order_id": None, "requested_slot": None}
        if re.match(r'^\d+$', value):
            return {"order_id": "ORD" + value.zfill(3)}
        if re.match(r'^ORD\d+$', value, re.IGNORECASE):
            return {"order_id": value.upper()}
        if re.match(r'^[a-f0-9]{32}$', value, re.IGNORECASE):
            return {"order_id": value.lower()}
        dispatcher.utter_message(text="Numarul '{}' nu pare valid. Exemplu: ORD017 sau 017".format(value))
        return {"order_id": None}


class ValidateCancelForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_cancel_form"

    def validate_order_id(self, slot_value, dispatcher, tracker, domain):
        value = str(slot_value).strip()
        if len(value) > 20 and not re.match(r'^[a-f0-9]{32}$', value):
            return {"order_id": None, "requested_slot": None}
        if re.match(r'^\d+$', value):
            return {"order_id": "ORD" + value.zfill(3)}
        if re.match(r'^ORD\d+$', value, re.IGNORECASE):
            return {"order_id": value.upper()}
        if re.match(r'^[a-f0-9]{32}$', value, re.IGNORECASE):
            return {"order_id": value.lower()}
        dispatcher.utter_message(text="Numarul '{}' nu pare valid. Exemplu: ORD008 sau 008".format(value))
        return {"order_id": None}


# ══════════════════════════════════════════════════════════════════
# ACTIONS
# ══════════════════════════════════════════════════════════════════

class ActionTrackOrder(Action):

    def name(self) -> Text:
        return "action_track_order"

    def run(self, dispatcher, tracker, domain):
        order_id = tracker.get_slot("order_id")
        email = tracker.get_slot("email")
        latest_text = (tracker.latest_message.get("text") or "").lower()
        delivered_not_arrived = bool(re.search(
            r"(nu\s+a\s+ajuns|nu\s+am\s+primit|n-am\s+primit|missing)",
            latest_text, re.IGNORECASE,
        ))

        if order_id:
            order_id = normalize_order_id(order_id)

        if not order_id:
            last_message = tracker.latest_message.get("text", "").strip()
            match = re.search(r'\b(ORD\d+|[a-f0-9]{32}|\d{5,})\b', last_message, re.IGNORECASE)
            if match:
                order_id = match.group().upper()
            elif re.match(r'^\d{2,}$', last_message):
                order_id = "ORD" + last_message.zfill(3)

        if not order_id and not email:
            dispatcher.utter_message(text="Va rog sa furnizati numarul exact, de exemplu: ORD017 sau 017.")
            return []

        try:
            conn = get_db_connection()
            cur = conn.cursor()
            if order_id:
                cur.execute("SELECT order_id, status, estimated_delivery, tracking_code FROM orders WHERE order_id = %s", (order_id,))
            else:
                cur.execute("""
                    SELECT o.order_id, o.status, o.estimated_delivery, o.tracking_code
                    FROM orders o JOIN customers c ON o.customer_id = c.customer_id
                    WHERE c.email = %s ORDER BY o.order_date DESC LIMIT 1
                """, (email,))
            row = cur.fetchone()
            cur.close()
            conn.close()

            if row:
                oid, status, estimated_delivery, tracking_code = row
                status_map = {
                    "delivered": "Livrata", "shipped": "In tranzit",
                    "processing": "In procesare", "canceled": "Anulata",
                    "invoiced": "Facturata", "unavailable": "Indisponibila"
                }
                status_ro = status_map.get(status, status)
                data = estimated_delivery.strftime("%d.%m.%Y") if estimated_delivery else "Necunoscuta"
                tracking = tracking_code if tracking_code else "Nedisponibil"

                if status == "delivered":
                    if delivered_not_arrived:
                        dispatcher.utter_message(
                            text="Comanda #{}\nStatus: {} \u2713\nData livrare estimata: {}\nCod tracking: {}\n\n"
                                 "Inteleg ca nu a ajuns coletul, desi apare livrat.\n"
                                 "Va rugam sa verificati la vecini sau la asociatia de bloc.\n"
                                 "Sunati direct la agentia de curierat cu codul {}.".format(oid, status_ro, data, tracking, tracking)
                        )
                        dispatcher.utter_message(text="Va transfer acum catre un agent uman pentru investigatie.")
                        return [FollowupAction("action_escalate")]
                    dispatcher.utter_message(
                        text="Comanda #{}\nStatus: {} \u2713\nData livrare estimata: {}\nCod tracking: {}\n\n"
                             "Daca nu ati primit coletul, verificati:\n"
                             "- La vecini sau la asociatia de bloc\n"
                             "- Codul de tracking pe site-ul curierului\n\n"
                             "Daca tot nu il gasiti, apasati butonul de mai jos pentru a contacta un agent.".format(oid, status_ro, data, tracking)
                    )
                elif status == "shipped":
                    dispatcher.utter_message(
                        text="Comanda #{}\nStatus: {} \U0001f69a\nData estimata livrare: {}\nCod tracking: {}\n\n"
                             "Comanda este pe drum.\nDaca termenul a trecut fara livrare, apasati butonul de mai jos pentru a contacta un agent.".format(oid, status_ro, data, tracking)
                    )
                elif status == "processing":
                    dispatcher.utter_message(
                        text="Comanda #{}\nStatus: {} \u23f3\nData estimata livrare: {}\n\n"
                             "Comanda este in procesare - curand va fi preluata de curier.\n"
                             "Veti primi un email cu codul de tracking cand pleaca.".format(oid, status_ro, data)
                    )
                elif status == "canceled":
                    dispatcher.utter_message(
                        text="Comanda #{}\nStatus: {} \u2717\n\n"
                             "Comanda a fost anulata.\n"
                             "Daca aceasta anulare va surprinde, puteti plasa oricand o noua comanda pe site.".format(oid, status_ro)
                    )
                else:
                    dispatcher.utter_message(
                        text="Comanda #{}\nStatus: {}\nData estimata livrare: {}\nCod tracking: {}".format(oid, status_ro, data, tracking)
                    )
            else:
                dispatcher.utter_message(
                    text="Nu am gasit comanda #{}.\n\nVerificati ca:\n- Numarul comenzii e corect (ex: ORD017)\n- Sau furnizati emailul cu care ati plasat comanda".format(order_id)
                )
        except Exception:
            dispatcher.utter_message(text="Imi pare rau, nu pot accesa datele comenzii momentan. Va transfer catre un agent uman.")

        return []


class ActionInitiateReturn(Action):

    def name(self) -> Text:
        return "action_initiate_return"

    def run(self, dispatcher, tracker, domain):
        order_id = tracker.get_slot("order_id")
        if order_id:
            order_id = normalize_order_id(order_id)
        if not order_id:
            for event in reversed(list(tracker.events)):
                if event.get("event") == "slot" and event.get("name") == "order_id":
                    order_id = event.get("value")
                    break
        if not order_id:
            dispatcher.utter_message(text="Pentru a initia un retur am nevoie de numarul comenzii. Va rog furnizati-l (ex: ORD017 sau 017).")
            return []
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT order_id, status FROM orders WHERE order_id = %s", (order_id,))
            row = cur.fetchone()
            cur.close()
            conn.close()
            if row and row[1] == "delivered":
                dispatcher.utter_message(
                    text="Am inregistrat cererea de retur pentru comanda #{}.\n"
                         "Veti primi un email cu eticheta de retur in 24 de ore.\n"
                         "Produsul trebuie trimis in termen de 14 zile.\n"
                         "Transportul la retur este GRATUIT.".format(order_id)
                )
            elif row:
                dispatcher.utter_message(text="Comanda #{} are statusul '{}' si nu poate fi returnata momentan.\nReturul este disponibil doar pentru comenzile livrate.".format(order_id, row[1]))
            else:
                dispatcher.utter_message(text="Nu am gasit comanda #{}. Verificati numarul comenzii.".format(order_id))
        except Exception:
            dispatcher.utter_message(text="A aparut o eroare la procesarea returului. Va transfer catre un agent uman.")
        return []


class ActionCancelOrder(Action):

    def name(self) -> Text:
        return "action_cancel_order"

    def run(self, dispatcher, tracker, domain):
        order_id = tracker.get_slot("order_id")
        if order_id:
            order_id = normalize_order_id(order_id)
        if not order_id:
            for event in reversed(list(tracker.events)):
                if event.get("event") == "slot" and event.get("name") == "order_id":
                    order_id = event.get("value")
                    if order_id:
                        order_id = normalize_order_id(order_id)
                    break
        if not order_id:
            dispatcher.utter_message(text="Am nevoie de numarul comenzii pentru a o anula. Furnizati-l va rog (ex: ORD008 sau 008).")
            return []
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT order_id, status FROM orders WHERE order_id = %s", (order_id,))
            row = cur.fetchone()
            if not row:
                dispatcher.utter_message(text="Nu am gasit comanda #{}. Verificati numarul comenzii.".format(order_id))
                cur.close()
                conn.close()
                return []
            status = row[1]
            if status in ("processing", "invoiced"):
                cur.execute("UPDATE orders SET status = 'canceled' WHERE order_id = %s", (order_id,))
                conn.commit()
                cur.close()
                conn.close()
                dispatcher.utter_message(
                    text="Comanda #{} a fost anulata cu succes.\n"
                         "Daca ati platit online, rambursarea se va efectua in 3-5 zile lucratoare.".format(order_id)
                )
                return [SlotSet("order_id", None)]
            elif status == "shipped":
                dispatcher.utter_message(
                    text="Comanda #{} este deja in tranzit.\nNu mai poate fi anulata.\n\n"
                         "Optiunile disponibile:\n- Refuzati coletul la livrare\n- Initiati un retur in 14 zile\n\n"
                         "Doriti sa va transfer la un agent?".format(order_id)
                )
            elif status == "delivered":
                dispatcher.utter_message(
                    text="Comanda #{} a fost deja livrata.\nPuteti initia un retur in termen de 14 zile.\n\nScrieti 'vreau retur'.".format(order_id)
                )
            elif status == "canceled":
                dispatcher.utter_message(
                    text="Comanda #{} este deja anulata.\nDaca ati anulat-o din greseala, va rugam sa plasati o noua comanda pe site.".format(order_id)
                )
            else:
                dispatcher.utter_message(text="Comanda #{} are statusul '{}' si nu poate fi anulata automat.".format(order_id, status))
            cur.close()
            conn.close()
        except Exception:
            dispatcher.utter_message(text="A aparut o eroare la procesarea anularii. Va transfer catre un agent uman.")
        return []


class ActionCheckStock(Action):

    def name(self) -> Text:
        return "action_check_stock"

    def run(self, dispatcher, tracker, domain):
        product_name = tracker.get_slot("product_name")
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            if product_name:
                cur.execute("""
                    SELECT product_name, stock_status, category, price FROM products
                    WHERE LOWER(product_name) LIKE LOWER(%s) LIMIT 3
                """, ("%{}%".format(product_name),))
                rows = cur.fetchall()
                if rows:
                    mesaj = "Am gasit urmatoarele produse:\n"
                    for row in rows:
                        stoc = "In stoc" if row[1] == "instock" else "Indisponibil"
                        pret = "{} RON".format(row[3]) if row[3] else "Pret indisponibil"
                        mesaj += "- {} ({}) - {} - {}\n".format(row[0], row[2], stoc, pret)
                    dispatcher.utter_message(text=mesaj)
                else:
                    dispatcher.utter_message(text="Nu am gasit produsul '{}' in catalog.".format(product_name))
            else:
                dispatcher.utter_message(text="Va rog sa specificati numele produsului pe care il cautati.")
            cur.close()
            conn.close()
        except Exception:
            dispatcher.utter_message(text="Nu pot verifica stocul in acest moment.")
        return []


class ActionDeliveryHelp(Action):

    def name(self) -> Text:
        return "action_delivery_help"

    def run(self, dispatcher, tracker, domain):
        order_id = tracker.get_slot("order_id")
        if order_id:
            order_id = normalize_order_id(order_id)
        if not order_id:
            for event in reversed(list(tracker.events)):
                if event.get("event") == "slot" and event.get("name") == "order_id":
                    order_id = event.get("value")
                    break
        if order_id:
            try:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("SELECT order_id, status, estimated_delivery, tracking_code FROM orders WHERE order_id = %s", (order_id,))
                row = cur.fetchone()
                cur.close()
                conn.close()
                if row:
                    oid, status, estimated_delivery, tracking_code = row
                    data = estimated_delivery.strftime("%d.%m.%Y") if estimated_delivery else "Necunoscuta"
                    tracking = tracking_code if tracking_code else "Nedisponibil"
                    if status == "delivered":
                        dispatcher.utter_message(
                            text="Am verificat comanda #{}:\nStatus: Livrata\nData estimata: {}\nCod tracking: {}\n\n"
                                 "Va recomandam:\n1. Verificati la vecini sau asociatia de bloc\n"
                                 "2. Verificati tracking-ul pe site-ul curierului\n3. Daca tot nu gasiti coletul, deschidem o investigatie\n\n"
                                 "Doriti sa va transfer la un agent?".format(oid, data, tracking)
                        )
                    else:
                        dispatcher.utter_message(
                            text="Am verificat comanda #{}:\nStatus: {}\nData estimata: {}\nCod tracking: {}\n\n"
                                 "1. Verificati codul de tracking la curier\n2. Daca intarzie mai mult de 3 zile, deschidem o investigatie\n\n"
                                 "Doriti sa va transfer la un agent?".format(oid, status, data, tracking)
                        )
                    return []
            except Exception:
                pass
        dispatcher.utter_message(
            text="Imi pare rau pentru neplacerile cauzate.\n\n"
                 "1. Verificati codul de tracking la curier\n"
                 "2. Daca comanda intarzie mai mult de 3 zile, putem deschide o investigatie\n\n"
                 "Furnizati numarul comenzii pentru verificare detaliata."
        )
        return []


class ActionWarrantyInfo(Action):

    def name(self) -> Text:
        return "action_warranty_info"

    def run(self, dispatcher, tracker, domain):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT answer FROM faq_entries WHERE category = 'garantie' ORDER BY id LIMIT 1")
            row = cur.fetchone()
            cur.close()
            conn.close()
            if row:
                dispatcher.utter_message(text=row[0])
            else:
                dispatcher.utter_message(text="Produsele beneficiaza de garantie legala de minimum 2 ani.\nPentru service, contactati cel mai apropiat centru autorizat.")
        except Exception:
            dispatcher.utter_message(text="Produsele beneficiaza de garantie legala de 2 ani. Pentru detalii, contactati un agent.")
        return []


class ActionPaymentHelp(Action):

    def name(self) -> Text:
        return "action_payment_help"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text="Pentru probleme de plata, iata pasii recomandati:\n\n"
                 "Card refuzat - verificati daca aveti fonduri suficiente si daca platile online sunt activate\n"
                 "Debit dublu - suma va fi returnata automat in 3-5 zile lucratoare\n"
                 "Factura lipsa - verificati folderul Spam sau solicitati retransmiterea\n\n"
                 "Aveti nevoie de ajutorul unui agent uman?"
        )
        return []


class ActionEscalate(Action):

    def name(self) -> Text:
        return "action_escalate"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text="Va transfer catre un agent uman.\n"
                 "Timpul estimat de asteptare: 5-10 minute.\n"
                 "Program: Luni-Vineri, 09:00-18:00.\n\n"
                 "Alternativ, ne puteti contacta la:\n"
                 "suport@magazin.ro\n"
                 "0800 123 456 (gratuit)"
        )
        return [SlotSet("order_id", None), SlotSet("product_name", None)]


class ActionRecommendProduct(Action):

    def name(self) -> Text:
        return "action_recommend_product"

    CATEGORY_MAP = {
        'cafetiera': 'electrocasnice mici',
        'espressor': 'electrocasnice mici',
        'blender': 'electrocasnice mici',
        'mixer': 'electrocasnice mici',
        'fierbator': 'electrocasnice mici',
        'prajitor': 'electrocasnice mici',
        'friteuza': 'electrocasnice mici',
        'aspirator': 'electrocasnice mici',
        'fier de calcat': 'electrocasnice mici',
        'telefon': 'telefoane',
        'smartphone': 'telefoane',
        'iphone': 'telefoane',
        'laptop': 'laptopuri',
        'notebook': 'laptopuri',
        'macbook': 'laptopuri',
        'televizor': 'televizoare',
        'tv': 'televizoare',
        'frigider': 'electrocasnice mari',
        'masina de spalat': 'electrocasnice mari',
        'cuptor': 'electrocasnice mari',
        'plita': 'electrocasnice mari',
        'tableta': 'tablete',
        'ipad': 'tablete',
        'smartwatch': 'smartwatch',
        'ceas inteligent': 'smartwatch',
        'casti': 'audio',
        'boxa': 'audio',
        'speaker': 'audio',
        'soundbar': 'audio',
        'monitor': 'monitoare',
        'gaming': 'gaming',
        'consola': 'gaming',
        'playstation': 'gaming',
        'xbox': 'gaming',
        'nintendo': 'gaming',
        'camera': 'foto-video',
        'drona': 'foto-video',
        'router': 'retea',
        'ssd': 'stocare',
        'hdd': 'stocare',
        'aer conditionat': 'climatizare',
        'incarcator': 'accesorii',
        'husa': 'accesorii',
        'powerbank': 'accesorii',
        'aparat de ras': 'ingrijire personala',
        'epilator': 'ingrijire personala',
        'uscator': 'ingrijire personala',
    }

    # keywords generice — cauta dupa categorie, nu dupa nume
    GENERIC_KEYWORDS = {
        'gaming', 'telefon', 'smartphone', 'laptop', 'notebook',
        'televizor', 'tv', 'tableta', 'smartwatch', 'monitor',
        'casti', 'boxa', 'speaker', 'router', 'ssd', 'hdd',
        'camera', 'consola', 'frigider', 'aspirator',
    }

    BRAND_KEYWORDS = [
        'apple', 'samsung', 'sony', 'lg', 'philips', 'bosch',
        'xiaomi', 'huawei', 'dell', 'hp', 'asus', 'lenovo',
        'dyson', 'nespresso', 'delonghi', 'gorenje', 'indesit',
        'whirlpool', 'beko', 'nokia', 'oppo', 'realme',
        'toshiba', 'panasonic', 'acer', 'msi', 'razer',
        'jbl', 'bose', 'harman', 'logitech', 'corsair',
    ]

    def run(self, dispatcher, tracker, domain):
        last_message = tracker.latest_message.get("text", "").lower()

        # detecteaza brand
        detected_brand = None
        for brand in self.BRAND_KEYWORDS:
            if brand in last_message:
                detected_brand = brand
                break

        # detecteaza categoria si keyword-ul original
        detected_category = None
        detected_keyword = None
        for kw, cat in self.CATEGORY_MAP.items():
            if kw in last_message:
                detected_category = cat
                detected_keyword = kw
                break

        # detecteaza pret maxim — "sub 500 RON" sau "sub 500"
        price_match = re.search(
            r'sub\s+(\d+)\s*(?:ron|lei)?', last_message, re.IGNORECASE
        )
        max_price = float(price_match.group(1)) if price_match else None

        # detecteaza pret minim — "peste 1000 RON"
        price_min_match = re.search(
            r'peste\s+(\d+)\s*(?:ron|lei)?', last_message, re.IGNORECASE
        )
        min_price = float(price_min_match.group(1)) if price_min_match else None

        try:
            conn = get_db_connection()
            cur = conn.cursor()

            conditions = ["stock_status = 'instock'"]
            params = []

            if detected_brand:
                # cauta dupa brand in numele produsului
                conditions.append("LOWER(product_name) LIKE LOWER(%s)")
                params.append("%" + detected_brand + "%")
            elif detected_keyword:
                if detected_keyword in self.GENERIC_KEYWORDS:
                    # keyword generic -> cauta dupa categorie
                    conditions.append("category = %s")
                    params.append(detected_category)
                else:
                    # keyword specific (cafetiera, espressor etc) ->
                    # cauta dupa nume produs ca sa nu intoarca toata categoria
                    conditions.append("LOWER(product_name) LIKE LOWER(%s)")
                    params.append("%" + detected_keyword + "%")

            if max_price:
                conditions.append("price <= %s")
                params.append(max_price)

            if min_price:
                conditions.append("price >= %s")
                params.append(min_price)

            query = (
                "SELECT product_name, price, category FROM products WHERE "
                + " AND ".join(conditions)
                + " ORDER BY price ASC LIMIT 4"
            )

            cur.execute(query, params)
            rows = cur.fetchall()
            cur.close()
            conn.close()

            if rows:
                if detected_brand:
                    mesaj = "Produse din gama {} disponibile".format(
                        detected_brand.capitalize()
                    )
                elif detected_keyword:
                    mesaj = "Produse '{}' disponibile".format(detected_keyword)
                else:
                    mesaj = "Produse disponibile"

                if max_price:
                    mesaj += " sub {} RON".format(int(max_price))
                if min_price:
                    mesaj += " peste {} RON".format(int(min_price))
                mesaj += ":\n\n"

                for i, row in enumerate(rows, 1):
                    mesaj += "{}. {} - {:.0f} RON\n".format(
                        i, row[0], float(row[1])
                    )
                mesaj += "\nPentru mai multe detalii vizitati pagina produsului pe site."
                dispatcher.utter_message(text=mesaj)

            else:
                # daca nu gaseste dupa nume specific, incearca dupa categorie ca fallback
                if detected_keyword and detected_keyword not in self.GENERIC_KEYWORDS:
                    try:
                        conn2 = get_db_connection()
                        cur2 = conn2.cursor()
                        fallback_conditions = [
                            "stock_status = 'instock'",
                            "category = %s"
                        ]
                        fallback_params = [detected_category]
                        if max_price:
                            fallback_conditions.append("price <= %s")
                            fallback_params.append(max_price)
                        fallback_query = (
                            "SELECT product_name, price, category FROM products WHERE "
                            + " AND ".join(fallback_conditions)
                            + " ORDER BY price ASC LIMIT 4"
                        )
                        cur2.execute(fallback_query, fallback_params)
                        fallback_rows = cur2.fetchall()
                        cur2.close()
                        conn2.close()

                        if fallback_rows:
                            mesaj = "Nu am gasit '{}' exact, dar in categoria '{}' am:\n\n".format(
                                detected_keyword, detected_category
                            )
                            for i, row in enumerate(fallback_rows, 1):
                                mesaj += "{}. {} - {:.0f} RON\n".format(
                                    i, row[0], float(row[1])
                                )
                            mesaj += "\nPentru mai multe detalii vizitati pagina produsului pe site."
                            dispatcher.utter_message(text=mesaj)
                            return []
                    except Exception:
                        pass

                dispatcher.utter_message(
                    text="Nu am gasit produse disponibile pentru cautarea ta"
                         + (" sub {} RON".format(int(max_price)) if max_price else "")
                         + ".\nIncearca alte criterii sau cauta direct pe site."
                )

        except Exception as e:
            print("[RecommendProduct] Eroare: {}".format(e))
            dispatcher.utter_message(
                text="Nu pot accesa catalogul momentan. "
                     "Cautati direct pe pagina site-ului."
            )

        return []


class ActionFallbackLLM(Action):

    def name(self) -> Text:
        return "action_fallback_llm"

    # cuvinte cheie care indica o intrebare despre produse
    PRODUCT_KEYWORDS = [
        'cafetiera', 'espressor', 'telefon', 'laptop', 'televizor', 'frigider',
        'aspirator', 'tableta', 'smartwatch', 'ceas', 'casti', 'boxa', 'speaker',
        'monitor', 'gaming', 'consola', 'camera foto', 'drona', 'imprimanta',
        'router', 'ssd', 'hdd', 'procesor', 'placa video', 'sursa', 'carcasa',
        'masina de spalat', 'cuptor', 'hota', 'plita', 'uscator', 'aer conditionat',
        'purificator', 'umidificator', 'termostat', 'priza inteligenta',
        'aparat de ras', 'epilator', 'periuta', 'uscator par',
        'recomanda', 'cumpar', 'disponibil', 'pret', 'stoc', 'ieftin', 'scump',
        'produs', 'model', 'brand', 'samsung', 'apple', 'sony', 'lg', 'bosch',
        'philips', 'xiaomi', 'huawei', 'dell', 'hp', 'asus', 'lenovo', 'dyson',
        'nespresso', 'delonghi', 'gorenje', 'indesit', 'whirlpool', 'beko',
    ]

    CATEGORY_MAP = {
        'cafetiera': 'electrocasnice mici',
        'espressor': 'electrocasnice mici',
        'blender': 'electrocasnice mici',
        'mixer': 'electrocasnice mici',
        'friteuza': 'electrocasnice mici',
        'fierbator': 'electrocasnice mici',
        'prajitor': 'electrocasnice mici',
        'aspirator': 'electrocasnice mici',
        'fier de calcat': 'electrocasnice mici',
        'telefon': 'telefoane',
        'smartphone': 'telefoane',
        'iphone': 'telefoane',
        'laptop': 'laptopuri',
        'notebook': 'laptopuri',
        'macbook': 'laptopuri',
        'televizor': 'televizoare',
        'frigider': 'electrocasnice mari',
        'masina de spalat': 'electrocasnice mari',
        'cuptor': 'electrocasnice mari',
        'plita': 'electrocasnice mari',
        'hota': 'electrocasnice mari',
        'uscator rufe': 'electrocasnice mari',
        'tableta': 'tablete',
        'ipad': 'tablete',
        'smartwatch': 'smartwatch',
        'ceas': 'smartwatch',
        'casti': 'audio',
        'boxa': 'audio',
        'speaker': 'audio',
        'soundbar': 'audio',
        'monitor': 'monitoare',
        'gaming': 'gaming',
        'consola': 'gaming',
        'playstation': 'gaming',
        'xbox': 'gaming',
        'nintendo': 'gaming',
        'camera': 'foto-video',
        'drona': 'foto-video',
        'gopro': 'foto-video',
        'router': 'retea',
        'ssd': 'stocare',
        'hdd': 'stocare',
        'procesor': 'componente PC',
        'placa video': 'componente PC',
        'aer conditionat': 'climatizare',
        'purificator': 'climatizare',
        'umidificator': 'climatizare',
        'incarcator': 'accesorii',
        'cablu': 'accesorii',
        'husa': 'accesorii',
        'powerbank': 'accesorii',
        'aparat de ras': 'ingrijire personala',
        'epilator': 'ingrijire personala',
        'periuta': 'ingrijire personala',
        'uscator par': 'ingrijire personala',
    }

    # cuvinte de ignorat la cautarea in nume produs
    STOP_WORDS = {
        'recomanda', 'mi', 'o', 'un', 'una', 'sub', 'peste', 'ron', 'lei',
        'pret', 'cumpar', 'vreau', 'am', 'nevoie', 'de', 'la', 'si', 'sau',
        'cu', 'in', 'pe', 'pentru', 'care', 'ce', 'mai', 'bun', 'buna',
        'ieftin', 'scump', 'disponibil', 'aveti', 'avem', 'este', 'are',
        'cel', 'cea', 'the', 'a', 'an', 'bune', 'bun', 'ok', 'okay',
        'sa', 'ma', 'te', 'va', 'ii', 'le', 'ne', 'se', 'imi', 'iti',
        'puteti', 'putea', 'pot', 'poti', 'vrei', 'vreti', 'cauta',
    }

    def run(self, dispatcher, tracker, domain):
        user_message = tracker.latest_message.get("text", "")
        user_lower = user_message.lower().strip()

        # verifica daca e o intrebare despre produse
        is_product_question = any(kw in user_lower for kw in self.PRODUCT_KEYWORDS)

        if is_product_question:
            try:
                conn = get_db_connection()
                cur = conn.cursor()

                # extrage pret maxim din mesaj daca exista (ex: "sub 1000 RON")
                price_match = re.search(r'sub\s+(\d+)\s*(?:ron|lei)?', user_lower, re.IGNORECASE)
                max_price = float(price_match.group(1)) if price_match else None

                # extrage pret minim daca exista (ex: "peste 500 RON")
                price_min_match = re.search(r'peste\s+(\d+)\s*(?:ron|lei)?', user_lower, re.IGNORECASE)
                min_price = float(price_min_match.group(1)) if price_min_match else None

                # detecteaza categoria din mesaj
                detected_category = None
                for kw, cat in self.CATEGORY_MAP.items():
                    if kw in user_lower:
                        detected_category = cat
                        break

                # extrage cuvinte cheie pentru cautare in numele produsului
                words = re.findall(r'\b\w+\b', user_lower)
                search_terms = [
                    w for w in words
                    if len(w) > 3 and w not in self.STOP_WORDS
                ]

                # construieste query dinamic
                conditions = ["stock_status = 'instock'"]
                params = []

                # prioritate: cauta in NUMELE produsului daca avem termeni specifici
                # categoria e doar fallback cand nu gasim dupa nume
                name_search_terms = []
                for term in search_terms:
                    # ignora termene generice care nu sunt nume de produs
                    generic_terms = {'recomanda', 'cafetiera', 'espressor', 'televizor',
                                    'telefon', 'laptop', 'tableta', 'monitor', 'aspirator'}
                    if term not in generic_terms and len(term) > 3:
                        name_search_terms.append(term)

                if name_search_terms:
                    # cauta dupa termeni specifici in numele produsului
                    term_conditions = []
                    for term in name_search_terms[:3]:
                        term_conditions.append("LOWER(product_name) LIKE LOWER(%s)")
                        params.append("%" + term + "%")
                    conditions.append("(" + " OR ".join(term_conditions) + ")")
                elif detected_category:
                    # fallback: cauta dupa categorie + cuvant cheie din mesaj
                    conditions.append("category = %s")
                    params.append(detected_category)
                    # adauga si cautare in nume dupa primul keyword relevant
                    for term in search_terms[:1]:
                        conditions.append("LOWER(product_name) LIKE LOWER(%s)")
                        params.append("%" + term + "%")

                if max_price:
                    conditions.append("price <= %s")
                    params.append(max_price)

                if min_price:
                    conditions.append("price >= %s")
                    params.append(min_price)

                query = (
                    "SELECT product_name, price, category, description "
                    "FROM products WHERE " + " AND ".join(conditions) +
                    " ORDER BY price ASC LIMIT 4"
                )

                cur.execute(query, params)
                rows = cur.fetchall()
                cur.close()
                conn.close()

                if rows:
                    mesaj = "Pe site-ul FilipShop avem"
                    if detected_category:
                        mesaj += " in categoria '{}'".format(detected_category)
                    if max_price:
                        mesaj += " sub {} RON".format(int(max_price))
                    if min_price:
                        mesaj += " peste {} RON".format(int(min_price))
                    mesaj += ":\n\n"

                    for i, row in enumerate(rows, 1):
                        name = row[0]
                        price = float(row[1])
                        desc = row[3] or ""
                        # scurteaza descrierea la 70 caractere
                        short_desc = desc[:70] + "..." if len(desc) > 70 else desc
                        mesaj += "{}. {} - {:.0f} RON\n".format(i, name, price)
                        if short_desc:
                            mesaj += "   {}\n".format(short_desc)

                    mesaj += "\nPentru detalii complete si comanda, accesati pagina produsului pe site."
                    dispatcher.utter_message(text=mesaj)
                else:
                    dispatcher.utter_message(
                        text="Nu am gasit produse disponibile pentru cautarea ta"
                             + (" sub {} RON".format(int(max_price)) if max_price else "")
                             + ".\n\nIncearca sa ajustezi criteriile sau cauta direct pe pagina site-ului."
                    )

            except Exception as e:
                print("[FallbackLLM] Eroare DB: {}".format(e))
                dispatcher.utter_message(
                    text="Nu pot accesa catalogul in acest moment. "
                         "Incearca sa cauti direct pe pagina site-ului."
                )

            return []

        # nu e o intrebare despre produse -> mesaj generic cu optiuni
        dispatcher.utter_message(
            text="Imi pare rau, nu am inteles intrebarea ta.\n\n"
                 "Pot sa te ajut cu:\n"
                 "- Statusul comenzii tale\n"
                 "- Retur sau anulare comanda\n"
                 "- Informatii despre garantie\n"
                 "- Problema cu livrarea sau plata\n\n"
                 "Sau scrie 'vreau ajutor' pentru a vorbi cu un agent uman."
        )
        return []