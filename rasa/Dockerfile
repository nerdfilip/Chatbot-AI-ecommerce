FROM rasa/rasa:3.6.0

WORKDIR /app

COPY . .

USER root
RUN pip install psycopg2-binary flask flask-cors

USER 1001

CMD ["run", "--enable-api", "--cors", "*", "-p", "5005"]