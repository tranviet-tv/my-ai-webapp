# ml_api.py
from flask import Flask, request, jsonify
import pandas as pd
import joblib
from pathlib import Path

app = Flask(__name__)

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "model.pkl"

# Load model
if not MODEL_PATH.exists():
    raise RuntimeError("❌ Model chưa được huấn luyện. Vui lòng chạy train_model.py trước.")

saved_data = joblib.load(MODEL_PATH)
model = saved_data['model']
feature_columns = saved_data['feature_columns']
label_encoders = saved_data['label_encoders']

@app.route("/predict", methods=["POST"])
def predict():
    try:
        input_data = request.json
        df_input = pd.DataFrame([input_data])

        for col in ['gender', 'ever_married', 'Residence_type']:
            if input_data[col] not in label_encoders[col].classes_:
                return jsonify({"error": f"Giá trị không hợp lệ cho trường {col}"}), 400
            df_input[col] = label_encoders[col].transform(df_input[col])

        df_input = pd.get_dummies(df_input, columns=['work_type', 'smoking_status'], drop_first=True)
        df_input = df_input.reindex(columns=feature_columns, fill_value=0)

        probability = model.predict_proba(df_input)[:, 1][0] * 100
        return jsonify({"stroke_probability": round(probability, 2)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=False)
