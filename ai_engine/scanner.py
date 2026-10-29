import sys
import json
import joblib
import re
import warnings

# Suppress sklearn/joblib warnings to prevent stdout corruption
warnings.filterwarnings('ignore')

def tokenize_url(url):
    """Extract lexical tokens for vectorization and logging."""
    tokens = re.split(r'[\W_]+', url)
    return [t.lower() for t in tokens if t]

def main():
    if len(sys.argv) < 2:
        sys.stdout.write(json.dumps({"error": "Missing URL argument", "threat_status": "ERROR"}))
        sys.exit(1)
        
    target_url = sys.argv[1]
    
    try:
        # Load pre-trained models
        model = joblib.load('phish_hunter_v1.pkl')
        vectorizer = joblib.load('vectorizer_v1.pkl')
        
        # Tokenize and vectorize
        tokens = tokenize_url(target_url)
        # Assuming the vectorizer was trained on space-separated tokens or raw URLs
        processed_input = [" ".join(tokens)]
        
        X_features = vectorizer.transform(processed_input)
        
        # Execute prediction
        prediction = model.predict(X_features)[0]
        probabilities = model.predict_proba(X_features)[0]
        confidence = float(max(probabilities))
        
        # Map output (assuming 1 = Phishing, 0 = Benign)
        threat_status = "MALICIOUS" if prediction == 1 else "BENIGN"
        
        # Construct strict JSON payload
        payload = {
            "target_url": target_url,
            "threat_status": threat_status,
            "confidence": confidence,
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