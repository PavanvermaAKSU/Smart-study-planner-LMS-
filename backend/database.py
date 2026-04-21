from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = "mysql+pymysql://root:Pavan%409589@localhost:3306/LMS"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ THIS WAS MISSING
Base = declarative_base()

# ✅ THIS WAS ALSO MISSING
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()