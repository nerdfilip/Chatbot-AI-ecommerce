from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os

app = Flask(__name__)
CORS(app)

# def get_db():
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

@app.route("/api/products", methods=["GET"])
def get_products():
    search   = request.args.get("search", "")
    category = request.args.get("category", "")
    page     = int(request.args.get("page", 1))
    limit    = int(request.args.get("limit", 12))
    offset   = (page - 1) * limit

    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        query  = "SELECT product_id, product_name, category, price, stock_status, description FROM products WHERE 1=1"
        params = []

        if search:
            query += " AND LOWER(product_name) LIKE LOWER(%s)"
            params.append(f"%{search}%")

        if category:
            query += " AND category = %s"
            params.append(category)

        # total count
        cur.execute("SELECT COUNT(*) FROM ({}) AS sub".format(query), params)
        total = cur.fetchone()[0]

        # paginated results
        query += " ORDER BY product_name LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        products = []
        for row in rows:
            products.append({
                "id":          row[0],
                "name":        row[1],
                "category":    row[2],
                "price":       float(row[3]) if row[3] else 0,
                "stock":       row[4],
                "description": row[5] or ""
            })

        return jsonify({"products": products, "total": total, "page": page})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/categories", methods=["GET"])
def get_categories():
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("SELECT DISTINCT category FROM products ORDER BY category")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"categories": [r[0] for r in rows]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<product_id>", methods=["GET"])
def get_product(product_id):
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("""
            SELECT product_id, product_name, category, price, stock_status, description
            FROM products WHERE product_id = %s
        """, (product_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if row:
            return jsonify({
                "id":          row[0],
                "name":        row[1],
                "category":    row[2],
                "price":       float(row[3]) if row[3] else 0,
                "stock":       row[4],
                "description": row[5] or ""
            })
        return jsonify({"error": "Product not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)