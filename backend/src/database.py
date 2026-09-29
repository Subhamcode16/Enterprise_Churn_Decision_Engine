"""
Database Persistence & Audit Trail Manager for CHURNIQ.
Supports PostgreSQL (Production) and SQLite (Local Development fallback).
"""

import os
from datetime import datetime, timedelta
from typing import Generator
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Local fallback to SQLite database in backend/data/
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "data", "churniq_audit.db")
    DATABASE_URL = f"sqlite:///{db_path}"

# Fix for postgres:// prefix on some cloud providers
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class DispatchedPlaybookRecord(Base):
    """Audit log of retention workflows dispatched."""
    __tablename__ = "dispatched_playbooks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    account_id = Column(String(64), index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    playbook_id = Column(String(64), nullable=False)
    priority = Column(String(16), default="P0")
    assignee_role = Column(String(128), default="Customer Success")
    sla_hours = Column(Integer, default=4)
    status = Column(String(32), default="active")  # active, completed, escalated
    created_at = Column(DateTime, default=datetime.utcnow)
    deadline_at = Column(DateTime, nullable=True)


class AccountNoteRecord(Base):
    """CS team collaboration notes per enterprise account."""
    __tablename__ = "account_notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    account_id = Column(String(64), index=True, nullable=False)
    author = Column(String(128), default="Revenue Director")
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ModelTelemetryRecord(Base):
    """Audit log of ML training runs & performance metrics."""
    __tablename__ = "model_telemetry"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_version = Column(String(64), nullable=False)
    recall = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    total_training_samples = Column(Integer, default=12000)
    trained_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Create tables if they do not exist."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
