# train_model.py
import pandas as pd
import joblib
from pathlib import Path
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils import resample

# Đường dẫn
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "Stroke_data.csv"
MODEL_PATH = BASE_DIR / "model.pkl"

def load_and_preprocess_data():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy file dữ liệu tại: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    df.drop(columns=['id'], inplace=True)

    imputer = SimpleImputer(strategy='mean')
    df['bmi'] = imputer.fit_transform(df[['bmi']])

    label_encoders = {}
    categorical_columns = ['gender', 'ever_married', 'Residence_type']
    for col in categorical_columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    df = pd.get_dummies(df, columns=['work_type', 'smoking_status'], drop_first=True)

    df_majority = df[df.stroke == 0]
    df_minority = df[df.stroke == 1]
    df_majority_downsampled = resample(df_majority, replace=False, 
                                      n_samples=len(df_minority), 
                                      random_state=42)
    df_balanced = pd.concat([df_majority_downsampled, df_minority])

    return df_balanced, label_encoders

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

    print("✅ Model đã được huấn luyện và lưu tại:", MODEL_PATH)

if __name__ == "__main__":
    train_and_save_model()
