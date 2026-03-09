import psycopg2

DATABASE_URL = 'postgresql://neondb_owner:npg_9RzcLyKdo6fJ@ep-calm-band-ahqd4yn3-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'  # Replace with your actual URL

try:
    conn = psycopg2.connect(DATABASE_URL)
    print('Connected successfully!')
    conn.close()
except Exception as e:
    print(f'Connection failed: {e}')