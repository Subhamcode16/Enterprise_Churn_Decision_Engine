"""
VALENCE Persistence & Database Layer
SQLAlchemy 2.0 ORM with SQLite local storage and PostgreSQL cloud compatibility.
"""

import os
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import (
    create_engine, 
    Column, 
    Integer, 
    String, 
    Float, 
    Boolean, 
    DateTime, 
    Text,
    event
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/valence.db")

# Ensure data directory exists for SQLite
if DATABASE_URL.startswith("sqlite"):
    os.makedirs("./data", exist_ok=True)
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()
        except Exception:
            pass
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """Operator / Executive User Account for RBAC"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    salt = Column(String(64), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="operator", nullable=False)  # admin, operator, executive
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime, nullable=True)


class TenantVault(Base):
    """Isolated Tenant Encrypted Workspace Records"""
    __tablename__ = "tenant_vaults"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(100), index=True, nullable=False)
    data_source = Column(String(50), nullable=False)  # csv, stripe, salesforce
    records_count = Column(Integer, default=0, nullable=False)
    encrypted_payload = Column(Text, nullable=True)
    schema_status = Column(String(50), default="verified", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class DispatchedPlaybookRecord(Base):
    """Audit Trail for SLA Retention Actions"""
    __tablename__ = "dispatched_playbooks"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String(100), index=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    playbook_id = Column(String(50), nullable=False)
    priority = Column(String(20), default="P0", nullable=False)
    assignee_role = Column(String(100), default="Customer Success", nullable=False)
    sla_hours = Column(Integer, default=4, nullable=False)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    deadline_at = Column(DateTime, nullable=True)


class AccountNoteRecord(Base):
    """Collaborative Notes on Enterprise Accounts"""
    __tablename__ = "account_notes"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String(100), index=True, nullable=False)
    author = Column(String(255), default="CS Lead", nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class ModelTelemetryRecord(Base):
    """ML Training Telemetry and Model Evaluation Logs"""
    __tablename__ = "model_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False)
    recall = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    total_training_samples = Column(Integer, nullable=False)
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class AuditLog(Base):
    """Security & Access Audit Trail"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


# Initialize Database Tables
def init_db():
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Backward compatibility aliases
PlaybookExecution = DispatchedPlaybookRecord
