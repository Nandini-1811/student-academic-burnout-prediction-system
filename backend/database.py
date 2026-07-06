from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./burnout.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    mbi_exhaustion = Column(Float)
    mbi_cynicism = Column(Float)
    mbi_efficacy = Column(Float)
    dass_depression = Column(Float)
    dass_anxiety = Column(Float)
    dass_stress = Column(Float)
    cope_score = Column(Float)
    attendance_rate = Column(Float)
    grade_decline_slope = Column(Float)
    assignment_completion_rate = Column(Float)
    late_submission_count = Column(Float)
    lms_login_frequency = Column(Float)
    time_on_task_weekly = Column(Float)
    engagement_variability = Column(Float)

    risk_level = Column(String)
    prob_low = Column(Float)
    prob_medium = Column(Float)
    prob_high = Column(Float)
    top_factors_json = Column(Text)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()