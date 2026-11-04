import sys
import json
import joblib
import warnings
import os

# Suppress sklearn/joblib warnings to prevent Node.js stdout corruption
warnings.filterwarnings('ignore')

# --- CRITICAL INTEGRATION: The "Hacker" Tokenizer ---
# This exact function must exist here so joblib can unpickle vectorizer_v1.pkl
def make_tokens(f):
    tkns_by_slash = str(f).split('/')
    total_tokens = []
    for i in tkns_by_slash:
        tokens = str(i).split('-')
        tkns_by_dot = []
        for j in range(0,len(tokens)):
            temp_tokens = str(tokens[j]).split('.')
            tkns_by_dot = tkns_by_dot + temp_tokens
        total_tokens = total_tokens + tkns_by_dot + tokens
    total_tokens = list(set(total_tokens))
    if 'com' in total_tokens:
        total_tokens.remove('com')
    return total_tokens

def main():
    # Enforce URL argument
    if len(sys.argv) < 2:
        sys.stdout.write(json.dumps({"error": "Missing URL argument", "threat_status": "ERROR"}))
        sys.exit(1)
        
    target_url = sys.argv[1]
    
    try:
        
        # Resolve the absolute path to the directory containing this script
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        
        # Construct the absolute paths to the models
        model_path = os.path.join(BASE_DIR, 'models', 'Phish_hunter_V1.pkl')
        vectorizer_path = os.path.join(BASE_DIR, 'models', 'vectorizer_V1.pkl')
        
        # Load the models (Ensure the filenames match your Azure instance exactly)
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        
        # 1. Transform input using the loaded vectorizer and custom make_tokens logic
        obj = vectorizer.transform([target_url])
        
        # 2. Predict Threat Status
        prediction = model.predict(obj)[0]
        
        # 3. Calculate Confidence Percentage
        probabilities = model.predict_proba(obj)
        confidence = float(probabilities[0][prediction]) * 100
        
        # 4. Map output (1 = Phishing, 0 = Safe)
        threat_status = "MALICIOUS" if prediction == 1 else "SAFE"
        
        # 5. Extract tokens explicitly for the audit log / database payload
        tokens = make_tokens(target_url)
        
        # Construct strict JSON payload
        payload = {
            "target_url": target_url,
            "threat_status": threat_status,
            "confidence": round(confidence, 2),
            "lexical_tokens": tokens
        }
        
        # Flush exact JSON to stdout for Node.js consumption
        sys.stdout.write(json.dumps(payload))
        sys.exit(0)
        
    except Exception as e:
        # Catch exceptions and return as JSON to prevent Express crash
        error_payload = {
            "target_url": target_url,
            "threat_status": "ERROR",
            "error_details": str(e)
        }
        sys.stdout.write(json.dumps(error_payload))
        sys.exit(1)

if __name__ == "__main__":
    main()