"""
End-to-End Training and Artifact Export Pipeline
Generates data, fits preprocessing transformers, trains XGBoost, evaluates performance,
and persists versioned artifacts.
"""

import os
import sys
import json

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from src.data_generator import generate_b2b_churn_dataset
from src.pipeline import (
    build_preprocessor,
    save_preprocessor,
    get_transformed_feature_names,
    ALL_MODEL_FEATURES,
    TARGET_COLUMN
)
from src.model import train_churn_model, evaluate_model, save_model

def run_training_pipeline(force_generate_data: bool = False) -> None:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_root = os.path.abspath(os.path.join(current_dir, ".."))
    data_dir = os.path.join(backend_root, "data")
    models_dir = os.path.join(backend_root, "models")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    csv_path = os.path.join(data_dir, "b2b_churn_dataset.csv")

    # Step 1: Ingest / Generate Data
    if force_generate_data or not os.path.exists(csv_path):
        print(">> Generating fresh 12,000-record B2B enterprise dataset...")
        df = generate_b2b_churn_dataset(n_samples=12000, random_seed=42, output_path=csv_path)
    else:
        print(f">> Loading existing dataset from: {csv_path}")
        df = pd.read_csv(csv_path)

    # Step 2: Split Train and Test Sets (Stratified)
    X = df[ALL_MODEL_FEATURES]
    y = df[TARGET_COLUMN].values

    X_train_df, X_test_df, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f">> Dataset Split: {len(X_train_df)} train rows, {len(X_test_df)} test rows")

    # Step 3: Build & Fit Preprocessor
    preprocessor = build_preprocessor()
    X_train_transformed = preprocessor.fit_transform(X_train_df)
    X_test_transformed = preprocessor.transform(X_test_df)
    
    transformed_feature_names = get_transformed_feature_names(preprocessor)
    print(f">> Preprocessing complete. Transformed features ({len(transformed_feature_names)}): {transformed_feature_names}")

    # Save Preprocessor
    preprocessor_path = os.path.join(models_dir, "preprocessor.joblib")
    save_preprocessor(preprocessor, preprocessor_path)

    # Step 4: Train XGBoost Classifier
    print(">> Training XGBoost Classifier with automated class balancing...")
    model, train_metrics = train_churn_model(
        X_train=X_train_transformed,
        y_train=y_train,
        X_val=X_test_transformed,
        y_val=y_test,
        random_seed=42
    )

    # Step 5: Evaluate on Held-out Test Set
    test_metrics = evaluate_model(model, X_test_transformed, y_test)
    print(">> Model Evaluation Results on Test Set:")
    print(f"   ROC-AUC:   {test_metrics['roc_auc']:.4f} (PRD Target: >= 0.85)")
    print(f"   Recall:    {test_metrics['recall']:.4f} (PRD Target: >= 0.80)")
    print(f"   Precision: {test_metrics['precision']:.4f}")
    print(f"   F1-Score:  {test_metrics['f1_score']:.4f}")
    print(f"   Brier:     {test_metrics['brier_score']:.4f}")

    # Step 6: Save Model & Metadata Artifacts
    model_path = os.path.join(models_dir, "xgb_churn_model.json")
    save_model(model, model_path)

    metadata = {
        "model_version": "1.0.0",
        "algorithm": "XGBoost Classifier",
        "transformed_feature_names": transformed_feature_names,
        "train_metrics": train_metrics,
        "test_metrics": {
            "roc_auc": test_metrics["roc_auc"],
            "recall": test_metrics["recall"],
            "precision": test_metrics["precision"],
            "f1_score": test_metrics["f1_score"],
            "accuracy": test_metrics["accuracy"],
            "brier_score": test_metrics["brier_score"]
        },
        "dataset_summary": {
            "total_records": len(df),
            "churn_rate": float(np.mean(y)),
            "total_mrr_monitored": float(df["contract_mrr"].sum())
        }
    }

    metadata_path = os.path.join(models_dir, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f">> Model metadata saved to: {metadata_path}")

    # Export a curated demo subset of accounts for fast frontend exploration
    demo_sample = df.sample(n=100, random_state=42)
    sample_path = os.path.join(data_dir, "demo_accounts_sample.json")
    demo_sample.to_json(sample_path, orient="records", indent=2)
    print(f">> Curated 100 demo accounts saved to: {sample_path}")
    return metadata

if __name__ == "__main__":
    run_training_pipeline(force_generate_data=True)
