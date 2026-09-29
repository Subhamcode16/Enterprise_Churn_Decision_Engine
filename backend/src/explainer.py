"""
Explainability Core using SHAP TreeExplainer
Computes local feature attributions, directionality, and human-readable diagnostic insights.
"""

import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from typing import List, Dict, Any
from src.pipeline import FEATURE_DISPLAY_NAMES

class ChurnExplainer:
    def __init__(self, model: xgb.XGBClassifier, feature_names: List[str]):
        self.model = model
        self.feature_names = feature_names
        # Initialize TreeExplainer
        self.explainer = shap.TreeExplainer(self.model)
        # Expected base margin value (in logit space)
        if hasattr(self.explainer.expected_value, "__iter__"):
            self.base_value = float(self.explainer.expected_value[1] if len(self.explainer.expected_value) > 1 else self.explainer.expected_value[0])
        else:
            self.base_value = float(self.explainer.expected_value)

    def explain_instance(
        self,
        transformed_row: np.ndarray,
        raw_feature_dict: Dict[str, Any],
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Computes SHAP values for a single transformed row and returns structured diagnostic insights.
        """
        # Ensure 2D array
        if transformed_row.ndim == 1:
            transformed_row = transformed_row.reshape(1, -1)

        shap_values = self.explainer.shap_values(transformed_row)[0]
        base_value = self.base_value

        # Calculate sum of attributions
        total_margin = base_value + np.sum(shap_values)
        predicted_proba = 1.0 / (1.0 + np.exp(-total_margin))

        # Map SHAP values to feature names
        driver_list = []
        for i, feat_name in enumerate(self.feature_names):
            val_shap = float(shap_values[i])
            # Determine base feature name (stripping one-hot suffix if applicable)
            clean_feat = feat_name.split("_")[0] if feat_name.startswith("contract_tier_") else feat_name
            display_name = FEATURE_DISPLAY_NAMES.get(feat_name, FEATURE_DISPLAY_NAMES.get(clean_feat, feat_name.replace("_", " ").title()))
            raw_val = raw_feature_dict.get(feat_name, raw_feature_dict.get(clean_feat, None))

            impact = "increases_risk" if val_shap > 0 else "decreases_risk"
            insight = self._generate_diagnostic_insight(feat_name, raw_val, val_shap)

            driver_list.append({
                "feature": feat_name,
                "display_name": display_name,
                "value": raw_val,
                "shap_value": round(val_shap, 4),
                "impact": impact,
                "abs_importance": abs(val_shap),
                "insight": insight
            })

        # Sort by absolute impact
        driver_list.sort(key=lambda x: x["abs_importance"], reverse=True)
        top_drivers = driver_list[:top_k]

        return {
            "base_value": round(base_value, 4),
            "total_margin": round(float(total_margin), 4),
            "predicted_probability": round(float(predicted_proba), 4),
            "top_drivers": top_drivers,
            "all_drivers": driver_list
        }

    def _generate_diagnostic_insight(self, feature: str, value: Any, shap_val: float) -> str:
        """
        Translates raw feature values and SHAP scores into executive natural language insights.
        """
        direction = "elevating" if shap_val > 0 else "reducing"
        if feature == "usage_change_pct_30d":
            if value is not None and value < 0:
                return f"30-day usage dropped by {abs(value)}%, strongly {direction} churn risk."
            elif value is not None:
                return f"30-day usage increased by {value}%, actively protecting the account."
        elif feature == "open_p1_tickets":
            if value is not None and value > 0:
                return f"{value} open P1 critical tickets creating acute customer dissatisfaction."
            return "Zero open P1 tickets maintaining technical stability."
        elif feature == "days_since_last_login":
            if value is not None and value > 14:
                return f"{value} days of team login inactivity signaling severe disengagement."
            return f"Recent platform activity ({value} days ago) reflects regular usage."
        elif feature == "nps_score":
            if value is not None and value <= 6:
                return f"Detractor NPS score ({value}/10) indicating vulnerable account sentiment."
            return f"Promoter / Passive NPS score ({value}/10) supporting account retention."
        elif feature == "csat_score":
            if value is not None and value < 3.5:
                return f"Low CSAT rating ({value}/5.0) points to ongoing operational friction."
            return f"Healthy CSAT score ({value}/5.0) confirms positive customer sentiment."
        elif feature == "payment_failures_past_quarter":
            if value is not None and value > 0:
                return f"{value} billing/dunning failures in the past quarter indicating financial friction."
            return "Clean billing history with zero failed payment attempts."
        elif feature == "tenure_months":
            if value is not None and value >= 12:
                return f"Mature customer tenure ({value} months) provides strong relationship resilience."
            return f"Early onboarding phase ({value} months) carries higher baseline risk."
        elif feature == "days_until_renewal":
            if value is not None and value <= 60:
                return f"Upcoming renewal window in {value} days amplifies immediate churn exposure."
            return f"Contract renewal is {value} days away."
        
        return f"{feature.replace('_', ' ').title()} is {direction} churn probability."
