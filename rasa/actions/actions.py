import os
import re
import psycopg2
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker, FormValidationAction
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction
from rasa_sdk.types import DomainDict

# ── Conexiune PostgreSQL ──────────────────────────────────────────
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "chatbot_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres")
    )

def normalize_order_id(value: str) -> str:
    """Normalizeaza order_id: 017 -> ORD017, ord017 -> ORD017"""
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

    def validate_product_name(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:

        value = str(slot_value).strip()

        # fraze prea scurte sau evident nu sunt produse
        if len(value) < 3:
            dispatcher.utter_message(
                text="Va rog specificati un nume de produs valid."
            )
            return {"product_name": None}

        return {"product_name": value}

class ValidateOrderForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_order_form"

    def validate_order_id(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:

        value = str(slot_value).strip()

        if len(value) > 20 and not re.match(r'^[a-f0-9]{32}$', value):
            return {"order_id": None, "requested_slot": None}

        if re.match(r'^\d+$', value):
            candidate = "ORD" + value.zfill(3)
            try:
                conn = get_db_connection()
                cur  = conn.cursor()
                cur.execute("SELECT order_id FROM orders WHERE order_id = %s", (candidate,))
                row = cur.fetchone()
                cur.close()
                conn.close()
                if row:
                    dispatcher.utter_message(
                        text="Am inteles - numarul comenzii tale este {}. Verific acum...".format(candidate)
                    )
                    return {"order_id": candidate}
            except Exception:
                pass
            return {"order_id": "ORD" + value}

        if re.match(r'^ORD\d+$', value, re.IGNORECASE):
            return {"order_id": value.upper()}

        if re.match(r'^[a-f0-9]{32}$', value, re.IGNORECASE):
            return {"order_id": value.lower()}

        dispatcher.utter_message(
            text="Numarul '{}' nu pare valid. Furnizati numarul comenzii, de exemplu: ORD017 sau 017".format(value)
        )
        return {"order_id": None}


class ValidateReturnForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_return_form"

    def validate_order_id(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:

        value = str(slot_value).strip()

        if len(value) > 20 and not re.match(r'^[a-f0-9]{32}$', value):
            return {"order_id": None, "requested_slot": None}

        if re.match(r'^\d+$', value):
            return {"order_id": "ORD" + value.zfill(3)}

        if re.match(r'^ORD\d+$', value, re.IGNORECASE):
            return {"order_id": value.upper()}

        if re.match(r'^[a-f0-9]{32}$', value, re.IGNORECASE):
            return {"order_id": value.lower()}

        dispatcher.utter_message(
            text="Numarul '{}' nu pare valid. Exemplu: ORD017 sau 017".format(value)
        )
        return {"order_id": None}


class ValidateCancelForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_cancel_form"

    def validate_order_id(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:

        value = str(slot_value).strip()

        if len(value) > 20 and not re.match(r'^[a-f0-9]{32}$', value):
            return {"order_id": None, "requested_slot": None}

        if re.match(r'^\d+$', value):
            return {"order_id": "ORD" + value.zfill(3)}

        if re.match(r'^ORD\d+$', value, re.IGNORECASE):
            return {"order_id": value.upper()}

        if re.match(r'^[a-f0-9]{32}$', value, re.IGNORECASE):
            return {"order_id": value.lower()}

        dispatcher.utter_message(
            text="Numarul '{}' nu pare valid. Exemplu: ORD008 sau 008".format(value)
        )
        return {"order_id": None}


# ══════════════════════════════════════════════════════════════════
# ACTIONS
# ══════════════════════════════════════════════════════════════════

class ActionTrackOrder(Action):

    def name(self) -> Text:
        return "action_track_order"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        order_id = tracker.get_slot("order_id")
        email    = tracker.get_slot("email")
        latest_text = (tracker.latest_message.get("text") or "").lower()
        delivered_not_arrived = bool(re.search(
            r"(nu\s+a\s+ajuns|nu\s+am\s+primit|n-am\s+primit|n.?am\s+primit|didn'?t\s+arrive|not\s+arrived|missing)",
            latest_text,
            re.IGNORECASE,
        ))

        # normalizeaza: 017 -> ORD017
        if order_id:
            order_id = normalize_order_id(order_id)

        # fallback din ultimul mesaj
        if not order_id:
            last_message = tracker.latest_message.get("text", "").strip()
            match = re.search(r'\b(ORD\d+|[a-f0-9]{32}|\d{5,})\b', last_message, re.IGNORECASE)
            if match:
                order_id = match.group().upper()
            elif re.match(r'^\d{2,}$', last_message):
                order_id = "ORD" + last_message.zfill(3)

        if not order_id and not email:
            dispatcher.utter_message(
                text="Va rog sa furnizati numarul exact, de exemplu: ORD017 sau 017."
            )
            return []

        try:
            conn = get_db_connection()
            cur  = conn.cursor()

            if order_id:
                cur.execute("""
                    SELECT order_id, status, estimated_delivery, tracking_code
                    FROM orders WHERE order_id = %s
                """, (order_id,))
            else:
                cur.execute("""
                    SELECT o.order_id, o.status, o.estimated_delivery, o.tracking_code
                    FROM orders o
                    JOIN customers c ON o.customer_id = c.customer_id
                    WHERE c.email = %s
                    ORDER BY o.order_date DESC LIMIT 1
                """, (email,))

            row = cur.fetchone()
            cur.close()
            conn.close()

            if row:
                oid, status, estimated_delivery, tracking_code = row
                status_map = {
                    "delivered":   "Livrata",
                    "shipped":     "In tranzit",
                    "processing":  "In procesare",
                    "canceled":    "Anulata",
                    "invoiced":    "Facturata",
                    "unavailable": "Indisponibila"
                }
                status_ro = status_map.get(status, status)
                data      = estimated_delivery.strftime("%d.%m.%Y") if estimated_delivery else "Necunoscuta"
                tracking  = tracking_code if tracking_code else "Nedisponibil"

                if status == "delivered":
                    if delivered_not_arrived:
                        dispatcher.utter_message(
                            text="Comanda #{}\n"
                                 "Status: {} \u2713\n"
                                 "Data livrare estimata: {}\n"
                                 "Cod tracking: {}\n\n"
                                 "Inteleg ca nu a ajuns coletul, desi apare livrat.\n"
                                 "Va rugam sa verificati la vecini sau la asociatia de bloc.\n"
                                 "Folositi codul de tracking ({}) si sunati direct la agentia de curierat pentru confirmare.".format(oid, status_ro, data, tracking, tracking)
                        )
                        dispatcher.utter_message(
                            text="Va transfer acum catre un agent uman pentru investigatie si asistenta dedicata."
                        )
                        return [FollowupAction("action_escalate")]
                    dispatcher.utter_message(
                        text="Comanda #{}\n"
                             "Status: {} \u2713\n"
                             "Data livrare estimata: {}\n"
                             "Cod tracking: {}\n\n"
                             "Daca nu ati primit coletul, verificati:\n"
                             "- La vecini sau la asociatia de bloc\n"
                             "- Codul de tracking pe site-ul curierului\n\n"
                             "Daca tot nu il gasiti, scrieti 'vreau ajutor' si deschidem o investigatie.".format(oid, status_ro, data, tracking)
                    )
                elif status == "shipped":
                    dispatcher.utter_message(
                        text="Comanda #{}\n"
                             "Status: {} \U0001f69a\n"
                             "Data estimata livrare: {}\n"
                             "Cod tracking: {}\n\n"
                             "Comanda este pe drum.\n"
                             "Daca termenul trece fara livrare, scrieti 'problema livrare'.".format(oid, status_ro, data, tracking)
                    )
                elif status == "processing":
                    dispatcher.utter_message(
                        text="Comanda #{}\n"
                             "Status: {} \u23f3\n"
                             "Data estimata livrare: {}\n\n"
                             "Comanda este in procesare - curand va fi preluata de curier.\n"
                             "Veti primi un email cu codul de tracking cand pleaca.".format(oid, status_ro, data)
                    )
                elif status == "canceled":
                    dispatcher.utter_message(
                        text="Comanda #{}\n"
                             "Status: {} \u2717\n\n"
                             "Comanda a fost anulata.\n"
                             "Daca aceasta anulare va surprinde, este posibil sa fi fost anulata din greseala.\n"
                             "Puteti plasa oricand o comanda noua pe site.\n"
                             "Va rugam sa plasati o noua comanda pe site.".format(oid, status_ro)
                    )
                else:
                    dispatcher.utter_message(
                        text="Comanda #{}\n"
                             "Status: {}\n"
                             "Data estimata livrare: {}\n"
                             "Cod tracking: {}".format(oid, status_ro, data, tracking)
                    )
            else:
                dispatcher.utter_message(
                    text="Nu am gasit comanda #{}.\n\n"
                         "Verificati ca:\n"
                         "- Numarul comenzii e corect (ex: ORD017)\n"
                         "- Sau furnizati emailul cu care ati plasat comanda".format(order_id)
                )

        except Exception as e:
            dispatcher.utter_message(
                text="Imi pare rau, nu pot accesa datele comenzii momentan. "
                     "Va transfer catre un agent uman."
            )

        return []


class ActionInitiateReturn(Action):

    def name(self) -> Text:
        return "action_initiate_return"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        order_id = tracker.get_slot("order_id")

        if order_id:
            order_id = normalize_order_id(order_id)

        if not order_id:
            for event in reversed(list(tracker.events)):
                if event.get("event") == "slot" and event.get("name") == "order_id":
                    order_id = event.get("value")
                    break

        if not order_id:
            dispatcher.utter_message(
                text="Pentru a initia un retur am nevoie de numarul comenzii. "
                     "Va rog furnizati-l (ex: ORD017 sau 017)."
            )
            return []

        try:
            conn = get_db_connection()
            cur  = conn.cursor()
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
                dispatcher.utter_message(
                    text="Comanda #{} are statusul '{}' si nu poate fi returnata momentan.\n"
                         "Returul este disponibil doar pentru comenzile livrate.".format(order_id, row[1])
                )
            else:
                dispatcher.utter_message(
                    text="Nu am gasit comanda #{}. Verificati numarul comenzii.".format(order_id)
                )

        except Exception:
            dispatcher.utter_message(
                text="A aparut o eroare la procesarea returului. "
                     "Va transfer catre un agent uman."
            )

        return []


class ActionCancelOrder(Action):

    def name(self) -> Text:
        return "action_cancel_order"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

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
            dispatcher.utter_message(
                text="Am nevoie de numarul comenzii pentru a o anula. "
                     "Furnizati-l va rog (ex: ORD008 sau 008)."
            )
            return []

        try:
            conn = get_db_connection()
            cur  = conn.cursor()
            cur.execute("SELECT order_id, status FROM orders WHERE order_id = %s", (order_id,))
            row = cur.fetchone()

            if not row:
                dispatcher.utter_message(
                    text="Nu am gasit comanda #{}. Verificati numarul comenzii.".format(order_id)
                )
                cur.close()
                conn.close()
                return []

            status = row[1]

            if status in ("processing", "invoiced"):
                cur.execute(
                    "UPDATE orders SET status = 'canceled' WHERE order_id = %s",
                    (order_id,)
                )
                conn.commit()
                cur.close()
                conn.close()
                dispatcher.utter_message(
                    text="Comanda #{} a fost anulata cu succes.\n"
                         "Daca ati platit online, rambursarea se va efectua\n"
                         "in 3-5 zile lucratoare pe metoda de plata folosita.".format(order_id)
                )
                # reseteaza slotul dupa anulare reusita
                return [SlotSet("order_id", None)]

            elif status == "shipped":
                dispatcher.utter_message(
                    text="Comanda #{} este deja in tranzit.\n"
                         "Nu mai poate fi anulata in acest moment.\n\n"
                         "Optiunile disponibile:\n"
                         "- Refuzati coletul la livrare - va fi returnat automat\n"
                         "- Acceptati livrarea si initiati un retur in 14 zile\n\n"
                         "Doriti sa va transfer la un agent pentru asistenta?".format(order_id)
                )
            elif status == "delivered":
                dispatcher.utter_message(
                    text="Comanda #{} a fost deja livrata.\n"
                         "Nu mai poate fi anulata, dar puteti initia un retur\n"
                         "in termen de 14 zile de la primire.\n\n"
                         "Scrieti 'vreau retur' pentru a incepe procesul.".format(order_id)
                )
            elif status == "canceled":
                dispatcher.utter_message(
                    text="Comanda #{} este deja anulata.\n"
                         "Daca ati anulat-o din greseala, va rugam sa plasati o noua comanda pe site.".format(order_id)
                )
            else:
                dispatcher.utter_message(
                    text="Comanda #{} are statusul '{}' si nu poate fi anulata automat.\n"
                         "Va transfer la un agent pentru asistenta.".format(order_id, status)
                )

            cur.close()
            conn.close()

        except Exception:
            dispatcher.utter_message(
                text="A aparut o eroare la procesarea anularii. "
                     "Va transfer catre un agent uman."
            )

        return []


class ActionCheckStock(Action):

    def name(self) -> Text:
        return "action_check_stock"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        product_name = tracker.get_slot("product_name")

        try:
            conn = get_db_connection()
            cur  = conn.cursor()

            if product_name:
                cur.execute("""
                    SELECT product_name, stock_status, category, price
                    FROM products
                    WHERE LOWER(product_name) LIKE LOWER(%s)
                    LIMIT 3
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
                    dispatcher.utter_message(
                        text="Nu am gasit produsul '{}' in catalog.\n"
                             "Verificati denumirea sau contactati un agent.".format(product_name)
                    )
            else:
                dispatcher.utter_message(
                    text="Va rog sa specificati numele produsului pe care il cautati."
                )

            cur.close()
            conn.close()

        except Exception:
            dispatcher.utter_message(
                text="Nu pot verifica stocul in acest moment. "
                     "Incercati din nou sau contactati un agent."
            )

        return []


class ActionDeliveryHelp(Action):

    def name(self) -> Text:
        return "action_delivery_help"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

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
                cur  = conn.cursor()
                cur.execute("""
                    SELECT order_id, status, estimated_delivery, tracking_code
                    FROM orders WHERE order_id = %s
                """, (order_id,))
                row = cur.fetchone()
                cur.close()
                conn.close()

                if row:
                    oid, status, estimated_delivery, tracking_code = row
                    data     = estimated_delivery.strftime("%d.%m.%Y") if estimated_delivery else "Necunoscuta"
                    tracking = tracking_code if tracking_code else "Nedisponibil"

                    if status == "delivered":
                        dispatcher.utter_message(
                            text="Am verificat comanda #{}:\n"
                                 "Status: Livrata\n"
                                 "Data estimata: {}\n"
                                 "Cod tracking: {}\n\n"
                                 "Sistemul arata ca a fost livrata. Va recomandam:\n"
                                 "1. Verificati la vecini sau asociatia de bloc\n"
                                 "2. Verificati tracking-ul pe site-ul curierului\n"
                                 "3. Daca tot nu gasiti coletul, deschidem o investigatie\n\n"
                                 "Doriti sa va transfer la un agent?".format(oid, data, tracking)
                        )
                    else:
                        dispatcher.utter_message(
                            text="Am verificat comanda #{}:\n"
                                 "Status: {}\n"
                                 "Data estimata: {}\n"
                                 "Cod tracking: {}\n\n"
                                 "1. Verificati codul de tracking la curier\n"
                                 "2. Daca intarzie mai mult de 3 zile, deschidem o investigatie\n"
                                 "3. Daca produsul a sosit deteriorat, fotografiati ambalajul\n\n"
                                 "Doriti sa va transfer la un agent?".format(oid, status, data, tracking)
                        )
                    return []

            except Exception:
                pass

        dispatcher.utter_message(
            text="Imi pare rau pentru neplacerile cauzate. Iata ce puteti face:\n\n"
                 "1. Verificati codul de tracking la curier\n"
                 "2. Daca comanda intarzie mai mult de 3 zile, putem deschide o investigatie\n"
                 "3. Daca produsul a sosit deteriorat, fotografiati ambalajul\n\n"
                 "Furnizati numarul comenzii pentru verificare detaliata."
        )
        return []


class ActionWarrantyInfo(Action):

    def name(self) -> Text:
        return "action_warranty_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            conn = get_db_connection()
            cur  = conn.cursor()
            cur.execute("""
                SELECT answer FROM faq_entries
                WHERE category = 'garantie'
                ORDER BY id LIMIT 1
            """)
            row = cur.fetchone()
            cur.close()
            conn.close()

            if row:
                dispatcher.utter_message(text=row[0])
            else:
                dispatcher.utter_message(
                    text="Produsele beneficiaza de garantie legala de minimum 2 ani.\n"
                         "Pentru service in garantie, contactati cel mai apropiat\n"
                         "centru autorizat sau returnati produsul prin curier.\n"
                         "Aveti nevoie de factura de cumparare."
                )

        except Exception:
            dispatcher.utter_message(
                text="Produsele beneficiaza de garantie legala de 2 ani. "
                     "Pentru detalii suplimentare, contactati un agent."
            )

        return []


class ActionPaymentHelp(Action):

    def name(self) -> Text:
        return "action_payment_help"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

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

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

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

    # mapare cuvinte cheie -> categorie in DB
    CATEGORY_MAP = {
        'ceas': 'smartwatch', 'smartwatch': 'smartwatch', 'watch': 'smartwatch',
        'telefon': 'telefoane', 'smartphone': 'telefoane', 'mobil': 'telefoane',
        'laptop': 'laptopuri', 'notebook': 'laptopuri', 'calculator': 'laptopuri',
        'televizor': 'televizoare', 'tv': 'televizoare', 'tele': 'televizoare',
        'tableta': 'tablete', 'ipad': 'tablete',
        'aspirator': 'electrocasnice mici', 'robot': 'electrocasnice mici',
        'frigider': 'electrocasnice mari', 'masina de spalat': 'electrocasnice mari',
        'casti': 'audio', 'boxa': 'audio', 'audio': 'audio', 'speaker': 'audio',
        'gaming': 'gaming', 'consola': 'gaming', 'playstation': 'gaming', 'xbox': 'gaming',
        'monitor': 'monitoare', 'ecran': 'monitoare',
        'cafetiera': 'electrocasnice mici', 'espressor': 'electrocasnice mici',
        'camera': 'foto-video', 'foto': 'foto-video', 'drona': 'foto-video',
    }

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        last_message = tracker.latest_message.get("text", "").lower()

        # detecteaza categoria din mesaj
        detected_category = None
        for keyword, category in self.CATEGORY_MAP.items():
            if keyword in last_message:
                detected_category = category
                break

        try:
            conn = get_db_connection()
            cur  = conn.cursor()

            if detected_category:
                cur.execute("""
                    SELECT product_name, price, stock_status
                    FROM products
                    WHERE category = %s AND stock_status = 'instock'
                    ORDER BY price DESC
                    LIMIT 3
                """, (detected_category,))
            else:
                # fara categorie detectata — arata produse populare
                cur.execute("""
                    SELECT product_name, price, stock_status
                    FROM products
                    WHERE stock_status = 'instock'
                    ORDER BY price DESC
                    LIMIT 3
                """)

            rows = cur.fetchall()
            cur.close()
            conn.close()

            if rows:
                if detected_category:
                    mesaj = "Iata cateva produse din categoria '{}':\n\n".format(detected_category)
                else:
                    mesaj = "Iata cateva produse disponibile:\n\n"

                for i, row in enumerate(rows, 1):
                    stoc = "In stoc" if row[2] == "instock" else "Indisponibil"
                    pret = "{:.2f} RON".format(float(row[1])) if row[1] else "Pret indisponibil"
                    mesaj += "{}. {} — {} ({})\n".format(i, row[0], pret, stoc)

                mesaj += "\nPuteti cauta mai multe produse direct pe pagina."
                dispatcher.utter_message(text=mesaj)
            else:
                dispatcher.utter_message(
                    text="Nu am gasit produse disponibile in aceasta categorie momentan."
                )

        except Exception as e:
            dispatcher.utter_message(
                text="Nu pot accesa catalogul in acest moment. Incercati sa cautati direct pe pagina."
            )

        return []