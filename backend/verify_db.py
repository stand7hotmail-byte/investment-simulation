from sqlalchemy import create_engine, inspect
import os

# Base directory of the backend application
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "test.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables in database: {tables}")

if "affiliate_brokers" in tables:
    print("SUCCESS: 'affiliate_brokers' table exists.")
    columns = [col["name"] for col in inspector.get_columns("affiliate_brokers")]
    print(f"Columns: {columns}")
else:
    print("FAILURE: 'affiliate_brokers' table does NOT exist.")
