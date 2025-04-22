from flask import Flask, request, jsonify
import pandas as pd
import joblib
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils import resample
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import GridSearchCV
import os
from pathlib import Path

app = Flask(__name__)

# Khởi tạo đường dẫn
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "Stroke_data.csv"
MODEL_PATH = BASE_DIR / "model.pkl"

# Load và tiền xử lý dữ liệu
def load_and_preprocess_data():
    # Kiểm tra file tồn tại
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy file dữ liệu tại: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    df.drop(columns=['id'], inplace=True)
    
    # Xử lý giá trị thiếu
    imputer = SimpleImputer(strategy='mean')
    df['bmi'] = imputer.fit_transform(df[['bmi']])
    
    # Encoding features
    label_encoders = {}
    categorical_columns = ['gender', 'ever_married', 'Residence_type']
    for col in categorical_columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le
    
    # Xử lý categorical variables
    df = pd.get_dummies(df, columns=['work_type', 'smoking_status'], drop_first=True)
    
    # Cân bằng dữ liệu
    df_majority = df[df.stroke == 0]
    df_minority = df[df.stroke == 1]
    df_majority_downsampled = resample(df_majority, replace=False, 
                                      n_samples=len(df_minority), 
                                      random_state=42)
    df_balanced = pd.concat([df_majority_downsampled, df_minority])
    
    return df_balanced, label_encoders

# Huấn luyện và lưu model
def train_and_save_model():
    df_balanced, label_encoders = load_and_preprocess_data()  
    
    X = df_balanced.drop(columns=['stroke'])
    y = df_balanced['stroke']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    param_grid = {
        'n_estimators': [100],
        'max_depth': [10],
        'min_samples_split': [2]
    }
    
    grid_search = GridSearchCV(
        RandomForestClassifier(),
        param_grid,
        cv=5,
        scoring='roc_auc'
    )
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    joblib.dump({
        'model': best_model,
        'feature_columns': X.columns.tolist(),
        'label_encoders': label_encoders
    }, MODEL_PATH)
    
    return best_model, X.columns

# Khởi tạo model
if not MODEL_PATH.exists():
    model, feature_columns = train_and_save_model()
else:
    saved_data = joblib.load(MODEL_PATH)
    model = saved_data['model']
    feature_columns = saved_data['feature_columns']
    label_encoders = saved_data['label_encoders']

@app.route("/predict", methods=["POST"])
def predict():
    try:
        input_data = request.json
        df_input = pd.DataFrame([input_data])
        
        # Xử lý categorical features
        for col in ['gender', 'ever_married', 'Residence_type']:
            if input_data[col] not in label_encoders[col].classes_:
                return jsonify({"error": f"Giá trị không hợp lệ cho trường {col}"}), 400
            
            df_input[col] = label_encoders[col].transform(df_input[col])
        
        # Xử lý one-hot encoding
        df_input = pd.get_dummies(df_input, columns=['work_type', 'smoking_status'], drop_first=True)
        df_input = df_input.reindex(columns=feature_columns, fill_value=0)
        
        # Dự đoán
        probability = model.predict_proba(df_input)[:, 1][0] * 100
        return jsonify({"stroke_probability": round(probability, 2)})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)