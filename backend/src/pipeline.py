"""
Feature Engineering & Preprocessing Pipeline
Handles feature definitions, transformations, scaling, and categorical encoding.
"""

import os
import joblib
import pandas as pd
import numpy as np
from typing import List, Tuple
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Numerical feature columns for model input
NUMERICAL_FEATURES: List[str] = [
    "contract_mrr",
    "tenure_months",
    "days_since_last_login",
    "usage_change_pct_30d",
    "active_user_ratio",
    "api_calls_monthly",
    "open_p1_tickets",
    "avg_resolution_time_hrs",
    "nps_score",
    "csat_score",
    "payment_failures_past_quarter",
    "days_until_renewal",
    "auto_renew_enabled"
]

# Categorical feature columns for model input
CATEGORICAL_FEATURES: List[str] = [
    "contract_tier"
]

ALL_MODEL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = "churned"

FEATURE_DISPLAY_NAMES = {
    "contract_mrr": "Contract MRR ($)",
    "tenure_months": "Account Tenure (Months)",
    "days_since_last_login": "Days Since Last Login",
    "usage_change_pct_30d": "Usage Change (30d %)",
    "active_user_ratio": "Active User Ratio",
    "api_calls_monthly": "Monthly API Calls",
    "open_p1_tickets": "Open P1 Support Tickets",
    "avg_resolution_time_hrs": "Avg Support Resolution Time (Hrs)",
    "nps_score": "Net Promoter Score (NPS)",
    "csat_score": "Customer Satisfaction (CSAT)",
    "payment_failures_past_quarter": "Payment Failures (Past Qtr)",
    "days_until_renewal": "Days Until Contract Renewal",
    "auto_renew_enabled": "Auto-Renew Status",
    "contract_tier": "Contract Tier"
}

def build_preprocessor() -> ColumnTransformer:
    """
    Constructs an sklearn ColumnTransformer with RobustScaler and OneHotEncoder.
    """
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", RobustScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERICAL_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )

    return preprocessor

def get_transformed_feature_names(preprocessor: ColumnTransformer) -> List[str]:
    """
    Retrieves the full list of output feature names after ColumnTransformer transformation.
    """
    feature_names = []
    # Numeric features
    feature_names.extend(NUMERICAL_FEATURES)
    # Categorical features from OneHotEncoder
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    encoded_cat_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    feature_names.extend(encoded_cat_names)
    return feature_names

def save_preprocessor(preprocessor: ColumnTransformer, filepath: str) -> None:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    joblib.dump(preprocessor, filepath)
    print(f"Saved fitted preprocessor to: {filepath}")

def load_preprocessor(filepath: str) -> ColumnTransformer:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Preprocessor not found at: {filepath}")
    return joblib.load(filepath)
