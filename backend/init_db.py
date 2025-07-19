from backend.models import Base
from backend.database import engine

Base.metadata.create_all(bind=engine)
print("Database and tables created!") 