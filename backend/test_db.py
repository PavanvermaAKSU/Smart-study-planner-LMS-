from backend.database import engine

try:
    connection = engine.connect()
    print("Database Connected Successfully")
except:
    print("Connection Failed")