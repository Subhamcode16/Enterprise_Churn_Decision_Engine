"""
XGBoost Churn Classifier Model Module
Handles model training, evaluation metrics, export, and loading.
"""

import os
import json
import numpy as np
import pandas as pd
import xgboost as xgb
from typing import Dict, Any, Tuple
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    roc_auc_score,
    recall_score,
    precision_score,
    f1_score,
    accuracy_score,
    brier_score_loss,
    classification_report
)

def train_churn_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray = None,
    y_val: np.ndarray = None,
    random_seed: int = 42
) -> Tuple[xgb.XGBClassifier, Dict[str, Any]]:
    """
    Trains an XGBoost classifier with automated class weighting and early stopping / validation.
    """
    n_neg = int(np.sum(y_train == 0))
    n_pos = int(np.sum(y_train == 1))
    scale_pos_weight = float((n_neg / max(n_pos, 1)) * 1.35)

    clf = xgb.XGBClassifier(
        n_estimators=350,
        learning_rate=0.03,
        max_depth=5,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight,
        objective="binary:logistic",
        eval_metric="auc",
        random_state=random_seed,
        tree_method="hist",
        n_jobs=-1
    )

    if X_val is not None and y_val is not None:
        eval_set = [(X_train, y_train), (X_val, y_val)]
        clf.fit(
            X_train,
            y_train,
            eval_set=eval_set,
            verbose=False
        )
    else:
        clf.fit(X_train, y_train)

    # Compute training metrics
    y_pred_proba = clf.predict_proba(X_train)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    metrics = {
        "train_roc_auc": float(roc_auc_score(y_train, y_pred_proba)),
        "train_recall": float(recall_score(y_train, y_pred)),
        "train_precision": float(precision_score(y_train, y_pred)),
        "train_f1": float(f1_score(y_train, y_pred)),
        "train_accuracy": float(accuracy_score(y_train, y_pred)),
        "scale_pos_weight": scale_pos_weight
    }

    return clf, metrics

def evaluate_model(clf: xgb.XGBClassifier, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
    """
    Evaluates trained classifier on held-out test data.
    """
    y_pred_proba = clf.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    metrics = {
        "roc_auc": float(roc_auc_score(y_test, y_pred_proba)),
        "recall": float(recall_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "brier_score": float(brier_score_loss(y_test, y_pred_proba)),
        "classification_report": classification_report(y_test, y_pred, output_dict=True)
    }

    return metrics

def save_model(clf: xgb.XGBClassifier, filepath: str) -> None:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    clf.save_model(filepath)
    print(f"Saved XGBoost model to: {filepath}")

def load_model(filepath: str) -> xgb.XGBClassifier:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Model file not found at: {filepath}")
    clf = xgb.XGBClassifier()
    clf.load_model(filepath)
    return clf
